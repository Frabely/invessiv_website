# Task 03 — Kundenliste

> **Merge-Einheit:** Ordner 05 · **Branch:** `feat/crm-kundenliste-status`
> **Aufwand:** M · **Abhängigkeiten:** Task 04 (minimale Übersicht und Route),
> Task 02a (geteilte Listen-Komponenten), Task 07 (Status)
> **Migration:** keine

> **Umgesetzt (16.09.2026):** Pagination, Count, URL-Sortierung, Archivfilter, Owner,
> Hauptansprechpartner und letzte Änderung sind Bestandteil von
> `feat/crm-kundenliste-status`. Allgemeine Suche, Facettenfilter und Tags folgen bewusst in
> Ordner 22a.

Dieser Task **erweitert** die minimale Kundenübersicht aus Task 04 zur vollen Liste: Pagination,
Sortierung, URL-State und die geteilten Bausteine aus Task 02a. Der Query-Handler
wird erweitert, nicht ersetzt — Signatur und DTO bleiben stabil.

- Standardliste filtert `status != archived`; archivierte Kunden sind über expliziten URL-Filter
  erreichbar.
- Liste zeigt Owner und verpflichtenden Primärkontakt.
- Seite, Sortierung und „Archivierte einblenden“ laufen vollständig über URL-State.
- Count und Liste verwenden exakt dieselbe Querydefinition.
- Task 42 in Ordner 07 ergänzt zwei Wertspalten und eine zusätzliche Sortierung. Der Query-Handler
  wird deshalb so geschnitten, dass eine optionale Aggregatspalte ohne Signaturbruch andockt — und
  die Sortierschlüssel liegen als Konstante, nicht als Literale in der Komponente.

## Context

Der erste sichtbare Teil des CRM: eine Route `/crm` mit einer Liste aller Kunden, Sortierung und
Pagination. Bewusst **read-only** — Anlegen kommt in Task 04. Damit ist der Task klein, allein
deploybar und liefert sofort die Struktur, in die alle Folgetasks hineinbauen.

Vorlage ist die Leads-Oberfläche: `apps/workspace/src/app/[locale]/(app)/leads/page.tsx` als
Orchestrierung, `components/workspace/leads/table/**` als Tabellenaufbau, URL-State statt
React-State. Der Empty-State ist hier kein Randfall, sondern der Normalzustand nach dem Deploy und
wird entsprechend sorgfältig gestaltet.

## Entscheidungen

| Bereich         | Entscheidung                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Route           | `/[locale]/(app)/crm` — Auth kommt automatisch vom `(app)`-Layout, zusätzlich `requireWorkspacePermission(Permission.CustomersRead)`            |
| Seitenparameter | `export const dynamic = "force-dynamic"`, `revalidate = 0`, Metadata mit `robots: noindex/nofollow/nocache` — Pflicht für alle privaten Seiten  |
| State           | Sortierung und Seite ausschließlich in der URL (Muster `lead-list-query-params.ts`)                                                             |
| Spalten         | Nummer, Name, Status, Ort, Primärkontakt, Letzte Änderung                                                                                       |
| Namensspalte    | Zeigt `display_name`; bei `customer_type = individual` zusätzlich ein dezenter Hinweis, bei `company` die abweichende Firmierung als Zweitzeile |
| Nummernspalte   | Anzeige über `formatCustomerNumber` (`K0001`), **sortiert wird auf der Zahl** — sonst stünde `K10000` vor `K2`                                  |
| Archivierte     | Standardansicht blendet `status = archived` aus; die Checkbox „Archivierte einblenden“ ergänzt sie zur aktuellen Liste                          |
| Bausteine       | Tabelle, Pagination, Sortier-Header und leerer Zustand kommen aus `components/workspace/shared/` (Task 02a) — nichts wird kopiert               |
| Seitengröße     | 25, identisch zu den Leads                                                                                                                      |
| Filter          | **Nicht** in diesem Task (Task 30)                                                                                                              |

## Architektur

```txt
(app)/crm/page.tsx
  ├─ requireWorkspacePermission(CustomersRead)
  ├─ getCrmDictionaries(locale)
  ├─ parseCustomerListSearchParams(searchParams)   Server, validiert + clamped
  ├─ listCustomers(filters)                        Query-Handler, direkt importiert
  └─ <CustomersPageShell> → <CustomersTable> → <CustomersTableRow>
                          → <CustomersPagination> / <CustomersEmptyState>
```

Kein Route Handler in diesem Task — es wird nur gelesen, und Lesen läuft über den direkt importierten
Query-Handler in der Server Component.

## Verzeichnisstruktur

```txt
apps/workspace/src/config/routes.ts                      + CRM: "/crm"
apps/workspace/src/components/workspace/workspace-sidebar/workspace-sidebar-items.ts   + Eintrag
apps/workspace/src/i18n/dictionaries/workspace/page/{de,en}.json                       + Label

apps/workspace/src/app/[locale]/(app)/crm/
  page.tsx
  page-constants.ts          CRM_BASE_PATH = SITE_ROUTES.CRM
  loading.tsx
  page.test.tsx
  AGENTS.md  CLAUDE.md

apps/workspace/src/server/workspace/crm/
  query-handler/list-customers.query-handler.ts
  shared/customer-list-search-params.ts
apps/workspace/src/common/constants/crm/list/customer-list-query-params.ts
apps/workspace/src/lib/workspace/crm/customer-list-query-string.ts

apps/workspace/src/components/workspace/crm/
  AGENTS.md
  shell/customers-page-shell/**      + .module.css
  shell/customers-page-header/**
  shell/customers-loading-skeleton/**
  table/customers-table/**
  table/customers-table-row/**
  table/customers-empty-state/**     nur der Text; Hülle kommt aus shared/table/list-empty-state

wiederverwendet, nicht neu gebaut (Task 02a):
  components/workspace/shared/table/{sortable-header,list-pagination,list-empty-state}
apps/workspace/src/i18n/dictionaries/workspace/crm/{meta,shell,table,pagination,shared}/{de,en}.json + index.ts
```

## Tickets

### CRM-03-T1 — Route, Sidebar, i18n-Gerüst

- **Files:** `config/routes.ts`, `workspace-sidebar-items.ts`, `dictionaries/workspace/page/{de,en}.json`,
  `dictionaries/workspace/crm/**`
- **Skills:** `best-practices`, `copywriting`
- **Inhalt:**
  - `SITE_ROUTES.CRM = "/crm"`; Sidebar-Eintrag mit `id`/`labelKey` `crm` und passendem Inline-SVG (Muster: bestehende
    Einträge, keine Icon-Library)
  - Dictionary-Namespaces `meta`, `shell`, `table`, `pagination`, `shared` je DE und EN, Loader-`index.ts`
    nach bestehendem Muster
  - Titel nach Projektkonvention: `CRM | Invessiv`
- **Akzeptanz:**
  - `WorkspaceSidebarItemKey` um `"crm"` erweitert, Typecheck grün
  - DE und EN haben identische Keys (Test oder Review-Nachweis)

### CRM-03-T2 — Query-Handler und URL-State

- **Files:** `query-handler/list-customers.query-handler.ts`,
  `shared/customer-list-search-params.ts`, `common/constants/crm/list/customer-list-query-params.ts`,
  `lib/workspace/crm/customer-list-query-string.ts` + Tests
- **Skills:** `best-practices`, `performance`
- **Inhalt:**
  - `listCustomers({ page, sort })` mit Drizzle: Join auf Primärkontakt, `count` für Pagination,
    Sortierung nach Nummer / Name / Status / Änderungsdatum
  - Statusfilter identisch in Liste und Count; kein `deleted_at`-Filter
  - Seiten-Clamping bei Überlauf (Muster: Leads-Page)
  - Query-Param-Namen als Const-Objekt
- **Akzeptanz:**
  - Tests: leere Datenbank ergibt `{ items: [], total: 0 }`; Seite 99 bei 3 Kunden wird auf die
    letzte gültige Seite geklemmt; Sortierung wirkt
  - Test: ein archivierter Kunde erscheint nur bei aktivierter Checkbox „Archivierte einblenden“
  - Test: Sortierung nach Nummer ordnet K2 vor K10 (numerisch, nicht alphabetisch)
  - Genau zwei Datenbankabfragen pro Seitenaufruf (Liste + Count)

### CRM-03-T3 — Tabelle, Empty-State, Skeleton

- **Files:** `components/workspace/crm/shell/**`, `components/workspace/crm/table/**`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Server-Table + Client-Row, aufgebaut auf den geteilten Bausteinen aus Task 02a (`shared/table/**`), co-located
    `*.module.css`, Zustände über `data-*`-Attribute, Farben über
    bestehende Theme-Tokens
  - Sortierbare Spaltenköpfe als Links (funktionieren ohne JavaScript)
  - Empty-State mit erklärendem Text und Verweis darauf, dass Kunden aus gewonnenen Leads entstehen
  - `loading.tsx` mit Skeleton in denselben Maßen wie die Tabelle (kein Layout-Sprung)
- **Akzeptanz:**
  - Tastaturbedienung vollständig, sichtbarer Fokus, genau eine H1
  - Dark und Light korrekt, keine hartkodierten Farben
  - Mobil ab 360 px ohne horizontales Scrollen der Seite (Tabelle in eigenem `overflow-x`-Container)

### CRM-03-T4 — Scope-Regeldateien

- **Files:** `(app)/crm/AGENTS.md` + `CLAUDE.md`, `components/workspace/crm/AGENTS.md`,
  Root-`AGENTS.md` (Index-Tabelle)
- **Skills:** `best-practices`
- **Inhalt:** Regeln analog zu den Leads-Pendants: URL-State statt React-State, Fetch statt Server
  Actions, CSS-Module, keine Inline-Texte, Permission-Pflicht pro Sektion
- **Akzeptanz:** Beide Scopes stehen in der Index-Tabelle der Root-`AGENTS.md`; Dateien auf Deutsch

## Deploy-Sicherheit

1. **Live sichtbar:** neuer Sidebar-Punkt „CRM" mit funktionierender, leerer Kundenliste. Kein toter
   Link — die Route existiert und rendert einen bewusst gestalteten Empty-State.
2. **Bricht nichts:** rein additiv. Keine Migration, keine Änderung an Leads-Code. Der Sidebar-Typ
   wird erweitert, nicht umgebaut.
3. **Offen:** Anlegen, Detail, Filter. Es gibt in dieser Oberfläche noch **keinen** Button dafür —
   der „Kunde anlegen"-Button erscheint erst in Task 04 zusammen mit seinem Dialog.

## End-to-End-Akzeptanz

1. `/de/crm` und `/en/crm` sind für allowlisted Nutzer erreichbar, für andere `404`.
2. Ohne Kunden erscheint der Empty-State, kein Fehler, keine leere Seite.
3. Sortierung und Seitenwechsel verändern die URL und sind teilbar und neu ladbar.
4. Seitenquelltext enthält `noindex`.
5. Alle Texte liegen in DE und EN im Dictionary, keiner im Code.
6. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
