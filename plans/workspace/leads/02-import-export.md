# Phase 2 - Workspace Leads: CSV-Import priorisiert, Export vorbereitet

> **Branch:** `feat/workspace-leads-phase-2`
> **Geschätzter Aufwand:** Import ~8-11h, Export später ~3-4h
> **Abhängigkeiten:** `01-list-and-detail.md` muss live sein, insbesondere `external_guid`, `lead_activities`,
> `source=import`, Toolbar, API-Auth via `withWorkspaceApiAuth`, Lead-Filter und Lead-Create-Flow.

## Context

Phase 2 fokussiert zuerst den CSV-Import von unvollständigen, aber verwertbaren Outbound-Leads. Ein Lead ist
importierbar, wenn mindestens `email` und entweder `last_name` oder `company_name` vorhanden sind. Alle anderen Felder
sind optional und werden gemappt, wenn sie vorhanden und valide sind.

Die Spaltenreihenfolge ist egal. Ein Import mit `last_name;email;website_url` ist genauso valide wie
`website_url;email;last_name`.

Export bleibt im Plan enthalten, wird aber nicht als unmittelbarer Umsetzungsschwerpunkt behandelt. Die geklärten
Export-Entscheidungen werden bereits dokumentiert, damit die spätere Implementierung nicht erneut entschieden werden
muss.

## Geklärte Entscheidungen

| Bereich             | Entscheidung                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| Import-Format       | Semikolon- oder Komma-CSV, UTF-8 mit/ohne BOM, CRLF/LF kompatibel                                             |
| Parser              | Zero-Dependency Parser mit Quote-, Separator-, BOM- und Zeilenende-Support                                    |
| Import-Spalten      | Nur exakt bekannte englische Spaltenkeys werden gemappt; unbekannte Spalten werden ignoriert                  |
| Spaltenreihenfolge  | Beliebig                                                                                                      |
| Minimaler Lead      | `email` plus `last_name` oder `company_name`                                                                  |
| Optionalität        | Alle weiteren Felder optional; vorhandene valide Felder werden gemappt                                        |
| Deduplizierung      | Global per E-Mail und optional per `external_guid`; `external_guid` ist nullable, aber eindeutig wenn gesetzt |
| Duplikate           | Nur Skip, kein Update bestehender Leads                                                                       |
| Email/GUID-Mismatch | Nicht importieren, aber als eigener Report-Fall am Ende ausweisen                                             |
| Partial Import      | Erlaubt: valide Zeilen werden importiert, invalide Zeilen und Skips landen im Report                          |
| Import-Limits       | Max. 2 MB und max. 500 Datenzeilen                                                                            |
| Kategorien          | `category_id` wird direkt gemappt; optionaler `category`-Key kann gegen bekannte Kategorien aufgelöst werden  |
| Social Profiles     | `linkedin_url`, `instagram_url`, `youtube_url` werden als `lead_social_profiles` persistiert                  |
| Status              | Interne Codes plus bekannte DE/EN-Synonyme akzeptieren; unbekannt wird Warning und Default `new`              |
| Reporting           | Typisierte Error-/Warning-Codes plus Row/Column; UI übersetzt über Dictionaries                               |
| Security            | `withWorkspaceApiAuth`, keine PII in Logs oder Activity-Metadata                                              |
| Export              | Vorerst sekundär; später alle gefilterten Leads exportieren, nicht nur aktuelle Page                          |

## Import-Contract

### Exakte Import-Spaltenkeys

Die folgenden Spaltenkeys sind die einzige offiziell unterstützte Import-Schnittstelle. Keys sind exakt und
case-sensitive zu behandeln. Nicht erkannte Spalten werden ignoriert und optional als Warning im Report gezählt.

```ts
export const LeadImportColumnKey = {
  ExternalGuid: "external_guid",
  Email: "email",
  FirstName: "first_name",
  LastName: "last_name",
  CompanyName: "company_name",
  Phone: "phone",
  WebsiteUrl: "website_url",
  CategoryId: "category_id",
  Category: "category",
  Score: "score",
  LinkedinUrl: "linkedin_url",
  InstagramUrl: "instagram_url",
  YoutubeUrl: "youtube_url",
  Status: "status",
  Owner: "owner",
  Notes: "notes",
  Improvements: "improvements",
} as const;

export type LeadImportColumnKey =
  (typeof LeadImportColumnKey)[keyof typeof LeadImportColumnKey];

export const LEAD_IMPORT_COLUMN_KEYS = Object.values(LeadImportColumnKey);
```

### Beispiel-Datei

Eine vollständige Beispiel-CSV mit allen Keys liegt unter:

`plans/workspace/leads/lead-import-example.csv`

Die Datei ist semikolongetrennt und enthält:

- eine vollständig befüllte Zeile
- einen minimalen Personen-Lead mit `email` + `last_name`
- einen minimalen Firmen-Lead mit `email` + `company_name`
- eine Zeile mit anderer Spaltenreihenfolge soll zusätzlich in Tests abgedeckt werden, nicht in derselben Beispiel-CSV,
  weil CSV-Dateien nur einen Header haben

### Mapping-Regeln

| CSV-Key         | Ziel                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------- |
| `external_guid` | `leads.external_guid`, trim, leer als `null`                                                      |
| `email`         | `leads.email`, required, trim/lowercase nur für Dedupe-Vergleich, Original normalisiert speichern |
| `first_name`    | `leads.first_name`, optional                                                                      |
| `last_name`     | `leads.last_name`, optional, aber erforderlich wenn `company_name` fehlt                          |
| `company_name`  | `leads.company_name`, optional, aber erforderlich wenn `last_name` fehlt                          |
| `phone`         | `leads.phone`, optional                                                                           |
| `website_url`   | `leads.website_url`, optional, vorhandene URL normalisieren/validieren                            |
| `category_id`   | `leads.category_id`, optional, UUID, direkter Match gegen bestehende Kategorie                    |
| `category`      | Optionaler Lookup gegen bekannte Kategorien, nur genutzt wenn `category_id` leer ist              |
| `score`         | Integer 0-100; außerhalb Range ist Row-Validation-Error                                           |
| `linkedin_url`  | `lead_social_profiles` mit Plattform `linkedin`, inklusive normalisierter URL                     |
| `instagram_url` | `lead_social_profiles` mit Plattform `instagram`, inklusive normalisierter URL                    |
| `youtube_url`   | `lead_social_profiles` mit Plattform `youtube`, inklusive normalisierter URL                      |
| `status`        | `leads.lead_status`; interne Codes und bekannte DE/EN-Synonyme akzeptieren                        |
| `owner`         | `leads.owner`, optional                                                                           |
| `notes`         | `leads.notes`, optional                                                                           |
| `improvements`  | `leads.improvements`, optional, mehrere Werte getrennt mit `\|`, leere Werte entfernen            |

Der Import setzt immer `source = LeadSource.Import`.

## Architektur

### Datenfluss Import

```txt
POST /api/workspace/leads/import
  -> withWorkspaceApiAuth
  -> multipart/form-data File prüfen
  -> max. 2 MB, max. 500 Datenzeilen
  -> CSV parse mit UTF-8/BOM, Semikolon/Komma, Quotes, CRLF/LF
  -> Header exakt gegen LeadImportColumnKey matchen
  -> unbekannte Header ignorieren und im Report zählen
  -> pro Row normalisieren und validieren
  -> minimale Validität: email + (last_name oder company_name)
  -> category_id direkt validieren oder category auf category_id mappen
  -> Status-Synonyme auf ContactLeadStatus mappen
  -> Social URLs als Social Profiles vorbereiten
  -> pro valide Row Insert versuchen
  -> Duplicate Email oder Duplicate external_guid skippen
  -> Email/GUID-Mismatch als conflict_mismatch reporten
  -> Activity type=import für jeden neu angelegten Lead
  -> Summary JSON zurückgeben
```

### Shared Create-Core

Vor der Import-Implementierung ist zu prüfen, ob ein wiederverwendbarer Create-Service existiert. Falls nicht, wird ein
Shared Core angelegt, damit manuelle Lead-Erstellung und Import nicht dieselbe Persistenzlogik duplizieren.

Anforderung an den Shared Core:

- akzeptiert validierte Create-Daten inklusive `source`, `lead_status`, optional `external_guid`, `improvements` und
  Social Profiles
- führt Insert von `leads`, `lead_social_profiles` und `lead_activities` in einer Transaction aus
- enthält keine API-/UI-spezifischen Fehlermeldungen
- erlaubt import-spezifische Activity `type=import`
- bleibt server-only

## Verzeichnisstruktur

```txt
src/
├── app/api/workspace/leads/
│   ├── import/route.ts
│   └── export/route.ts                  # später, aktuell nur vorbereitet
├── common/contracts/leads/import/
│   ├── lead-import-column-key.ts
│   ├── lead-import-row.dto.ts
│   ├── lead-import-report.dto.ts
│   └── lead-import-error-code.ts
├── components/workspace/leads/
│   ├── import-leads-dialog/
│   └── export-leads-button/             # später
├── server/workspace/leads/
│   ├── command-handler/import-leads.command-handler.ts
│   ├── services/import/lead-csv-parser.ts
│   ├── services/import/lead-csv-import-mapping-service.ts
│   ├── services/import/lead-import-validation-service.ts
│   └── services/create-lead-core/
└── i18n/dictionaries/workspace/leads/
    └── import/{de,en}.json
```

## Tickets

### P2-T1 - Import-Spaltenkeys, DTOs und Beispiel-CSV

- **Files:**
  - `src/common/contracts/leads/import/lead-import-column-key.ts`
  - `src/common/contracts/leads/import/lead-import-row.dto.ts`
  - `src/common/contracts/leads/import/lead-import-report.dto.ts`
  - `plans/workspace/leads/lead-import-example.csv`
- **Inhalt:**
  - Const-Objekt `LeadImportColumnKey` exakt wie oben
  - Type `LeadImportColumnKey`
  - Values-Array `LEAD_IMPORT_COLUMN_KEYS`
  - DTO für rohe Import-Zeile mit optionalen Feldern
  - Report-DTO mit Counters, Row-Errors, Row-Warnings und Ignored-Columns
  - Beispiel-CSV mit allen offiziellen Spaltenkeys
- **Akzeptanz:**
  - Type-Test stellt sicher, dass `LEAD_IMPORT_COLUMN_KEYS` nur aus dem Const-Objekt abgeleitet wird
  - Beispiel-CSV ist mit dem Parser lesbar
  - Spaltenreihenfolge in Tests variiert und bleibt valide

### P2-T2 - Zero-Dependency CSV-Parser

- **Files:** `src/server/workspace/leads/services/import/lead-csv-parser.ts`
- **Inhalt:**
  - UTF-8 Textinput mit optionalem BOM
  - Separator-Erkennung für `;` und `,`
  - Quote-Support für Felder mit Separator, Zeilenbruch oder Quotes
  - CRLF und LF unterstützen
  - Header extrahieren
  - Datenzeilen zählen, leere Zeilen ignorieren
  - Limit: max. 500 Datenzeilen
- **Akzeptanz:**
  - Tests für Semikolon, Komma, BOM, Quotes, CRLF, LF
  - Tests für beliebige Spaltenreihenfolge
  - Test für unbekannte Header: werden ignoriert, Import bricht nicht ab

### P2-T3 - Import-Mapping und Validierung

- **Files:**
  - `src/server/workspace/leads/services/import/lead-csv-import-mapping-service.ts`
  - `src/server/workspace/leads/services/import/lead-import-validation-service.ts`
- **Inhalt:**
  - Nur exakt bekannte Header mappen
  - `email` required
  - `last_name` oder `company_name` required
  - alle anderen Felder optional
  - `score` als Integer 0-100
  - `status` aus internen Codes und bekannten DE/EN-Synonymen mappen
  - unbekannter Status: Warning, Default `new`
  - `category_id` direkt als UUID gegen bekannte Kategorien validieren
  - `category` gegen bekannte Kategorien mappen, wenn `category_id` leer ist
  - unbekannte Kategorie oder unbekannte `category_id`: Row-Error, sofern gesetzt
  - `linkedin_url`, `instagram_url`, `youtube_url` als Social Profiles vorbereiten
  - `improvements` per Separator `|` zu `improvements: string[]`
- **Akzeptanz:**
  - Minimalimport `email + last_name` valide
  - Minimalimport `email + company_name` valide
  - `email + first_name` ohne `last_name/company_name` invalid
  - vollständig befüllte Beispielzeile mappt alle aktuellen `CreateLeadRequestDto`-Felder plus Import-only-Felder
  - unbekannte Spalte wird ignoriert

### P2-T4 - Shared Create-Core für Manual und Import

- **Files:** `src/server/workspace/leads/services/create-lead-core/`
- **Inhalt:**
  - Bestehende manuelle Lead-Erstellung auf Shared Core zurückführen
  - Import kann denselben Core mit `source=import`, optionalem `external_guid`, Status, Owner, Notes, Improvements und
    Social Profiles nutzen
  - Activity-Erstellung im Core oder über klaren Hook/Parameter
- **Akzeptanz:**
  - Bestehende Tests für manuelle Lead-Erstellung bleiben grün
  - Import-spezifischer Core-Test erzeugt Lead + Social Profiles + Import Activity in einer Transaction
  - Keine duplizierte Insert-Logik für `leads` und `lead_social_profiles`

### P2-T5 - Import-Command mit Skip- und Konflikt-Report

- **Files:** `src/server/workspace/leads/command-handler/import-leads.command-handler.ts`
- **Inhalt:**
  - Partial Import
  - pro valide Row Insert versuchen
  - Duplicate Email -> Skip `duplicate_email`
  - Duplicate `external_guid` -> Skip `duplicate_external_guid`
  - Email/GUID zeigen auf unterschiedliche bestehende Leads -> Skip/Error `conflict_email_guid_mismatch`
  - Validation Errors werden gesammelt
  - Activity `type=import` pro neuem Lead
  - Activity-Metadata nur PII-frei, z. B. `{ import_batch_id, row_index }`
- **Akzeptanz:**
  - Erstimport Beispiel-CSV legt valide Leads an
  - Re-Import skippt alle vorhandenen Leads
  - Duplicate Email wird gezählt
  - Duplicate GUID wird gezählt
  - Email/GUID-Mismatch erscheint im Report
  - invalid Score erscheint als Row-Error

### P2-T6 - API-Route `POST /api/workspace/leads/import`

- **Files:** `src/app/api/workspace/leads/import/route.ts`
- **Inhalt:**
  - `multipart/form-data` mit genau einer Datei
  - File-Check per Name, MIME-Type und Parsebarkeit
  - `.csv` und `text/csv` akzeptieren, Browser-MIME-Toleranz sinnvoll berücksichtigen
  - max. 2 MB -> 413
  - max. 500 Datenzeilen -> 422
  - invalid/fehlende Datei -> 400
  - nicht unterstützter Dateityp -> 415
  - `withWorkspaceApiAuth`
  - JSON Response mit typisiertem Import-Report
- **Akzeptanz:**
  - Tests für unauthenticated/authenticated
  - Tests für Datei zu groß, falscher Typ, invalide CSV, zu viele Rows
  - Keine PII in Logs

### P2-T7 - UI: `<ImportLeadsDialog>`

- **Files:** `src/components/workspace/leads/import-leads-dialog/`
- **Inhalt:**
  - Trigger in Toolbar
  - File Picker
  - Header-Erkennung mit bekannten/ignorierten Spalten
  - Vorschau der ersten 5 Datenzeilen
  - Submit gegen Import-API
  - Summary: importiert, geskippt, Errors, Warnings, ignorierte Spalten
  - Nach erfolgreichem Import `router.refresh()`
  - Alle UI-Texte in `src/i18n/dictionaries/workspace/leads/import/{de,en}.json`
- **Akzeptanz:**
  - Beispiel-CSV kann importiert werden
  - Re-Import zeigt Skips
  - Report ist verständlich lokalisiert
  - Keyboard- und Fokusverhalten im Dialog getestet

### P2-T8 - Tests und Pre-Merge-Gate Import

- **Inhalt:**
  - Unit-Tests für Parser, Mapping, Validation, Command
  - API-Route Tests
  - jsdom-Test für Dialog-Interaktion
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
- **Akzeptanz:**
  - Alle Gates grün
  - Manueller Smoke: Beispiel-CSV importieren, reimportieren, Skips prüfen

## Export, später vorbereiten

Export wird aktuell nicht umgesetzt, aber der spätere Plan ist festgelegt:

- `GET /api/workspace/leads/export`
- `withWorkspaceApiAuth`
- Exportiert alle gefilterten Leads, nicht nur die aktuelle Page
- Filter entsprechen der Lead-Liste, aber Pagination wird ignoriert
- CSV-Export neutralisiert Excel-/Formula-Injection für Werte mit `=`, `+`, `-`, `@`
- `Content-Disposition` mit statischem datumsbasiertem Dateinamen, z. B. `leads-YYYY-MM-DD.csv`
- PII-freier Export-Audit-Eintrag, z. B. Anzahl exportierter Zeilen und Filter-Keys, aber keine E-Mails oder
  Kontaktwerte
- Export-Spalten sollen später mindestens die Import-Spalten plus technische Felder enthalten:
  - `id`
  - `created_at`
  - optional weitere Felder nur, wenn Re-Import-Verhalten klar definiert ist
- Re-Import exportierter Dateien:
  - zusätzliche bekannte Felder wie `status` und `owner` dürfen gemappt werden
  - technische Felder wie `id` und `created_at` werden ignoriert

## End-to-End-Akzeptanz Import

1. Beispiel-CSV mit allen Keys ist importierbar.
2. Spaltenreihenfolge ist egal.
3. Minimalimport `email + last_name` ist valide.
4. Minimalimport `email + company_name` ist valide.
5. Alle optionalen Felder werden gemappt, wenn vorhanden.
6. Unbekannte Spalten werden ignoriert und im Report ausgewiesen.
7. Erstimport legt neue Leads mit `source=import` an.
8. Social URLs werden als Social Profiles gespeichert.
9. Pro neuem Lead entsteht genau eine Import-Activity.
10. Re-Import skippt bestehende Leads.
11. Email/GUID-Mismatch wird im Abschlussreport sichtbar.
12. Ungültige Zeilen verhindern nicht den Import gültiger Zeilen.
13. Alle UI-Texte sind in DE und EN gepflegt.
