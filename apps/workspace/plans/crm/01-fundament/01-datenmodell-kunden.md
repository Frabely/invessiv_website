# Task 01 — Datenmodell Kunden

> **Branch:** `feat/crm-datenmodell-kunden`
> **Aufwand:** M (rund ein Tag)
> **Abhängigkeiten:** keine
> **Migration:** `0021_create_customers.sql` (Planwert)

## Context

Das Fundament des CRM: die Tabellen `customers` und `customer_contacts`, dazu die Konstanten, DTOs
und der Mapper. Bewusst **ohne jede UI und ohne Route** — dieser Task legt nur Struktur an, damit die
Folgetasks auf einem stabilen, reviewten Schema aufsetzen.

Die Timeline entsteht nicht hier, sondern in Task 01a als **gemeinsame** `activities`-Tabelle für
Leads und Kunden. Grund: aus einem Lead wird ohnehin ein Kunde, und die Historie soll durchlaufen
statt an der Konvertierung abzureißen.

Vorlage für alles hier ist `packages/db/src/record-configuration/leads.ts` — Struktur, Benennung und
Index-Strategie werden übernommen, nicht neu erfunden.

## Entscheidungen

| Bereich                     | Entscheidung                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Primärschlüssel             | `uuid`, applikationsseitig per `crypto.randomUUID()` (wie `leads`)                                                                          |
| Kundennummer                | Zusätzliche Ganzzahl aus einer Sequenz, Anzeige als `K0001`. Sortierung und Filter laufen **auf der Zahl**, nie auf dem formatierten String |
| Warum keine Uuid als Nummer | Die Nummer soll sprechbar und tippbar sein (am Telefon, auf der Rechnung, im Ordnernamen). Die `uuid` bleibt der Primärschlüssel            |
| Warum ohne Jahr             | Ein Kunde überdauert Geschäftsjahre und behält seine Nummer. Belege (`AG2026-001`, `RE2026-001`) tragen das Jahr, Stammdaten nicht          |
| Kundentyp                   | `customer_type` (`company` \| `individual`). `display_name` ist Pflicht- und Anzeigefeld, `company_name` optional                           |
| Warum                       | Privatkunden und Freiberufler haben keinen Firmennamen. Ohne den Typ müsste Task 08 den Personennamen ins Feld Firmenname schreiben         |
| Firmenname                  | **Kein** Unique-Index. Zwei echte „Müller GmbH" in verschiedenen Städten sind ein gültiger Zustand; Task 04 warnt stattdessen vor Dubletten |
| Status                      | Feste Liste `onboarding, active, maintenance, on_hold, archived`. Kein `prospect` — ein Kunde entsteht aus einem gewonnenen Lead            |
| Warum `on_hold`             | Deckt sich mit dem gleichnamigen Lead-Status. Ein Vokabular statt zwei, die dasselbe meinen                                                 |
| Kategorie                   | Verweist auf die **bestehende** Tabelle `lead_categories`, damit Task 08 die Kategorie des Leads übernehmen kann                            |
| Löschen                     | Soft-Delete über `deleted_at`. Nur `customers` und `projects` bekommen die Spalte — Kind-Abfragen sind ohnehin über den Parent gescopet     |
| Beträge                     | `default_hourly_rate_cents` am Kunden als Vorgabe; Budget und abweichender Satz liegen am Projekt (Task 09)                                 |
| Ende                        | `churned_at` + `churn_reason` — `status = archived` sagt nicht, wann und warum eine Betreuung endete                                        |
| Adresse                     | Als Spalten am Kunden (`street`, `postal_code`, `city`, `country`), keine eigene Tabelle — eine Rechnungsadresse pro Kunde reicht           |
| Ansprechpartner             | Eigene Tabelle, `ON DELETE CASCADE`, genau einer darf `is_primary` sein (partieller Unique-Index)                                           |
| Enums                       | TEXT-Spalte + CHECK-Constraint über `sqlCheckIn`, Werte aus Const-Objekt in `packages/common`                                               |
| Ordnerschnitt               | Modelle unter `packages/db/src/record-configuration/crm/` mit eigenem Barrel                                                                |
| Zeitstempel                 | `created_at` / `updated_at` als `timestamptz`, DTOs geben ISO-Strings zurück, nie `Date`                                                    |

## Contract

```ts
// packages/common/src/constants/crm/customer-statuses.ts
export const CustomerStatus = {
  Onboarding: "onboarding",
  Active: "active",
  Maintenance: "maintenance",
  OnHold: "on_hold",
  Archived: "archived",
} as const;

export type CustomerStatus =
  (typeof CustomerStatus)[keyof typeof CustomerStatus];

export const CUSTOMER_STATUS_VALUES = [
  CustomerStatus.Onboarding,
  CustomerStatus.Active,
  CustomerStatus.Maintenance,
  CustomerStatus.OnHold,
  CustomerStatus.Archived,
] as const;
```

```ts
// packages/common/src/constants/crm/customer-types.ts
export const CustomerType = {
  Company: "company",
  Individual: "individual",
} as const;
```

```ts
// packages/common/src/patterns/crm/format-customer-number.ts
/** 1 → "K0001", 10000 → "K10000". Anzeige only — sortiert und gefiltert wird auf der Zahl. */
export function formatCustomerNumber(value: number): string;
```

```ts
// packages/common/src/contracts/crm/customer-summary.dto.ts
export interface CustomerSummaryDto {
  id: string;
  customerNumber: number; // roh; Formatierung erst in der Anzeige
  customerType: CustomerType;
  displayName: string;
  companyName: string | null;
  status: CustomerStatus;
  categoryId: string | null;
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
  defaultHourlyRateCents: number | null;
  churnedAt: string | null;
  churnReason: string | null;
  contacts: CustomerContactDto[];
}
```

## Tabellen

```txt
customers
  id uuid PK
  customer_number integer NOT NULL            DEFAULT nextval('customers_customer_number_seq')
  customer_type text NOT NULL DEFAULT 'company'    CHECK in CUSTOMER_TYPE_VALUES
  display_name text NOT NULL
  company_name text NULL
  status text NOT NULL DEFAULT 'onboarding'        CHECK in CUSTOMER_STATUS_VALUES
  category_id uuid NULL → lead_categories.id ON DELETE SET NULL
  street / postal_code / city / country            text NULL
  website_url / vat_id / notes                     text NULL
  default_hourly_rate_cents integer NULL           CHECK (>= 0)
  churned_at timestamptz NULL
  churn_reason text NULL
  deleted_at timestamptz NULL
  created_at / updated_at                          timestamptz NOT NULL DEFAULT now()
  UNIQUE INDEX customers_customer_number_uidx ON (customer_number)
  INDEX (status, created_at desc)  WHERE deleted_at IS NULL
  INDEX (category_id)              WHERE deleted_at IS NULL

customer_contacts
  id uuid PK
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  first_name / last_name / email / phone / role_label   text NULL
  display_name text NOT NULL
  is_primary boolean NOT NULL DEFAULT false
  created_at / updated_at
  UNIQUE INDEX customer_contacts_primary_uidx ON (customer_id) WHERE is_primary
  INDEX (customer_id)
```

Kein Unique-Index auf dem Firmennamen — bewusst, siehe Entscheidungen.

## Verzeichnisstruktur

```txt
packages/db/migrations/0021_create_customers.sql
packages/db/src/record-configuration/crm/
  customers.ts
  customer-contacts.ts
  index.ts                                  Barrel, wird in record-configuration/index.ts re-exportiert

packages/common/src/constants/crm/
  customer-statuses.ts        (+ .test.ts)
  customer-types.ts           (+ .test.ts)
  errors/customer-error-codes.ts

packages/common/src/patterns/crm/
  format-customer-number.ts   (+ .test.ts)

packages/common/src/contracts/crm/
  customer-summary.dto.ts
  customer-detail.dto.ts
  customer-contact.dto.ts
  rows/customer-row.ts
  results/create-customer-result.ts

apps/workspace/src/server/workspace/crm/services/
  customers-mapper-service.ts   (+ Test unter src/server/tests/workspace/crm/services/)
```

## Tickets

### CRM-01-T1 — Konstanten, Nummernformat und Fehlercodes

- **Files:** `packages/common/src/constants/crm/customer-statuses.ts`, `customer-types.ts`,
  `errors/customer-error-codes.ts`, `packages/common/src/patterns/crm/format-customer-number.ts`
- **Skills:** `best-practices`
- **Inhalt:**
  - Const-Objekt + abgeleiteter Type + `_VALUES`-Array je Gruppe, Muster exakt wie
    `packages/common/src/constants/contact/contact-lead-statuses.ts`
  - `formatCustomerNumber` als reine Funktion, vierstellig aufgefüllt, darüber frei wachsend
  - Fehlercodes: `CustomerNotFound`, `ValidationError`, `ContactNotFound`.
    **Kein** `CompanyNameExists` — Duplikate sind erlaubt und werden in Task 04 nur angewarnt
  - Kein TS `enum`, kein String-Literal doppelt
- **Akzeptanz:**
  - Co-located Test prüft `_VALUES` gegen `Object.values()` des Const-Objekts und auf Duplikate
  - Test der Formatierung: 1, 42, 999, 1000, 10000 und 99999
  - `pnpm --filter @invessiv/common typecheck` grün

### CRM-01-T2 — Migration 0021

- **Files:** `packages/db/migrations/0021_create_customers.sql`
- **Skills:** `best-practices`
- **Inhalt:**
  - Sequenz `customers_customer_number_seq`, dann beide `CREATE TABLE IF NOT EXISTS` wie oben,
    getrennt durch `--> statement-breakpoint`
  - CHECK-Constraints mit denselben Werten wie die Const-Objekte aus T1
  - Fremdschlüssel auf `lead_categories` (die Tabelle existiert bereits)
  - Partieller Unique-Index auf `is_primary`, partielle Indizes mit `deleted_at IS NULL`
  - Rein additiv: keine bestehende Tabelle wird angefasst
- **Akzeptanz:**
  - `pnpm db:migrate:dev` läuft durch, erneuter Lauf ist idempotent (kein Fehler)
  - `pnpm db:smoke:dev` grün
  - Insert mit unbekanntem Status oder Typ wird von Postgres abgewiesen
  - Zwei Kunden mit identischem `company_name` lassen sich anlegen
  - Zwei aufeinanderfolgende Inserts bekommen aufsteigende, lückenlose Nummern

### CRM-01-T3 — Drizzle-Modelle

- **Files:** `packages/db/src/record-configuration/crm/{customers,customer-contacts,index}.ts`,
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
  - `customerNumber` bleibt im DTO eine Zahl; formatiert wird erst in der Anzeige
  - `customersMapperService = { toSummary, toDetail, toContact } as const`
  - Result-Union `CreateCustomerResult` nach Muster `create-lead-result.ts`
- **Akzeptanz:**
  - Mapper-Tests decken `null`-Felder, fehlenden Primärkontakt, beide Kundentypen und
    Zeitstempel-Formatierung ab
  - Kein `any`, kein Cast ohne Type-Guard

## Deploy-Sicherheit

1. **Live sichtbar:** nichts. Keine Route, kein Menüpunkt, keine UI.
2. **Bricht nichts:** Migration ist rein additiv (zwei neue Tabellen, eine neue Sequenz, ein
   Fremdschlüssel **auf** `lead_categories` ohne diese Tabelle zu verändern). Die neuen
   Drizzle-Modelle werden von keinem produktiven Codepfad gelesen. Das Barrel wird nur erweitert.
3. **Offen:** alles Weitere. Abgesichert dadurch, dass es keinen Einstiegspunkt gibt — der
   Sidebar-Eintrag kommt erst mit Task 03.

## End-to-End-Akzeptanz

1. `pnpm db:migrate:dev` legt beide Tabellen an, ein zweiter Lauf ist folgenlos.
2. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` sind grün.
3. `pnpm build:workspace` läuft durch.
4. Ein manuell eingefügter Kunde lässt sich über den Mapper zu einem `CustomerDetailDto` machen.
5. Ein Privatkunde ohne `company_name` ist ein gültiger Datensatz.
6. Ein Kunde mit zwei `is_primary`-Kontakten wird von der Datenbank abgelehnt.
7. Die App verhält sich vor und nach dem Deploy identisch.
