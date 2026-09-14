# Task 02e-9 — Tabellenbausteine nach `components/workspace/shared/table/`

> **Teil von:** [Task 02e](./02e-geteilte-ui-bausteine.md) · **Merge-Einheit:** Ordner 03d · **Branch:**
> `chore/crm-geteilte-ui-bausteine`
> **Tickets:** CRM-03d-T18 bis CRM-03d-T20 (ersetzt Teile von Task 02a) · **Abhängigkeiten:** Task 02e-8 und
> Checkpoint aus Task 02e-8
> **Changeset:** ~17–20 Dateien (Ziel ≤ 30, Stopp > 35, hart 50) · **Aufwand:** S

## Ziel

Sortier-Header, Pagination und Selection liegen unter `components/workspace/shared/table/` und sind ohne Lead-Bezug
nutzbar. Die Lead-Liste verhält sich identisch.

## CRM-03d-T18 — `SortableHeader`

- `leads/table/sortable-header` → `shared/table/sortable-header`; Beschriftungen als Props.
- **Akzeptanz:** Sortierung in `leads-table.test.tsx` Import-only grün.

## CRM-03d-T19 — `ListPagination`

- `leads-pagination` (+ `utils`, Test) → `shared/table/list-pagination`.
- Im Ticket prüfen: Nutzt die Komponente lead-benannte Konstanten (`LeadPaginationItemKind` aus
  `packages/common/src/constants/leads/list/`)? Falls ja, generisch umbenennen und nach
  `apps/workspace/src/common/constants/ui/` verschieben (+2–3 Dateien, im Changeset berücksichtigt).
- **Akzeptanz:** Pagination-Test Import-only grün.

## CRM-03d-T20 — `ListSelectionProvider` und `ListSelectAllCheckbox`

- Provider samt Context und Select-All-Checkbox → `shared/table/`.
- **Akzeptanz:** Selection-Provider-Test Import-only grün; Selection leert sich weiter bei Filter-, Sortier- und
  Seitenwechsel.

## Changeset

| Ticket | Dateien                                                                                                                                                                                                            |    Anzahl |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------: |
| T18    | `shared/table/sortable-header/{sortable-header.tsx,sortable-header.module.css}` (verschoben)                                                                                                                       |         2 |
| T18/20 | `leads/table/leads-table/leads-table.tsx`                                                                                                                                                                          |         1 |
| T19    | `shared/table/list-pagination/{list-pagination.tsx,list-pagination.module.css,list-pagination.test.tsx,list-pagination.utils.ts}` (verschoben)                                                                     |         4 |
| T19    | `apps/workspace/src/app/[locale]/(app)/leads/{page.tsx,page.test.tsx}`                                                                                                                                             |         2 |
| T19    | Pagination-Konstante generisch (nur falls lead-benannt): Konstantendatei, Barrel, Test                                                                                                                             |       0–3 |
| T20    | `shared/table/list-selection-provider/{list-selection-provider.tsx,list-selection-context.ts,list-selection-provider.test.tsx}`, `shared/table/list-select-all-checkbox/list-select-all-checkbox.tsx` (verschoben) |         4 |
| T20    | `leads/table/bulk/leads-bulk-action-bar/{leads-bulk-action-bar.tsx,leads-bulk-action-bar.test.tsx}`, `leads/table/leads-table-row/{leads-table-row.tsx,leads-table-row.test.tsx}`                                  |         4 |
|        |                                                                                                                                                                                                                    | **17–20** |

## Abschluss

- `pnpm -r lint`, `pnpm -r typecheck`, Tests `apps/workspace` (und `packages/common`, falls Konstante verschoben) grün.
- Browser-Smoke Lead-Liste: sortieren, blättern, mehrere auswählen, Filter wechseln → Auswahl leer.
- Changeset gemessen und in der Übergabe genannt.
