# CLAUDE — Workspace Leads (UI)

Architektur-Wissen für die Lead-Liste und das Detail-Side-Panel unter `src/app/[locale]/workspace/leads/`. Diese Datei ergänzt die Repo-Root `CLAUDE.md`, `src/app/CLAUDE.md` sowie die Workspace-Parent-Docs (`src/app/[locale]/workspace/CLAUDE.md` + `AGENTS.md`).

> **Status:** Phase 1 in Implementierung. Plan: `plans/workspace/leads/01-list-and-detail.md`. Folge-Pläne: `02-import-export.md`, `03-message-generator.md`.

## Zweck

Vereinheitlichte Lead-Übersicht für Inbound-Submissions (Quick-Contact, Project-Request, Discovery-Call) und Outbound-Recherche (manuell oder per Import). Eine erweiterte `leads`-Tabelle ist Single-Source-of-Truth; `lead_submissions` bleibt für Inbound-Rohdaten und wird im Detail-Panel als Activity-Stream gemerged.

## Auth-Vererbung

- Auth-Gate liegt im Parent-Layout `src/app/[locale]/workspace/layout.tsx` und ruft `requireWorkspaceAccess(locale)` aus `@/lib/auth/permissions` auf.
- `src/app/[locale]/workspace/leads/page.tsx` und `loading.tsx` enthalten **keine** eigene Auth-Logik. Sie verlassen sich auf das Layout (Layer 2) und `proxy.ts` (Layer 1, Edge).
- Allowlist über `WORKSPACE_ALLOWED_EMAILS` (siehe Workspace-Parent-Doku). Keine eigenen Permission-Checks in Pages oder UI-Komponenten.
- Server-only Helper aus `src/lib/auth/*` dürfen nicht in `"use client"`-Dateien importiert werden.

## Routing

| Route                                                                          | Zweck                                                                            |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `/[locale]/workspace/leads`                                                    | List-Page (server-rendered)                                                      |
| `/[locale]/workspace/leads?status=&source=&category=&q=&from=&to=&page=&sort=` | Alle Filter über Query-Params, SSR-friendly, deep-linkbar                        |
| `/[locale]/workspace/leads?selected=<id>`                                      | Detail-Side-Panel öffnet rechts (Server-Component, kein eigenes Routing-Segment) |

- Es gibt **kein** `/[locale]/workspace/leads/[id]`-Segment. Detail-Panel-State lebt ausschließlich im `selected`-Query-Param, damit die Liste hinter dem Panel sichtbar bleibt und der Tab-Wechsel reversibel ist.
- Filter setzen Query-Params per `router.push()`/`router.replace()` aus `next/navigation`. SSR re-rendert auf jeder URL-Änderung.

## SSR-Datenfluss

```
page.tsx (Server-Component)
  ├─ parseLeadFilter(searchParams)        → Zod-validierter Filter (lead-validation-service)
  ├─ buildWhere(filter)                   → Drizzle-Conditions (lead-filter-service)
  ├─ listLeads({ where, page, perPage })  → { rows: LeadSummaryDto[], total, page, perPage }
  ├─ optional: getLeadById(searchParams.selected) → LeadDetailDto oder Redirect ohne selected
  └─ render <LeadsPageShell>...</LeadsPageShell> with header and table children
```

- `page.tsx` ist eine Server-Component und orchestriert nur. Alle Datenmengen kommen aus `src/server/workspace/leads/query-handler/*`.
- `loading.tsx` ist der initiale Route-Skeleton. Tabellen-interne Refreshes (Filter/Such-Input/Pagination/Sort) zeigen einen lokalen `<LeadsTableLoadingState>`, damit Toolbar, Header, Bulk-Bar und Detail-Panel bedienbar bleiben.
- Mutationen laufen über die API-Routen in `src/app/api/workspace/leads/`. Nach Erfolg wird `router.refresh()` aufgerufen, damit der Server neu rendert.

## Filter via Query-Params

- Erlaubte Keys: `status`, `source`, `category`, `search`, `score_min`, `date_from`, `date_to`, `page`, `sort`.
- Keys werden zentral in `packages/common/src/constants/leads/lead-list-defaults.ts` und in
  `src/server/workspace/leads/services/lead-filter/lead-filter.schema.ts` typisiert. **Keine** ad-hoc-Strings in
  Komponenten.
- Standardliste schließt `archived` aus. Archivierte Leads sind nur über `?status=archived` sichtbar.
- `PAGE_SIZE = 25`, `MAX_PAGE_SIZE = 100`. Default-Sort `created_at DESC`.

## i18n

- Alle UI-/Page-Texte liegen in `src/i18n/dictionaries/workspace/leads/`:
  - `meta/{de,en}.json` — `title`, `description` (mit `noindex`)
  - `shell/{de,en}.json` — Header- und Shell-Texte
  - `shared/{de,en}.json` — Status-/Source-/Kategorie-/Plattform-Labels, Score-Aria-Label
  - `table/{de,en}.json` — Tabellen-Header, Sort-Labels, Selection-Labels, Platzhalter
  - `outreach/{de,en}.json` — Texte für Outreach-Trigger, Dialog, Kanäle, Fehler und Aktionen
  - `index.ts` — `getLeadsMetaDictionary(locale)`, `getLeadsSharedDictionary(locale)`,
    `getLeadsTableDictionary(locale)`, `getLeadsShellDictionary(locale)`,
    `getLeadsOutreachDictionary(locale)`
- DE und EN immer im selben Commit pflegen.
- Keine `locale === "de" ? ... : ...`-Branches; auch nicht für Kategorie-Labels. Kategorien werden über ihren `label_key` aus dem Dictionary aufgelöst — nicht direkt aus der DB.

## SEO / Caching

- `metadata.robots = { index: false, follow: false, nocache: true }` auf jeder Page.
- `export const dynamic = "force-dynamic"` (oder `revalidate = 0`), damit user-spezifische Server-Renders nie statisch gecached werden.
- Keine Sitemap-Einträge, keine externe Verlinkung.

## Komponenten-Schnitt

UI-Bausteine liegen in `src/components/workspace/leads/` und sind in folgende Subordner gruppiert (Begründung und Datei-Konvention in `src/components/workspace/leads/AGENTS.md`):

- `shell/` — Page-Shell + Page-Header
- `toolbar/` — Filter-Toolbar, Tabs, Suche
- `table/` — Tabelle, Row, Selection-Provider, Bulk-Action-Bar, Pagination, Empty-State, Loading-State
- `detail/` — Side-Panel + Activities-Stream
- `form/` — Add-Lead-Dialog
- `shared/` — Status-/Source-Badge, Score-Bar

Server Components sind Default. `"use client"` nur, wenn echte Interaktivität (URL-Sync, Selection-State, Dialoge, Form-State) das erzwingt. Animations-/Scroll-/Observer-Logik gehört nach `src/hooks/`, nicht in Render-Dateien.

## Kontrakt-Grenzen (DTOs vs. DB-Records)

- `packages/common/src/contracts/leads/**` enthält **nur** API-/Client-shared DTOs:
  - `lead-summary.dto.ts` — Listenzeile (für `<LeadsTable>`)
  - `lead-detail.dto.ts` — vollständiger Datensatz inkl. Kategorie, Social-Profile, Activities, Submissions
  - `bulk-edit-leads-input.ts` — Bulk-Action-Input
  - `results/*.ts` — Command-/Query-Result-Typen
  - `rows/*.ts` — DB-nahe SELECT-Shapes für serverseitige Mapper
- Persistenznahe Record-Shapes liegen bei Bedarf unter `src/server/db/records/leads/**` und werden nur server-intern
  konsumiert.
- Persistenz-Inputs liegen nur dann unter `src/server/db/contracts/leads/**`, wenn sie von DB-Persistenzfunktionen konsumiert werden. Command-spezifische Inputs bleiben unter `src/server/workspace/leads/**`.
- UI darf ausschließlich `packages/common/src/contracts/leads/**` importieren, nie `src/server/**` oder
  `src/server/db/**`.

## Kritische Dateien

| Pfad                                                                       | Zweck                                    |
| -------------------------------------------------------------------------- | ---------------------------------------- |
| `src/app/[locale]/workspace/leads/page.tsx`                                | SSR-Page, lädt Filter aus `searchParams` |
| `src/app/[locale]/workspace/leads/loading.tsx`                             | Initialer Route-Skeleton                 |
| `src/app/[locale]/workspace/layout.tsx`                                    | Auth-Gate (Layer 2, Parent)              |
| `src/proxy.ts`                                                             | Edge-Auth (Layer 1)                      |
| `src/components/workspace/leads/`                                          | Gruppierte Lead-Komponenten              |
| `src/server/workspace/leads/query-handler/list-leads.query-handler.ts`     | Listen-Loader                            |
| `src/server/workspace/leads/query-handler/get-lead-by-id.query-handler.ts` | Detail-Loader                            |
| `src/server/workspace/leads/services/lead-filter-service.ts`               | Query-Param → Drizzle-Where              |
| `src/i18n/dictionaries/workspace/leads/`                                   | Texte für Meta, Shell und Shared-Visuals |
| `packages/common/src/contracts/leads/`                                     | API-/Client-shared DTOs                  |

## Reuse-Punkte

- `requireWorkspaceAccess(locale)` aus `src/lib/auth/permissions.ts` — bereits im Parent-Layout aktiv, nicht doppeln.
- `getDrizzleDatabaseClient` + `ContactDatabaseTransaction` aus `src/server/db/core` — DB-Singleton.
- Bestehendes `lead_submissions`-Pattern — wird im Detail-Panel als Inbound-Stream gemerged, **nicht** dupliziert.
- Workspace-Shell-Komponenten (`workspace-shell`, `workspace-header`, `workspace-sidebar`) — keine Änderungen außer Sidebar-Item-Aktivierung in P1-T31.
- `next-themes` und `globals.css`-Tokens — keine neuen globalen Tokens nötig.

## Was hier NICHT hingehört

- Marketing-/Legal-Pages → siehe entsprechende Route-Groups.
- Eigene Auth-Logik oder doppelte Allowlist-Checks → einmal im Parent-Layout reicht.
- DB-Zugriff in Page-Files → über `src/server/workspace/leads/query-handler/*`.
- Inline-Strings, locale-Branches in `.tsx`, globale CSS-Klassen für lokale Komponenten → siehe Repo-Root-Regeln.

## Verweise

- Repo-Root `CLAUDE.md` — Stack, i18n-Regeln, SEO-Defaults.
- Repo-Root `AGENTS.md` — Branding, Security, Qualitätsregeln.
- `src/app/CLAUDE.md` — App-Router-Konventionen.
- `src/app/[locale]/workspace/CLAUDE.md` + `AGENTS.md` — Workspace-weite Auth-/i18n-/SEO-Regeln.
- `src/components/workspace/leads/AGENTS.md` — Komponenten-Schnitt und gruppierte Subfolder-Struktur.
- `src/app/api/workspace/leads/README.md` — API-Contract.
- Implementierungsplan: `plans/workspace/leads/01-list-and-detail.md`.
