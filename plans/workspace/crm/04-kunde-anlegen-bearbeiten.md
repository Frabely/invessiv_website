# Task 04 — Kunde anlegen und bearbeiten

> **Branch:** `feat/crm-kunde-formular`
> **Aufwand:** M (rund ein Tag)
> **Abhängigkeiten:** Task 03 (Liste, Route, Dictionaries)
> **Migration:** keine

## Context

Die Liste aus Task 03 kann nur lesen. Dieser Task ergänzt den Schreibpfad: einen Dialog, der Anlegen
und Bearbeiten in einer Komponente abbildet (Muster `lead-form-dialog`), dahinter Route Handler,
zod-Schemas und Command-Handler.

Ansprechpartner bleiben bewusst außen vor (Task 06) — hier geht es nur um die Stammdaten des Kunden
selbst. Beim Anlegen wird optional ein erster Kontakt mit erfasst, damit die Liste sofort sinnvolle
Zeilen zeigt.

## Entscheidungen

| Bereich          | Entscheidung                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Dialog           | Eine Komponente für beide Modi über `CustomerFormDialogMode`, gesteuert über Query-Parameter (`mode`, `edit`)                           |
| Schreibpfad      | Client `fetch` → Route Handler → Command-Handler. **Keine** Server Actions (Projektkonvention)                                          |
| Fehlerbehandlung | Handler liefern Result-Unions, werfen nicht. Route mappt Code auf HTTP über eine nicht-exportierte Message-Map                          |
| Duplikate        | Firmenname global eindeutig (case- und whitespace-insensitiv). Verletzung wird als Feldfehler am Firmennamen angezeigt, nicht als Toast |
| Pflichtfelder    | Nur Firmenname. Alles andere optional — ein Kunde entsteht oft mit lückenhaften Daten                                                   |
| Erstkontakt      | Beim Anlegen optional; wird als `is_primary`-Kontakt gespeichert                                                                        |

## Contract

```ts
// apps/workspace/src/server/workspace/crm/services/create-customer.schema.ts
const createCustomerSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  status: z.enum(CUSTOMER_STATUS_VALUES).default(CustomerStatus.Prospect),
  street: z.string().trim().max(200).nullish(),
  postalCode: z.string().trim().max(20).nullish(),
  city: z.string().trim().max(120).nullish(),
  country: z.string().trim().max(120).nullish(),
  websiteUrl: z.url().nullish(),
  vatId: z.string().trim().max(64).nullish(),
  notes: z.string().trim().max(20_000).nullish(),
  primaryContact: customerContactInputSchema.nullish(),
});
```

```ts
// packages/common/src/contracts/crm/results/create-customer-result.ts
export type CreateCustomerResult =
  | { ok: true; customer: CustomerDetailDto }
  | { ok: false; code: typeof CustomerErrorCode.CompanyNameExists }
  | {
      ok: false;
      code: typeof CustomerErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    };
```

## Architektur

```txt
POST /api/workspace/crm/customers
  → withPermission(CustomersWrite)
  → zod parse
  → createCustomer.command-handler
      → Transaktion: customers insert (+ optional customer_contacts)
      → customer_activities: type "created"
  → Result-Union → HTTP (201 | 409 | 422)

PATCH /api/workspace/crm/customers/[id]   analog, Permission CustomersWrite
```

Nach erfolgreichem Submit: Dialog schließen, `router.refresh()` — kein clientseitiges Nachhalten des
Listenzustands.

## Verzeichnisstruktur

```txt
apps/workspace/src/app/api/workspace/crm/customers/route.ts
apps/workspace/src/app/api/workspace/crm/customers/[id]/route.ts
apps/workspace/src/app/api/workspace/crm/README.md            API-Contract, Muster: leads/README.md

apps/workspace/src/server/workspace/crm/
  command-handler/create-customer.command-handler.ts
  command-handler/update-customer.command-handler.ts
  services/create-customer.schema.ts
  services/update-customer.schema.ts
  services/customer-validation-service.ts
  shared/duplicate-company-name-error.class.ts
  shared/is-duplicate-company-name-error.ts

apps/workspace/src/lib/workspace/crm/customer-api-error.ts
apps/workspace/src/common/constants/api-endpoints.ts          + CrmCustomers
apps/workspace/src/components/workspace/crm/form/customer-form-dialog/
  customer-form-dialog.tsx  .module.css  .schema.ts  customers-service.ts
apps/workspace/src/i18n/dictionaries/workspace/crm/form/{de,en}.json
```

## Tickets

### CRM-04-T1 — Schemas, Command-Handler, Fehlercodes

- **Files:** `services/*.schema.ts`, `command-handler/{create,update}-customer.command-handler.ts`,
  `shared/duplicate-company-name-error.class.ts`, `is-duplicate-company-name-error.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - zod-Schemas wie oben; Trim vor Validierung, leere Strings werden zu `null`
  - Transaktion inklusive Activity-Eintrag
  - Postgres-Fehlercode `23505` plus Indexname wird in `CompanyNameExists` übersetzt (Muster:
    `is-duplicate-email-error.ts`)
- **Akzeptanz:**
  - Tests: Anlegen mit Minimaldaten, Duplikat ergibt `CompanyNameExists`, Validierungsfehler ergibt
    die Issues, Transaktion rollt bei Fehler im Kontakt-Insert vollständig zurück
  - Genau ein Activity-Eintrag pro angelegtem Kunden

### CRM-04-T2 — Route Handler

- **Files:** `api/workspace/crm/customers/route.ts`, `[id]/route.ts`,
  `lib/workspace/crm/customer-api-error.ts`, `common/constants/api-endpoints.ts`,
  `api/workspace/crm/README.md` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - `withPermission(Permission.CustomersWrite, …)`; bei Routen mit `params` wird der Wrapper innen
    aufgerufen (bestehendes Muster)
  - Status-Codes aus `HttpResponseCode`-Konstanten, nie nackte Zahlen
  - Endpunkte in `WorkspaceApiEndpoint` eintragen — keine URL-Literale im Client
- **Akzeptanz:**
  - Tests: 401 ohne Login, 404 ohne Allowlist, 403 bei fehlender Permission, 201 im Erfolgsfall,
    409 bei Duplikat, 422 bei Validierungsfehler
  - README beschreibt alle Endpunkte mit Body und Statuscodes

### CRM-04-T3 — Formular-Dialog

- **Files:** `components/workspace/crm/form/customer-form-dialog/**`,
  `dictionaries/workspace/crm/form/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Ein Dialog für Anlegen und Bearbeiten, Modus über Query-Parameter
  - Fokusfalle und Escape-Schluss über den bestehenden `dialog-focus-trap`
  - Feldfehler an den Feldern, Submit-Fehler als Statuszeile; Doppel-Submit blockiert
  - Adressblock optisch gruppiert, Notizfeld mit Zeichenzähler ab 80 Prozent
- **Akzeptanz:**
  - Alle Fehlerzustände sichtbar: Pflichtfeld leer, ungültige URL, Duplikat, Serverfehler
  - Tastaturbedienung vollständig, Fokus kehrt nach dem Schließen auf den auslösenden Button zurück
  - `aria-invalid` und `aria-describedby` korrekt gesetzt

### CRM-04-T4 — Verdrahtung in der Liste

- **Files:** `components/workspace/crm/shell/customers-page-header/**`,
  `table/customers-table-row-actions/**`, `(app)/crm/page.tsx`
- **Skills:** `frontend-design`, `accessibility`
- **Inhalt:** Button „Kunde anlegen" im Header, Zeilenaktion „Bearbeiten", beide setzen nur
  Query-Parameter; die Page lädt bei `edit` den Kunden serverseitig vor
- **Akzeptanz:**
  - Neu angelegter Kunde erscheint nach `router.refresh()` in der Liste
  - Ein `edit`-Parameter mit unbekannter ID öffnet keinen Dialog und wirft keinen Fehler
  - Der Empty-State verweist jetzt auf den Anlegen-Button

## Deploy-Sicherheit

1. **Live sichtbar:** Anlegen- und Bearbeiten-Button in der Kundenliste, beide voll funktionsfähig.
2. **Bricht nichts:** keine Migration, keine Änderung bestehender Routen. `withPermission` wird hier
   zum ersten Mal produktiv genutzt — ausschließlich auf neuen Endpunkten.
3. **Offen:** Ansprechpartner über den Erstkontakt hinaus (Task 06), Detailansicht (Task 05). Die
   Zeile ist noch nicht anklickbar — es gibt nur die explizite Aktion „Bearbeiten", also keinen
   Klick ins Leere.

## End-to-End-Akzeptanz

1. Ein Kunde lässt sich mit nur einem Firmennamen anlegen und erscheint sofort in der Liste.
2. Derselbe Firmenname ein zweites Mal ergibt eine verständliche Fehlermeldung am Feld, kein 500er.
3. Groß- und Kleinschreibung sowie führende Leerzeichen gelten als Duplikat.
4. Bearbeiten lädt die bestehenden Werte vor und speichert Änderungen.
5. Ein Kunde mit Erstkontakt zeigt diesen als Primärkontakt in der Listenspalte.
6. Alle Texte in DE und EN gepflegt.
7. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
