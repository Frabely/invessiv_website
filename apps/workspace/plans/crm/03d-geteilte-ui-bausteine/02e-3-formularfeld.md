# Task 02e-3 — Pflichtmarker, Label und Formularfeld

> **Teil von:** [Task 02e](./02e-geteilte-ui-bausteine.md) · **Merge-Einheit:** Ordner 03d · **Branch:**
> `chore/crm-geteilte-ui-bausteine`
> **Tickets:** CRM-03d-T3, CRM-03d-T4 · **Abhängigkeiten:** Task 02e-2
> **Changeset:** ~23 Dateien (Ziel ≤ 30, Stopp > 35, hart 50) · **Aufwand:** S

## Ziel

`FormRequiredMarker`, `FormFieldLabel` und `FormField` liegen in `packages/ui`; beide Apps nutzen sie. Die drei
Bausteine hängen direkt voneinander ab und werden deshalb gemeinsam reviewt.

Die Web-Oberfläche bleibt in diesem Refactoring visuell unverändert. Ihre bewusste gestalterische Anpassung für alle
Nutzer dieser drei Bausteine erfolgt erst nach dem vollständigen CRM-Umbau in
[Ordner 23, Task 39](../23-web-ui-abschluss/39-web-ui-anpassung.md) als eigener Web-PR.

## CRM-03d-T3 — `FormRequiredMarker` und `FormFieldLabel`

- Beide Bausteine nach `packages/ui/src/components/form/`.
- Der Marker erhält `decorative?: boolean` (`true` → `aria-hidden`). Das Web übergibt `decorative` über das Label; der
  Workspace behält den Standard, damit Accessible Names wie „Anzeigename \*" in Bestandstests gleich bleiben.
- Die fachliche Angleichung (Marker immer dekorativ, Pflicht über `required`/`aria-required`) als Follow-up in
  `plans/Todo.md` eintragen.
- Nutzer beider Apps umstellen (Web: `contact-consent-field`, `project-scope-field`; beide `form-field.tsx`),
  App-Kopien löschen.
- **Akzeptanz:** Accessible Names in beiden Apps unverändert (Bestandstests Import-only grün).

## CRM-03d-T4 — `FormField`

- Die Web-Variante (`FormFieldKind.Custom`, `labelSuffix`, `labelRow`-Styles) ist die Basis; für den Workspace ist das
  eine rein additive Obermenge.
- Web-Test (Obermenge) und Workspace-Test in `packages/ui` zusammenführen.
- Nutzer umstellen (Web 3, Workspace 4), App-Kopien löschen.
- **Akzeptanz:** Lead-Formular, Rollen-Dialog, Kontaktformular und Generator-Formular visuell und in den Tests
  unverändert.

## Changeset

| Bereich                   | Dateien                                                                                                                                                                                                                                     | Anzahl |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -----: |
| `packages/ui` (T3)        | `components/form/form-required-marker/{form-required-marker.tsx,form-required-marker.module.css}`, `components/form/form-field-label/form-field-label.tsx` (verschoben aus der Workspace-Kopie), `src/index.ts`                             |      4 |
| `packages/ui` (T4)        | `components/form/form-field/{form-field.tsx,form-field.module.css,form-field.test.tsx}` (verschoben aus der Web-Kopie)                                                                                                                      |      3 |
| Web-Kopien gelöscht       | `apps/web/src/components/shared/form/{form-required-marker/form-required-marker.tsx,form-required-marker/form-required-marker.module.css,form-field-label/form-field-label.tsx}`                                                            |      3 |
| Workspace-Kopien gelöscht | `apps/workspace/src/components/shared/form/form-field/{form-field.tsx,form-field.module.css,form-field.test.tsx}`                                                                                                                           |      3 |
| Nutzer Web                | `shared/form/contact-consent-field`, `contact-section/contact-form/project-scope-field`, `contact-section/shared/contact-identity-fields`, `contact-section/shared/contact-message-field`, `linkedin-post/generator-section/generator-form` |      5 |
| Nutzer Workspace          | `leads/form/lead-form-dialog`, `leads/form/lead-form-dialog/social-profiles-section`, `leads/shared/improvements-list-editor`, `settings/roles/role-form-dialog`                                                                            |      4 |
| Follow-up                 | `plans/Todo.md`                                                                                                                                                                                                                             |      1 |
|                           |                                                                                                                                                                                                                                             | **23** |

Hinweis: Die Workspace-Kopien von Marker und Label werden per Umbenennung nach `packages/ui` verschoben und zählen in
der
ersten Zeile; die Web-Kopie von `form-field.tsx` ebenso in der zweiten.

## Abschluss

- `pnpm -r lint`, `pnpm -r typecheck`, Tests `packages/ui`, `apps/web` und `apps/workspace` grün.
- Screenshots Kontaktformular (inklusive Einwilligungsfeld), Generator-Formular, Lead-Formular, Rollen-Dialog.
- Changeset gemessen und in der Übergabe genannt.
