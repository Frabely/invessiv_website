# Task 01 — Datenmodell Kunden

> **Merge-Einheit:** Ordner 01 · **Branch:** `feat/crm-kernschema-und-contracts`
> **Aufwand:** M · **Abhängigkeiten:** keine
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)

- Dieser Task legt `workspace_members`, `customers`, globale `people`,
  `customer_contact_assignments` und das Activity-Expand-Schema additiv an.
- Kundenstatus ausschließlich `active | paused | archived`; der Create-Command setzt ihn explizit.
- `customers.owner_member_id` ist Pflicht-FK; bearbeitbare Entitäten erhalten `version`.
- Kein `deleted_at`, `churned_at` oder `churn_reason`. Archivierung ist reversibel; Purge folgt nur
  im internen Owner-Command aus Task 34.
- `people` hält globale Daten und `preferred_locale`; die Zuordnung hält Funktion, abweichende
  Firmen-E-Mail/-Telefon und `is_primary`.
- Ein Kunde muss nach dem Create-Command genau einen Primärkontakt besitzen. Die DB erzwingt
  höchstens einen, der atomare Command mindestens einen.
- `CustomerSummaryDto.primaryContactName` ist nicht nullable;
  `primaryContactEmail` bleibt nullable, weil Name plus Telefon einen gültigen Kontakt bilden.
- Kontakt-DTOs führen `personVersion` und `assignmentVersion` getrennt, weil globale Personendaten
  und kundenspezifische Zuordnungsdaten unabhängig versioniert sind.
- Sequenzlücken sind gültig und werden getestet; keine Nummer wird wiederverwendet.

## Context

Das Fundament des CRM: die Tabellen `customers`, globale `people` und `customer_contact_assignments`, dazu die
Konstanten, DTOs
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
| Status                      | Feste Liste `active, paused, archived`; der Create-Command setzt den Startwert explizit                                                     |
| Kategorie                   | Verweist auf die **bestehende** Tabelle `lead_categories`, damit Task 08 die Kategorie des Leads übernehmen kann                            |
| Archivieren                 | Reversibel über `status = archived`; kein `deleted_at` und kein Löschpfad in dieser Einheit                                                 |
| Beträge                     | `default_hourly_rate_cents` am Kunden als Vorgabe; Budget und abweichender Satz liegen am Projekt (Task 09)                                 |
| Aufbewahrung                | Optionale individuelle Prüffrist; Standardlogik folgt in Ordner 05                                                                          |
| Adresse                     | Als Spalten am Kunden (`street`, `postal_code`, `city`, `country`), keine eigene Tabelle — eine Rechnungsadresse pro Kunde reicht           |
| Ansprechpartner             | Globale `people` plus Zuordnungstabelle; genau eine Zuordnung ist Primärkontakt                                                             |
| Enums                       | TEXT-Spalte + CHECK-Constraint über `sqlCheckIn`, Werte aus Const-Objekt in `packages/common`                                               |
| Ordnerschnitt               | Modelle unter `packages/db/src/record-configuration/crm/` mit eigenem Barrel                                                                |
| Zeitstempel                 | `created_at` / `updated_at` als `timestamptz`, DTOs geben ISO-Strings zurück, nie `Date`                                                    |

## Contract

```ts
// packages/common/src/constants/crm/customer-statuses.ts
export const CustomerStatus = {
  Active: "active",
  Paused: "paused",
  Archived: "archived",
} as const;

export type CustomerStatus =
  (typeof CustomerStatus)[keyof typeof CustomerStatus];

export const CUSTOMER_STATUS_VALUES = [
  CustomerStatus.Active,
  CustomerStatus.Paused,
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
  ownerMemberId: string;
  categoryId: string | null;
  city: string | null;
  primaryContactName: string;
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
  retentionReviewAfterDays: number | null;
  version: number;
  contacts: CustomerContactAssignmentDto[];
}
```

## Optimistic Concurrency (verbindlich für den ganzen Plan)

Rund zwanzig Command-Handler in späteren Ordnern brauchen `version` und 409. Das Muster entsteht **einmal hier** und
wird überall benutzt — nicht je Ordner neu erfunden.

Der Grund: die beiden naheliegenden Implementierungen sehen gleich aus und sind es nicht.

```ts
// FALSCH — Race-Fenster zwischen Lesen und Schreiben
const current = await load(id);
if (current.version !== input.version) return conflict(current);
await update(id, input); // hier kann dazwischen geschrieben werden
```

```sql
-- RICHTIG — atomar, ein Roundtrip, Version im WHERE
UPDATE customers
   SET …, version = version + 1, updated_at = now()
 WHERE id = $1 AND version = $2
-- 0 betroffene Zeilen → Konflikt (oder die Zeile existiert nicht)
```

Die falsche Variante schützt in fast allen Fällen und verliert im Rest still Daten. Deshalb ist sie
nicht erlaubt, und deshalb kapselt ein Helper das `UPDATE`, damit niemand sie schreiben muss.

### Contract

```ts
// packages/common/src/contracts/concurrency/versioned.ts
/** Jede bearbeitbare Entität trägt `version`; jeder Write schickt die gelesene Version mit. */
export interface VersionedWriteInput {
  version: number;
}

// packages/common/src/constants/errors/concurrency-error-codes.ts
export const ConcurrencyErrorCode = {
  VersionConflict: "version_conflict",
} as const;
```

```ts
// packages/common/src/contracts/concurrency/version-conflict.dto.ts
/** Body jeder 409-Antwort. `current` ist der frische Stand, damit die UI ihn zeigen kann,
 *  ohne nachzuladen und ohne die Eingaben des Nutzers zu verwerfen. */
export interface VersionConflictDto<T> {
  code: typeof ConcurrencyErrorCode.VersionConflict;
  currentVersion: number;
  current: T;
}
```

### Helper

```ts
// apps/workspace/src/server/workspace/shared/update-versioned.ts
/**
 * Führt genau ein atomares `UPDATE … WHERE id = $1 AND version = $2` aus.
 * - 1 Zeile  → { ok: true, value }
 * - 0 Zeilen → Zeile neu laden: existiert sie, ist es ein Konflikt; sonst NotFound.
 * Erhöht `version` im selben Statement. Es gibt keinen zweiten Weg, `version` zu setzen.
 */
export async function updateVersioned<
  TTable extends VersionedTable,
  TDto,
>(args: {
  tx: Tx;
  table: TTable;
  id: string;
  expectedVersion: number;
  patch: VersionedPatch<TTable>; // ohne id, version, created_at und updated_at
  toDto: (row: TTable["$inferSelect"]) => TDto;
}): Promise<
  | { ok: true; value: TDto }
  | { ok: false; code: "version_conflict"; conflict: VersionConflictDto<TDto> }
  | { ok: false; code: "not_found" }
>;
```

### Regeln

- **Jede** bearbeitbare Tabelle bekommt `version integer NOT NULL`; der Create-Command setzt `1` explizit.
- `version` wird ausschließlich im selben `UPDATE` erhöht. Kein Trigger — sonst springt sie an
  Stellen, die den Helper nutzen, um zwei.
- Jeder schreibende Command auf einer bearbeitbaren Entität nimmt `VersionedWriteInput` an. Eine
  Mutation ohne Version ist ein Contract-Fehler, kein „optional".
- Die Route mappt `version_conflict` auf `HttpResponseCode.Conflict` und gibt den
  `VersionConflictDto` als Body zurück — überall derselbe Schlüssel, derselbe Typ.
- Löschen und Statuswechsel sind ebenfalls Writes und tragen die Version mit. Ein Archivieren auf
  veraltetem Stand ist derselbe Fehler wie ein Überschreiben.
- Der Client verwirft bei 409 **nie** die Eingaben des Nutzers. Er zeigt den Konflikt mit dem Stand
  aus `current` und lässt erneut absenden.

### Akzeptanz (gilt als Vorlage für alle späteren Ordner)

- Test: zwei Writes mit derselben Ausgangsversion — der erste gewinnt, der zweite bekommt 409 mit
  `currentVersion` und vollständigem `current`.
- Test: der 409-Fall hat **nichts** geschrieben.
- Test: nach einem erfolgreichen Write ist die Version um genau 1 erhöht.
- Test: unbekannte ID ergibt `not_found`, nicht `version_conflict` — die beiden sind
  unterscheidbar, damit die UI nicht „jemand war schneller" für eine gelöschte Zeile anzeigt.
- Test: nebenläufige Writes im DB-Integrationstest, nicht nur im Unit-Mock.

## Tabellen

```txt
customers
  id uuid PK
  customer_number integer NOT NULL            DEFAULT nextval('customers_customer_number_seq')
  customer_type text NOT NULL                          CHECK in CUSTOMER_TYPE_VALUES
  display_name text NOT NULL
  company_name text NULL
  status text NOT NULL                                 CHECK in CUSTOMER_STATUS_VALUES
  owner_member_id uuid NOT NULL → workspace_members.id
  category_id uuid NULL → lead_categories.id ON DELETE SET NULL
  street / postal_code / city / country            text NULL
  website_url / vat_id / notes                     text NULL
  default_hourly_rate_cents integer NULL           CHECK (>= 0)
  created_at / updated_at                          timestamptz NOT NULL DEFAULT now()
  UNIQUE INDEX customers_customer_number_uidx ON (customer_number)
  version integer NOT NULL CHECK (version > 0)
  INDEX (status, created_at desc)
  INDEX (category_id)

customer_contact_assignments
  id uuid PK
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  person_id uuid NOT NULL → people.id ON DELETE RESTRICT
  role_label / business_email / business_phone          text NULL
  is_primary boolean NOT NULL
  version integer NOT NULL CHECK (version > 0)
  created_at / updated_at
  UNIQUE INDEX customer_contact_assignments_primary_uidx ON (customer_id) WHERE is_primary
  INDEX (customer_id)
```

Kein Unique-Index auf dem Firmennamen — bewusst, siehe Entscheidungen.

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_create_customers.sql
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
  - Fehlercodes: `CustomerNotFound`, `ValidationError`, `ContactNotFound`. **Kein** `CompanyNameExists` — Duplikate
    sind erlaubt und werden in Task 04 nur angewarnt
- Kein TS `enum`, kein String-Literal doppelt
- **Akzeptanz:**
  - Co-located Test prüft `_VALUES` gegen `Object.values()` des Const-Objekts und auf Duplikate
    — einschließlich `ConcurrencyErrorCode`
  - Test der Formatierung: 1, 42, 999, 1000, 10000 und 99999
  - `pnpm --filter @invessiv/common typecheck` grün

### CRM-01-T2 — Migration 0021

- **Files:** `packages/db/migrations/<nr>_create_customers.sql`
- **Skills:** `best-practices`
- **Inhalt:**
  - Sequenz `customers_customer_number_seq`, dann beide `CREATE TABLE IF NOT EXISTS` wie oben,
    getrennt durch `--> statement-breakpoint`
  - CHECK-Constraints mit denselben Werten wie die Const-Objekte aus T1
  - Fremdschlüssel auf `lead_categories` (die Tabelle existiert bereits)
  - Partieller Unique-Index auf `is_primary`; Listen filtern ausschließlich über den Kundenstatus
  - Rein additiv: keine bestehende Tabelle wird angefasst
- **Akzeptanz:**
  - `pnpm db:migrate:dev` läuft durch, erneuter Lauf ist idempotent (kein Fehler)
  - `pnpm db:smoke:dev` grün
  - Insert mit unbekanntem Status oder Typ wird von Postgres abgewiesen
  - Zwei Kunden mit identischem `company_name` lassen sich anlegen
  - Zwei Inserts bekommen aufsteigende Nummern; ein simulierter Rollback darf eine Sequenzlücke
    hinterlassen und diese Lücke wird als gültig akzeptiert

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

### CRM-01-T5 — Concurrency-Muster

- **Files:** `packages/common/src/contracts/concurrency/{versioned,version-conflict.dto}.ts`,
  `packages/common/src/constants/errors/concurrency-error-codes.ts`,
  `apps/workspace/src/server/workspace/shared/update-versioned.ts` + DB-Integrationstest
- **Skills:** `best-practices`
- **Inhalt:** Contract, Fehlercode und Helper wie oben. Der Helper ist der **einzige** Weg, eine
  versionierte Zeile zu aktualisieren
- **Akzeptanz:** die fünf Punkte aus dem Abschnitt „Optimistic Concurrency", inklusive des
  nebenläufigen DB-Tests, der den echten `updateVersioned`-Helper gegen PostgreSQL ausführt

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
6. Ein Kunde mit zwei `is_primary`-Zuordnungen wird von der Datenbank abgelehnt; ein Kunde ohne
   Primärkontakt wird nur außerhalb des atomaren Create-Commands als ungültiger Zwischenzustand
   zugelassen.
7. Zwei Writes mit derselben Ausgangsversion: der erste gewinnt, der zweite bekommt 409 mit
   `currentVersion` und `current`, und es wurde nichts geschrieben.
8. Eine unbekannte ID ergibt `not_found` und nicht `version_conflict`.
9. Die App verhält sich vor und nach dem Deploy identisch.
