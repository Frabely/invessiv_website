# Task 01 — Datenmodell Kunden

> **Branch:** `feat/crm-datenmodell-kunden`
> **Aufwand:** M (rund ein Tag)
> **Abhängigkeiten:** keine
> **Migration:** `0021_create_customers.sql` (Planwert)

## Context

Das Fundament des CRM: die Tabellen `customers`, `customer_contacts` und `customer_activities`, dazu
die Konstanten, DTOs und der Mapper. Bewusst **ohne jede UI und ohne Route** — dieser Task legt nur
Struktur an, damit die Folgetasks auf einem stabilen, reviewten Schema aufsetzen.

`customer_activities` entsteht schon hier, obwohl die Timeline-UI erst Task 26 baut: die
Lead-Konvertierung (Task 08) schreibt bereits Einträge, und eine Tabelle nachzuziehen wäre teurer,
als sie leer mitlaufen zu lassen.

Vorlage für alles hier ist `packages/db/src/record-configuration/leads.ts` und
`lead-activities.ts` — Struktur, Benennung und Index-Strategie werden übernommen, nicht neu erfunden.

## Entscheidungen

| Bereich         | Entscheidung                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Primärschlüssel | `uuid`, applikationsseitig per `crypto.randomUUID()` (wie `leads`)                                                                |
| Enums           | TEXT-Spalte + CHECK-Constraint über `sqlCheckIn`, Werte aus Const-Objekt in `packages/common`                                     |
| Ordnerschnitt   | Modelle unter `packages/db/src/record-configuration/crm/` mit eigenem Barrel                                                      |
| Adresse         | Als Spalten am Kunden (`street`, `postal_code`, `city`, `country`), keine eigene Tabelle — eine Rechnungsadresse pro Kunde reicht |
| Firmenname      | Pflichtfeld, partieller Unique-Index auf `lower(btrim(company_name))` wie bei `leads`                                             |
| Ansprechpartner | Eigene Tabelle, `ON DELETE CASCADE`, genau einer darf `is_primary` sein (partieller Unique-Index)                                 |
| Zeitstempel     | `created_at` / `updated_at` als `timestamptz`, DTOs geben ISO-Strings zurück, nie `Date`                                          |

## Contract

```ts
// packages/common/src/constants/crm/customer-statuses.ts
export const CustomerStatus = {
  Prospect: "prospect",
  Onboarding: "onboarding",
  Active: "active",
  Maintenance: "maintenance",
  Paused: "paused",
  Archived: "archived",
} as const;

export type CustomerStatus =
  (typeof CustomerStatus)[keyof typeof CustomerStatus];

export const CUSTOMER_STATUS_VALUES = [
  CustomerStatus.Prospect,
  CustomerStatus.Onboarding,
  CustomerStatus.Active,
  CustomerStatus.Maintenance,
  CustomerStatus.Paused,
  CustomerStatus.Archived,
] as const;
```

```ts
// packages/common/src/constants/crm/customer-activity-types.ts
export const CustomerActivityType = {
  Note: "note",
  Created: "created",
  StatusChange: "status_change",
  FieldChange: "field_change",
  ConvertedFromLead: "converted_from_lead",
  CredentialRevealed: "credential_revealed",
  FileUploaded: "file_uploaded",
  SubmissionReceived: "submission_received",
} as const;
```

```ts
// packages/common/src/contracts/crm/customer-summary.dto.ts
export interface CustomerSummaryDto {
  id: string;
  companyName: string;
  status: CustomerStatus;
  city: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// packages/common/src/contracts/crm/customer-detail.dto.ts
export interface CustomerDetailDto extends CustomerSummaryDto {
  street: string | null;
  postalCode: string | null;
  country: string | null;
  websiteUrl: string | null;
  vatId: string | null;
  notes: string | null;
  contacts: CustomerContactDto[];
}
```

## Tabellen

```txt
customers
  id uuid PK
  company_name text NOT NULL
  status text NOT NULL DEFAULT 'prospect'   CHECK in CUSTOMER_STATUS_VALUES
  street / postal_code / city / country     text NULL
  website_url / vat_id / notes              text NULL
  created_at / updated_at                   timestamptz NOT NULL DEFAULT now()
  UNIQUE INDEX customers_company_name_lower_uidx  ON lower(btrim(company_name))
  INDEX (status, created_at desc)

customer_contacts
  id uuid PK
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  first_name / last_name / email / phone / role_label   text NULL
  display_name text NOT NULL
  is_primary boolean NOT NULL DEFAULT false
  created_at / updated_at
  UNIQUE INDEX customer_contacts_primary_uidx ON (customer_id) WHERE is_primary
  INDEX (customer_id)

customer_activities
  id uuid PK
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  type text NOT NULL                        CHECK in CUSTOMER_ACTIVITY_TYPE_VALUES
  title text NOT NULL
  body text NULL
  metadata jsonb NULL
  occurred_at timestamptz NOT NULL DEFAULT now()
  actor_type text NOT NULL                  CHECK in ('system','user','customer')
  actor_id / actor_label text NULL
  INDEX (customer_id, occurred_at desc)
```

## Verzeichnisstruktur

```txt
packages/db/migrations/0021_create_customers.sql
packages/db/src/record-configuration/crm/
  customers.ts
  customer-contacts.ts
  customer-activities.ts
  index.ts                                  Barrel, wird in record-configuration/index.ts re-exportiert

packages/common/src/constants/crm/
  customer-statuses.ts        (+ .test.ts)
  customer-activity-types.ts  (+ .test.ts)
  customer-actor-types.ts
  errors/customer-error-codes.ts

packages/common/src/contracts/crm/
  customer-summary.dto.ts
  customer-detail.dto.ts
  customer-contact.dto.ts
  customer-activity.dto.ts
  rows/customer-row.ts
  results/create-customer-result.ts

apps/workspace/src/server/workspace/crm/services/
  customers-mapper-service.ts   (+ Test unter src/server/tests/workspace/crm/services/)
```

## Tickets

### CRM-01-T1 — Konstanten und Fehlercodes

- **Files:** `packages/common/src/constants/crm/customer-statuses.ts`,
  `customer-activity-types.ts`, `customer-actor-types.ts`, `errors/customer-error-codes.ts`
- **Skills:** `best-practices`
- **Inhalt:**
  - Const-Objekt + abgeleiteter Type + `_VALUES`-Array je Gruppe, Muster exakt wie
    `packages/common/src/constants/contact/contact-lead-statuses.ts`
  - Fehlercodes: `CompanyNameExists`, `CustomerNotFound`, `ValidationError`, `ContactNotFound`
  - Kein TS `enum`, kein String-Literal doppelt
- **Akzeptanz:**
  - Co-located Test prüft `_VALUES` gegen `Object.values()` des Const-Objekts und auf Duplikate
  - `pnpm --filter @invessiv/common typecheck` grün

### CRM-01-T2 — Migration 0021

- **Files:** `packages/db/migrations/0021_create_customers.sql`
- **Skills:** `best-practices`
- **Inhalt:**
  - Drei `CREATE TABLE IF NOT EXISTS` wie oben beschrieben, getrennt durch `--> statement-breakpoint`
  - CHECK-Constraints mit denselben Werten wie die Const-Objekte aus T1
  - Partielle Unique-Indizes (`company_name` lower/btrim, `is_primary`)
  - Rein additiv: keine bestehende Tabelle wird angefasst
- **Akzeptanz:**
  - `pnpm db:migrate:dev` läuft durch, erneuter Lauf ist idempotent (kein Fehler)
  - `pnpm db:smoke:dev` grün
  - Insert mit unbekanntem Status wird von Postgres abgewiesen

### CRM-01-T3 — Drizzle-Modelle

- **Files:** `packages/db/src/record-configuration/crm/{customers,customer-contacts,customer-activities,index}.ts`,
  Re-Export in `packages/db/src/record-configuration/index.ts`
- **Skills:** `best-practices`
- **Inhalt:**
  - `pgTable`-Definitionen deckungsgleich zur Migration, Vorlage `record-configuration/leads.ts`
  - CHECKs über `sqlCheckIn` aus `packages/db/src/core/sql-helpers.ts`
  - Barrel `crm/index.ts`, das vom bestehenden `record-configuration/index.ts` re-exportiert wird
- **Akzeptanz:**
  - Typecheck grün, bestehende Imports aus `record-configuration` brechen nicht
  - Spaltennamen und Constraints stimmen 1:1 mit der Migration überein (Review-Punkt im PR)

### CRM-01-T4 — DTOs und Mapper

- **Files:** `packages/common/src/contracts/crm/**`,
  `apps/workspace/src/server/workspace/crm/services/customers-mapper-service.ts`,
  `apps/workspace/src/server/tests/workspace/crm/services/customers-mapper-service.test.ts`
- **Skills:** `best-practices`
- **Inhalt:**
  - DTOs in camelCase, Row-Shapes in snake_case, Zeitstempel als ISO-String
  - `customersMapperService = { toSummary, toDetail, toContact, toActivity } as const`
  - Result-Union `CreateCustomerResult` nach Muster `create-lead-result.ts`
- **Akzeptanz:**
  - Mapper-Tests decken `null`-Felder, fehlenden Primärkontakt und Zeitstempel-Formatierung ab
  - Kein `any`, kein Cast ohne Type-Guard

## Deploy-Sicherheit

1. **Live sichtbar:** nichts. Keine Route, kein Menüpunkt, keine UI.
2. **Bricht nichts:** Migration ist rein additiv (drei neue Tabellen, keine bestehende Spalte
   angefasst). Die neuen Drizzle-Modelle werden von keinem produktiven Codepfad gelesen. Das Barrel
   wird nur erweitert.
3. **Offen:** alles Weitere. Abgesichert dadurch, dass es keinen Einstiegspunkt gibt — der
   Sidebar-Eintrag kommt erst mit Task 03.

## End-to-End-Akzeptanz

1. `pnpm db:migrate:dev` legt die drei Tabellen an, ein zweiter Lauf ist folgenlos.
2. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` sind grün.
3. `pnpm build:workspace` läuft durch.
4. Ein manuell eingefügter Kunde lässt sich über den Mapper zu einem `CustomerDetailDto` machen.
5. Ein Kunde mit zwei `is_primary`-Kontakten wird von der Datenbank abgelehnt.
6. Die App verhält sich vor und nach dem Deploy identisch.
