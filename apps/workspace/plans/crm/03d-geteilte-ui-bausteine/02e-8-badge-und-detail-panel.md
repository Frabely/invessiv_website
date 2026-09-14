# Task 02e-8 — `Badge`, Detail-Bausteine und `SidePanel`

> **Teil von:** [Task 02e](./02e-geteilte-ui-bausteine.md) · **Merge-Einheit:** Ordner 03d · **Branch:**
> `chore/crm-geteilte-ui-bausteine`
> **Tickets:** CRM-03d-T15 bis CRM-03d-T17 · **Abhängigkeiten:** Task 02e-7
> **Changeset:** ~28 Dateien (Ziel ≤ 30, Stopp > 35, hart 50) · **Aufwand:** M

## Ziel

Die Anzeige-Bausteine für die Kundenakte liegen in `packages/ui`: `Badge`, `DefinitionList`, `DetailSection` und
`SidePanel`. Das Lead-Detail-Panel ist der erste Nutzer aller drei Detail-Bausteine.

**Checkpoint nach diesem Task:** PR-Gesamtstand messen (siehe Übersicht, „Umfangskontrolle").

## CRM-03d-T15 — `Badge`

- `Badge` in `packages/ui` übernimmt `lead-badge` (Styles und Tones 1:1); `BadgeTone` nach `packages/common`.
- `LeadStatusBadge`, `LeadSourceBadge`, `LeadCategoryBadge` rendern `Badge`; `kind` und `categoryKey` bleiben als
  durchgereichte `data-*`-Attribute erhalten, falls Selektoren oder Tests sie nutzen (im Ticket per Suche prüfen).
  `lead-badge/**` und der Barrel-Eintrag entfallen.
- **Akzeptanz:** `lead-badge.test.tsx` und `lead-status-badge.test.tsx` grün (Import-only oder nach `packages/ui`
  verschoben); alle Tones in Dark/Light unverändert.

## CRM-03d-T16 — `DefinitionList` und `DetailSection`

- `DefinitionList` (`items` oder Kinder mit Label/Wert) und `DetailSection` (Überschrift mit `id`, Aktions-Slot,
  Inhalt) in `packages/ui`.
- `lead-detail-panel` ersetzt die lokale `DetailField`-Komponente und das Sektions-Markup.
- **Akzeptanz:** `lead-detail-panel.test.tsx` Import-only grün; `aria-labelledby` der Sektionen unverändert;
  Screenshot-Vergleich des Panels.

## CRM-03d-T17 — `SidePanel`

- `SidePanel` in `packages/ui`: `<aside>` mit Kopf (Eyebrow, Titel, Aktions-Slot, Schließen-Button), Inhalt und
  responsivem Verhalten des heutigen Lead-Panels.
- Opt-in-Props `closeOnEscape` und `focusOnOpen` (Fokus beim Öffnen ins Panel, beim Schließen zurück); Leads aktiviert
  sie nicht, Ordner 04 schon.
- `lead-detail-panel` nutzt `SidePanel` als Hülle; die URL-gesteuerte Schließ-Navigation bleibt im Lead-Code.
- **Akzeptanz:** SidePanel-Tests für die Opt-in-Props; Lead-Panel-Verhalten und -Optik unverändert (Desktop, ≤ 1024 px,
  ≤ 520 px).

## Changeset

| Ticket | Dateien                                                                                                                                                                                                                                                             |    Anzahl |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------: |
| T15    | `packages/ui/src/components/badge/{badge.tsx,badge.module.css,badge.test.tsx}` (verschoben aus `workspace/shared/lead-badge`), `packages/ui/src/index.ts`                                                                                                           |         4 |
| T15    | `packages/common/src/constants/ui/badge-tones.ts` (verschoben aus `constants/leads/badges/lead-badge-tones.ts`), `constants/ui/badge-tones.test.ts` (neu), `constants/leads/badges/index.ts`, `constants/leads/tests/leads-constants.test.ts` (Tone-Block entfernt) |         4 |
| T15    | `apps/workspace/src/common/constants/leads/badges/lead-status-badge-tones.ts`, `dashboard/funnel-connector/funnel-connector.tsx`                                                                                                                                    |         2 |
| T15    | `leads/shared/{index.ts,lead-category-badge/lead-category-badge.tsx,lead-source-badge/lead-source-badge.tsx}`, `leads/toolbar/lead-source-filter/lead-source-filter.tsx`                                                                                            |         4 |
| T15    | `workspace/shared/lead-status-badge/{lead-status-badge.tsx,lead-status-badge.test.tsx}`                                                                                                                                                                             |         2 |
| T16    | `packages/ui/src/components/detail/definition-list/{definition-list.tsx,definition-list.module.css,definition-list.test.tsx}`                                                                                                                                       |         3 |
| T16    | `packages/ui/src/components/detail/detail-section/{detail-section.tsx,detail-section.module.css,detail-section.test.tsx}`                                                                                                                                           |         3 |
| T16/17 | `leads/detail/lead-detail-panel/{lead-detail-panel.tsx,lead-detail-panel.module.css}`                                                                                                                                                                               |         2 |
| T17    | `packages/ui/src/components/side-panel/{side-panel.tsx,side-panel.module.css,side-panel.test.tsx}`                                                                                                                                                                  |         3 |
| T17    | `leads/shell/leads-page-shell/leads-page-shell.tsx` (nur falls sich der Panel-Slot ändert)                                                                                                                                                                          |       0–1 |
|        |                                                                                                                                                                                                                                                                     | **27–28** |

## Abschluss

- `pnpm -r lint`, `pnpm -r typecheck`, Tests `packages/common`, `packages/ui` und `apps/workspace` grün.
- Screenshots: alle Badge-Tones (Leads-Liste, Dashboard-Funnel), Lead-Detail-Panel auf Desktop, ≤ 1024 px und ≤ 520 px
  (Dark/Light).
- Changeset **und** PR-Gesamtstand (`git diff --stat master...HEAD`) gemessen; über 160 Dateien → Rücksprache vor
  Task 02e-9.
