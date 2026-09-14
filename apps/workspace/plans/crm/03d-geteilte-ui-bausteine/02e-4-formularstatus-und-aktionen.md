# Task 02e-4 — `FormStatus` und `FormActions`

> **Teil von:** [Task 02e](./02e-geteilte-ui-bausteine.md) · **Merge-Einheit:** Ordner 03d · **Branch:**
> `chore/crm-geteilte-ui-bausteine`
> **Tickets:** CRM-03d-T5 · **Abhängigkeiten:** Task 02e-3
> **Changeset:** ~15 Dateien (Ziel ≤ 30, Stopp > 35, hart 50) · **Aufwand:** S

## Ziel

Die letzten Formularbausteine liegen in `packages/ui`. Danach enthält `apps/workspace/src/components/shared/form/`
nichts
mehr und `apps/web/src/components/shared/form/` nur noch das fachliche `contact-consent-field`.

Der Task bleibt bewusst klein: Er berührt dieselben Lead-Dialoge, die Task 02e-6 später auf `Dialog` umstellt, und hält
deren Diff so rein auf Importe beschränkt.

Auch die Web-Darstellung von `FormStatus` und `FormActions` bleibt hier unverändert. Die gemeinsame visuelle
Weiterentwicklung aller in Tasks 02e-2 bis 02e-4 verschobenen Web-Bausteine folgt ausschließlich nach dem gesamten
CRM-Umbau in [Ordner 23, Task 39](../23-web-ui-abschluss/39-web-ui-anpassung.md).

## CRM-03d-T5 — `FormStatus` und `FormActions`

- Beide Dateien sind in den Apps identisch; Umzug nach `packages/ui`, Nutzer umstellen, Kopien löschen.
- **Akzeptanz:** Status-Live-Region und Aktionsleiste unverändert; Conversion-Smoke Kontaktformular (Fehler-, Lade- und
  Erfolgszustand).

## Changeset

| Bereich             | Dateien                                                                                                                                                                                                | Anzahl |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -----: |
| `packages/ui`       | `components/form/form-status/{form-status.tsx,form-status.module.css}`, `components/form/form-actions/{form-actions.tsx,form-actions.module.css}` (verschoben aus der Workspace-Kopie), `src/index.ts` |      5 |
| Web-Kopien gelöscht | `apps/web/src/components/shared/form/form-status/{form-status.tsx,form-status.module.css}`, `apps/web/src/components/shared/form/form-actions/{form-actions.tsx,form-actions.module.css}`              |      4 |
| Nutzer Web          | `marketing/home/sections/contact-section/contact-form/contact-form.tsx`                                                                                                                                |      1 |
| Nutzer Workspace    | `leads/delete/lead-delete-confirm-dialog`, `leads/form/lead-form-dialog`, `leads/table/bulk/{leads-bulk-archive-confirm-dialog,leads-bulk-delete-confirm-dialog,leads-bulk-edit-dialog}`               |      5 |
|                     |                                                                                                                                                                                                        | **15** |

## Abschluss

- `pnpm -r lint`, `pnpm -r typecheck`, Tests `packages/ui`, `apps/web` und `apps/workspace` grün;
  `pnpm --filter @invessiv/web build` grün (Conversion-Flow betroffen).
- Conversion-Smoke Kontaktformular: Pflichtfeld-Fehler, Ladezustand, Erfolg, Submit-Fehler.
- Changeset gemessen und in der Übergabe genannt.
