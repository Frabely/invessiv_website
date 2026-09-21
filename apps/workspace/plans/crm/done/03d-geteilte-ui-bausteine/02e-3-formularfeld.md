# Task 02e-3 — Pflichtmarker, Label und Formularfeld

> **Teil von:** [Task 02e](./02e-geteilte-ui-bausteine.md) · **Merge-Einheit:** Ordner 03d · **Branch:**
> `chore/crm-geteilte-ui-bausteine`
> **Tickets:** CRM-03d-T3, CRM-03d-T4 · **Abhängigkeiten:** Task 02e-1
> **Changeset:** ~11 Dateien (Ziel ≤ 30, Stopp > 35, hart 50) · **Aufwand:** S

## Ziel

**Umsetzungsstand:** Erledigt im Workspace; `apps/web` bleibt bis Task 39 unverändert.

Die Workspace-Varianten von `FormRequiredMarker`, `FormFieldLabel` und `FormField` liegen in `packages/ui`; alle
Workspace-Nutzer importieren sie aus der öffentlichen Package-API. Die drei Bausteine hängen direkt voneinander ab und
werden deshalb gemeinsam reviewt. `apps/web` bleibt vollständig unangetastet und wird erst in Ordner 23 technisch und
visuell umgestellt.

## CRM-03d-T3 — `FormRequiredMarker` und `FormFieldLabel`

- Beide Workspace-Bausteine nach `packages/ui/src/components/form/` verschieben.
- Accessible Names bleiben unverändert; der Pflichtmarker bleibt in dieser Einheit Teil des Namens.
- Die fachliche Angleichung des Markers (`aria-hidden`, Pflicht über `required`/`aria-required`) wird erst bei der
  späteren Web-Migration app-übergreifend entschieden.
- **Akzeptanz:** Bestehende Workspace-Tests bleiben bis auf Importpfade unverändert grün.

## CRM-03d-T4 — `FormField`

- Die Workspace-Variante unverändert nach `packages/ui` verschieben und über `src/index.ts` exportieren.
- Die vier Workspace-Nutzer umstellen und die Workspace-Kopie löschen.
- Web-spezifische Fähigkeiten wie `FormFieldKind.Custom` und `labelSuffix` werden in Ordner 23 als app-neutrale
  Erweiterung ergänzt, wenn die Web-Nutzer tatsächlich umgestellt werden.
- **Akzeptanz:** Lead-Formular und Rollen-Dialog bleiben visuell und funktional unverändert.

## Changeset

| Bereich            | Dateien                                                                                                                                                                                               | Anzahl |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -----: |
| `packages/ui` (T3) | `components/form/form-required-marker/{form-required-marker.tsx,form-required-marker.module.css}`, `components/form/form-field-label/form-field-label.tsx` (aus Workspace verschoben), `src/index.ts` |      4 |
| `packages/ui` (T4) | `components/form/form-field/{form-field.tsx,form-field.module.css,form-field.test.tsx}` (aus Workspace verschoben)                                                                                    |      3 |
| Nutzer Workspace   | `leads/form/lead-form-dialog`, `leads/form/lead-form-dialog/social-profiles-section`, `leads/shared/improvements-list-editor`, `settings/roles/role-form-dialog`                                      |      4 |
|                    |                                                                                                                                                                                                       | **11** |

## Abschluss

- `pnpm -r lint`, `pnpm -r typecheck`, Tests `packages/ui` und `apps/workspace` grün.
- Workspace-Screenshots für Lead-Formular und Rollen-Dialog in Mobil/Desktop sowie Dark/Light.
- Changeset gemessen und in der Übergabe genannt.
