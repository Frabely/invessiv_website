# Workspace-Leads CSV-Import — Implementierungsplan (Phase 2)

> **Branch:** `feat/workspace-lead-section`
> **Quelle:** Verfeinerung von `plans/workspace/leads/02-import-export.md` und Sync mit
> `docs/guides/workspace-leads-import-readme.md` + `plans/workspace/leads/lead-import-example.csv`.
> **Phase 1 Voraussetzung:** Liste, Detail, manueller Lead-Create-Flow (`createLead()`), `withWorkspaceApiAuth`,
> `LeadSource.Import`, `external_guid`, `lead_activities`, `lead_social_profiles`, Lead-Filter — alles laut
> Faktenkartierung **bereits live**.

## Context

Phase 2 priorisiert den CSV-Import für Outbound-Leads. Ein importierbarer Lead besteht aus `email` plus entweder
`last_name` oder `company_name`. Alle weiteren Felder sind optional und werden nur gemappt, wenn sie vorhanden und
valide sind. Die Spaltenreihenfolge ist beliebig, unbekannte Spalten werden ignoriert. Phase 1 hat die Persistenz-,
Auth- und UI-Schicht bereits geliefert — Phase 2 baut darauf auf, ohne diese Ebenen zu duplizieren.

Export bleibt explizit **out-of-scope** (Vorbereitung im Quellplan dokumentiert, hier nicht umgesetzt).

## Kritische Abweichungen vom Quellplan (`02-import-export.md`)

Diese Punkte habe ich nach Rücksprache angepasst — dokumentiert für Reviewer und spätere Audits:

| Quellplan                                                                   | Diese Umsetzung                                                                                                                                               | Begründung                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `category`-Spaltenkey löst Slug-Fallback aus, falls `category_id` leer ist. | **`category`-Key entfällt.** Nur `category_id` (UUID) ist offiziell.                                                                                          | User-Entscheidung. Vereinfacht Mapping/Validation, eliminiert Locale-Edge-Cases. Bestehende Beispiel-CSV bleibt funktional, weil `category` als unbekannte Spalte ignoriert wird (zählt in `ignored_columns`-Report).       |
| `LeadActivityType` mit existierendem `Note` weiternutzen.                   | **Neuer Enum-Wert `LeadActivityType.Import`.**                                                                                                                | User-Entscheidung. Saubere semantische Unterscheidung im Activity-Feed; benötigt eine kleine Drizzle-Enum-Migration.                                                                                                        |
| `createLead()` direkt durch Import wiederverwenden.                         | **Refactor:** Extrahiere `createLeadCoreInTransaction(tx, input, options)` aus dem bestehenden Command-Handler. Manueller Flow + Import rufen denselben Core. | User-Entscheidung. DRY, behält bestehende Tests grün.                                                                                                                                                                       |
| Import-Trigger lebt in der Toolbar (`leads-toolbar`).                       | **Trigger im `leads-page-header`** neben dem bestehenden „Neuer Lead"-Button.                                                                                 | UX-Konsistenz: Add-Lead-Trigger ist heute schon im Header (`src/components/workspace/leads/shell/leads-page-header.tsx`). Toolbar bleibt rein für Filter (entspricht der scoped `AGENTS.md`-Konvention „Toolbar = Filter"). |
| Skills wie `best-practices`, `performance`, `web-design-guidelines`.        | Auf installierte Superpowers-Skills gemappt (siehe pro Step).                                                                                                 | Nur tatsächlich verfügbare Skills referenzieren.                                                                                                                                                                            |

## Architekturüberblick

### Datenfluss

```text
ImportLeadsDialog (client)
  └── multipart POST /api/workspace/leads/import
        └── withWorkspaceApiAuth
              └── importLeadsCommandHandler(file, access)
                    ├── lead-csv-parser            (Bytes → Headers + Rows)
                    ├── lead-csv-mapping-service   (Headers + Row → typed RawLeadImportRow)
                    ├── lead-import-validation     (Zod, cross-field, status synonyms)
                    ├── batch-load existing keys   (emails + external_guids)
                    └── per Row:
                          dedupe / conflict checks
                          createLeadCoreInTransaction(tx, input, { source: Import, activityType: Import, batchId, rowIndex })
              └── leadImportReport (typed, lokalisierbar im Client)
```

### Zielverzeichnisstruktur

```text
src/
├── app/api/workspace/leads/
│   └── import/
│       └── route.ts                                                  # neu
├── common/
│   ├── constants/leads/
│   │   ├── lead-import-column-keys.ts                                # neu
│   │   ├── lead-import-error-codes.ts                                # neu
│   │   ├── lead-import-warning-codes.ts                              # neu
│   │   ├── lead-activity-types.ts                                    # erweitern: + Import
│   │   └── lead-import-status-synonyms.ts                            # neu
│   └── contracts/leads/import/
│       ├── lead-import-row.dto.ts                                    # neu
│       ├── lead-import-report.dto.ts                                 # neu
│       └── lead-import-result.dto.ts                                 # neu
├── components/workspace/leads/
│   ├── shell/leads-page-header/leads-page-header.tsx                 # erweitern: Import-Trigger
│   └── form/import-leads-dialog/
│       ├── import-leads-dialog.tsx                                   # neu (client)
│       ├── import-leads-dialog.module.css                            # neu
│       ├── import-leads-service.ts                                   # neu (multipart fetch)
│       └── import-leads-error-message.ts                             # neu (code → dict text)
├── lib/workspace/leads/
│   └── lead-import-api-error.ts                                      # neu (analog zu lead-api-error.ts)
├── server/
│   ├── db/migrations/                                                # neu: ALTER TYPE … ADD VALUE 'import'
│   └── workspace/leads/
│       ├── command-handler/import-leads.command-handler.ts           # neu
│       ├── command-handler/create-lead.command-handler.ts            # refactor (delegate)
│       └── services/
│           ├── create-lead-core/
│           │   ├── create-lead-core.ts                               # neu (extrahiert)
│           │   ├── create-lead-core-input.ts                         # neu (server-internal types)
│           │   └── create-lead-core.test.ts
│           └── import/
│               ├── lead-csv-parser.ts                                # neu
│               ├── lead-csv-mapping-service.ts                       # neu
│               ├── lead-import-validation-service.ts                 # neu
│               ├── lead-import-existing-keys-loader.ts               # neu (batch-load)
│               └── *.test.ts
└── i18n/dictionaries/workspace/leads/
    └── import/
        ├── de.json                                                   # neu
        ├── en.json                                                   # neu
        └── index.ts (export im Top-Level-`index.ts` ergänzen)
```

### Wiederzuverwendende Bausteine (NICHT neu bauen)

| Baustein                  | Pfad                                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| Auth-Wrapper API          | `src/lib/auth/api.ts` → `withWorkspaceApiAuth`                                                           |
| Error-Helper-Pattern      | `src/lib/workspace/leads/lead-api-error.ts` (Vorlage)                                                    |
| Lead-Schema (Zod)         | `src/server/workspace/leads/services/create-lead/create-lead.schema.ts`                                  |
| Social-URL-Normalisierung | bestehende `normalizeLeadProfileUrl()` (im Create-Flow verwendet)                                        |
| Activity-Insert-Helper    | bestehender `createLeadActivity(tx, …)`                                                                  |
| Kategorien-Validation     | `src/server/workspace/leads/query-handler/list-lead-categories.query-handler.ts` (`getLeadCategories()`) |
| Status-Konstanten         | `src/common/constants/contact/contact-lead-statuses.ts` (`ContactLeadStatus`)                            |
| Source-Konstanten         | `src/common/constants/leads/lead-sources.ts` (`LeadSource.Import` existiert)                             |
| Dictionary-Loader         | `src/i18n/dictionaries/workspace/leads/index.ts` (Pattern)                                               |

## Verbindliche Konventionen pro Bereich

Vor jeder Änderung **die scoped AGENTS.md / CLAUDE.md im jeweiligen Verzeichnis lesen**. Schlüsselregeln (Auszug):

- **Keine Inline-Strings, keine `locale === "de" ? …`-Branches** in Server-/Client-Code →
  `src/i18n/dictionaries/workspace/leads/import/{de,en}.json`.
- **Const-Objekt + Derived-Type-Pattern** für alle neuen Enums, kein TS `enum`. Werte-Array separat als `*_VALUES`.
- **Error-Codes** als Const-Objekt + `MESSAGES`-Map in `*-error.ts`. Keine inline `Response.json` mit hardcoded Strings.
- **Contracts in `src/common/contracts/leads/import/`** sind die einzige UI/Server-shared Schnittstelle; UI darf nicht
  aus `src/server/**` importieren.
- **Server-internal Types** in `*-types.ts` neben dem Service.
- **Komponente = eigener Ordner** mit `<name>.tsx` + `<name>.module.css`. Keine Inline-Styles, keine globalen Klassen.
- **Server Components default**, `"use client"` nur bei echter Interaktivität.
- **Mutationen** nur via API-Route + `router.refresh()` nach Erfolg.
- **`withWorkspaceApiAuth`** ist Pflicht; keine eigene Auth.
- **Keine PII in Logs/Activity-Metadata** — nur `{ import_batch_id, row_index, status_synonym? }`.
- **Tests** mocken DB via `vi.hoisted()` + `txMock.insert(...).values(...)` (Pattern aus
  `create-lead.command-handler.test.ts`).
- **Pre-Merge-Gates**: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` müssen alle grün sein.

---

## Step 1 — Constants, Activity-Type-Migration, Status-Synonyms ✅

**Ziel:** Reine Type-/Const-Foundation. Kein Code, der Logik ausführt.

**Files:**

- Modify: `src/common/constants/leads/lead-activity-types.ts` → `Import: "import"` ergänzen +
  `LEAD_ACTIVITY_TYPE_VALUES` erweitern.
- Create: `src/common/constants/leads/lead-import-column-keys.ts` (`LeadImportColumnKey`, `LEAD_IMPORT_COLUMN_KEYS` — \*
  \*ohne\*\* `category`-Key).
- Create: `src/common/constants/leads/lead-import-error-codes.ts` (`LeadImportErrorCode` mit u. a. `FileTooLarge`,
  `UnsupportedMediaType`, `EmptyFile`, `InvalidCsv`, `TooManyRows`, `ValidationFailed`, `Internal`).
- Create: `src/common/constants/leads/lead-import-warning-codes.ts` (`LeadImportWarningCode` mit `IgnoredColumn`,
  `UnknownStatusFallback`, `EmptyImprovementToken`).
- Create: `src/common/constants/leads/lead-import-row-issue-codes.ts` — pro Zeile sowohl Errors (`MissingEmail`,
  `MissingNameOrCompany`, `InvalidEmail`, `InvalidUrl`, `InvalidScore`, `InvalidExternalGuid`, `UnknownCategoryId`,
  `DuplicateEmailInFile`, `DuplicateExternalGuidInFile`) als auch Skip-/Konfliktcodes (`DuplicateEmail`,
  `DuplicateExternalGuid`, `ConflictEmailGuidMismatch`).
- Create: `src/common/constants/leads/lead-import-status-synonyms.ts` — **server-only Map**
  `Record<string, ContactLeadStatus>` mit lower-cased DE/EN Synonymen, z. B.
  `{ "neu": "new", "new": "new", "kontaktiert": "contacted", "contacted": "contacted", "qualifiziert": "qualified", … }`.
  Quelle: bestehende DE/EN-Labels aus `dictionaries/workspace/leads/shared/*.json`.
- Create: `src/server/db/migrations/<timestamp>_lead_activity_type_add_import.sql` —
  `ALTER TYPE "lead_activity_type" ADD VALUE IF NOT EXISTS 'import';`
- Test: `src/common/constants/leads/lead-import-column-keys.test.ts` (Type-Test sichert `LEAD_IMPORT_COLUMN_KEYS` gegen
  Const-Objekt-Drift), analog für Error/Warning/Row-Issue.

**Akzeptanz:**

- TypeScript: alle drei `*_VALUES`-Arrays sind ableitete Tuples (`as const`); `Object.values()`-basiert.
- `npm run db:migrate:dev` läuft fehlerfrei und macht den Enum-Wert in lokaler DB verfügbar.
- Keine Logik, kein I/O.

**Skills:** `superpowers:test-driven-development` (Type-Tests zuerst), `superpowers:verification-before-completion`.

**Konventionsprüfung:**

- Root `CLAUDE.md` Abschnitt „Constants & Enums": Const-Objekt + derived type, `*_VALUES`-Array, ein File pro Domain,
  PascalCase-Keys.
- Root `CLAUDE.md` Abschnitt „Error Codes & Messages": Codes hier, Messages erst in Step 7 / 8.

---

## Step 2 — Import-DTOs (shared contracts) ✅

**Ziel:** Typsichere Brücke zwischen Server, API und UI.

**Files:**

- Create: `src/common/contracts/leads/import/lead-import-row.dto.ts` — DTO mit allen optionalen Feldern entsprechend
  `LeadImportColumnKey` (z. B. `email: string`, `first_name?: string`, `linkedin_url?: string`, …). Snake-case-Felder
  spiegeln die CSV-Keys 1:1 zur Mapping-Lesbarkeit.
- Create: `src/common/contracts/leads/import/lead-import-report.dto.ts`:
  ```ts
  export interface LeadImportReportDto {
    total_rows: number;
    imported_count: number;
    skipped_count: number;
    error_count: number;
    warning_count: number;
    ignored_columns: string[];
    row_issues: LeadImportRowIssueDto[];
    import_batch_id: string;
  }
  export interface LeadImportRowIssueDto {
    row_index: number; // 1-basiert, ohne Header
    column?: LeadImportColumnKey;
    code: LeadImportRowIssueCode;
    severity: "error" | "warning" | "skip";
  }
  ```
- Create: `src/common/contracts/leads/import/lead-import-result.dto.ts` — Server-Antwort-Wrapper
  `{ ok: true; report: LeadImportReportDto }` bzw. `{ ok: false; error: LeadImportErrorCode; details?: unknown }`.
- Test: `src/common/contracts/leads/import/lead-import-row.dto.test-d.ts` — Typ-Assertions, dass Felder ausschließlich
  aus `LeadImportColumnKey` ableiten (keine Drift).

**Akzeptanz:**

- Kein Server-Import in den Contract-Dateien (überprüft per Lint-Regel/Convention aus scoped `AGENTS.md`).
- DTOs sind ausschließlich aus `src/common/constants/leads/*` abhängig.

**Skills:** `superpowers:test-driven-development`.

**Konventionsprüfung:** scoped `src/app/[locale]/workspace/leads/AGENTS.md` „Kontrakt-Grenzen: UI importiert nur
`src/common/contracts/leads/**`".

---

## Step 3 — Zero-Dep CSV-Parser ✅

**Ziel:** Robuster, abhängigkeitsfreier Parser mit klar abgegrenzter Responsibility.

**Files:**

- Create: `src/server/workspace/leads/services/import/lead-csv-parser.ts` — exportiert
  `parseLeadCsv(input: string, options: { maxDataRows: number }): { headers: string[]; rows: string[][]; }` und einen
  typisierten Fehler `LeadCsvParseError` mit Code aus `LeadImportErrorCode` (`InvalidCsv`, `TooManyRows`).
- Create: `src/server/workspace/leads/services/import/lead-csv-parser-types.ts` — internal types.
- Test: `src/server/workspace/leads/services/import/lead-csv-parser.test.ts`.

**Funktionale Anforderungen:**

- UTF-8, BOM optional am Dateianfang strippen.
- Separator-Auto-Detect: prüfe erste Zeile auf `;` vs `,`; bei beidem `;` priorisieren.
- Quote-Support `"` mit Escaping `""`. Felder mit Separator/Newline/Quote sind quotable.
- Zeilenenden CRLF und LF.
- Leere Zeilen (auch nur Whitespace) werden ignoriert (zählen nicht zur 500-Datenzeilen-Grenze).
- Header-Zeile = erste nicht-leere Zeile.
- Ergebnis: `headers: string[]` (raw, **case-sensitive**), `rows: string[][]` (gleichlange Zeilen, kürzere mit `""`
  aufgefüllt).
- Bei `> maxDataRows` → `LeadCsvParseError(TooManyRows)`.

**Tests (TDD):**

- Semikolon, Komma, BOM, Quotes mit Separator/CRLF im Wert, leere Zeilen, gemischte CRLF/LF.
- 501 Datenzeilen → `TooManyRows`.
- Spaltenreihenfolge variiert (`email;last_name` vs `last_name;email`) liefert dieselben `headers`-Werte.
- Unbekannte Header werden NICHT vom Parser zurückgewiesen — sind Sache des Mappers.
- Beispielfixture: `plans/workspace/leads/lead-import-example.csv` parst ohne Error.

**Akzeptanz:**

- Keine externe CSV-Lib im `package.json`-Diff.
- 100 % Branch-Coverage für Quote-/Escape-Pfade in den Tests.

**Skills:** `superpowers:test-driven-development`, `superpowers:systematic-debugging` (für Edge-Case-Bugs).

---

## Step 4 — Mapping- und Validation-Service ✅

**Ziel:** Aus rohen Header+Row-Tupeln typisierte, validierte `RawLeadImportRow`-Datensätze inklusive sauberem
Issue-Report bauen.

**Files:**

- Create: `src/server/workspace/leads/services/import/lead-csv-mapping-service.ts` —
  `mapHeadersToColumns(headers): { columns: (LeadImportColumnKey | null)[]; ignored: string[] }` plus
  `mapRowToRaw(columns, row): RawLeadImportRow`.
- Create: `src/server/workspace/leads/services/import/lead-import-validation-service.ts` — Zod-Schema
  `leadImportRowSchema` + Funktion
  `validateRow(raw, ctx): { ok: true; value: ValidatedLeadImportRow } | { ok: false; issues: LeadImportRowIssueDto[] }`.
- Create: `src/server/workspace/leads/services/import/lead-import-validation-types.ts`.
- Test: `*.test.ts` für beide Services.

**Mapping-Regeln (verbindlich):**

- Header-Match ist **case-sensitive** und exakt gegen `LEAD_IMPORT_COLUMN_KEYS`. Nicht erkannte Header →
  `ignored.push(rawHeader)`. Doppelt vorkommende Header → erster gewinnt, weitere als ignored gewertet (Warning).
- `email`: required, trim, **gespeichert in Original-Schreibweise**, lowercase nur als Vergleichsschlüssel.
- `first_name`, `last_name`, `company_name`, `phone`, `owner`, `notes`: trim, leer → `undefined`.
- `external_guid`: trim, leer → `undefined`. Maximal 128 Zeichen (Validation Issue, falls länger).
- `website_url`, `linkedin_url`, `instagram_url`, `youtube_url`: leer → `undefined`; wenn gesetzt → Zod-
  `z.string().url()` + bei Social URLs zusätzlich `normalizeLeadProfileUrl()`.
- `category_id`: leer → `undefined`. Wenn gesetzt → `z.string().uuid()`. Existenzprüfung erfolgt im Command-Handler (
  braucht DB-Lookup), nicht hier.
- `score`: leer → `undefined`. Wenn gesetzt → `z.coerce.number().int().min(0).max(100)`; Floats / NaN → `InvalidScore`.
- `status`: leer → `undefined` (Command-Handler setzt Default `New`). Wenn gesetzt → lowercase + lookup in
  `LEAD_IMPORT_STATUS_SYNONYMS`. Unbekannt → Warning `UnknownStatusFallback` und Wert `New`.
- `improvements`: leer → `[]`. Sonst split bei `|`, jedes Element trim, leere Tokens entfernen + Warning
  `EmptyImprovementToken` zählen.

**Cross-Field-Validation:**

- `email` && (`last_name` || `company_name`) → required-Kombi. Sonst Issue `MissingNameOrCompany`.
- Doppelte `email` innerhalb derselben Datei → `DuplicateEmailInFile` (Skip beim ersten Re-Treffer, ursprüngliche Zeile
  bleibt valide).
- Doppelter `external_guid` innerhalb derselben Datei → `DuplicateExternalGuidInFile` analog.

**Tests (TDD, mit `beispiel-csv` als Fixture):**

- Vollzeile mappt alle Felder.
- Minimal `email + last_name` valide.
- Minimal `email + company_name` valide.
- `email + first_name` ohne Last/Company → `MissingNameOrCompany`.
- `category` als Header → `ignored_columns: ["category"]`, kein Crash.
- Score `45.5` → Issue `InvalidScore`.
- Status `Neu` → `ContactLeadStatus.New`; Status `unknown` → Warning + Default `New`.
- `improvements` mit `"a |  | b"` → `["a", "b"]` + 1 Warning.
- Spaltenreihenfolge `last_name;email` bzw. `website_url;email;last_name` sind beide valide.

**Akzeptanz:**

- Keine DB-Zugriffe.
- Alle Issues sind typisiert (`LeadImportRowIssueCode`), keine Free-Form-Strings.

**Skills:** `superpowers:test-driven-development`.

**Konventionsprüfung:** `*-types.ts` für server-interne Types (Root `CLAUDE.md` „Types & Contracts").

---

## Step 5 — Shared `createLeadCoreInTransaction` (Refactor) ✅

**Ziel:** DRY-Persistenz für manuellen Create und Import.

**Files:**

- Create: `src/server/workspace/leads/services/create-lead-core/create-lead-core.ts` —
  `createLeadCoreInTransaction(tx, input, options): Promise<LeadDetailDto>`.
- Create: `src/server/workspace/leads/services/create-lead-core/create-lead-core-input.ts`:
  ```ts
  export interface CreateLeadCoreInput {
    /* validierte Felder, snake_case */
  }
  export interface CreateLeadCoreOptions {
    source: LeadSource; // default in callern, hier explizit
    activityType: LeadActivityType; // Note (manual) | Import
    activityMetadata?: Record<string, string | number>;
    externalGuid?: string;
    statusOverride?: ContactLeadStatus; // Import: aus Synonym, Manual: undefined → New
    ownerOverride?: string;
  }
  ```
- Modify: `src/server/workspace/leads/command-handler/create-lead.command-handler.ts` — orchestriert weiter Validation +
  DB-Tx, ruft aber `createLeadCoreInTransaction(tx, input, { source: Manual, activityType: Note })` auf. Keine
  Signatur-Änderung am Public-Export.
- Test: `src/server/workspace/leads/services/create-lead-core/create-lead-core.test.ts` — Mocked-Tx-Pattern aus
  `create-lead.command-handler.test.ts`. Cases: Manual default; Import mit external_guid + Owner +
  Import-Activity-Type + Metadata.
- Verify: bestehende `create-lead.command-handler.test.ts` und `leads-route.test.ts` bleiben unverändert grün.

**Anforderungen:**

- Atomische Transaktion: `leads`-Insert → `lead_social_profiles`-Insert (falls Profile vorhanden) → `lead_activities`
  -Insert via `createLeadActivity()`.
- `email` wird in normalisierter Form gespeichert (Original-Casing aus Input, lowercase NUR fürs Dedup-Vergleichen —
  passiert eine Schicht höher).
- Default-Werte: `source ← options.source`, `lead_status ← options.statusOverride ?? ContactLeadStatus.New`.
- Kein API-/UI-Wording in Errors. Duplicate-Email wirft `DuplicateEmailError` (bestehender Typ aus Step-5-Verifikation;
  falls nicht existiert: server-internen Error-Type ergänzen, Command-Handler unterscheidet).
- Server-only (`import "server-only"` Top-of-File).

**Akzeptanz:**

- Bestehende Tests grün ohne Änderungen.
- Neuer Core-Test deckt Manual + Import ab.
- Keine duplizierten Insert-Statements für `leads` oder `lead_social_profiles` im Repository (Grep im Review).

**Skills:** `superpowers:test-driven-development`, `superpowers:receiving-code-review` (Refactors verlangen
Reviewer-Disziplin: Diff klein halten, Vorher-/Nachher-Verhalten dokumentieren).

**Konventionsprüfung:** Root `CLAUDE.md` „Types & Contracts" (Server-internal types in `*-types.ts`), scoped Workspace-
`AGENTS.md` (kein API-Wording im Service).

---

## Step 6 — Import-Command-Handler

**Ziel:** Orchestriert Parser + Mapper + Validator + Dedupe + Persistenz, erzeugt typisierten Report.

**Files:**

- Create: `src/server/workspace/leads/command-handler/import-leads.command-handler.ts` —
  `importLeads(file: File, access): Promise<LeadImportResultDto>`.
- Create: `src/server/workspace/leads/services/import/lead-import-existing-keys-loader.ts` —
  `loadExistingKeys(emails: string[], guids: string[]): Promise<{ emailToLeadId: Map<string, string>; guidToLeadId: Map<string, string> }>`.
- Test: `src/server/workspace/leads/command-handler/import-leads.command-handler.test.ts`.
- Test: `src/server/workspace/leads/services/import/lead-import-existing-keys-loader.test.ts`.

**Flow:**

1. `await file.text()` → Bytes-Größe vorab im Route-Layer geprüft, hier nur String → Parser.
2. `parseLeadCsv(text, { maxDataRows: 500 })` — Parsing-Errors propagieren als `LeadImportErrorCode.InvalidCsv` /
   `TooManyRows`.
3. `mapHeadersToColumns(headers)` → Liefert `ignored_columns` für den Report.
4. `validate` jede Row → sammele `row_issues`.
5. Hole `loadExistingKeys()` mit allen valid-mapped Emails (lowercased) + Guids.
6. Hole `getLeadCategories()` einmal und baue `Set<categoryId>` für Validierung; per Row-Validation: wenn `category_id`
   gesetzt aber nicht im Set → Issue `UnknownCategoryId`.
7. Pro valider Row:
   - `existingByEmail = emailToLeadId.get(emailLower)`
   - `existingByGuid  = guidToLeadId.get(externalGuid ?? "")`
   - Beide gesetzt und ungleich → `ConflictEmailGuidMismatch` (skip).
   - Nur Email gesetzt und vorhanden → `DuplicateEmail` (skip).
   - Nur Guid gesetzt und vorhanden → `DuplicateExternalGuid` (skip).
   - Sonst:
     `db.transaction(tx => createLeadCoreInTransaction(tx, …, { source: Import, activityType: Import, activityMetadata: { import_batch_id, row_index } }))`.
   - Bei Race-Condition (zwischen Pre-Load und Insert kommt eine Email durch) fängt der `DuplicateEmailError` aus dem
     Core und übersetzt zu Skip `DuplicateEmail`.
8. `import_batch_id = crypto.randomUUID()` einmal pro Aufruf.
9. Aggregiere Report-DTO und gib zurück.

**Anforderungen:**

- Genau eine Transaktion **pro Lead** (kein File-globaler Tx, damit Partial Import garantiert ist).
- Logging ist PII-frei: nur `import_batch_id`, Counters, Codes, `row_index`. Keine Emails, keine Namen.
- Fehler in der Loader-Stage werfen ein `LeadImportErrorCode.Internal`.

**Tests (Mocked-DB-Pattern):**

- Parser-Error → `result.ok === false`, Code propagiert.
- Vollständige Beispiel-CSV: 3 Leads angelegt, Report-Counters stimmen.
- Re-Import derselben CSV: 3 Skips `DuplicateEmail`.
- Mismatch: Lead A existiert mit Email X, Row hat Email X aber GUID, der zu Lead B gehört → `ConflictEmailGuidMismatch`.
- Score 150 → 1 Error, restliche Rows trotzdem importiert.
- `category_id` ist UUID, aber unbekannt → Error.
- Race-Simulation: Loader liefert leer, Core wirft `DuplicateEmailError` → Skip.

**Akzeptanz:**

- Mocked-DB-Tests grün, kein Real-DB-Lauf nötig.
- Activity-Inserts enthalten keine PII (im Test-Capture verifiziert).

**Skills:** `superpowers:test-driven-development`, `superpowers:systematic-debugging`,
`superpowers:verification-before-completion`.

**Konventionsprüfung:** Root `CLAUDE.md` „Database" (kanonisches Schema in `record-configuration/`, kein
duplicate-column-list), „Constants & Enums".

---

## Step 7 — API-Route + Error-Helper

**Ziel:** Public-facing Endpoint mit allen HTTP-Statuscodes, sauber typisiertem Error-Mapping.

**Files:**

- Create: `src/lib/workspace/leads/lead-import-api-error.ts` — analog zu `lead-api-error.ts` mit `LeadImportErrorCode` +
  `MESSAGES`-Map + `leadImportApiError(code, status, details?)`.
- Create: `src/app/api/workspace/leads/import/route.ts` —
  `export const POST = withWorkspaceApiAuth(async (req, access) => { … })`.
- Test: `src/server/tests/workspace/leads/api/leads-import-route.test.ts` (Pfad wie bestehende API-Tests).

**Route-Anforderungen:**

- Erwartet `multipart/form-data` mit Feld `file`.
- File-Size-Cap: 2 MB → `413 PayloadTooLarge` mit `LeadImportErrorCode.FileTooLarge`. Prüfung über
  `request.headers.get("content-length")` UND fallback auf `file.size` nach `formData()`.
- Akzeptiert `text/csv`, `application/vnd.ms-excel` (Excel-Browser-Quirk), und Fallback nach Filename-Endung `.csv`.
  Anders → `415 UnsupportedMediaType`.
- Fehlende oder leere Datei → `400 BadRequest` (`EmptyFile`).
- Parser/Mapper-Fehler aus Command → `422 UnprocessableEntity` mit Report.
- Erfolg (auch mit Skips/Errors pro Row) → `200 OK` mit `LeadImportResultDto.report`.
- Auth-Fehler über `withWorkspaceApiAuth` (`401`/`404` wie etabliert).

**Tests (Vitest + Mock-Request):**

- Unauthenticated → `401`.
- Nicht-allowlisted → `404`.
- File > 2 MB → `413`, Code `FileTooLarge`.
- Falscher MIME → `415`.
- Leerer Body → `400`, Code `EmptyFile`.
- Beispiel-CSV → `200`, Report mit `imported_count = 3`.
- Re-Import → `200`, Report mit `skipped_count = 3`.
- Logs (gemockt) enthalten **keine** Emails.

**Akzeptanz:**

- Lint/typecheck/test grün.
- Manuell mit `curl -F "file=@plans/workspace/leads/lead-import-example.csv" …` (lokal mit Auth) liefert sauberes JSON.

**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`.

**Konventionsprüfung:**

- Root `CLAUDE.md` „Error Codes & Messages" (separater `*-error.ts`, MESSAGES nicht exportieren außer für i18n).
- scoped `src/app/[locale]/workspace/AGENTS.md` (nur `withWorkspaceApiAuth`, keine eigene Auth).
- Sicherheits-Regel: keine PII in Logs (Root `CLAUDE.md` „Security" + `02-import-export.md`).

---

## Step 8 — Import-Dialog UI + i18n + Page-Header-Trigger

**Ziel:** Bedienbarer, lokalisierter, accessibler Dialog. Wird im `leads-page-header` neben „Neuer Lead" eingehängt.

**Files:**

- Create: `src/i18n/dictionaries/workspace/leads/import/de.json` und `en.json` mit Namespaces `meta`, `trigger`,
  `dialog`, `preview`, `summary`, `errors`, `warnings`, `row_issues` (Codes → Text).
- Modify: `src/i18n/dictionaries/workspace/leads/index.ts` — `getLeadsImportDictionary()` exportieren.
- Create: `src/components/workspace/leads/form/import-leads-dialog/import-leads-dialog.tsx` (`"use client"`).
- Create: `src/components/workspace/leads/form/import-leads-dialog/import-leads-dialog.module.css`.
- Create: `src/components/workspace/leads/form/import-leads-dialog/import-leads-service.ts` —
  `submitLeadImport(file): Promise<LeadImportResultDto>`.
- Create: `src/components/workspace/leads/form/import-leads-dialog/import-leads-error-message.ts` —
  `getLeadImportErrorMessage(code, dict): string` und `getLeadImportRowIssueMessage(code, dict): string`.
- Modify: `src/components/workspace/leads/shell/leads-page-header/leads-page-header.tsx` — neuen Trigger-Button
  rendern (server-component-freundlich: nur ein Client-Wrapper für den Dialog), Dictionary über Props injizieren.
- Test: `import-leads-dialog.test.tsx` (jsdom + Vitest).

**Funktionale Anforderungen:**

- Trigger-Button öffnet Dialog. Im Dialog: drei Phasen (`idle` → `previewing` → `submitting` → `result`).
- File-Picker akzeptiert nur `.csv`. Maxgröße 2 MB clientseitig vorprüfen — bei Überschreitung Inline-Error aus
  Dictionary, kein Upload.
- Nach Auswahl: clientseitiges Quick-Parsing der ersten 5 Datenzeilen + Header-Erkennung mit drei Listen: erkannte
  Spalten (✓), ignorierte Spalten (⚠), fehlende Pflicht-Header — zeigen aber **niemals** Pflicht-Header strikt:
  Spaltenreihenfolge ist egal, Pflicht ist nur, dass `email` und (`last_name` | `company_name`) als Header erscheinen,
  ansonsten Hinweis.
- Submit ruft `submitLeadImport(file)` auf, zeigt Spinner.
- Result-View: Counters (importiert / geskippt / Errors / Warnings), expandable Liste pro Issue mit `row_index`,
  `column`, lokalisierter Code-Text. Liste der `ignored_columns`.
- Bei Erfolg (`imported_count > 0`): `router.refresh()` + Close-Button.
- Keine PII in Console-Logs.
- Tastatur-Navigation: ESC schließt, Tab-Reihenfolge logisch, Focus-Trap im Dialog.

**Trigger-Platzierung:**

- Page-Header bekommt einen Sekundär-Button „CSV-Import" links vom „Neuer Lead"-Primary. Beide Buttons in einem `<div>`
  Flex-Group.
- **Nicht** in der Toolbar (Begründung in „Kritische Abweichungen" oben).

**Tests:**

- Render initial → Trigger sichtbar (DE + EN snapshot).
- File 3 MB → Inline-Fehler, kein Submit.
- Mock-Submit liefert Report → Counters und Issue-Texte erscheinen lokalisiert.
- Mock-Submit liefert API-Fehler → Fallback-Text aus `errors`-Namespace.
- Schließen via ESC.

**Akzeptanz:**

- DE/EN Dictionaries vollständig synchron (gleiche Keys).
- Komponente rein client, Server-Page bleibt server-rendered.
- Lighthouse-Smoke: Dialog hat `role="dialog"`, `aria-modal`, `aria-labelledby`.

**Skills:** `frontend-design:frontend-design`, `superpowers:test-driven-development`.

**Konventionsprüfung:**

- scoped `src/components/workspace/leads/AGENTS.md`: Komponente in eigenem Ordner, `*.module.css`, keine `globals.css`
  -Klassen, „use client" nur wo nötig.
- Root `CLAUDE.md` „i18n (mandatory rules)": DE+EN im selben Commit, keine `locale === "de"` Branches, keine
  Inline-Strings.
- scoped `src/app/[locale]/workspace/leads/AGENTS.md`: Mutations via API + `router.refresh()`.

---

## Step 9 — README-Sync, End-to-End-Smoke, Pre-Merge-Gates

**Ziel:** Dokumentation aktualisiert, manueller Smoke gelaufen, alle Gates grün.

**Files:**

- Modify: `docs/guides/workspace-leads-import-readme.md` — `category` aus Liste der erlaubten Spalten entfernen,
  Erklärung „unbekannte Spalten werden ignoriert" beibehalten. Hinweis ergänzen: Activity-Feed zeigt Import-Events als
  eigenen Typ.
- Modify (falls nötig): `plans/workspace/leads/lead-import-example.csv` — entweder beibehalten (testet implizit
  „unbekannte Spalte wird ignoriert") oder `category`-Spalte streichen. Entscheidung: **beibehalten**, weil sie als
  Regression-Test für Ignored-Columns dient. Kommentarzeile in der README ergänzen, dass `category` absichtlich als
  ignored-Beispiel verbleibt.
- Modify: `plans/workspace/leads/02-import-export.md` — kurzer Status-Header oben „umgesetzt in <PR-Link>, Abweichungen
  siehe <Plan-Datei>" ergänzen.

**Smoke-Schritte (manuell, lokal):**

1. `npm run db:migrate:dev`
2. `npm run dev`
3. Login, Workspace → Leads.
4. „CSV-Import" öffnen, `lead-import-example.csv` hochladen → Report zeigt 3 imported, 1 ignored column.
5. Lead-Liste zeigt 3 neue Leads (mit `source = import`).
6. Detail-Panel des ersten Leads → Activity-Feed zeigt Eintrag vom Typ `Import` mit `import_batch_id`.
7. Re-Import derselben Datei → Report zeigt 3 Skips `DuplicateEmail`.
8. Korrupte CSV (`email` löschen) → Report zeigt Errors, keine Daten geschrieben.
9. 3-MB-Dummy → Inline-Fehler clientseitig, kein Server-Roundtrip.

**Gates:**

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

**Akzeptanz:**

- Alle Gates grün.
- Smoke-Punkte 1–9 dokumentiert (z. B. PR-Description-Checkliste, Screenshots optional).

**Skills:** `superpowers:verification-before-completion`, `superpowers:requesting-code-review`,
`superpowers:finishing-a-development-branch`.

**Konventionsprüfung:**

- Root `CLAUDE.md` „Pre-merge gates".
- Root `CLAUDE.md` „Architecture violations": falls beim Smoke etwas einer Regel widerspricht, in
  `ARCHITECTURE-open-items.md` dokumentieren statt stillschweigend mergen.

---

## End-to-End-Akzeptanz (Übersicht)

| #   | Anforderung                                     | Step    |
| --- | ----------------------------------------------- | ------- |
| 1   | Beispiel-CSV importierbar                       | 6, 9    |
| 2   | Spaltenreihenfolge beliebig                     | 3, 4    |
| 3   | Minimal `email + last_name` valide              | 4, 6    |
| 4   | Minimal `email + company_name` valide           | 4, 6    |
| 5   | Optionale Felder werden gemappt, wenn vorhanden | 4, 5    |
| 6   | Unbekannte Spalten ignoriert + im Report        | 4, 6, 8 |
| 7   | Erstimport legt Leads mit `source=import` an    | 5, 6    |
| 8   | Social URLs als Profile gespeichert             | 5       |
| 9   | Pro Lead genau eine Import-Activity             | 1, 5    |
| 10  | Re-Import skippt                                | 6       |
| 11  | Email/GUID-Mismatch im Report                   | 6, 8    |
| 12  | Partial Import bei invaliden Zeilen             | 4, 6    |
| 13  | UI-Texte DE+EN gepflegt                         | 8       |
| 14  | Keine PII in Logs/Activity-Metadaten            | 5, 6, 7 |
| 15  | Pre-Merge-Gates grün                            | 9       |

## Verifikationsplan (Reviewer-Checkliste)

- **Per Step ein Commit** (oder Stacked-PR), in der genannten Reihenfolge. Reviewer kann jeden Step isoliert lesen, weil
  alle vorherigen Steps semantisch atomar sind.
- **Tests laufen pro Commit grün** (lokales `npm run test` reicht; CI-Pipeline darf nichts neues entdecken).
- **Diff-Größe pro Step**: erwartet < 400 LoC produktiv (ohne Tests/Dictionaries) für Steps 1–7, Step 8 bis ~600 LoC
  inkl. Component+i18n.
- **Keine ungenutzten Exports** zwischen Steps (verifizierbar mit `tsc --noUnusedLocals` über `npm run typecheck`).
- **Architektur-Compliance** bestätigt für jeden Step in der PR-Description durch Verlinkung der konsultierten
  `AGENTS.md`/`CLAUDE.md`.

## Empfohlene Skill-Reihenfolge zur Umsetzung

1. **Vor jedem Step:** `superpowers:executing-plans` zum Bezug auf diese Plan-Datei.
2. **Pro Implementierungsstep:** `superpowers:test-driven-development` als Standard-Disziplin (Steps 1–7 + 9).
3. **Step 8 zusätzlich:** `frontend-design:frontend-design`.
4. **Bei Bugs / Edge-Case-Hunt (Parser, Race):** `superpowers:systematic-debugging`.
5. **Vor Step-Abschluss:** `superpowers:verification-before-completion` — keine „grün" Aussagen ohne Output.
6. **Vor Merge:** `superpowers:requesting-code-review` + `superpowers:finishing-a-development-branch`.
7. **Refactor-Step 5 zusätzlich:** `superpowers:receiving-code-review` (Selbst-Review-Disziplin für Refactor-Hygiene).

## Out-of-Scope (bewusst)

- Export-Endpoint (`GET /api/workspace/leads/export`) — bleibt nach `02-import-export.md` für eine spätere Phase. Keine
  Wiring-Spuren in dieser Implementierung.
- Bulk-Update bestehender Leads via Import. Nur Skip, kein Update.
- Async/Job-Queue. Import läuft synchron innerhalb der Request-Lifecycle (500 Rows × ein Tx pro Lead < akzeptables
  Latenz-Budget).
- DB-basierte ACL. Allowlist-ENV bleibt der Auth-Mechanismus (siehe `src/app/[locale]/workspace/CLAUDE.md`).
