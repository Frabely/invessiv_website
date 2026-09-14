# Task 02e-4 — `FormStatus` und `FormActions`

> **Teil von:** [Task 02e](./02e-geteilte-ui-bausteine.md) · **Merge-Einheit:** Ordner 03d · **Branch:**
> `chore/crm-geteilte-ui-bausteine`
> **Tickets:** CRM-03d-T5 · **Abhängigkeiten:** Task 02e-3
> **Changeset:** ~10 Dateien (Ziel ≤ 30, Stopp > 35, hart 50) · **Aufwand:** S

## Ziel

Die Workspace-Varianten der letzten Formularbausteine liegen in `packages/ui`. Danach enthält
`apps/workspace/src/components/shared/form/` keine produktiven Bausteine mehr. Die Web-Kopien und alle Web-Nutzer
bleiben bis Ordner 23 vollständig unangetastet.

Der Task bleibt bewusst klein: Er berührt dieselben Lead-Dialoge, die Task 02e-6 später auf `Dialog` umstellt, und hält
deren Diff rein auf Importe beschränkt.

## CRM-03d-T5 — `FormStatus` und `FormActions`

- Beide Workspace-Bausteine nach `packages/ui` verschieben, Workspace-Nutzer umstellen und Workspace-Kopien löschen.
- **Akzeptanz:** Status-Live-Region und Aktionsleiste bleiben im Workspace unverändert.

## Changeset

| Bereich          | Dateien                                                                                                                                                                                      | Anzahl |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -----: |
| `packages/ui`    | `components/form/form-status/{form-status.tsx,form-status.module.css}`, `components/form/form-actions/{form-actions.tsx,form-actions.module.css}` (aus Workspace verschoben), `src/index.ts` |      5 |
| Nutzer Workspace | `leads/delete/lead-delete-confirm-dialog`, `leads/form/lead-form-dialog`, `leads/table/bulk/{leads-bulk-archive-confirm-dialog,leads-bulk-delete-confirm-dialog,leads-bulk-edit-dialog}`     |      5 |
|                  |                                                                                                                                                                                              | **10** |

## Abschluss

- `pnpm -r lint`, `pnpm -r typecheck`, Tests `packages/ui` und `apps/workspace` grün.
- Workspace-Smoke für Fehler-, Lade- und Erfolgszustände der betroffenen Dialoge.
- Changeset gemessen und in der Übergabe genannt.
