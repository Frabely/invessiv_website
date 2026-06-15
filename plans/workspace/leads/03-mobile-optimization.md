# Phase 3 - Workspace Leads: Mobile-Optimierung

> **Branch:** `feat/workspace-leads-mobile`
> **Scope:** Nur Mobile (`@media (max-width: 720px)`). Desktop bleibt 1:1 unverändert. Dashboard out of scope.

## Context

Der Leads-Bereich (`/[locale]/leads`) ist auf Mobile erreichbar, aber UX-seitig schwach: Filter-Chips fressen Platz,
die Tabelle (`min-width: 1765px`) erzwingt horizontales Scrollen (nur halber Name sichtbar), Row-Aktionen liegen als
drei Buttons offen, Spacings/Fonts sind desktop-dimensioniert.

Ziel: kompakte, nutzbare Mobile-Ansicht. Alle Änderungen in `@media (max-width: 720px)` gekapselt; mobil-only Markup
wird auf Desktop per CSS `display:none` ausgeblendet. Breakpoint 720px = bestehende Mobile-Schwelle von Toolbar,
Pagination, Bulk-Action-Bar.

## Geklärte Entscheidungen

| Bereich                  | Entscheidung                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------- |
| Tabelle mobil            | CSS-Transformation der bestehenden `<table>` in gestapelte Karten (kein Markup-Duplikat, gleiches DOM)  |
| Karten-Felder            | Name + E-Mail, Status-Badge, Kategorie-Badge, Score-Bar, Social-Profile, Aktions-Menü, Auswahl-Checkbox |
| Karten ausgeblendet      | Erstellt-/Aktualisiert-Datum, Quelle-Badge (im Detail-Panel via Klick sichtbar)                         |
| Row-Aktionen             | Kebab-Overflow-Menü (`useState`-controlled, kein `<details>`); Desktop weiter 3 Buttons inline          |
| Filter Status/Kat/Quelle | Mobil `CustomSelect` (Single-Modus); Desktop-Chips bleiben, mobil ausgeblendet                          |
| Profil-Filter            | `CustomSelect` im neuen Multi-Modus (tri-state: off / include / exclude)                                |
| Spacing/Fonts            | Im Mobile-Breakpoint reduziert                                                                          |

## Erweiterte Komponente: `packages/ui` `CustomSelect`

Statt einer separaten Komponente wurde die bestehende `CustomSelect` über eine diskriminierte Union um einen
Multi-Modus erweitert (Reuse statt Neuanlage):

- **Single (Default, unverändert):** `value`/`onChange`, schließt bei Auswahl, `role="listbox"`/`option`. Bestehende
  Nutzung (`apps/web` generator-form) bleibt API-kompatibel.
- **Multi (`multiple`):** `options: { value, label, leading?, state }[]`, `onToggleOption(value)`, `triggerLabel`,
  `summary?`; bleibt beim Togglen offen, Optionen zeigen Tri-State-Indikator (✓/✕). `TriState`-Const-Objekt exportiert.
- Cycle-Logik bleibt im Consumer (Toolbar mappt `ProfileFilterState` -> `TriState`, ruft `cycleProfile`).
- Verhalten beider Modi über den Workspace-Toolbar-Test abgedeckt (`packages/ui` hat keine Test-Infra; Präzedenz:
  `CustomSelect` war auch vorher untested).

## Betroffene Dateien

- `packages/ui/src/components/custom-select/{custom-select.tsx,.module.css}` (Single + Multi-Modus).
- `apps/workspace/src/components/workspace/leads/toolbar/leads-toolbar/{leads-toolbar.tsx,.module.css,.test.tsx}`
- `.../table/leads-table/leads-table.module.css`
- `.../table/leads-table-row/{leads-table-row.module.css,.test.tsx}`
- `.../table/leads-table-row-actions/{leads-table-row-actions.tsx,.module.css}`
- i18n: bestehender Key `table.actions.label` ("Aktionen"/"Actions") wird für das Kebab-Menü wiederverwendet
  (kein neuer Key zwingend).

## Verifikation

- Mobile (<=720px): Filter als Selects + tri-state Profile; Tabelle als Karten ohne H-Scroll; Kebab-Menü; kompakter.
- Desktop (>720px): unverändert. Dark + Light. A11y-Smoke (Keyboard/Fokus/aria).
- Gates: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/workspace build`.
