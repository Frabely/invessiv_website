# Task 02e-7 — `EmptyState` und `ListEmptyState`

> **Teil von:** [Task 02e](./02e-geteilte-ui-bausteine.md) · **Merge-Einheit:** Ordner 03d · **Branch:**
> `chore/crm-geteilte-ui-bausteine`
> **Tickets:** CRM-03d-T14 · **Abhängigkeiten:** Task 02e-6
> **Changeset:** ~17 Dateien (Ziel ≤ 30, Stopp > 35, hart 50) · **Aufwand:** S

## Ziel

**Umsetzungsstand:** Erledigt: `EmptyState`, `ListEmptyState` und die Settings-Nutzer sind umgestellt; Tests
und die geplante generische Workspace-Konstante fehlen noch.

Ein Empty-State in `packages/ui`, ein link-gebundener Listen-Empty-State in `components/workspace/shared/table/`.
Leads und Settings nutzen beide statt eigenem Markup. Erster Baustein unter `components/workspace/shared/table/` — die
Regeln dafür stehen seit Task 02e-1.

## CRM-03d-T14 — `EmptyState` und `ListEmptyState`

- `EmptyState` in `packages/ui` (Icon, Titel, Beschreibung, Aktions-Slot, `variant` über `data-*`).
- `components/workspace/shared/table/list-empty-state` bindet die Link-Aktion an `next/link` und ersetzt
  `leads-empty-state`; das Const-Objekt `LeadsEmptyStateVariant` wird zu einer generischen Variante (Umbenennung samt
  Test). Ablage: Nutzung nur im Workspace → `apps/workspace/src/common/constants/ui/`.
- `roles-list` und `add-member-dialog` nutzen `EmptyState` statt Inline-Markup.
- **Akzeptanz:** Leads „nichts angelegt"/„keine Treffer" und beide Settings-Empty-States visuell unverändert; ohne
  `actionHref` wird keine Aktion gerendert (kein toter Button).

## Changeset

| Bereich              | Dateien                                                                                                                                                                                                                                                                            |    Anzahl |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------: |
| `packages/ui`        | `components/empty-state/{empty-state.tsx,empty-state.module.css,empty-state.test.tsx}`, `src/index.ts`                                                                                                                                                                             |         4 |
| Workspace-Shared     | `components/workspace/shared/table/list-empty-state/{list-empty-state.tsx,list-empty-state.module.css}` (verschoben aus `leads/table/leads-empty-state`)                                                                                                                           |         2 |
| Konstante            | `apps/workspace/src/common/constants/ui/list-empty-state-variants.ts` (verschoben aus `packages/common/src/constants/leads/list/lead-empty-state-variants.ts`), `packages/common/src/constants/leads/list/index.ts`, `apps/workspace/src/common/constants/ui/ui-constants.test.ts` |         3 |
| Konstantentest Leads | `packages/common/src/constants/leads/tests/leads-constants.test.ts` (nur falls dort die Variante geprüft wird)                                                                                                                                                                     |       0–1 |
| Nutzer Leads         | `apps/workspace/src/app/[locale]/(app)/leads/page.tsx`, `leads/table/leads-table/{leads-table.tsx,leads-table.test.tsx}`                                                                                                                                                           |         3 |
| Nutzer Settings      | `roles/roles-list/{roles-list.tsx,roles-list.module.css}`, `members/add-member-dialog/{add-member-dialog.tsx,add-member-dialog.module.css}`                                                                                                                                        |         4 |
|                      |                                                                                                                                                                                                                                                                                    | **16–17** |

## Abschluss

- `pnpm -r lint`, `pnpm -r typecheck`, Tests `packages/common`, `packages/ui` und `apps/workspace` grün.
- Screenshots Leads-Liste leer und ohne Treffer, Rollenliste leer, Mitglied-hinzufügen ohne Kandidaten (Mobil/Desktop,
  Dark/Light).
- Changeset gemessen und in der Übergabe genannt.
