# Task 02e-1 — Regeldateien und Button im Workspace

> **Teil von:** [Task 02e](./02e-geteilte-ui-bausteine.md) · **Merge-Einheit:** Ordner 03d · **Branch:**
> `chore/crm-geteilte-ui-bausteine`
> **Tickets:** CRM-03d-T0, CRM-03d-T1 · **Abhängigkeiten:** Ordner 03b und 03c gemerged
> **Changeset:** ~31 Dateien (Ziel ≤ 30, Stopp > 35, hart 50) · **Aufwand:** M

## Ziel

Die Regeln für `packages/ui` und `components/workspace/shared/` stehen vor dem ersten Codeschritt. Der Button liegt
danach in `packages/ui`; der Workspace nutzt ihn, die Web-Kopie bleibt bis Task 02e-2 bestehen.

## CRM-03d-T0 — Status und Regeldateien

- Status `läuft` in Ordner-README und Tabelle `00-entscheidungen.md`.
- `components/workspace/shared/AGENTS.md` (+ `CLAUDE.md` mit `@AGENTS.md`): keine Dictionary-Importe, keine
  Domänenannahmen, Texte als Props, jeder Baustein aus mindestens zwei Bereichen nutzbar, Link-Bindung ist hier erlaubt.
- `packages/AGENTS.md`, Abschnitt `packages/ui`: kein `next/*`, `linkComponent`-Muster, Test-Setup-Pflicht für Dialoge.
- Root-`AGENTS.md`: Index um `apps/workspace/src/components/workspace/shared/` ergänzen.
- **Akzeptanz:** Die Regeln sind vor dem ersten Codeschritt dokumentiert; Index vollständig.

## CRM-03d-T1 — Button nach `packages/ui`, Workspace umstellen

- `ButtonControl`, `ButtonLink`, `PrimaryCtaButton`, `PrimaryCtaLink` nach `packages/ui/src/components/button/`.
- `ButtonLink` ersetzt `useNextLink` durch `linkComponent` (Komponente mit Anchor-Props und `href`); ohne Prop rendert
  es `<a>`.
- CSS nutzt `var(--font-family-base)` sowie neue Tokens `--button-disabled-opacity` und `--button-disabled-filter`.
  `apps/workspace/src/app/globals.css` definiert `--font-family-base` mit dem heutigen Literal und die Disabled-Tokens
  neutral (`1`/`none`).
- 20 Workspace-Nutzer umstellen, Workspace-Kopie löschen. Die Web-Kopie bleibt bis Task 02e-2 bestehen.
- **Akzeptanz:** zusammengeführter Button-Test in `packages/ui` grün; Workspace-Buttons visuell unverändert inklusive
  Disabled-Zustand.

## Changeset

| Bereich                                            | Dateien                                                                                                                                                                                                                                                                                                                                                                                       | Anzahl |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -----: |
| Doku (T0)                                          | `03d-geteilte-ui-bausteine/README.md`, `00-entscheidungen.md`, `components/workspace/shared/AGENTS.md` (neu), `components/workspace/shared/CLAUDE.md` (neu), `packages/AGENTS.md`, Root-`AGENTS.md`                                                                                                                                                                                           |      6 |
| `packages/ui`                                      | `components/button/{button.tsx,button.module.css,button.test.tsx}` (verschoben aus der Workspace-Kopie), `src/index.ts`                                                                                                                                                                                                                                                                       |      4 |
| Workspace-Tokens                                   | `apps/workspace/src/app/globals.css`                                                                                                                                                                                                                                                                                                                                                          |      1 |
| Nutzer Leads (`components/workspace/leads/`)       | `delete/lead-delete-confirm-dialog`, `form/lead-form-dialog`, `form/lead-form-dialog/social-profiles-section`, `import/import-leads-dialog`, `shared/improvements-list-editor`, `shell/leads-page-header`, `table/bulk/leads-bulk-action-bar`, `table/bulk/leads-bulk-archive-confirm-dialog`, `table/bulk/leads-bulk-delete-confirm-dialog`, `table/bulk/leads-bulk-edit-dialog` (je `.tsx`) |     10 |
| Nutzer Settings (`components/workspace/settings/`) | `members/{add-member-dialog,member-roles-dialog,member-row,member-status-dialog,members-list,owner-change-dialog}`, `roles/{role-form-dialog,role-row,roles-list}` (je `.tsx`)                                                                                                                                                                                                                |      9 |
| Nutzer Shared                                      | `components/workspace/shared/dialog/workspace-dialog/workspace-dialog.tsx`                                                                                                                                                                                                                                                                                                                    |      1 |
|                                                    |                                                                                                                                                                                                                                                                                                                                                                                               | **31** |

## Abschluss

- `pnpm -r lint`, `pnpm -r typecheck`, Tests `packages/ui` und `apps/workspace` grün.
- Screenshots Workspace-Buttons (Leads-Header, Settings-Listen, ein Dialog-Footer; Mobil/Desktop, Dark/Light), inklusive
  Disabled-Zustand.
- Changeset gemessen und in der Übergabe genannt.
