# Task 02e-5 — Natives `Dialog`, Settings-Dialoge und Portal-Root

> **Teil von:** [Task 02e](./02e-geteilte-ui-bausteine.md) · **Merge-Einheit:** Ordner 03d · **Branch:**
> `chore/crm-geteilte-ui-bausteine`
> **Tickets:** CRM-03d-T6, CRM-03d-T7 · **Abhängigkeiten:** Task 02e-4
> **Changeset:** ~20 Dateien (Ziel ≤ 30, Stopp > 35, hart 50) · **Aufwand:** M

## Ziel

**Umsetzungsstand:** Teilweise erledigt: `Dialog` und die Settings-Nutzer sind umgestellt; zentraler jsdom-Setup und die
vorgesehenen Dialog-Tests fehlen noch.

Die Dialog-Hülle auf Basis des nativen `<dialog>` liegt in `packages/ui` samt Test-Setup; alle Settings-Dialoge nutzen
sie, und `CustomSelect` ist innerhalb eines Dialogs bedienbar. Die Lead-Dialoge behalten bis Task 02e-6 ihre
Fokusfalle — `dialog-focus-trap.ts` bleibt deshalb in diesem Task bestehen.

Verhaltensregeln, Ziel-API und
Test-Setup: [Task 02e, „Dialog-Umstellung im Detail"](./02e-geteilte-ui-bausteine.md#dialog-umstellung-im-detail).

## CRM-03d-T6 — `Dialog` nach `packages/ui`, Settings umstellen

- `Dialog` mit nativem `<dialog>` gemäß „Dialog-Umstellung im Detail"; `DialogSize` nach `packages/common`.
- `packages/ui/vitest.config.ts`, `dialog-test-setup.ts` und `setupFiles` in der Workspace-Testconfig.
- Alle Nutzer von `WorkspaceDialog` umstellen (Stand Repository: Mitglied hinzufügen, Rollen zuweisen,
  Mitgliedsstatus/Übergabe, Owner-Wechsel, Rollen-Dialog). `workspace-dialog/**` löschen.
- `components/workspace/settings/AGENTS.md`: Regel „Dialog-Hülle aus `components/workspace/shared/dialog/`" auf
  `@invessiv/ui` ändern.
- `workspace-dialog.test.tsx` wird zu `dialog.test.tsx`; der Tab-Wrap-Test entfällt zugunsten „modal geöffnet und Escape
  per `cancel`" (benannte Ausnahme).
- **Akzeptanz:** Dialog-Tests für Escape, `busy`-Sperre, Hintergrundklick, initialen Fokus, Fokus-Rückgabe (Schließen
  und Unmount); Settings-Dialogtests Import-only grün; Settings-Dialoge visuell unverändert; manueller Check in
  Chromium, Firefox und WebKit.

## CRM-03d-T7 — Portal-Root für `CustomSelect`

- `Dialog` stellt sein Element über `DialogPortalRootContext` bereit; `CustomSelect` übergibt es an `FloatingPortal`
  (`root`). Außerhalb eines Dialogs bleibt `document.body`.
- **Akzeptanz:** jsdom-Test: `CustomSelect` im `Dialog` rendert die Liste innerhalb des `<dialog>`; manueller
  Browser-Check mit temporärem Test-Harness (nicht committet), dass die Liste im Top-Layer klickbar ist. Bestehende
  `CustomSelect`-Nutzer außerhalb von Dialogen unverändert.

## Changeset

| Bereich                   | Dateien                                                                                                                                                                                               | Anzahl |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -----: |
| `packages/common`         | `constants/ui/dialog-sizes.ts` (verschoben aus `apps/workspace/src/common/constants/ui/workspace-dialog-sizes.ts`), `constants/ui/dialog-sizes.test.ts` (neu)                                         |      2 |
| Workspace-Konstantentest  | `apps/workspace/src/common/constants/ui/ui-constants.test.ts` (Dialoggrößen-Block entfernt)                                                                                                           |      1 |
| `packages/ui` Dialog (T6) | `components/dialog/dialog/{dialog.tsx,dialog.module.css,dialog.test.tsx}` (verschoben aus `workspace-dialog`), `src/testing/dialog-test-setup.ts`, `vitest.config.ts`, `package.json`, `src/index.ts` |      7 |
| `packages/ui` Portal (T7) | `components/dialog/dialog-portal-root-context.ts`, `components/custom-select/{custom-select.tsx,custom-select.test.tsx}`                                                                              |      3 |
| App-Test-Config           | `apps/workspace/vitest.config.ts`                                                                                                                                                                     |      1 |
| Nutzer Settings           | `members/{add-member-dialog,member-roles-dialog,member-status-dialog,owner-change-dialog}`, `roles/role-form-dialog` (je `.tsx`)                                                                      |      5 |
| Settings-Regeln           | `components/workspace/settings/AGENTS.md`                                                                                                                                                             |      1 |
|                           |                                                                                                                                                                                                       | **20** |

`packages/ui/package.json` nur, falls für jsdom-Tests Dev-Dependencies oder ein Test-Export fehlen; sonst 19. Puffer bis
~20 für einen zusätzlich nötigen Dialog-CSS-Nachzug in einem Settings-Modul.

## Abschluss

- `pnpm -r lint`, `pnpm -r typecheck`, Tests `packages/common`, `packages/ui` und `apps/workspace` grün.
- Screenshots aller fünf Settings-Dialoge (Mobil/Desktop, Dark/Light); Tastatur-Smoke (Öffnen, Escape,
  Fokus-Rückgabe).
- Changeset gemessen und in der Übergabe genannt.
