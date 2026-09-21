# Task 02e-10 — Suchfeld, Facettenfilter, Timeline und Abschluss

> **Teil von:** [Task 02e](./02e-geteilte-ui-bausteine.md) · **Merge-Einheit:** Ordner 03d · **Branch:**
> `chore/crm-geteilte-ui-bausteine`
> **Tickets:** CRM-03d-T21 bis CRM-03d-T24 (ersetzt Teile von Task 02a) · **Abhängigkeiten:** Task 02e-9
> **Changeset:** ~18 Dateien (Ziel ≤ 30, Stopp > 35, hart 50) · **Aufwand:** M

## Ziel

**Umsetzungsstand:** Erledigt im Workspace. `ListSearchField`, `FacetFilter` und `ActivityTimeline` liegen im Shared-
Scope; Abschlussprüfungen und Nachweis sind durchgeführt.

Suchfeld, Facettenfilter (mit opt-in Mehrfachauswahl) und Activity-Timeline liegen unter
`components/workspace/shared/`. Danach wird der gesamte Ordner nachgewiesen und an das Review übergeben.

## CRM-03d-T21 — `ListSearchField`

- `lead-search-field` → `shared/toolbar/list-search-field`; Verzögerung und Beschriftungen als Props.
- **Akzeptanz:** Suche in der Lead-Liste verhält sich identisch (Verzögerung, Löschen, URL-State).

## CRM-03d-T22 — `FacetFilter` mit Mehrfachauswahl

- `lead-facet-filter` → `shared/toolbar/facet-filter`; `activeValues: readonly string[]`,
  `selectionMode: "single" | "multiple"` als Const-Objekt in `apps/workspace/src/common/constants/`.
- Leads nutzt `single` und übergibt null oder einen Wert.
- **Akzeptanz:** Lead-Filter unverändert; neuer Komponententest für `multiple` (zwei wählen, einen entfernen, alle
  leeren, `aria-pressed`, Live-Region).

## CRM-03d-T23 — `ActivityTimeline`

- `lead-detail-activities` → `shared/activity/activity-timeline`; Einträge, Typ-Symbole, Beschriftungen und
  Datumsformatierung als Props; Metadaten über übergebene Type-Wächter.
- `lead-detail-panel` übergibt seine bisherigen Texte und Symbole.
- **Akzeptanz:** `lead-detail-activities.test.tsx` Import-only grün; unbekannter Aktivitätstyp ergibt eine
  verständliche Zeile.

## CRM-03d-T24 — Nachweis und Übergabe

- `components/workspace/leads/AGENTS.md`: Subfolder-Tabelle und Regel 15 („Reuse") auf die geteilten Orte verweisen.
- Suchen belegen: kein Import aus gelöschten Pfaden, kein `next/*` in `packages/ui`, kein `createPortal` in Dialogen.
- Visueller Gesamtcheck Mobil/Dark/Light: Leads (Liste, Panel, alle sieben Dialoge) und Settings (Listen, alle Dialoge).
- A11y-Smoke: Tastatur, Fokus-Reihenfolge und Kontrast für Dialoge und Panel.
- Status `im Review` in README und Tabelle; PR mit Testplan, Screenshots, benannten Testausnahmen, Dateizahl je Task
  und gesamt sowie Rollback.
- **Akzeptanz:** `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` und
  `pnpm --filter @invessiv/workspace build` grün.

## Changeset

| Ticket | Dateien                                                                                                                                                                                  | Anzahl |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -----: |
| T21    | `shared/toolbar/list-search-field/{list-search-field.tsx,list-search-field.module.css}` (verschoben), `leads/shell/leads-page-header/leads-page-header.tsx`                              |      3 |
| T22    | `shared/toolbar/facet-filter/{facet-filter.tsx,facet-filter.module.css}` (verschoben), `shared/toolbar/facet-filter/facet-filter.test.tsx` (neu)                                         |      3 |
| T22    | `leads/toolbar/{lead-category-filter,lead-source-filter,lead-status-filter}` (je `.tsx`)                                                                                                 |      3 |
| T22    | `apps/workspace/src/common/constants/ui/facet-selection-modes.ts` (neu), `apps/workspace/src/common/constants/ui/ui-constants.test.ts`                                                   |      2 |
| T23    | `shared/activity/activity-timeline/{activity-timeline.tsx,activity-timeline.module.css,activity-timeline.test.tsx}` (verschoben), `leads/detail/lead-detail-panel/lead-detail-panel.tsx` |      4 |
| T24    | `components/workspace/leads/AGENTS.md`, `03d-geteilte-ui-bausteine/README.md`, `00-entscheidungen.md`                                                                                    |      3 |
|        |                                                                                                                                                                                          | **18** |

## Abschluss

- Alle Qualitäts-Gates aus T24 grün.
- Changeset dieses Tasks und PR-Gesamtstand gemessen; beide Zahlen im PR.
