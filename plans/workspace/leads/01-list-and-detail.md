# Phase 1 — Workspace Leads: List, Filter, Detail-Panel, Add-Lead

> **Branch:** `feat/workspace-leads-phase-1`
> **Geschätzter Aufwand:** ~22–28h
> **Abhängigkeiten:** keine. Geht von der bestehenden Workspace-Shell (Auth, Header, Sidebar) aus.
> **Folge-Pläne:** `02-import-export.md`, `03-message-generator.md`

## Context

Im Workspace gibt es bislang nur Auth + Shell und einen Disabled-`leads`-Sidebar-Eintrag. Outbound-Recherche (LinkedIn-Prospects aus `mockups/claude_ready_linkedin_leads.md`) liegt aktuell in CSV/Markdown und ist nicht im Workspace verwaltbar. Inbound-Submissions (Quick-Contact, Project-Request, Discovery-Call) landen bereits in `leads`/`lead_submissions`, sind aber nicht im UI sichtbar.

**Ziel Phase 1:** Eine einheitliche Lead-Übersicht (Mockup `mockups/workspace-lead-page.png`) mit Tabelle, Filter, Suche, Pagination, Bulk-Aktionen (Status/Archivieren), Detail-Side-Panel und manuellem Anlegen. Inbound + Outbound werden in **einer** erweiterten `leads`-Tabelle zusammengeführt.

### Geklärte Entscheidungen

| Bereich         | Entscheidung                                                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB-Strategie    | Bestehende `leads`-Tabelle erweitern, Inbound + Outbound zusammenführen                                                                               |
| Person vs Firma | `first_name` (nullable), `last_name` (nullable), `company_name` (nullable). CHECK: mindestens `last_name` ODER `company_name`                         |
| Status-Enum     | Erweitern um `proposal` → `new, contacted, qualified, proposal, won, lost, archived`                                                                  |
| Activities      | Neue Timeline-/Audit-Tabelle `lead_activities`. Kein Message-Speicher; `lead_submissions` bleibt und wird im Detail-Panel als merged Stream gerendert |
| Source-Werte    | `webform`, `manual`, `import`                                                                                                                         |
| Unique Lead     | `email` bleibt primärer Dedupe-Key über `leads_email_lower_uidx`; Website wird nicht unique, weil Firmen mehrere Kontakte haben können                |
| Social Profiles | Keine `linkedin_url`-Spalte in `leads`; Socials werden über `lead_social_profiles` mit fester Plattform-Checkliste modelliert                         |
| Kategorien      | Kategorien werden als erweiterbare Lookup-Tabelle `lead_categories` mit FK `leads.category_id` modelliert                                             |
| Score           | Score-Skala `0..100`, damit spätere Scoring-Regeln und Range-Filter fein genug abbildbar sind                                                         |
| Bulk-Aktionen   | Status ändern, Soft-Delete über `archived` (mit Confirm); kein Hard-Delete in P1                                                                      |
| Owner-Feld      | Free-text (`leads.owner` existiert bereits)                                                                                                           |

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
category_id        uuid NULL          -- NEU FK -> lead_categories(id)
score              integer NULL       -- NEU (CHECK 0..100)
source             text NOT NULL      -- NEU CHECK webform|manual|import; kein DB-Default
lead_status        text NOT NULL      -- bleibt, Constants um 'proposal' erweitert
owner              text NULL          -- bleibt
notes              text NULL          -- NEU
improvements       text[] NULL        -- NEU (verbesserung_1..3 aus CSV; für Message-Generator in Phase 03 erforderlich)
external_guid      text NULL          -- NEU (CSV-Guid für Import-Idempotenz)
created_at         timestamptz NOT NULL DEFAULT NOW()
updated_at         timestamptz NOT NULL DEFAULT NOW()
```

**Constraints/Indizes neu:**

- `CHECK (NULLIF(BTRIM(last_name), '') IS NOT NULL OR NULLIF(BTRIM(company_name), '') IS NOT NULL)`
- `CHECK (score IS NULL OR (score >= 0 AND score <= 100))`
- `CHECK (source IN ('webform', 'manual', 'import'))`
- Bestehender Email-Unique-Index bleibt (`leads_email_lower_uidx`)
- Neuer Index `leads_source_created_at_idx` auf `(source, created_at DESC)`
- Neuer Index `leads_category_created_at_idx` auf `(category_id, created_at DESC)`
- Neuer Partial-Unique-Index `leads_external_guid_uidx` auf `external_guid WHERE external_guid IS NOT NULL`
- `updated_at` wird bei jedem Command explizit im App-Code gesetzt; kein DB-Trigger in P1.
- `source` hat keinen DB-Default. Manuelle Leads setzen `source='manual'`, Webforms setzen `source='webform'`, spätere Imports setzen `source='import'` explizit.

**Tabelle `lead_categories` (neu):**

```
id                 uuid PK
slug               text NOT NULL UNIQUE
label_key          text NOT NULL
description        text NULL
is_active          boolean NOT NULL DEFAULT TRUE
sort_order         integer NOT NULL DEFAULT 0
created_at         timestamptz NOT NULL DEFAULT NOW()
updated_at         timestamptz NOT NULL DEFAULT NOW()
```

- Initiale Seed-Kategorien: `coaches`, `craftspeople`, `local-service-providers`, `small-b2b-providers`, `consultants`,
  `photographers`
- `sort_order` wird fachlich in 10er-Schritten vergeben (`10`, `20`, `30`, ...), damit Kategorien später ohne Umnummerierung dazwischen einsortiert werden können.
- UI-Labels für Kategorien werden über Dictionaries anhand von `label_key` gerendert; `slug` bleibt stabile technische Identität.
- Import normalisiert freie CSV-Kategorien auf `slug`; unbekannte Kategorien werden in Phase 2 beim Import entweder angelegt oder als Import-Fehler gemeldet.

**Tabelle `lead_social_profiles` (neu):**

```
id                 uuid PK
lead_id            uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE
platform           text NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'youtube'))
profile_url        text NOT NULL
normalized_url     text NOT NULL
created_at         timestamptz NOT NULL DEFAULT NOW()
updated_at         timestamptz NOT NULL DEFAULT NOW()
```

- Index `lead_social_profiles_lead_id_idx` auf `(lead_id)`
- Unique-Index `lead_social_profiles_lead_platform_url_uidx` auf `(lead_id, platform, normalized_url)`
- LinkedIn aus der aktuellen CSV wird als `platform='linkedin'` importiert; neue Plattformen erfordern bewusst eine Migration und Code-Ergänzung der Checkliste.

**Tabelle `lead_activities` (neu):**

```
id                 uuid PK
lead_id            uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE
type               text NOT NULL   enum(note|status_change|inbound_submission|import)
title              text NULL
body               text NULL
metadata           jsonb NULL
occurred_at        timestamptz NOT NULL DEFAULT NOW()
actor_type         text NOT NULL CHECK (actor_type IN ('system', 'user'))
actor_id           text NULL  -- Clerk userId, keine E-Mail
actor_label        text NULL  -- optionaler Anzeigename ohne E-Mail/PII
created_at         timestamptz NOT NULL DEFAULT NOW()
```

- Index `lead_activities_lead_id_occurred_at_idx` auf `(lead_id, occurred_at DESC)`
- `lead_activities` speichert Timeline-/Audit-Ereignisse, aber keinen vollständigen Nachrichtenverkehr. Echte Outbound-/Inbound-Messages werden im Folgeplan `03-message-generator.md` separat modelliert, z. B. über eine eigene `lead_messages`-Tabelle.
- `metadata` und Actor-Felder dürfen keine E-Mail-Adressen, Telefonnummern oder andere PII enthalten; vollständige Lead-Daten bleiben in den fachlichen Lead-/Submission-Tabellen.
- Erlaubte `metadata`-Keys in P1: `previous_status`, `next_status`, `submission_id`, `import_batch_id`. Keine freien Lead-Felder oder Kopien von Kontaktinformationen.

> **Hinweis:** Das Drizzle-Schema verwendet `text("lead_status", { enum: CONSTANT_ARRAY })` (kein PG-ENUM-Typ). Trotzdem existiert in der aktuellen SQL-Migration ein DB-`CHECK` auf die Statuswerte; dieser Check muss in P1-T7 so ersetzt werden, dass `proposal` DB-seitig akzeptiert wird.

### Routing & URL-Konvention

| Route                                                                                         | Zweck                                                                            |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `/[locale]/workspace/leads`                                                                   | List-Page (server-rendered)                                                      |
| `/[locale]/workspace/leads?status=&source=&category=&search=&date_from=&date_to=&page=&sort=` | Alle Filter über Query-Params, SSR-friendly, shareable                           |
| `/[locale]/workspace/leads?selected=<id>`                                                     | Detail-Side-Panel öffnet rechts (Server-Component, kein eigenes Routing-Segment) |
| `GET /api/workspace/leads`                                                                    | List                                                                             |
| `POST /api/workspace/leads`                                                                   | Create                                                                           |
| `GET/PATCH/DELETE /api/workspace/leads/[id]`                                                  | Read/Update/Soft-Delete (`archived`)                                             |
| `POST /api/workspace/leads/bulk`                                                              | Bulk Status / Soft-Delete (`archived`)                                           |

**Auth:** UI-Routen unter `/[locale]/workspace/*` nutzen weiterhin `requireWorkspaceAccess(locale)` über das Workspace-Layout. API-Routen unter `/api/workspace/*` nutzen einen separaten JSON-Helper `withWorkspaceApiAuth`, der ohne Locale-Redirect-Semantik authentifiziert und bei fehlender Auth/Allowlist JSON-Fehler (`401`/`404`) zurückgibt. `proxy.ts` wird nur dann für `/api/workspace/(.*)` erweitert, wenn die Middleware für API-Requests nachweislich kein Redirect-/HTML-Verhalten erzeugt; andernfalls bleibt der HOC der maßgebliche API-Schutz.

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
│       ├── README.md                    # API-Contract, Auth, Fehler, Test-Hinweise
│       ├── CLAUDE.md                    # API-Architektur-Doku
│       ├── AGENTS.md                    # API-spezifische Agent-Regeln
│       ├── route.ts
│       ├── [id]/route.ts
│       └── bulk/route.ts
├── components/workspace/leads/
│   ├── README.md                        # Komponenten-Schnitt, Subfolder-Regeln
│   ├── AGENTS.md                        # Scope-Regeln für gruppierte Leads-Komponenten
│   ├── shell/
│   │   ├── leads-page-shell/
│   │   └── leads-page-header/
│   ├── toolbar/
│   │   └── leads-toolbar/
│   ├── table/
│   │   ├── leads-table/
│   │   ├── leads-table-loading-state/
│   │   ├── leads-table-row/
│   │   ├── leads-bulk-action-bar/
│   │   ├── leads-pagination/
│   │   └── leads-empty-state/
│   ├── detail/
│   │   ├── lead-detail-panel/
│   │   └── lead-detail-activities/
│   ├── form/
│   │   └── add-lead-dialog/
│   └── shared/
│       ├── lead-status-badge/
│       ├── lead-source-badge/
│       └── lead-score-bar/
├── server/
│   ├── workspace/leads/
│   │   ├── command-handler/
│   │   │   ├── create-lead.command-handler.ts
│   │   │   ├── update-lead.command-handler.ts
│   │   │   ├── update-lead-status.command-handler.ts
│   │   │   ├── bulk-update-status.command-handler.ts
│   │   │   └── bulk-archive-leads.command-handler.ts
│   │   ├── query-handler/
│   │   │   ├── lead-filter.query-handler.ts
│   │   │   ├── list-leads.query-handler.ts
│   │   │   └── get-lead-by-id.query-handler.ts
│   │   ├── services/
│   │   │   ├── shared/
│   │   │   │   ├── lead-schema.ts                   # leadSchema-Objekt (Zod-Felder)
│   │   │   │   └── lead-social-profile.schema.ts    # socialProfileSchema
│   │   │   ├── create-lead/
│   │   │   │   ├── create-lead.schema.ts            # createLeadSchema + Refinement
│   │   │   │   └── create-lead-validation-service.ts
│   │   │   ├── update-lead/
│   │   │   │   ├── update-lead.schema.ts            # updateLeadSchema + Refinement
│   │   │   │   └── update-lead-validation-service.ts
│   │   │   └── lead-filter/
│   │   │       └── lead-filter.schema.ts
│   │   └── utils/
│   │       └── lead-url-normalization-service.ts
│   └── db/
│       ├── record-configuration/
│       │   ├── leads.ts                 # ERWEITERT
│       │   ├── lead-categories.ts       # NEU
│       │   ├── lead-social-profiles.ts  # NEU
│       │   └── lead-activities.ts       # NEU
│       └── migrations/
│           ├── 0003_create_lead_categories.sql
│           ├── 0004_extend_leads_for_crm.sql
│           ├── 0005_create_lead_social_profiles.sql
│           └── 0006_create_lead_activities.sql
├── common/
│   ├── constants/leads/
│   │   ├── lead-sources.ts
│   │   ├── lead-activity-types.ts
│   │   ├── lead-status-tabs.ts
│   │   └── lead-list-defaults.ts
│   └── contracts/leads/
│       ├── lead-summary.dto.ts
│       ├── lead-detail.dto.ts
│       ├── lead-write-fields.dto.ts
│       ├── create-lead.dto.ts
│       ├── update-lead.dto.ts
│       └── lead-filter.dto.ts
├── server/tests/workspace/leads/
│   ├── api/
│   ├── command-handler/
│   ├── query-handler/
│   ├── services/
│   └── utils/
├── i18n/dictionaries/workspace/leads/
│   ├── meta/{de,en}.json
│   ├── page/{de,en}.json
│   └── index.ts
└── lib/auth/api.ts                      # NEU: withWorkspaceApiAuth
```

---

## Tickets

### Pre-Flight

#### P1-T0 — Scoped Docs anlegen ✅

- **Files:** `src/app/[locale]/workspace/leads/CLAUDE.md`, `src/app/[locale]/workspace/leads/AGENTS.md`, `src/app/api/workspace/leads/CLAUDE.md`, `src/app/api/workspace/leads/AGENTS.md`, `src/app/api/workspace/leads/README.md`, `src/components/workspace/leads/AGENTS.md`
- **Inhalt UI-Doku:** Auth-Vererbung vom Parent-Layout, Routing, Filter via Query-Params, SSR-Datenfluss, i18n-Section `leads`, kritische Pfade, Reuse-Punkte
- **Inhalt API-Doku:** API-Auth über `withWorkspaceApiAuth`, erlaubte Endpunkte, Request-/Response-DTOs, Fehlerformat, Statuscodes, No-PII-Logging, Tests und Server-Layer-Reuse
- **Inhalt Komponenten-Doku:** `AGENTS.md` begründet die Unterteilung `shell/`, `toolbar/`, `table/`, `detail/`, `form/`, `shared/`, legt Komponentenordner-Dateinamen fest, verweist auf lokale `*.module.css` statt globale Styles und enthält die forward-looking Regeln für künftige Lead-Komponenten
- **Forward-looking AGENTS:** Alle drei `AGENTS.md` formulieren ihre Regeln so, dass sie über Phase 1 hinaus für künftige Lead-Erweiterungen (Import/Export, Outbound-Messaging, weitere Sub-Views) gelten — ohne Plan- oder Ticket-Spezifika
- **DTO-Regel:** `create-lead.dto.ts` und `update-lead.dto.ts` bleiben getrennt; gemeinsam genutzte schreibbare Felder liegen in `lead-write-fields.dto.ts`, kein generisches `save-lead.dto.ts`.
- **Contract-Grenze:** `src/common/contracts/leads/**` enthält nur API-/Client-shared DTOs. DB-nahe Records liegen bei Bedarf unter `src/server/db/records/leads/**` und spiegeln direkte DB-Row-Shapes. Persistenz-Inputs liegen nur dann unter `src/server/db/contracts/leads/**`, wenn sie von DB-Persistenzfunktionen konsumiert werden; command-spezifische Inputs bleiben bei `src/server/workspace/leads/**`.
- **Skills:** keine
- **Akzeptanz:** Alle sechs Markdown-Dateien existieren; `AGENTS.md`-Dateien sind auf Deutsch und forward-looking formuliert; UI-Doku referenziert Repo-Root-`CLAUDE.md` + Workspace-Parent-Docs; API-README beschreibt die Routen kompakt genug für Client-/Test-Implementierung; Komponenten-`AGENTS.md` erlaubt die gruppierte Leads-Struktur bewusst als Scope-spezifische Präzisierung
- **Aufwand:** 1h

### DB & Schema

#### P1-T1 — Constants & Enums ✅

- **Files:**
  - `src/common/constants/contact/contact-lead-statuses.ts` (Edit: `proposal` ergänzen, Position zwischen `qualified` und `won`)
  - `src/common/constants/leads/lead-sources.ts` (`['webform','manual','import']`)
  - `src/common/constants/leads/lead-activity-types.ts` (`['note','status_change','inbound_submission','import']`)
  - `src/common/constants/leads/lead-status-tabs.ts` (`['all','new','qualified','proposal','won']`)
  - `src/common/constants/leads/lead-list-defaults.ts` (`PAGE_SIZE = 25`, `MAX_PAGE_SIZE = 100`)
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Alle Constants als `as const`-Arrays mit `satisfies`-Type-Check; Bestand kompiliert
- **Aufwand:** 1h

#### P1-T2 — Drizzle-Schema `leads.ts` erweitern

- **Files:** `src/server/db/record-configuration/leads.ts`
- **Inhalt:** `first_name`/`last_name` nullable, neue Spalten anlegen, `category_id` FK zu `lead_categories`, Score-Check `0..100`, neue CHECKs + Indizes (siehe Schema oben)
- **Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`
- **Akzeptanz:** `npm run typecheck` grün; bestehende Persist-Funktionen kompilieren
- **Aufwand:** 1,5h

#### P1-T3 — Drizzle-Schema `lead-categories.ts` neu

- **Files:** `src/server/db/record-configuration/lead-categories.ts`, `src/server/db/client.ts` (Edit: in `contactSchema` registrieren)
- **Inhalt:** Lookup-Tabelle für filterbare Lead-Kategorien mit `slug`, `label_key`, `description`, `is_active`, `sort_order`; sichtbare Labels kommen aus Dictionaries, nicht aus der DB
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Tabelle in `contactSchema`-Objekt; Type-Inference funktioniert; `slug` ist unique; `label_key` ist verpflichtend und wird als Dictionary-Key genutzt
- **Aufwand:** 1h

#### P1-T4 — Drizzle-Schema `lead-social-profiles.ts` neu

- **Files:** `src/server/db/record-configuration/lead-social-profiles.ts`, `src/server/db/client.ts` (Edit: in `contactSchema` registrieren)
- **Inhalt:** Social-Profile pro Lead mit fester Plattform-Checkliste (`linkedin`, `instagram`, `youtube`) und `normalized_url`
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Tabelle in `contactSchema`-Objekt; Unique-Constraint auf `(lead_id, platform, normalized_url)` funktioniert; `normalized_url` wird vor Insert/Update über den URL-Normalization-Service berechnet
- **Aufwand:** 1h

#### P1-T5 — Drizzle-Schema `lead-activities.ts` neu

- **Files:** `src/server/db/record-configuration/lead-activities.ts`, `src/server/db/client.ts` (Edit: in `contactSchema` registrieren)
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Tabelle in `contactSchema`-Objekt; Type-Inference funktioniert
- **Aufwand:** 1h

#### P1-T6 — SQL-Migration `0003_create_lead_categories.sql`

- **Files:** `src/server/db/migrations/0003_create_lead_categories.sql`
- **Inhalt:** `CREATE TABLE IF NOT EXISTS lead_categories` + Unique-Index auf `slug` + Seed der initialen Kategorien mit `label_key` und `sort_order` in 10er-Schritten
- **Akzeptanz:** Migration läuft idempotent; Seed-Kategorien sind vorhanden, können gefiltert werden, nutzen `sort_order`-Werte `10`, `20`, `30`, ... und UI-Labels werden später aus Dictionaries per `label_key` aufgelöst
- **Aufwand:** 1h

#### P1-T7 — SQL-Migration `0004_extend_leads_for_crm.sql`

- **Files:** `src/server/db/migrations/0004_extend_leads_for_crm.sql`
- **Inhalt:** `ALTER TABLE leads` für nullable + neue Spalten inklusive `category_id` FK zu `lead_categories(id)` + Score-Check `0..100` + `source`-Check ohne DB-Default + aktualisierter `lead_status`-Check inklusive `proposal` und `on_hold` + getrimmter Personen/Firmenname-Check + Indizes (idempotent mit `IF NOT EXISTS` / `DROP CONSTRAINT IF EXISTS … ADD CONSTRAINT`)
- **Stilvorbild:** `src/server/db/migrations/0002_restructure_lead_storage.sql` (`statement-breakpoint`-Splits)
- **Skills:** `superpowers:verification-before-completion`
- **Akzeptanz:** `npm run db:migrate:dev` läuft ohne Fehler durch; idempotent (zweiter Lauf macht nichts); bestehender `lead_status`-CHECK wird so ersetzt, dass `proposal` und `on_hold` DB-seitig akzeptiert werden; `source` hat keinen DB-Default und alle bestehenden `leads` erhalten explizit `source='webform'` oder eine bewusst dokumentierte Fallback-Quelle; `persistSharedLeadSubmission()` setzt bei künftigen Inbound-Upserts `source='webform'` explizit und der bestehende Contact-Persistenz-Test bleibt grün
- **Aufwand:** 1,5h

#### P1-T8 — SQL-Migration `0005_create_lead_social_profiles.sql`

- **Files:** `src/server/db/migrations/0005_create_lead_social_profiles.sql`
- **Inhalt:** `CREATE TABLE IF NOT EXISTS lead_social_profiles` + `CHECK (platform IN ('linkedin', 'instagram', 'youtube'))` + Index + Unique-Index
- **Akzeptanz:** Migration läuft idempotent; mehrere erlaubte Plattformen pro Lead sind möglich, Dubletten pro Plattform/URL nicht; nicht erlaubte Plattformen werden DB-seitig abgelehnt
- **Aufwand:** 1h

#### P1-T9 — SQL-Migration `0006_create_lead_activities.sql`

- **Files:** `src/server/db/migrations/0006_create_lead_activities.sql`
- **Inhalt:** `CREATE TABLE IF NOT EXISTS lead_activities` + Type-Check für `note`, `status_change`, `inbound_submission`, `import` + Actor-Felder `actor_type`, `actor_id`, `actor_label` + Index + FK
- **Akzeptanz:** Migration läuft, Tabelle in Neon sichtbar; manueller Insert-Test passt
- **Aufwand:** 1h

### Server-Layer

#### P1-T10 — Lead-Validation- und URL-Normalization-Services

Schemas und Refinements liegen je Operation in einer Datei (`*.schema.ts`), ohne separates `*.validation-rules.ts`.
Gemeinsame Zod-Bausteine leben in `shared/`.

- **Files:**
  - `src/server/workspace/leads/utils/lead-url-normalization-service.ts`
  - `src/common/constants/leads/lead-tracking-params.ts`
  - `src/server/workspace/leads/services/shared/lead-schema.ts`
  - `src/server/workspace/leads/services/shared/lead-social-profile.schema.ts`
  - `src/server/workspace/leads/services/create-lead/create-lead.schema.ts`
  - `src/server/workspace/leads/services/create-lead/create-lead-validation-service.ts`
  - `src/server/workspace/leads/services/update-lead/update-lead.schema.ts`
  - `src/server/workspace/leads/services/update-lead/update-lead-validation-service.ts`
  - `src/server/workspace/leads/services/lead-filter/lead-filter.schema.ts`
- **Inhalt:** Zod-Schemas `createLeadSchema`, `updateLeadSchema`, `leadFilterSchema`
  - Refinement: mindestens getrimmtes `last_name` ODER getrimmtes `company_name`
  - Email-Format, Score 0–100, URL-Format für `website_url` und Social-Profil-URLs
  - `category_id` muss UUID sein; Social-Profile validieren `platform` gegen die feste Plattformliste `linkedin | instagram | youtube`
  - `normalizeLeadProfileUrl()` erzeugt `normalized_url` deterministisch aus Social-Profil-URLs (trim, lowercase host, entfernte Tracking-Parameter und trailing slash)
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Unit-Tests für jedes Schema (valid + invalid Inputs) unter
  `src/server/tests/workspace/leads/services/lead-validation-service.test.ts`; URL-Normalisierung ist unter
  `src/server/tests/workspace/leads/utils/lead-url-normalization-service.test.ts` gegen
  Dubletten-/Tracking-Parameter-Fälle getestet
- **Aufwand:** 2h

#### P1-T11 — Filter-Query-Handler ✅

- **Files:** `src/server/workspace/leads/query-handler/lead-filter.query-handler.ts`
- **Inhalt:** `buildLeadFilter(filter: LeadFilterInput): LeadFilterResult` — Query-Param → Drizzle-`where`-Conditions +
  Pagination + Sort
  - Filter: status, source, category, score-min, date-range (`date_from`/`date_to`), free-text-search `search` (auf
    email/last_name/company_name/owner via `ilike`)
  - Standardliste schließt `archived` aus (`ne(lead_status, "archived")`); archivierte Leads werden nur bei explizitem
    `status=archived` berücksichtigt
  - Pagination: `limit` = `LEAD_LIST_PAGE_SIZE`, `offset` = `(page - 1) * perPage`, Default page 1
  - Sort: `score_asc`, `score_desc`, `name_asc`, `name_desc`, Default `created_at DESC`
  - Rückgabewert `LeadFilterResult`: `{ where, orderBy, limit, offset, page, perPage }`
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** ✅ 31 Unit-Tests für jeden Filter-Pfad + Kombinationen unter
  `src/server/tests/workspace/leads/query-handler/lead-filter.query-handler.test.ts`; Test belegt, dass `archived` ohne
  expliziten Statusfilter ausgeschlossen ist; alle 331 Tests im Projekt grün
- **Aufwand:** 2h

#### P1-T12 — Query: `list-leads.query-handler.ts`

- **Files:** `src/server/workspace/leads/query-handler/list-leads.query-handler.ts`
- **Inhalt:** `listLeads(filter): Promise<{ rows, total, page, perPage }>`; Count + Select in Transaction; DTO-Mapping nach `LeadSummaryDto`
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Integration-Test gegen Test-DB (oder Mock) unter `src/server/tests/workspace/leads/query-handler/list-leads.query-handler.test.ts`; Pagination korrekt
- **Aufwand:** 1,5h

#### P1-T13 — Query: `get-lead-by-id.query-handler.ts`

- **Files:** `src/server/workspace/leads/query-handler/get-lead-by-id.query-handler.ts`
- **Inhalt:** Lädt Lead + Kategorie + Social-Profile + Activities (sortiert by `occurred_at DESC`) + verknüpfte `lead_submissions`; Mapping nach `LeadDetailDto`
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Test unter `src/server/tests/workspace/leads/query-handler/get-lead-by-id.query-handler.test.ts` mit Lead, der Kategorie, Social-Profil, Activity und Submission hat
- **Aufwand:** 1,5h

#### P1-T14 — Command: `create-lead.command-handler.ts`

- **Files:** `src/server/workspace/leads/command-handler/create-lead.command-handler.ts`, `src/server/workspace/leads/services/lead-activity-service.ts`
- **Inhalt:** Validate → Insert Lead mit explizit gesetztem `source='manual'`, `lead_status='new'`, optionalen `improvements`, `created_at` und `updated_at` → Insert Social-Profile mit berechnetem `normalized_url` in derselben Transaction → Activity über `appendLeadActivity()` im `lead-activity-service` loggen (`type=note`, `body="Lead manually created"`) → Return DTO
- **Konflikt:** Email-Duplicate → `{ ok: false, code: 'EMAIL_EXISTS' }`
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Tests unter `src/server/tests/workspace/leads/command-handler/create-lead.command-handler.test.ts` für valid create mit Kategorie/Social-Profil/Improvements, duplicate email, missing required field; Activity-Test prüft, dass `metadata` und Actor-Felder keine E-Mail/PII enthalten
- **Aufwand:** 2h

#### P1-T15 — Command: `update-lead` + `update-lead-status`

- **Files:** `src/server/workspace/leads/command-handler/update-lead.command-handler.ts`, `src/server/workspace/leads/command-handler/update-lead-status.command-handler.ts`
- **Inhalt:** Lead-Stammdaten inklusive `category_id`, `notes` und `improvements` aktualisieren und `updated_at` explizit setzen; Social-Profile per Replace-Set in Transaction synchronisieren; Status-Change setzt ebenfalls `updated_at` und loggt Activity (`type=status_change`, `body="<old> → <new>"`)
- **Akzeptanz:** Tests unter `src/server/tests/workspace/leads/command-handler/update-lead.command-handler.test.ts` und `update-lead-status.command-handler.test.ts` für valid update mit Kategorie/Social-Profil/Improvements, status-change-activity wird angelegt, 404 wenn Lead nicht existiert
- **Aufwand:** 1,5h

#### P1-T16 — Bulk-Commands

- **Files:** `src/server/workspace/leads/command-handler/bulk-update-status.command-handler.ts`, `src/server/workspace/leads/command-handler/bulk-archive-leads.command-handler.ts`
- **Inhalt:** Eingaben `{ ids: string[], status?: LeadStatus }` bzw. `{ ids: string[] }`; Transaction; Activity-Log pro Lead bei Status-Bulk; Soft-Delete setzt `lead_status='archived'` und `updated_at`, keine Zeilen werden physisch gelöscht
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Tests unter `src/server/tests/workspace/leads/command-handler/bulk-update-status.command-handler.test.ts` und `bulk-archive-leads.command-handler.test.ts` mit gemischten valid/invalid IDs (atomic: alles oder nichts); archivierte Leads bleiben in der DB und sind über Statusfilter `archived` auffindbar
- **Aufwand:** 1,5h

### API-Routes

#### P1-T17 — Auth-Helper für Workspace-API

- **Files:**
  - `src/lib/auth/api.ts` (NEU: `withWorkspaceApiAuth(handler)` HOC; nutzt Clerk `auth()`/`currentUser()` + Allowlist-Prüfung ohne Locale-Redirect und gibt 401/404 als JSON)
  - `src/proxy.ts` (prüfen und nur erweitern, wenn `/api/workspace/(.*)` mit Clerk-Middleware JSON-kompatibel bleibt; sonst keine Proxy-Änderung für API)
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Unit-Tests für authed/unauthed/non-allowlisted Calls; API-Helper importiert keine locale-aware Redirect-Helper und ruft nicht `requireWorkspaceAccess(locale)` auf; falls `proxy.ts` erweitert wird, ist ein Test/Smoke dokumentiert, dass API-Requests JSON-Fehler statt HTML/Redirect erhalten
- **Aufwand:** 2h

#### P1-T18 — Route: `GET/POST /api/workspace/leads`

- **Files:** `src/app/api/workspace/leads/route.ts`, `src/app/api/workspace/leads/README.md` (bei Contract-Details aktualisieren)
- **Inhalt:**
  - GET: Filter aus Query-Params parsen → `listLeads()` → JSON
  - POST: Body inklusive `category_id`, `improvements[]` und `social_profiles[]` validieren → `createLead()` → JSON
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Vitest-Route-Tests grün unter `src/server/tests/workspace/leads/api/leads-route.test.ts`; API-README dokumentiert Query-Params, Create-Body, Success-Response und Fehlercodes
- **Aufwand:** 1,5h

#### P1-T19 — Route: `GET/PATCH/DELETE /api/workspace/leads/[id]`

- **Files:** `src/app/api/workspace/leads/[id]/route.ts`, `src/app/api/workspace/leads/README.md` (bei Contract-Details aktualisieren)
- **Akzeptanz:** Tests für jeden Verb-Pfad unter `src/server/tests/workspace/leads/api/lead-id-route.test.ts`; `PATCH` kann `improvements` ergänzen/bearbeiten; `DELETE` setzt `lead_status='archived'` statt physisch zu löschen und antwortet mit `{ ok: true, status: 'archived' }` statt `204`; API-README dokumentiert Read-/Patch-/Soft-Delete-Verhalten inklusive 404/Validation-Fehler
- **Aufwand:** 1h

#### P1-T20 — Route: `POST /api/workspace/leads/bulk`

- **Files:** `src/app/api/workspace/leads/bulk/route.ts`, `src/app/api/workspace/leads/README.md` (bei Contract-Details aktualisieren)
- **Inhalt:** Action-Discriminator im Body: `{ action: 'set_status' | 'archive', ids, status? }`
- **Akzeptanz:** Tests für beide Actions unter `src/server/tests/workspace/leads/api/leads-bulk-route.test.ts`; API-README dokumentiert Atomicity, erlaubte Actions, Soft-Delete-Semantik und Fehlerfälle
- **Aufwand:** 1h

### i18n

#### P1-T21 — Workspace-Leads-Dictionaries

- **Files:**
  - `src/i18n/dictionaries/workspace/leads/meta/{de,en}.json`: title, description (mit `noindex`)
  - `src/i18n/dictionaries/workspace/leads/page/{de,en}.json`: header, toolbar (tabs, filters, category-filter, search-placeholder), table-columns, status-labels, source-labels, category-labels, social-platform-labels, empty-state, pagination, bulk-bar, detail-panel (sections, labels), add-dialog (form-labels, errors)
  - `src/i18n/dictionaries/workspace/leads/index.ts`: `getLeadsMetaContent(locale)`, `getLeadsPageContent(locale)`
- **Akzeptanz:** DE und EN parallel komplett, kein inline-String in Komponenten; Kategorie-Labels werden per `label_key` in `category-labels` aufgelöst, nicht direkt aus der DB gerendert
- **Aufwand:** 2h

### UI-Komponenten

#### P1-T22 — Page-Shell + Page-Header

- **Files:**
  - `src/app/[locale]/workspace/leads/page.tsx` (Server-Component, lädt Filter aus `searchParams`, ruft `listLeads()`)
  - `src/app/[locale]/workspace/leads/loading.tsx` (initialer Page-Skeleton für Route-Load; kein Tabellen-Refresh-State)
  - `src/components/workspace/leads/shell/leads-page-shell/` (wrapped Header + Toolbar + Bulk-Bar + Tabelle + Pagination + Detail-Panel-Slot)
  - `src/components/workspace/leads/shell/leads-page-header/` (Title h1, Privacy-Badge, Description, "Add Lead"-Button)
- **Skills:** `frontend-design:frontend-design`
- **Akzeptanz:** Page rendert ohne Daten (empty state), Mockup-Layout sichtbar; initialer Route-Load zeigt Page-Skeleton mit Header-/Toolbar-/Table-Struktur; Page setzt `export const dynamic = "force-dynamic"` und `metadata.robots = { index: false, follow: false, nocache: true }`
- **Aufwand:** 2,5h

#### P1-T23 — Toolbar + Filter

- **Files:** `src/components/workspace/leads/toolbar/leads-toolbar/`
- **Inhalt:** Tabs (All/New/Qualified/Proposal/Won), Search-Input (debounced, URL-sync via `next/navigation`), Status-Select, Source-Select, Category-Select, Score-Range-Select (z.B. ≥70), Date-Range-Picker. Alle setzen Query-Params via `router.push()`
- **Skills:** `frontend-design:frontend-design`
- **Akzeptanz:** URL ändert sich auf Filter, SSR-Page rendert neu, alle Filter funktional, browser-back funktioniert
- **Aufwand:** 3h

#### P1-T24 — Tabelle + Row + Selection + Sort

- **Files:** `src/components/workspace/leads/table/leads-table/`, `src/components/workspace/leads/table/leads-table-row/`, `src/components/workspace/leads/table/leads-table-loading-state/`
- **Inhalt:**
  - `<LeadsTable>` Server-Component für initial render
  - `<LeadsTableSelectionProvider>` als Client-Wrapper für Selection-State
  - `<LeadsTableLoadingState>` für lokale Tabellen-Refreshes bei Filter/Search/Pagination/Sort; Toolbar, Header, Bulk-Bar und Detail-Panel bleiben sichtbar und bedienbar
  - Spalten: Checkbox, Lead (Avatar/Initial + Name + URL klein darunter), Kategorie, Stage (Status-Badge), Source (Badge), Owner, Score (Bar), Created (last-touch), Next-Step (Platzhalter)
  - Row-Click → `?selected=<id>` (öffnet Side-Panel); Click auf Checkbox stoppt Propagation
  - Sortable Columns: Lead-Name, Score, Created (ASC/DESC via `?sort=…`)
- **Skills:** `frontend-design:frontend-design`
- **Akzeptanz:** Klick auf Row öffnet Detail; Checkbox-Selection wird beim Filter-Change cleared; Sort funktioniert; Tabellen-Refresh zeigt Row-Skeletons oder dezentes Table-Overlay statt Full-Page-Spinner
- **Aufwand:** 4h

#### P1-T25 — Bulk-Action-Bar

- **Files:** `src/components/workspace/leads/table/leads-bulk-action-bar/`
- **Inhalt:** Sticky am unteren Rand wenn Selection > 0; Actions "Mark as …" (Status-Dropdown), "Archive" (Confirm-Dialog); Sendet an `/api/workspace/leads/bulk`; Refresh via `router.refresh()`
- **Skills:** `frontend-design:frontend-design`
- **Akzeptanz:** Bei Status-Wechsel updaten Rows; bei Archive verschwinden Leads aus der Standardliste, bleiben aber über Statusfilter `archived` auffindbar
- **Aufwand:** 2h

#### P1-T26 — Pagination + Empty-State

- **Files:** `src/components/workspace/leads/table/leads-pagination/`, `src/components/workspace/leads/table/leads-empty-state/`
- **Inhalt:**
  - Pagination: First/Prev/[1..n]/Next/Last + "Showing X–Y of Z"
  - EmptyState (zwei Varianten): "noch keine Leads" (CTA "Add lead") und "0 Filter-Treffer" (CTA "Filter zurücksetzen")
- **Skills:** `frontend-design:frontend-design`
- **Akzeptanz:** Pagination ändert `?page=`, EmptyState zeigt korrekten Text basierend auf `hasFilters`
- **Aufwand:** 1,5h

#### P1-T27 — Detail-Side-Panel

- **Files:** `src/components/workspace/leads/detail/lead-detail-panel/`
- **Inhalt:**
  - Server-Component, lädt via `getLeadById(searchParams.selected)`
  - Sektionen: Header (Logo+Name+Status), Contact-Block (Email, Phone, Company, Website), Kategorie, Social-Profile, Improvements (ergänzbar und editierbar), Notes (editierbar), Activities-Stream
  - Close-Button entfernt `?selected=`
  - "View full profile" als Disabled-Placeholder (Roadmap)
- **Skills:** `frontend-design:frontend-design`
- **Akzeptanz:** Panel öffnet/schließt via URL; alle Sektionen rendern; bei nicht-existentem `selected` zeigt Panel "Not found"
- **Aufwand:** 3h

#### P1-T28 — Activities-Stream-Komponente

- **Files:** `src/components/workspace/leads/detail/lead-detail-activities/`
- **Inhalt:** Mergt Timeline-/Audit-Einträge aus `lead_activities` + Inbound-Ereignisse aus `lead_submissions` (sortiert nach `occurred_at`/`created_at` DESC); rendert mit Type-Icon + Title + Body + Owner + Datum
- **Akzeptanz:** Lead mit Inbound-Submission UND manueller Activity zeigt beide chronologisch
- **Aufwand:** 1,5h

#### P1-T29 — Add-Lead-Dialog

- **Files:** `src/components/workspace/leads/form/add-lead-dialog/`
- **Inhalt:** Modal mit Form (Felder: first_name, last_name, company_name, email\*, phone, website_url, category_id, score, owner, notes, improvements[], social_profiles[]; Server setzt explizit `source='manual'`); Client-Side Validation gegen Zod-Schema (geteilt mit Server); Submit → POST → on success: schließt Dialog, refresh Liste, optional `?selected=<newId>`
- **Skills:** `frontend-design:frontend-design`
- **Akzeptanz:** Form rendert, Kategorie-Select lädt aktive Kategorien, Improvements können ergänzt/bearbeitet werden, Social-Profile können mit Plattform + URL erfasst werden, Errors werden inline angezeigt (z.B. "Email or company required"), Email-Duplicate-Error wird sauber gemeldet
- **Aufwand:** 3h

#### P1-T30 — Status- / Source- / Score-Visuals

- **Files:** `src/components/workspace/leads/shared/lead-status-badge/`, `src/components/workspace/leads/shared/lead-source-badge/`, `src/components/workspace/leads/shared/lead-score-bar/`
- **Inhalt:**
  - `<LeadStatusBadge>`: 7 Status mit konsistenten Farb-Tokens (z.B. new=neutral, qualified=accent-warm, proposal=cta, won=success-green, lost/archived=muted)
  - `<LeadSourceBadge>`: 3 Source-Werte
  - `<LeadScoreBar>`: 0–100 als gefüllte Bar + Zahl
- **Skills:** `frontend-design:frontend-design`
- **Akzeptanz:** Visuell konsistent über Tabelle + Detail-Panel
- **Aufwand:** 2h

### Sidebar-Aktivierung

#### P1-T31 — Workspace-Sidebar `leads`-Eintrag aktivieren

- **Files:**
  - `src/components/workspace/workspace-sidebar/workspace-sidebar.tsx` (Edit: `aria-disabled` + "Bald verfügbar"-Badge entfernen, `<Link href="/[locale]/workspace/leads">`)
  - `src/components/workspace/workspace-sidebar/workspace-sidebar-items.ts` (ggf. minimal anpassen falls Disabled-Flag dort liegt)
- **Akzeptanz:** Klick führt zur Page; aktiver Tab visuell hervorgehoben
- **Aufwand:** 0,5h

### QA & Tests

#### P1-T32 — DB-Enum-Constraint-Paritätstest

- **Files:** `src/server/tests/db/records/lead-enum-constraints.test.ts`
- **Inhalt:** Live-DB-Test (analog zu `contact-record-shape.test.ts`), der für jede Spalte mit einem `CHECK (col IN (...))` die tatsächliche DB-Constraint-Definition gegen das zugehörige TypeScript-Const-Array prüft. Schlägt fehl, wenn beide Listen nicht deckungsgleich sind — Migration und Konstante sind dann nicht synchron.

  Zu prüfende Paare:

  | Tabelle                | Spalte        | TS-Konstante                   |
  | ---------------------- | ------------- | ------------------------------ |
  | `leads`                | `source`      | `LEAD_SOURCES_VALUES`          |
  | `leads`                | `lead_status` | `CONTACT_LEAD_STATUS_VALUES`   |
  | `lead_social_profiles` | `platform`    | `LEAD_SOCIAL_PLATFORMS_VALUES` |
  | `lead_activities`      | `type`        | `LEAD_ACTIVITY_TYPES`          |
  | `lead_activities`      | `actor_type`  | `LEAD_ACTOR_TYPE_VALUES`       |

  Implementierungshinweise:
  - DB-Seite: `pg_get_constraintdef(oid)` auf `pg_constraint` (Typ `c`) für die jeweilige Tabelle/Spalte aufrufen; aus dem zurückgegebenen String (z. B. `CHECK (platform = ANY (ARRAY['linkedin'::text, ...]))` oder `CHECK ((platform = ANY (ARRAY[...])))`) die Werte per Regex extrahieren und als sortiertes `string[]` normalisieren.
  - TS-Seite: Das jeweilige `_VALUES`-Array direkt importieren, `[...values].sort()` verwenden.
  - Fehlertext muss klar benennen, welche Tabelle/Spalte abweicht und welche Werte fehlen oder überzählig sind, damit nach einer Migration sofort erkennbar ist, welche Konstante nachgezogen werden muss.
  - Test überspringt sich selbst mit `skip` (oder wirft verständliche Message), wenn `DATABASE_URL` nicht gesetzt ist, damit CI ohne DB-Verbindung nicht rot wird.

- **Skills:** `superpowers:verification-before-completion`
- **Akzeptanz:** Test ist grün wenn alle fünf Paare übereinstimmen; wird rot wenn z. B. `LEAD_SOCIAL_PLATFORMS_VALUES` einen Wert enthält, der im DB-CHECK fehlt, oder umgekehrt; `npm run test` läuft ohne DB-Verbindung durch (skip-Pfad)
- **Aufwand:** 1h

#### P1-T33 — E2E-Smoke-Test

- **Files:** `e2e/workspace-leads.e2e.ts`
- **Inhalt:** Login (mocked oder Test-Allowlist), Navigate zu `/de/workspace/leads`, "Add lead" → Form mit Kategorie, Score `80`, Improvement und LinkedIn-Profil ausfüllen → Submit → Lead in Liste sichtbar → Click Row → Detail-Panel öffnet mit Kategorie/Social-Profil/Improvement → Improvement bearbeiten → Status ändern → Reload → Status und Improvement persistieren → Lead archivieren → aus Standardliste weg, per Statusfilter `archived` sichtbar
- **Skills:** `superpowers:verification-before-completion`
- **Akzeptanz:** Test grün lokal + CI
- **Aufwand:** 2h

#### P1-T34 — Pre-Merge-Gate

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
   - Source/Kategorie/Score/Date-Filter funktionieren, Kombination von 2+ Filtern korrekt
   - Pagination bei >25 Leads
   - Bulk: 3 Leads selektieren → "Mark as Qualified" → alle 3 haben neuen Status
   - Bulk: 2 Leads selektieren → Archive (mit Confirm) → aus Standardliste weg, per Statusfilter `archived` sichtbar
   - Klick auf Row → Detail-Panel öffnet rechts mit korrekten Daten
   - Detail-Panel zeigt Kategorie und Social-Profile korrekt
   - Detail-Panel zeigt Improvements und erlaubt Ergänzen/Bearbeiten
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

| Skill                                        | Tickets                                                         |
| -------------------------------------------- | --------------------------------------------------------------- |
| `superpowers:test-driven-development`        | T1, T2, T3, T4, T5, T10, T11, T12, T13, T14, T15, T16, T17, T18 |
| `superpowers:verification-before-completion` | T2, T6, T7, T8, T9, T17, T32, T33, T34                          |
| `superpowers:requesting-code-review`         | T33                                                             |
| `frontend-design:frontend-design`            | T22, T23, T24, T25, T26, T27, T29, T30                          |
| `superpowers:systematic-debugging`           | bei Bugs während Implementation                                 |
