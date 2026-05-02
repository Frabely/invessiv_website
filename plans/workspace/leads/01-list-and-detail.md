# Phase 1 — Workspace Leads: List, Filter, Detail-Panel, Add-Lead

> **Branch:** `feat/workspace-leads-phase-1`
> **Geschätzter Aufwand:** ~22–28h
> **Abhängigkeiten:** keine. Geht von der bestehenden Workspace-Shell (Auth, Header, Sidebar) aus.
> **Folge-Pläne:** `02-import-export.md`, `03-message-generator.md`

## Context

Im Workspace gibt es bislang nur Auth + Shell und einen Disabled-`leads`-Sidebar-Eintrag. Outbound-Recherche (LinkedIn-Prospects aus `mockups/claude_ready_linkedin_leads.md`) liegt aktuell in CSV/Markdown und ist nicht im Workspace verwaltbar. Inbound-Submissions (Quick-Contact, Project-Request, Discovery-Call) landen bereits in `leads`/`lead_submissions`, sind aber nicht im UI sichtbar.

**Ziel Phase 1:** Eine einheitliche Lead-Übersicht (Mockup `mockups/workspace-lead-page.png`) mit Tabelle, Filter, Suche, Pagination, Bulk-Aktionen (Status/Delete), Detail-Side-Panel und manuellem Anlegen. Inbound + Outbound werden in **einer** erweiterten `leads`-Tabelle zusammengeführt.

### Geklärte Entscheidungen

| Bereich         | Entscheidung                                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| DB-Strategie    | Bestehende `leads`-Tabelle erweitern, Inbound + Outbound zusammenführen                                                       |
| Person vs Firma | `first_name` (nullable), `last_name` (nullable), `company_name` (nullable). CHECK: mindestens `last_name` ODER `company_name` |
| Status-Enum     | Erweitern um `proposal` → `new, contacted, qualified, proposal, won, lost, archived`                                          |
| Activities      | Neue Tabelle `lead_activities`. `lead_submissions` bleibt; im Detail-Panel als merged Stream gerendert                        |
| Source-Werte    | `webform`, `manual`, `import`                                                                                                 |
| Bulk-Aktionen   | Status ändern, Löschen (mit Confirm)                                                                                          |
| Owner-Feld      | Free-text (`leads.owner` existiert bereits)                                                                                   |

---

## Architektur

### DB-Schema-Erweiterung

**Tabelle `leads` (erweitert):**

```
id                 uuid PK
first_name         text NULL          -- nullable (war NOT NULL)
last_name          text NULL          -- nullable (war NOT NULL)
company_name       text NULL          -- NEU
email              text NOT NULL      -- bleibt
phone              text NULL          -- NEU
website_url        text NULL          -- NEU
linkedin_url       text NULL          -- NEU
category           text NULL          -- NEU (free-text, normalisiert beim Import)
score              integer NULL       -- NEU (CHECK 0..10)
source             text NOT NULL      -- NEU enum(webform|manual|import) DEFAULT 'manual'
lead_status        text NOT NULL      -- bleibt, Constants um 'proposal' erweitert
owner              text NULL          -- bleibt
notes              text NULL          -- NEU
tags               text[] NULL        -- NEU (Spalte für Roadmap; kein Bulk-UI in P1)
improvements       text[] NULL        -- NEU (verbesserung_1..3 aus CSV)
external_guid      text NULL          -- NEU (CSV-Guid für Import-Idempotenz)
created_at         timestamptz NOT NULL DEFAULT NOW()
updated_at         timestamptz NOT NULL DEFAULT NOW()
```

**Constraints/Indizes neu:**

- `CHECK (last_name IS NOT NULL OR company_name IS NOT NULL)`
- `CHECK (score IS NULL OR (score >= 0 AND score <= 10))`
- Bestehender Email-Unique-Index bleibt (`leads_email_lower_uidx`)
- Neuer Index `leads_source_created_at_idx` auf `(source, created_at DESC)`
- Neuer Partial-Unique-Index `leads_external_guid_uidx` auf `external_guid WHERE external_guid IS NOT NULL`

**Tabelle `lead_activities` (neu):**

```
id                 uuid PK
lead_id            uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE
type               text NOT NULL   enum(note|status_change|message_drafted|inbound_submission|import|delete_marker)
title              text NULL
body               text NULL
metadata           jsonb NULL
occurred_at        timestamptz NOT NULL DEFAULT NOW()
created_by         text NULL  (clerk display-name oder system)
created_at         timestamptz NOT NULL DEFAULT NOW()
```

- Index `lead_activities_lead_id_occurred_at_idx` auf `(lead_id, occurred_at DESC)`

> **Hinweis:** Das aktuelle Schema verwendet `text("lead_status", { enum: CONSTANT_ARRAY })` (kein PG-ENUM-Typ). `proposal` wird daher nur in der Constant `CONTACT_LEAD_STATUS_VALUES` ergänzt — kein DDL-Change am Enum-Typ nötig.

### Routing & URL-Konvention

| Route                                                                | Zweck                                                                            |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `/[locale]/workspace/leads`                                          | List-Page (server-rendered)                                                      |
| `/[locale]/workspace/leads?status=&source=&q=&from=&to=&page=&sort=` | Alle Filter über Query-Params, SSR-friendly, shareable                           |
| `/[locale]/workspace/leads?selected=<id>`                            | Detail-Side-Panel öffnet rechts (Server-Component, kein eigenes Routing-Segment) |
| `GET /api/workspace/leads`                                           | List                                                                             |
| `POST /api/workspace/leads`                                          | Create                                                                           |
| `GET/PATCH/DELETE /api/workspace/leads/[id]`                         | Read/Update/Delete                                                               |
| `POST /api/workspace/leads/bulk`                                     | Bulk Status / Delete                                                             |

**Auth:** Alle `/api/workspace/*`-Routen prüfen `requireWorkspaceAccess(locale)` server-seitig. Layer 1 (`proxy.ts`) deckt UI-Routen ab; API-Routen bekommen ein zusätzliches Pattern + Server-Side-HOC im Handler.

### Verzeichnisstruktur (Phase 1)

```
src/
├── app/
│   ├── [locale]/workspace/leads/
│   │   ├── page.tsx                     # SSR Liste + Detail-Panel
│   │   ├── loading.tsx                  # Skeleton
│   │   ├── CLAUDE.md                    # Architektur-Doku
│   │   └── AGENTS.md                    # Mandatorische Regeln
│   └── api/workspace/leads/
│       ├── route.ts
│       ├── [id]/route.ts
│       └── bulk/route.ts
├── components/workspace/leads/
│   ├── leads-page-shell/
│   ├── leads-page-header/
│   ├── leads-toolbar/
│   ├── leads-bulk-action-bar/
│   ├── leads-table/
│   ├── leads-table-row/
│   ├── leads-pagination/
│   ├── leads-empty-state/
│   ├── lead-detail-panel/
│   ├── lead-detail-activities/
│   ├── lead-status-badge/
│   ├── lead-source-badge/
│   ├── lead-score-bar/
│   └── add-lead-dialog/
├── server/
│   ├── workspace/leads/
│   │   ├── list-leads.query.ts
│   │   ├── get-lead-by-id.query.ts
│   │   ├── create-lead.command-handler.ts
│   │   ├── update-lead.command-handler.ts
│   │   ├── update-lead-status.command-handler.ts
│   │   ├── bulk-update-status.command-handler.ts
│   │   ├── bulk-delete-leads.command-handler.ts
│   │   ├── append-lead-activity.ts
│   │   ├── lead-validation-service.ts
│   │   └── lead-filter-service.ts
│   └── db/
│       ├── record-configuration/
│       │   ├── leads.ts                 # ERWEITERT
│       │   └── lead-activities.ts       # NEU
│       └── migrations/
│           ├── 0003_extend_leads_for_crm.sql
│           └── 0004_create_lead_activities.sql
├── common/
│   ├── constants/leads/
│   │   ├── lead-sources.ts
│   │   ├── lead-activity-types.ts
│   │   ├── lead-status-tabs.ts
│   │   └── lead-list-defaults.ts
│   └── contracts/leads/
│       ├── lead-summary.dto.ts
│       ├── lead-detail.dto.ts
│       ├── create-lead.dto.ts
│       ├── update-lead.dto.ts
│       └── lead-filter.dto.ts
├── i18n/dictionaries/workspace/leads/
│   ├── meta/{de,en}.json
│   ├── page/{de,en}.json
│   └── index.ts
└── lib/auth/api.ts                      # NEU: withWorkspaceApiAuth
```

---

## Tickets

### Pre-Flight

#### P1-T0 — Scoped Docs anlegen

- **Files:** `src/app/[locale]/workspace/leads/CLAUDE.md`, `src/app/[locale]/workspace/leads/AGENTS.md`
- **Inhalt:** Auth-Vererbung vom Parent-Layout, Routing, Filter via Query-Params, SSR-Datenfluss, i18n-Section `leads`, kritische Pfade, Reuse-Punkte
- **Skills:** keine
- **Akzeptanz:** Beide Files existieren; referenzieren Repo-Root-`CLAUDE.md` + Workspace-Parent-Docs
- **Aufwand:** 0,5h

### DB & Schema

#### P1-T1 — Constants & Enums

- **Files:**
  - `src/common/constants/contact/contact-lead-statuses.ts` (Edit: `proposal` ergänzen, Position zwischen `qualified` und `won`)
  - `src/common/constants/leads/lead-sources.ts` (`['webform','manual','import']`)
  - `src/common/constants/leads/lead-activity-types.ts` (`['note','status_change','message_drafted','inbound_submission','import']`)
  - `src/common/constants/leads/lead-status-tabs.ts` (`['all','new','qualified','proposal','won']`)
  - `src/common/constants/leads/lead-list-defaults.ts` (`PAGE_SIZE = 25`, `MAX_PAGE_SIZE = 100`)
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Alle Constants als `as const`-Arrays mit `satisfies`-Type-Check; Bestand kompiliert
- **Aufwand:** 1h

#### P1-T2 — Drizzle-Schema `leads.ts` erweitern

- **Files:** `src/server/db/record-configuration/leads.ts`
- **Inhalt:** `first_name`/`last_name` nullable, neue Spalten anlegen, neue CHECKs + Indizes (siehe Schema oben)
- **Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`
- **Akzeptanz:** `npm run typecheck` grün; bestehende Persist-Funktionen kompilieren
- **Aufwand:** 1,5h

#### P1-T3 — Drizzle-Schema `lead-activities.ts` neu

- **Files:** `src/server/db/record-configuration/lead-activities.ts`, `src/server/db/client.ts` (Edit: in `contactSchema` registrieren)
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Tabelle in `contactSchema`-Objekt; Type-Inference funktioniert
- **Aufwand:** 1h

#### P1-T4 — SQL-Migration `0003_extend_leads_for_crm.sql`

- **Files:** `src/server/db/migrations/0003_extend_leads_for_crm.sql`
- **Inhalt:** `ALTER TABLE leads` für nullable + neue Spalten + CHECK + Indizes (idempotent mit `IF NOT EXISTS` / `DROP CONSTRAINT IF EXISTS … ADD CONSTRAINT`)
- **Stilvorbild:** `src/server/db/migrations/0002_restructure_lead_storage.sql` (`statement-breakpoint`-Splits)
- **Skills:** `superpowers:verification-before-completion`
- **Akzeptanz:** `npm run db:migrate:dev` läuft ohne Fehler durch; idempotent (zweiter Lauf macht nichts)
- **Aufwand:** 1,5h

#### P1-T5 — SQL-Migration `0004_create_lead_activities.sql`

- **Files:** `src/server/db/migrations/0004_create_lead_activities.sql`
- **Inhalt:** `CREATE TABLE IF NOT EXISTS lead_activities` + Index + FK
- **Akzeptanz:** Migration läuft, Tabelle in Neon sichtbar; manueller Insert-Test passt
- **Aufwand:** 1h

### Server-Layer

#### P1-T6 — Lead-Validation-Service

- **Files:** `src/server/workspace/leads/lead-validation-service.ts`
- **Inhalt:** Zod-Schemas `createLeadSchema`, `updateLeadSchema`, `leadFilterSchema`
  - Refinement: mindestens `last_name` ODER `company_name`
  - Email-Format, Score 0–10, URL-Format für `website_url`/`linkedin_url`
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Unit-Tests für jedes Schema (valid + invalid Inputs)
- **Aufwand:** 2h

#### P1-T7 — Filter-Service

- **Files:** `src/server/workspace/leads/lead-filter-service.ts`
- **Inhalt:** Query-Param → Drizzle-`where`-Conditions
  - Filter: status, source, score-min, date-range (`from`/`to`), free-text-search (auf email/last_name/company_name/owner)
  - Pagination + Sort (default `created_at DESC`)
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Unit-Tests für jeden Filter-Pfad + Kombinationen
- **Aufwand:** 2h

#### P1-T8 — Query: `list-leads.query.ts`

- **Files:** `src/server/workspace/leads/list-leads.query.ts`
- **Inhalt:** `listLeads(filter): Promise<{ rows, total, page, perPage }>`; Count + Select in Transaction; DTO-Mapping nach `LeadSummaryDto`
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Integration-Test gegen Test-DB (oder Mock); Pagination korrekt
- **Aufwand:** 1,5h

#### P1-T9 — Query: `get-lead-by-id.query.ts`

- **Files:** `src/server/workspace/leads/get-lead-by-id.query.ts`
- **Inhalt:** Lädt Lead + Activities (sortiert by `occurred_at DESC`) + verknüpfte `lead_submissions`; Mapping nach `LeadDetailDto`
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Test mit Lead, der sowohl Activities als auch Submission hat
- **Aufwand:** 1,5h

#### P1-T10 — Command: `create-lead.command-handler.ts`

- **Files:** `src/server/workspace/leads/create-lead.command-handler.ts`, `src/server/workspace/leads/append-lead-activity.ts`
- **Inhalt:** Validate → Insert → Activity log (`type=note`, `body="Lead manually created"`) → Return DTO
- **Konflikt:** Email-Duplicate → `{ ok: false, code: 'EMAIL_EXISTS' }`
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Tests für valid create, duplicate email, missing required field
- **Aufwand:** 2h

#### P1-T11 — Command: `update-lead` + `update-lead-status`

- **Files:** `src/server/workspace/leads/update-lead.command-handler.ts`, `src/server/workspace/leads/update-lead-status.command-handler.ts`
- **Inhalt:** Status-Change loggt Activity (`type=status_change`, `body="<old> → <new>"`)
- **Akzeptanz:** Tests für valid update, status-change-activity wird angelegt, 404 wenn Lead nicht existiert
- **Aufwand:** 1,5h

#### P1-T12 — Bulk-Commands

- **Files:** `src/server/workspace/leads/bulk-update-status.command-handler.ts`, `src/server/workspace/leads/bulk-delete-leads.command-handler.ts`
- **Inhalt:** Eingaben `{ ids: string[], status?: LeadStatus }` bzw. `{ ids: string[] }`; Transaction; Activity-Log pro Lead bei Status-Bulk; Hard-Delete cascaded auf Activities
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Tests mit gemischten valid/invalid IDs (atomic: alles oder nichts)
- **Aufwand:** 1,5h

### API-Routes

#### P1-T13 — Auth-Helper für Workspace-API

- **Files:**
  - `src/lib/auth/api.ts` (NEU: `withWorkspaceApiAuth(handler)` HOC; ruft `requireWorkspaceAccess(locale)`; gibt 401/404 als JSON)
  - `src/proxy.ts` (Edit: Pattern für `/api/workspace/(.*)` ergänzen, sodass auch hier `auth.protect()` läuft)
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Unit-Tests für authed/unauthed/non-allowlisted Calls
- **Aufwand:** 2h

#### P1-T14 — Route: `GET/POST /api/workspace/leads`

- **Files:** `src/app/api/workspace/leads/route.ts`
- **Inhalt:**
  - GET: Filter aus Query-Params parsen → `listLeads()` → JSON
  - POST: Body validieren → `createLead()` → JSON
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Vitest-Route-Tests grün
- **Aufwand:** 1,5h

#### P1-T15 — Route: `GET/PATCH/DELETE /api/workspace/leads/[id]`

- **Files:** `src/app/api/workspace/leads/[id]/route.ts`
- **Akzeptanz:** Tests für jeden Verb-Pfad
- **Aufwand:** 1h

#### P1-T16 — Route: `POST /api/workspace/leads/bulk`

- **Files:** `src/app/api/workspace/leads/bulk/route.ts`
- **Inhalt:** Action-Discriminator im Body: `{ action: 'set_status' | 'delete', ids, status? }`
- **Akzeptanz:** Tests für beide Actions
- **Aufwand:** 1h

### i18n

#### P1-T17 — Workspace-Leads-Dictionaries

- **Files:**
  - `src/i18n/dictionaries/workspace/leads/meta/{de,en}.json`: title, description (mit `noindex`)
  - `src/i18n/dictionaries/workspace/leads/page/{de,en}.json`: header, toolbar (tabs, filters, search-placeholder), table-columns, status-labels, source-labels, empty-state, pagination, bulk-bar, detail-panel (sections, labels), add-dialog (form-labels, errors)
  - `src/i18n/dictionaries/workspace/leads/index.ts`: `getLeadsMetaContent(locale)`, `getLeadsPageContent(locale)`
- **Akzeptanz:** DE und EN parallel komplett, kein inline-String in Komponenten
- **Aufwand:** 2h

### UI-Komponenten

#### P1-T18 — Page-Shell + Page-Header

- **Files:**
  - `src/app/[locale]/workspace/leads/page.tsx` (Server-Component, lädt Filter aus `searchParams`, ruft `listLeads()`)
  - `src/components/workspace/leads/leads-page-shell/` (wrapped Header + Toolbar + Bulk-Bar + Tabelle + Pagination + Detail-Panel-Slot)
  - `src/components/workspace/leads/leads-page-header/` (Title h1, Privacy-Badge, Description, "Add Lead"-Button)
- **Skills:** `frontend-design:frontend-design`
- **Akzeptanz:** Page rendert ohne Daten (empty state), Mockup-Layout sichtbar
- **Aufwand:** 2,5h

#### P1-T19 — Toolbar + Filter

- **Files:** `src/components/workspace/leads/leads-toolbar/`
- **Inhalt:** Tabs (All/New/Qualified/Proposal/Won), Search-Input (debounced, URL-sync via `next/navigation`), Status-Select, Source-Select, Score-Range-Select (z.B. ≥7), Date-Range-Picker. Alle setzen Query-Params via `router.push()`
- **Skills:** `frontend-design:frontend-design`
- **Akzeptanz:** URL ändert sich auf Filter, SSR-Page rendert neu, alle Filter funktional, browser-back funktioniert
- **Aufwand:** 3h

#### P1-T20 — Tabelle + Row + Selection + Sort

- **Files:** `src/components/workspace/leads/leads-table/`, `src/components/workspace/leads/leads-table-row/`
- **Inhalt:**
  - `<LeadsTable>` Server-Component für initial render
  - `<LeadsTableSelectionProvider>` als Client-Wrapper für Selection-State
  - Spalten: Checkbox, Lead (Avatar/Initial + Name + URL klein darunter), Stage (Status-Badge), Source (Badge), Owner, Score (Bar), Created (last-touch), Next-Step (Platzhalter)
  - Row-Click → `?selected=<id>` (öffnet Side-Panel); Click auf Checkbox stoppt Propagation
  - Sortable Columns: Lead-Name, Score, Created (ASC/DESC via `?sort=…`)
- **Skills:** `frontend-design:frontend-design`
- **Akzeptanz:** Klick auf Row öffnet Detail; Checkbox-Selection wird beim Filter-Change cleared; Sort funktioniert
- **Aufwand:** 4h

#### P1-T21 — Bulk-Action-Bar

- **Files:** `src/components/workspace/leads/leads-bulk-action-bar/`
- **Inhalt:** Sticky am unteren Rand wenn Selection > 0; Actions "Mark as …" (Status-Dropdown), "Delete" (Confirm-Dialog); Sendet an `/api/workspace/leads/bulk`; Refresh via `router.refresh()`
- **Skills:** `frontend-design:frontend-design`
- **Akzeptanz:** Bei Status-Wechsel updaten Rows; bei Delete sind Leads weg
- **Aufwand:** 2h

#### P1-T22 — Pagination + Empty-State

- **Files:** `src/components/workspace/leads/leads-pagination/`, `src/components/workspace/leads/leads-empty-state/`
- **Inhalt:**
  - Pagination: First/Prev/[1..n]/Next/Last + "Showing X–Y of Z"
  - EmptyState (zwei Varianten): "noch keine Leads" (CTA "Add lead") und "0 Filter-Treffer" (CTA "Filter zurücksetzen")
- **Skills:** `frontend-design:frontend-design`
- **Akzeptanz:** Pagination ändert `?page=`, EmptyState zeigt korrekten Text basierend auf `hasFilters`
- **Aufwand:** 1,5h

#### P1-T23 — Detail-Side-Panel

- **Files:** `src/components/workspace/leads/lead-detail-panel/`
- **Inhalt:**
  - Server-Component, lädt via `getLeadById(searchParams.selected)`
  - Sektionen: Header (Logo+Name+Status), Contact-Block (Email, Phone, Company, Location), Notes (editierbar), Tags-List, Activities-Stream
  - Close-Button entfernt `?selected=`
  - "View full profile" als Disabled-Placeholder (Roadmap)
- **Skills:** `frontend-design:frontend-design`
- **Akzeptanz:** Panel öffnet/schließt via URL; alle Sektionen rendern; bei nicht-existentem `selected` zeigt Panel "Not found"
- **Aufwand:** 3h

#### P1-T24 — Activities-Stream-Komponente

- **Files:** `src/components/workspace/leads/lead-detail-activities/`
- **Inhalt:** Mergt `lead_activities` + `lead_submissions` (sortiert nach `occurred_at`/`created_at` DESC); rendert mit Type-Icon + Title + Body + Owner + Datum
- **Akzeptanz:** Lead mit Inbound-Submission UND manueller Activity zeigt beide chronologisch
- **Aufwand:** 1,5h

#### P1-T25 — Add-Lead-Dialog

- **Files:** `src/components/workspace/leads/add-lead-dialog/`
- **Inhalt:** Modal mit Form (Felder: first_name, last_name, company_name, email\*, phone, website_url, linkedin_url, category, score, owner, notes, source=manual default); Client-Side Validation gegen Zod-Schema (geteilt mit Server); Submit → POST → on success: schließt Dialog, refresh Liste, optional `?selected=<newId>`
- **Skills:** `frontend-design:frontend-design`
- **Akzeptanz:** Form rendert, Errors werden inline angezeigt (z.B. "Email or company required"), Email-Duplicate-Error wird sauber gemeldet
- **Aufwand:** 3h

#### P1-T26 — Status- / Source- / Score-Visuals

- **Files:** `src/components/workspace/leads/lead-status-badge/`, `src/components/workspace/leads/lead-source-badge/`, `src/components/workspace/leads/lead-score-bar/`
- **Inhalt:**
  - `<LeadStatusBadge>`: 7 Status mit konsistenten Farb-Tokens (z.B. new=neutral, qualified=accent-warm, proposal=cta, won=success-green, lost/archived=muted)
  - `<LeadSourceBadge>`: 3 Source-Werte
  - `<LeadScoreBar>`: 0–10 als gefüllte Bar (10 Segmente) + Zahl
- **Skills:** `frontend-design:frontend-design`
- **Akzeptanz:** Visuell konsistent über Tabelle + Detail-Panel
- **Aufwand:** 2h

### Sidebar-Aktivierung

#### P1-T27 — Workspace-Sidebar `leads`-Eintrag aktivieren

- **Files:**
  - `src/components/workspace/workspace-sidebar/workspace-sidebar.tsx` (Edit: `aria-disabled` + "Bald verfügbar"-Badge entfernen, `<Link href="/[locale]/workspace/leads">`)
  - `src/components/workspace/workspace-sidebar/workspace-sidebar-items.ts` (ggf. minimal anpassen falls Disabled-Flag dort liegt)
- **Akzeptanz:** Klick führt zur Page; aktiver Tab visuell hervorgehoben
- **Aufwand:** 0,5h

### QA & Tests

#### P1-T28 — E2E-Smoke-Test

- **Files:** `e2e/workspace-leads.e2e.ts`
- **Inhalt:** Login (mocked oder Test-Allowlist), Navigate zu `/de/workspace/leads`, "Add lead" → Form ausfüllen → Submit → Lead in Liste sichtbar → Click Row → Detail-Panel öffnet → Status ändern → Reload → Status persistiert
- **Skills:** `superpowers:verification-before-completion`
- **Akzeptanz:** Test grün lokal + CI
- **Aufwand:** 2h

#### P1-T29 — Pre-Merge-Gate

- **Inhalt:** `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` alle grün; manueller Smoke-Test im Browser (Mockup-Vergleich); Code-Review per `superpowers:requesting-code-review`
- **Aufwand:** 1h

---

## Verifikation (End-to-End-Akzeptanz Phase 1)

1. `npm run lint && npm run typecheck && npm run test && npm run build` grün
2. `npm run db:migrate:dev` läuft idempotent (zweimal hintereinander OK)
3. Im Browser auf `/de/workspace/leads` (eingeloggt mit Allowlist-Email):
   - Empty-State sichtbar wenn Tabelle leer
   - "Add lead" → Dialog → Submit mit `email + company_name` → Lead in Liste
   - Status-Tabs filtern korrekt
   - Such-Input filtert nach Email/Name/Firma
   - Source/Score/Date-Filter funktionieren, Kombination von 2+ Filtern korrekt
   - Pagination bei >25 Leads
   - Bulk: 3 Leads selektieren → "Mark as Qualified" → alle 3 haben neuen Status
   - Bulk: 2 Leads selektieren → Delete (mit Confirm) → weg
   - Klick auf Row → Detail-Panel öffnet rechts mit korrekten Daten
   - Activity-Stream zeigt Status-Change-Eintrag
   - URL `?selected=<id>` direkt aufrufbar (deep-link)
   - Browser-Back schließt Detail-Panel
4. Sidebar zeigt aktiven `leads`-Eintrag
5. E2E-Test grün
6. Mockup-Vergleich (`mockups/workspace-lead-page.png`) visuell stimmig (Spacing, Tokens, Badges)

## Reuse-Punkte

- `requireWorkspaceAccess` (`src/lib/auth/permissions.ts`) — Auth-Gate
- `getDrizzleDatabaseClient` + `ContactDatabaseTransaction` (`src/server/db/client.ts`) — DB-Singleton
- Bestehende `leads`-Tabelle + `lead_submissions`-Joining
- Bestehende SQL-Migrations-Convention (`statement-breakpoint`-Splits, raw SQL)
- Bestehende Persist-Pattern (Transactions, UPSERT-Logik in `persist-shared-lead-submission.ts`)
- Workspace-Shell-Komponenten (`workspace-shell`, `workspace-header`, `workspace-sidebar`) — keine Änderungen außer Sidebar-Item-Aktivierung
- `next-themes`, `globals.css`-Tokens — keine neuen Tokens nötig

## Skill-Übersicht (Phase 1)

| Skill                                        | Tickets                                             |
| -------------------------------------------- | --------------------------------------------------- |
| `superpowers:test-driven-development`        | T1, T2, T3, T6, T7, T8, T9, T10, T11, T12, T13, T14 |
| `superpowers:verification-before-completion` | T2, T4, T5, T13, T28, T29                           |
| `superpowers:requesting-code-review`         | T29                                                 |
| `frontend-design:frontend-design`            | T18, T19, T20, T21, T22, T23, T25, T26              |
| `superpowers:systematic-debugging`           | bei Bugs während Implementation                     |
