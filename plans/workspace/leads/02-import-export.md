# Phase 2 — Workspace Leads: CSV-Import / -Export

> **Branch:** `feat/workspace-leads-phase-2`
> **Geschätzter Aufwand:** ~10–14h
> **Abhängigkeiten:** `01-list-and-detail.md` (DB-Schema-Erweiterung inkl. `external_guid`, Activities-Tabelle, `source`-Enum, Bulk-Aktionen, Toolbar müssen bereits live sein)

## Context

Outbound-Leads liegen aktuell in `mockups/claude_ready_linkedin_leads.md` als CSV-Block (30 Zeilen, Spalten `Guid, Vorname, Nachname / Firma, E-Mail, Leadstatus, Website-URL, Kategorie, Score, LinkedIn URL, verbesserung_1, verbesserung_2, verbesserung_3`). Manuelles Anlegen via Phase-1-Dialog wäre für 30+ Leads ineffizient. Phase 2 ergänzt CSV-Import (mit Skip-bei-Duplikat) und CSV-Export (für Backup, externe Tools, Re-Import).

### Geklärte Entscheidungen

| Bereich       | Entscheidung                                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Import-Format | CSV (Datenquelle bleibt der CSV-Block aus `claude_ready_linkedin_leads.md`; Nutzer extrahiert ihn manuell als `.csv`-Datei) |
| Import-Dedup  | Skip bei Email-Duplikat ODER `external_guid`-Duplikat + Report im UI                                                        |
| Excel/.xlsx   | nicht in P2 — Roadmap                                                                                                       |

---

## Architektur

### Datenfluss

```
File-Upload (multipart, max 2MB)
   → Parse CSV (papaparse oder zero-dep)
   → Pro Row: Validate (Zod) + Normalize ("Neu" → "new", Score-String → Int, Name-Heuristik)
   → Try-Insert in Transaction:
        Conflict auf email-lower → skip (count byEmail++)
        Conflict auf external_guid → skip (count byGuid++)
        Validation-Error → push to errors[]
        Success → Activity (type=import) anlegen
   → Return Summary { imported, skipped: { byEmail, byGuid }, errors }
```

### Verzeichnisstruktur (Phase 2)

```
src/
├── app/api/workspace/leads/
│   ├── import/route.ts                  # POST (multipart)
│   └── export/route.ts                  # GET (streamed CSV)
├── components/workspace/leads/
│   ├── import-leads-dialog/             # File-Picker + Vorschau + Summary
│   └── export-leads-button/             # Toolbar-Button mit Filter-href
├── server/workspace/leads/
│   ├── lead-csv-import.service.ts       # Parser + Validator + Mapper
│   ├── lead-csv-export.service.ts       # Stream-Writer
│   └── import-leads.command-handler.ts  # Orchestrierung + Skip-Logic
└── common/contracts/leads/
    └── lead-import-row.dto.ts
```

---

## Tickets

### Import (CSV)

#### P2-T1 — CSV-Spalten-Mapping & Contract

- **Files:** `src/common/contracts/leads/lead-import-row.dto.ts`
- **Inhalt:** Erwartete Spalten + Aliase
  - Pflicht: `E-Mail` (Aliase: `Email`, `email`)
  - Optional: `Guid`, `Vorname`, `Nachname / Firma`, `Leadstatus` (default `Neu`), `Website-URL`, `Kategorie`, `Score`, `LinkedIn URL` (Alias: `LinkedIn`), `verbesserung_1..3`
  - Mapper-Mapping nach `CreateLeadInput` dokumentieren (Heuristik für `Nachname / Firma`)
- **Akzeptanz:** Type-Test, Header-Aliase dokumentiert
- **Aufwand:** 1h

#### P2-T2 — CSV-Parser & Row-Validator

- **Files:** `src/server/workspace/leads/lead-csv-import.service.ts`
- **Inhalt:**
  - Lib-Pick: `papaparse` (klein, browser+node) — falls CSV simpel genug, zero-dep eigener Parser akzeptabel
  - Pro Row: Validate via Zod → Map auf `CreateLeadInput`:
    - Status `Neu`/`new` → `new`; andere bekannte Werte → entsprechendes Enum; unbekannt → `new` + Warning im Report
    - Score-String → Int (0–100), out-of-range → Validation-Error
    - `Nachname / Firma` → Heuristik:
      - Wenn `Vorname` gesetzt: Wert = `last_name`
      - Sonst: Wert = `company_name`
    - `Guid` → `external_guid`
    - `verbesserung_1..3` → `improvements: [v1, v2, v3].filter(Boolean)`
    - `source` = `'import'`
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Tests mit `mockups/claude_ready_linkedin_leads.md` als Fixture (CSV-Block extrahiert); alle 30 Rows mappen korrekt
- **Aufwand:** 3h

#### P2-T3 — Import-Command + Skip-Logic

- **Files:** `src/server/workspace/leads/import-leads.command-handler.ts`
- **Inhalt:**
  - Pro Row Try-Insert in Transaction
  - Conflict auf `external_guid` Unique-Index → skip
  - Conflict auf `email-lower` → skip
  - Aktivität `type=import` (mit Metadata `{ import_batch_id, row_index }`) pro neu angelegtem Lead; keine Dateinamen, E-Mails oder Kontaktwerte in Activity-Metadata speichern
  - Return Summary: `{ imported, skipped: { byEmail, byGuid }, errors: [{ row, message }] }`
- **Akzeptanz:** Test mit doppeltem Email → übersprungen; Test mit invalidem Score → Error im Report; Test mit Mix
- **Aufwand:** 2h

#### P2-T4 — API-Route `POST /api/workspace/leads/import`

- **Files:** `src/app/api/workspace/leads/import/route.ts`
- **Inhalt:** `multipart/form-data` mit File-Upload, max 2MB; nutzt `withWorkspaceApiAuth`; Returns Summary-JSON
- **Akzeptanz:** Tests für authed/unauthed; valid + invalid file; Limit-Überschreitung → 413
- **Aufwand:** 1,5h

#### P2-T5 — UI: `<ImportLeadsDialog>`

- **Files:** `src/components/workspace/leads/import-leads-dialog/`
- **Inhalt:**
  - Trigger-Button in Toolbar (neben "Add lead" / "Export")
  - File-Picker + Vorschau (erste 5 Rows + Spalten-Erkennung mit Match-/Unknown-Markern)
  - Submit → POST → Summary anzeigen (X importiert, Y übersprungen, Errors als Liste)
  - Nach Close: `router.refresh()`
- **Skills:** `frontend-design:frontend-design`
- **Akzeptanz:** Manueller Import von `claude_ready_linkedin_leads.md` (CSV-Block als `.csv` gespeichert) → 30 Leads angelegt; Re-Import → 30 Skips
- **Aufwand:** 2h

### Export

#### P2-T6 — CSV-Export-Service

- **Files:** `src/server/workspace/leads/lead-csv-export.service.ts`
- **Inhalt:** Filter wie List-Query (Reuse `lead-filter-service`); schreibt CSV-Stream; Spalten = Import-Spalten + zusätzliche `id, lead_status, owner, created_at`
- **Akzeptanz:** Test mit Mock-Leads, CSV-String parsbar; gleiche Spalten-Reihenfolge wie Import
- **Aufwand:** 1,5h

#### P2-T7 — API-Route `GET /api/workspace/leads/export`

- **Files:** `src/app/api/workspace/leads/export/route.ts`
- **Inhalt:** Streamt CSV mit `Content-Disposition: attachment; filename="leads-YYYY-MM-DD.csv"`; nutzt `withWorkspaceApiAuth`; akzeptiert gleiche Filter-Params wie List-API
- **Akzeptanz:** Manueller Download lädt CSV; mit Filter `?status=qualified` enthält nur Qualified-Leads
- **Aufwand:** 1h

#### P2-T8 — UI: `<ExportLeadsButton>` in Toolbar

- **Files:** `src/components/workspace/leads/export-leads-button/`
- **Inhalt:** Button nutzt aktuelle Filter aus URL → href auf Export-API
- **Akzeptanz:** Klick mit aktivem Status-Filter lädt gefilterte CSV
- **Aufwand:** 0,5h

### Pre-Merge

#### P2-T9 — Pre-Merge-Gate

- **Inhalt:** `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` grün; manueller Round-Trip Import → Export → Re-Import (Re-Import muss alle skippen); Code-Review per `superpowers:requesting-code-review`
- **Aufwand:** 0,5h

---

## Verifikation (End-to-End-Akzeptanz Phase 2)

1. Alle Phase-1-Gates weiterhin grün
2. `mockups/claude_ready_linkedin_leads.md` (CSV-Block extrahiert als `.csv`) → Import → 30 Leads in DB, 0 Skips beim Erst-Import
3. Re-Import derselben Datei → 30 Skips (Email/Guid-Duplikate), 0 neue
4. Pro importiertem Lead existiert genau eine `lead_activities`-Row mit `type=import`
5. Export der gefilterten Liste (z.B. `?status=new`) → CSV-Datei downloadable, mit gleicher Spalten-Struktur, nur die gefilterten Leads enthalten
6. Round-Trip Import → Export → Re-Import: zweiter Import skipt alles korrekt

## Reuse-Punkte

- `withWorkspaceApiAuth` (aus P1-T17) — alle neuen API-Routen
- `lead-filter-service` (aus P1-T11) — Export-Filter
- `lead-validation-service` (aus P1-T10) — pro Row Validation
- `lead-activity-service.appendLeadActivity()` (aus P1-T14) — Import-Activity-Log
- `getDrizzleDatabaseClient` + Transaction-Pattern

## Skill-Übersicht (Phase 2)

| Skill                                        | Tickets                         |
| -------------------------------------------- | ------------------------------- |
| `superpowers:test-driven-development`        | T2, T3, T4, T6                  |
| `superpowers:verification-before-completion` | T9                              |
| `superpowers:requesting-code-review`         | T9                              |
| `frontend-design:frontend-design`            | T5, T8                          |
| `superpowers:systematic-debugging`           | bei Bugs während Implementation |
