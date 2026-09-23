# Workspace CRM API

## Zugriffsbereiche

`GET /api/workspace/crm/customers/[id]/access-scopes` liefert
`200 { "accessScopes": WorkspaceMemberAccessScopeDto[] }` für Nutzer mit `members.manage`.
Unbekannte oder ungültige Kunden-IDs antworten mit `404`.

JSON-API des internen CRM-Bereichs. Server-only, Clerk-authentifiziert, permissionbasiert autorisiert. Fachliche
Grundlage: `plans/crm/04-personen-und-kundenakte/04-kunde-anlegen-bearbeiten.md`.

> **Quelle der Wahrheit für den Contract:** dieses Dokument. Änderungen an Endpunkten, Statuscodes oder Bodies
> aktualisieren diese Datei im selben Commit.

## Auth

Jeder Handler ist mit `withPermission(Permission.X, handler)` gewrappt: ohne Session `401 UNAUTHORIZED`, ohne aktive
Mitgliedschaft `404 NOT_FOUND`, deaktiviertes Mitglied `403 FORBIDDEN`, DB-Fehler bei der Auflösung
`503 UNAVAILABLE`, fehlende Permission `403 FORBIDDEN`.

| Route                       | Permission        |
| --------------------------- | ----------------- |
| `GET /crm/customers`        | `customers.read`  |
| `POST /crm/customers`       | `customers.write` |
| `PATCH /crm/customers/[id]` | `customers.write` |

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

Query-Parameter:

- `page`: positive Ganzzahl, Standard `1`; Seiten außerhalb des Bereichs werden auf die letzte Seite geklemmt.
- `sort`: `number_asc | number_desc | name_asc | name_desc | status_asc | status_desc | updated_asc | updated_desc`.
- `archived`: nur `true` blendet archivierte Kunden zusätzlich ein; ohne Parameter bleiben sie ausgeblendet.

Erfolg: `200 { "page": number, "perPage": 25, "total": number, "rows": CustomerSummaryDto[] }`.
Count und Liste verwenden dieselbe Archivbedingung; die Sortierung besitzt immer die Kunden-ID als stabilen Tie-Breaker.

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
- Der Primärkontakt braucht `lastName`; `email` ist optional. Er wird immer als neue Person angelegt.
- Status ist immer `active`, Owner das anlegende Mitglied. Zusätzliche Felder im Body werden verworfen.
- Kunde, Person, Primärzuordnung und die Activity `created` entstehen in einer Transaktion.

Weitere im Formular übernommene Ansprechpartner werden optional als `additionalContacts` im selben Request gesendet.
Es gibt bewusst keinen separaten Ansprechpartner-Endpunkt: Erst das Speichern des gesamten Kundenformulars persistiert
Kunde und Ansprechpartner gemeinsam.

Erfolg: `201 { "customer": CustomerDetailDto }`.

## `PATCH /api/workspace/crm/customers/[id]`

Body `UpdateCustomerRequestDto` — alle Kundenfelder wie beim Anlegen, ohne `primaryContact`, dazu `status` und
`version`. Der Body ersetzt jedes Feld. Erlaubte Statuswerte sind `active | paused | archived`. `contacts` ist
optional; wenn vorhanden, enthält es den vollständigen gewünschten Stand aller Ansprechpartner inklusive ihrer
getrennten Personen- und Zuordnungsversionen. Kunde, Status und Kontakte werden gemeinsam transaktional gespeichert.
Ein tatsächlicher Statuswechsel erzeugt eine `status_change`-Activity; derselbe Status erzeugt keine Activity.

Erfolg: `200 { "customer": CustomerDetailDto }`. Veraltete `version`: `409 VersionConflictDto`.

---

## Projektleistungen

Eine Projektleistung gehört zu genau **einem** Projekt; ihr Kunde wird ausschließlich über dieses Projekt abgeleitet.
Es gibt keinen kundenweiten Schreibweg und keinen Löschpfad. Titel, Beschreibung, Preis, Preisart und Intervall sind
ein vollständiger Snapshot; `sourceLineItemTemplateId` ist reiner Herkunftsnachweis und wird nie mitgeschrieben.

Beide Rechte sind **bindbar**: eine Kundenbindung vererbt auf alle Projekte dieses Kunden, eine Projektbindung gilt
nur für dieses eine Projekt. Fremdzugriff antwortet `404`, fehlendes Recht auf Endpunktebene `403`.

| Route                                       | Permission                 |
| ------------------------------------------- | -------------------------- |
| `GET /crm/projects/[projectId]/line-items`  | `project_line_items.read`  |
| `POST /crm/projects/[projectId]/line-items` | `project_line_items.write` |
| `PATCH /crm/project-line-items/[id]`        | `project_line_items.write` |

### `GET /api/workspace/crm/projects/[projectId]/line-items`

Erfolg: `200 { "projectLineItems": ProjectLineItemDto[] }`, älteste Position zuerst.
Ein lesbares Projekt ohne Leistungen antwortet `200` mit leerer Liste; ein Projekt außerhalb des Zugriffsbereichs
antwortet `404 PROJECT_NOT_FOUND` — beide Fälle bleiben unterscheidbar.

### `POST /api/workspace/crm/projects/[projectId]/line-items`

Body `CreateProjectLineItemRequestDto`:

```json
{
  "sourceLineItemTemplateId": "9c8f1a10-1b1a-4a10-8e10-000000000001",
  "title": "Landingpage",
  "description": "Einseitige Website inklusive Konzept und Umsetzung.",
  "priceCents": 180000,
  "pricingMode": "one_time",
  "recurringInterval": null
}
```

- `sourceLineItemTemplateId` ist Pflicht und muss ein **aktives** Template benennen; archivierte oder unbekannte
  Templates antworten `422 LINE_ITEM_TEMPLATE_NOT_ASSIGNABLE`.
- Die übrigen Felder sind der Snapshot. Sie werden aus dem Template vorbelegt, dürfen aber abweichen — gespeichert
  wird ausschließlich, was im Request steht.
- `recurringInterval` ist genau dann gesetzt, wenn `pricingMode` `recurring` ist.

Erfolg: `201 { "projectLineItem": ProjectLineItemDto }` mit `version: 1`.

### `PATCH /api/workspace/crm/project-line-items/[id]`

Body `UpdateProjectLineItemRequestDto` — dieselben Snapshot-Felder plus `version`, ohne `sourceLineItemTemplateId`.
Der Body ersetzt jedes Snapshot-Feld; Projekt und Herkunft bleiben unverändert.

Erfolg: `200 { "projectLineItem": ProjectLineItemDto }`. Veraltete `version`: `409 VersionConflictDto`.

| Status | `error`                             | Bedeutung                                                         |
| ------ | ----------------------------------- | ----------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`                  | Body ist kein JSON                                                |
| 422    | `VALIDATION_ERROR`                  | Schemafehler; `details` mit Feldpfad                              |
| 422    | `LINE_ITEM_TEMPLATE_NOT_ASSIGNABLE` | Vorlage ist archiviert oder unbekannt                             |
| 404    | `PROJECT_NOT_FOUND`                 | Projekt existiert nicht oder liegt außerhalb des Zugriffsbereichs |
| 404    | `PROJECT_LINE_ITEM_NOT_FOUND`       | Leistung existiert nicht oder gehört zu einem fremden Projekt     |
| 409    | `version_conflict`                  | Veraltete `version`; Body trägt `currentVersion` und `current`    |
| 500    | `INTERNAL`                          | Unerwarteter Fehler; geloggt ohne Body                            |

---

## Aufgaben

Eine Aufgabe gehört zu genau **einem** Projekt; ihr Kunde wird ausschließlich über dieses Projekt abgeleitet. Es
gibt keinen Löschpfad — `cancelled` ersetzt das Löschen. Bearbeiter ist immer ein **aktives** internes Mitglied, auch
wenn der Kunde handeln muss (`actionSide = customer`). Eine Kundenaufgabe ist immer für den Kunden sichtbar; ein
Request mit `actionSide = customer` und `visibleToCustomer = false` wird abgewiesen, nicht stillschweigend korrigiert.

Beide Rechte sind **bindbar**: eine Kundenbindung vererbt auf alle Projekte dieses Kunden, eine Projektbindung gilt
nur für dieses eine Projekt. Fremdzugriff antwortet `404`, fehlendes Recht auf Endpunktebene `403`.

| Route                                  | Permission    |
| -------------------------------------- | ------------- |
| `GET /crm/projects/[projectId]/tasks`  | `tasks.read`  |
| `POST /crm/projects/[projectId]/tasks` | `tasks.write` |
| `PATCH /crm/tasks/[id]`                | `tasks.write` |
| `PATCH /crm/tasks/[id]/status`         | `tasks.write` |

### `GET /api/workspace/crm/projects/[projectId]/tasks`

Erfolg: `200 { "tasks": TaskDto[] }`. Reihenfolge: offene Aufgaben (`open`, `in_progress`) zuerst, darin die früheste
Fälligkeit zuerst (überfällige stehen damit oben), Aufgaben ohne Datum zuletzt; danach `done` und `cancelled`, zuletzt
Geändertes zuerst. Ein lesbares Projekt ohne Aufgaben antwortet `200` mit leerer Liste; ein Projekt außerhalb des
Zugriffsbereichs antwortet `404 PROJECT_NOT_FOUND` — beide Fälle bleiben unterscheidbar.

### `POST /api/workspace/crm/projects/[projectId]/tasks`

Body `CreateTaskRequestDto`:

```json
{
  "title": "Zugangsdaten zum Hosting bereitstellen",
  "description": "",
  "actionSide": "customer",
  "visibleToCustomer": true,
  "assigneeMemberId": null,
  "dueOn": "2026-10-01"
}
```

- `assigneeMemberId: null` weist den Projekt-Owner zu; jedes andere Mitglied muss aktiv sein
  (`422 ASSIGNEE_NOT_ACTIVE`).
- `dueOn` ist ein Kalendertag `YYYY-MM-DD` in der Geschäftszeitzone (Europe/Berlin) oder `null`.
- Die neue Aufgabe ist immer `open`; der Status wird nicht im Body gesetzt.

Erfolg: `201 { "task": TaskDto }` mit `version: 1`. Die Anlage schreibt eine `created`-Activity am Kunden und Projekt.

### `PATCH /api/workspace/crm/tasks/[id]`

Body `UpdateTaskRequestDto` — dieselben Felder, `assigneeMemberId` verpflichtend, plus `version`. Der Body ersetzt jedes
Feld; Projekt und Status bleiben unverändert. Ein Bearbeiter, der sich nicht ändert, wird nicht erneut auf „aktiv“
geprüft. Ein Wechsel von Bearbeiter, Handlungsseite oder Sichtbarkeit schreibt je eine `field_change`-Activity
(Metadaten: Feld, alt, neu — nie Titel oder Beschreibung); eine reine Textänderung schreibt keine.

Erfolg: `200 { "task": TaskDto }`. Veraltete `version`: `409 VersionConflictDto`.

### `PATCH /api/workspace/crm/tasks/[id]/status`

Body `ChangeTaskStatusRequestDto`: `{ "status": "open" | "in_progress" | "done" | "cancelled", "version": number }`.
Jeder Status darf auf jeden folgen, auch das Wiederöffnen. `done` setzt `completedAt` und `completedByMemberId`, jeder
andere Status löscht beide. Ein Wechsel schreibt eine `status_change`-Activity. Fordert der Request den Status, den
die Aufgabe schon hat, ändert sich nichts (keine Versionserhöhung, keine Activity) und der aktuelle Stand wird
zurückgegeben.

Erfolg: `200 { "task": TaskDto }`. Veraltete `version`: `409 VersionConflictDto`.

| Status | `error`               | Bedeutung                                                         |
| ------ | --------------------- | ----------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`    | Body ist kein JSON                                                |
| 422    | `VALIDATION_ERROR`    | Schemafehler; `details` mit Feldpfad                              |
| 422    | `ASSIGNEE_NOT_ACTIVE` | Bearbeiter ist kein aktives Mitglied                              |
| 404    | `PROJECT_NOT_FOUND`   | Projekt existiert nicht oder liegt außerhalb des Zugriffsbereichs |
| 404    | `TASK_NOT_FOUND`      | Aufgabe existiert nicht oder gehört zu einem fremden Projekt      |
| 409    | `version_conflict`    | Veraltete `version`; Body trägt `currentVersion` und `current`    |
| 500    | `INTERNAL`            | Unerwarteter Fehler; geloggt ohne Body                            |
