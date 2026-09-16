# Workspace CRM API

JSON-API des internen CRM-Bereichs. Server-only, Clerk-authentifiziert, permissionbasiert autorisiert. Fachliche
Grundlage: `plans/crm/04-personen-und-kundenakte/04-kunde-anlegen-bearbeiten.md`.

> **Quelle der Wahrheit für den Contract:** dieses Dokument. Änderungen an Endpunkten, Statuscodes oder Bodies
> aktualisieren diese Datei im selben Commit.

## Auth

Jeder Handler ist mit `withPermission(Permission.X, handler)` gewrappt: ohne Session `401 UNAUTHORIZED`, ohne aktive
Mitgliedschaft `404 NOT_FOUND`, deaktiviertes Mitglied `403 FORBIDDEN`, DB-Fehler bei der Auflösung
`503 UNAVAILABLE`, fehlende Permission `403 FORBIDDEN`.

| Route                               | Permission        |
| ----------------------------------- | ----------------- |
| `GET /crm/customers`                | `customers.read`  |
| `POST /crm/customers`               | `customers.write` |
| `PATCH /crm/customers/[id]`         | `customers.write` |
| `POST /crm/customers/[id]/contacts` | `customers.write` |

## Fehlerformat

```json
{
  "error": "<MACHINE_CODE>",
  "message": "<english, no PII>",
  "details": "<optional zod issues>"
}
```

Ausnahme **409 Versionskonflikt**: Der Body ist ein `VersionConflictDto`
(`{ "code": "version_conflict", "currentVersion": n, "current": CustomerDetailDto }`).

| Status | `error`                       | Bedeutung                                                               |
| ------ | ----------------------------- | ----------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`            | Body ist kein JSON                                                      |
| 422    | `VALIDATION_ERROR`            | Schemafehler oder unbekannte/inaktive Kategorie; `details` mit Feldpfad |
| 404    | `CUSTOMER_NOT_FOUND`          | Kunde existiert nicht oder ID ist keine UUID                            |
| 409    | `CUSTOMER_DISPLAY_NAME_TAKEN` | Anzeigename (ohne Groß-/Kleinschreibung und Randleerzeichen) vergeben   |
| 409    | `CUSTOMER_OWNER_INACTIVE`     | Das anlegende Mitglied wurde parallel deaktiviert                       |
| 500    | `INTERNAL`                    | Unerwarteter Fehler; geloggt ohne Request-Body und Kontaktdaten         |

---

## `GET /api/workspace/crm/customers`

`200 { "rows": CustomerSummaryDto[] }` — nicht archivierte Kunden, neueste zuerst, festes Limit von 100. Pagination,
Sortierung und Filter ergänzt Task 03 additiv.

## `POST /api/workspace/crm/customers`

Body `CreateCustomerRequestDto`:

```json
{
  "displayName": "Nordlicht Coaching",
  "companyName": "Nordlicht Coaching GmbH",
  "categoryId": null,
  "street": null,
  "postalCode": null,
  "city": "Köln",
  "country": null,
  "websiteUrl": "https://nordlicht.example",
  "vatId": null,
  "notes": null,
  "defaultHourlyRateCents": 9500,
  "primaryContact": {
    "firstName": "Anna",
    "lastName": "Berger",
    "email": "anna@nordlicht.example",
    "phone": null,
    "roleLabel": "Geschäftsführung",
    "preferredLocale": "de"
  }
}
```

- Leere Strings werden zu `null`.
- Primärkontakt braucht `lastName` oder `email`; er wird immer als neue Person angelegt.
- Status ist immer `active`, Owner das anlegende Mitglied. Zusätzliche Felder im Body werden verworfen.
- Kunde, Person, Primärzuordnung und die Activity `created` entstehen in einer Transaktion.

Erfolg: `201 { "customer": CustomerDetailDto }`.

## `PATCH /api/workspace/crm/customers/[id]`

Body `UpdateCustomerRequestDto` — alle Kundenfelder wie beim Anlegen, ohne `primaryContact`, dazu `version`. Der Body
ersetzt jedes Feld; Kontakte ändern sich hier nicht.

Erfolg: `200 { "customer": CustomerDetailDto }`. Veraltete `version`: `409 VersionConflictDto`.

## `POST /api/workspace/crm/customers/[id]/contacts`

Body `CreateCustomerContactRequestDto`: die Kontaktfelder `firstName`, `lastName`, `email`, `phone`, `roleLabel`
und `preferredLocale`. `lastName` oder `email` ist erforderlich.

Der Endpunkt legt immer eine neue, **sekundäre** Zuordnung an. Dadurch kann er den atomar beim Kunden angelegten
Hauptansprechpartner nicht verdrängen; jeder Kunde behält mindestens einen Hauptansprechpartner.

Erfolg: `201 { "customer": CustomerDetailDto }`.
