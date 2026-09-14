# Task 02e-6 — `ConfirmDialog` und alle Lead-Dialoge

> **Teil von:** [Task 02e](./02e-geteilte-ui-bausteine.md) · **Merge-Einheit:** Ordner 03d · **Branch:**
> `chore/crm-geteilte-ui-bausteine`
> **Tickets:** CRM-03d-T8 bis CRM-03d-T13 · **Abhängigkeiten:** Task 02e-5
> **Changeset:** ~23 Dateien (Ziel ≤ 30, Stopp > 35, hart 50) · **Aufwand:** M

## Ziel

**Umsetzungsstand:** Teilweise erledigt: `ConfirmDialog`, Single-Delete, Bulk-Archiv und Bulk-Löschen sind umgestellt.
Die übrigen vier
Lead-Dialoge nutzen noch Fokusfalle und/oder `createPortal`.

Alle sieben Lead-Dialoge nutzen `Dialog` beziehungsweise `ConfirmDialog`. Danach gibt es keine eigene Overlay-, Portal-
oder Fokuslogik mehr; `dialog-focus-trap.ts` ist gelöscht.

Die Tickets bleiben im Review einzeln lesbar: Jedes Ticket fasst genau einen Dialogordner an. Empfohlen ist ein Commit
je Ticket innerhalb des Tasks.

## CRM-03d-T8 — `ConfirmDialog` und Lead-Löschdialog

- `ConfirmDialog` auf Basis von `Dialog` inklusive `secondaryAction`-Slot.
- `lead-delete-confirm-dialog` nutzt ihn; eigene Overlay-, Portal- und Fokuslogik entfällt, lead-spezifische Texte und
  Mutationen bleiben.
- **Akzeptanz:** Archivieren, Löschen, Fehler- und Busy-Zustand wie bisher; neue ConfirmDialog-Tests.

## CRM-03d-T9 — Bulk-Archiv- und Bulk-Löschbestätigung

- Beide Dialoge auf `ConfirmDialog` umstellen; die doppelten CSS-Module schrumpfen auf den fachlichen Rest.
- **Akzeptanz:** Bulk-Action-Bar-Tests Import-only grün; Optik unverändert.

## CRM-03d-T10 — Bulk-Edit-Dialog

- `leads-bulk-edit-dialog` auf `Dialog` umstellen.
- **Akzeptanz:** `leads-bulk-edit-dialog.test.tsx` Import-only grün.

## CRM-03d-T11 — Outreach-Dialog

- `lead-outreach-dialog` auf `Dialog` umstellen; eigener `portalRoot` entfällt.
- **Akzeptanz:** `lead-outreach-dialog.test.tsx` grün (Fokus im Kontextfeld bleibt über `initialFocusRef`).

## CRM-03d-T12 — Import-Dialog

- `import-leads-dialog` auf `Dialog` umstellen (Hintergrundklick bleibt aktiv); `import/dialog-footer` bleibt fachlich.
- **Akzeptanz:** `import-leads-dialog.test.tsx` grün, Escape als `cancel` (benannte Ausnahme).

## CRM-03d-T13 — Lead-Formular-Dialog und Abbau der Fokusfalle

- `lead-form-dialog` auf `Dialog` umstellen (`closeOnBackdropClick={false}`, Fokus auf das erste verfügbare Feld über
  `initialFocusRef`).
- `dialog-focus-trap.ts` löschen; Suche belegt: kein `createPortal` und kein `aria-modal`-Eigenbau mehr in Dialogen.
  Die mobile Sidebar ist kein Dialog-Baustein und bleibt unberührt.
- **Akzeptanz:** `lead-form-dialog.test.tsx` grün mit den benannten Ausnahmen; Tastatur-Smoke im Browser (Öffnen,
  Tab-Reihenfolge, Escape, Fokus-Rückgabe auf den Auslöser) in Chromium, Firefox und WebKit.

## Changeset

| Ticket | Dateien                                                                                                                                               | Anzahl |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -----: |
| T8     | `packages/ui/src/components/dialog/confirm-dialog/{confirm-dialog.tsx,confirm-dialog.module.css,confirm-dialog.test.tsx}`, `packages/ui/src/index.ts` |      4 |
| T8     | `leads/delete/lead-delete-confirm-dialog/{lead-delete-confirm-dialog.tsx,lead-delete-confirm-dialog.module.css}`                                      |      2 |
| T9     | `leads/table/bulk/leads-bulk-archive-confirm-dialog/{….tsx,….module.css}`, `leads/table/bulk/leads-bulk-delete-confirm-dialog/{….tsx,….module.css}`   |      4 |
| T10    | `leads/table/bulk/leads-bulk-edit-dialog/{leads-bulk-edit-dialog.tsx,leads-bulk-edit-dialog.module.css}`                                              |      2 |
| T11    | `leads/outreach/lead-outreach-dialog/{lead-outreach-dialog.tsx,lead-outreach-dialog.module.css,lead-outreach-dialog.test.tsx}`                        |      3 |
| T12    | `leads/import/import-leads-dialog/{import-leads-dialog.tsx,import-leads-dialog.module.css,import-leads-dialog.test.tsx}`                              |      3 |
| T13    | `leads/form/lead-form-dialog/{lead-form-dialog.tsx,lead-form-dialog.module.css,lead-form-dialog.test.tsx}`                                            |      3 |
| T13    | `components/workspace/shared/dialog/dialog-focus-trap.ts` (gelöscht)                                                                                  |      1 |
|        |                                                                                                                                                       | **22** |

Der Outreach-Test ändert sich nur, falls der Fokus-Test das Overlay-Element direkt adressiert; sonst 21. Puffer bis ~23.

## Abschluss

- `pnpm -r lint`, `pnpm -r typecheck`, Tests `packages/ui` und `apps/workspace` grün.
- Suchen belegen: kein Import von `dialog-focus-trap`, kein `createPortal` in Workspace-Dialogen.
- Screenshots aller sieben Lead-Dialoge (Mobil/Desktop, Dark/Light).
- Changeset gemessen und in der Übergabe genannt.
