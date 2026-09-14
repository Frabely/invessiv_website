# Task 02e — Geteilte UI-Bausteine (Übersicht)

> **Merge-Einheit:** Ordner 03d · **Branch:** `chore/crm-geteilte-ui-bausteine`
> **Aufwand:** L (4–5 Tage) · **Abhängigkeiten:** Task 02c (Ordner 03b) und Task 02d (Ordner 03c) gemerged
> **Migration:** keine · **Zuschnitt:** 9 Tasks mit je höchstens ~30 Dateien, harte Grenze 50

Diese Datei hält die übergreifenden Entscheidungen, die Dialog-Umstellung, die Teststrategie und das Zielbild. Die
umzusetzenden Tickets stehen in den Task-Dateien (siehe „Tasks").

## Kontext

Stand 14.09.2026: Ordner 03b und 03c sind gemerged. Der Lifecycle-Dialog aus 03c (`member-status-dialog`) ist
bestehender Nutzer der Dialog-Hülle.

Ordner 04 baut Kundenliste, Create/Edit-Dialog und Kundenakte. Heute existiert jeder Baustein dafür mehrfach oder nur
im Leads-Bereich:

| Baustein            | Ist-Zustand (Repository, 14.09.2026)                                                                                                                                                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dialog-Hülle        | `components/workspace/shared/dialog/workspace-dialog` (5 Settings-Nutzer) plus **sieben** Lead-Dialoge mit eigener Overlay-, Portal- und Fokuslogik über `dialog-focus-trap.ts`: Lead-Formular (1050 Zeilen), Import (538), Outreach (452), Bulk-Edit (608), Lead löschen (202), Bulk-Archiv (183), Bulk-Löschen (187) |
| Button              | Workspace-Button seit Task 02e-1 in `packages/ui`; die Web-Kopie und ihre Nutzer bleiben bis Ordner 23 unverändert                                                                                                                                                                                                     |
| Formularbausteine   | `components/shared/form/*` im Workspace; die abweichenden Web-Kopien werden erst in Ordner 23 technisch und visuell umgestellt                                                                                                                                                                                         |
| Empty-State         | `leads/table/leads-empty-state` (mit `next/link`), in Settings als Inline-Markup in `roles-list` und `add-member-dialog`                                                                                                                                                                                               |
| Badge               | `components/workspace/shared/lead-badge` — generische Tones, aber lead-benannt; Tones in `packages/common/src/constants/leads/badges/lead-badge-tones.ts`                                                                                                                                                              |
| Detail-Panel        | `leads/detail/lead-detail-panel` — `<aside>` im Seiten-Slot, lokale `DetailField`-Komponente als Definitionsliste, Sektionen als Inline-Markup; kein Escape, keine Fokussteuerung                                                                                                                                      |
| Listenbausteine     | ausschließlich unter `leads/table/**` und `leads/toolbar/**`; Facettenfilter nur Single-Select                                                                                                                                                                                                                         |
| Timeline            | `leads/detail/lead-detail-activities` (298 Zeilen, lead-gebunden)                                                                                                                                                                                                                                                      |
| `packages/ui` heute | `CheckboxControl`, `CustomSelect` (Floating-UI mit `FloatingPortal` nach `document.body`); keine Vitest-Config, Tests setzen jsdom per Dateikommentar                                                                                                                                                                  |

Dieser Task führt die Bausteine an genau einer Stelle zusammen, ohne Verhalten oder Optik zu ändern. Einzige bewusste
technische Umstellung ist das native `<dialog>` (Entscheidung vom 13.09.2026 in der Ordner-README).

## Entscheidungen

| Bereich              | Entscheidung                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Zuschnitt            | **Ein Ordner, ein PR.** Die Workspace-Tickets sind in **9 Tasks** gebündelt. Jeder Task ist ein eigenes Changeset mit **Ziel 20–30 Dateien, harte Grenze 50**, für sich grün und wird vom Nutzer einzeln reviewt und committet, bevor der nächste beginnt. T2 wird mit der Web-Migration nach Ordner 23 verschoben.                                                |
| Split-Gate           | Der Gesamt-PR liegt voraussichtlich mit 145–165 Dateien über dem Split-Gate von 120 und unter der harten Grenze von 200. Die Überschreitung ist bewusst: Der Großteil sind reine Importpfad-Diffs, und das Review läuft je Task-Changeset. Checkpoints stehen unter „Umfangskontrolle".                                                                            |
| Apps                 | **Nur Workspace stellt in Ordner 03d um.** Button und Formularbausteine werden aus `apps/workspace` nach `packages/ui` verschoben. `apps/web` bleibt bis Ordner 23 vollständig unangetastet.                                                                                                                                                                       |
| Ablage               | Hybrid wie am 13.09.2026 entschieden. `packages/ui`: Button, Formularfeld samt Label/Marker/Status/Actions, Dialog, Bestätigungsdialog, Seitenpanel, Detail-Sektion, Definitionsliste, Empty-State, Badge. `components/workspace/shared/`: Link-gebundener Listen-Empty-State, Sortier-Header, Pagination, Selection, Suchfeld, Facettenfilter, Activity-Timeline. |
| `packages/ui`-Grenze | Keine Importe aus `next/*`, App-Code, Dictionaries, Analytics oder Fachdomänen. Texte, Links, Icons und Callbacks kommen als Props. Links werden über eine `linkComponent`-Prop injiziert, nie importiert.                                                                                                                                                         |
| Verhalten            | Reines Refactoring. Leads und Settings verhalten sich identisch. Neue Fähigkeiten (Mehrfachauswahl im Facettenfilter, Escape/Fokus im Seitenpanel, Portal-Root für `CustomSelect`) sind opt-in und werden in diesem Ordner von niemandem aktiviert.                                                                                                                |
| Optik                | Mobil, Dark und Light bleiben im Workspace pixelnah unverändert. Web-spezifische Abweichungen werden erst in Ordner 23 aufgelöst.                                                                                                                                                                                                                                  |
| Dialog               | Natives `<dialog>` mit `showModal()`/`close()`; `dialog-focus-trap.ts` und alle `createPortal`-Dialoge entfallen (Details unten).                                                                                                                                                                                                                                  |
| Konstanten           | `WorkspaceDialogSize` wird zu `DialogSize` in `packages/common/src/constants/ui/`; `LeadBadgeTone` wird zu `BadgeTone` am selben Ort. Const-Objekt plus abgeleiteter Typ, Tests ziehen mit.                                                                                                                                                                        |
| Tests                | Bestandstests ändern nur Importpfade — **mit einer benannten Ausnahme**: Tests, die die ersetzte Eigenbau-Mechanik prüfen (siehe „Teststrategie"), werden auf das native Verhalten umgeschrieben. Die Abweichung steht im PR.                                                                                                                                      |
| Doku                 | Regeländerungen landen im selben Task wie der Code, der sie auslöst — nicht gesammelt am Ende.                                                                                                                                                                                                                                                                     |

## Tasks

## Tatsächlicher Umsetzungsstand (14.09.2026)

Der Ordner ist noch nicht reviewbereit. Der aktuelle Codebestand wurde gegen die Task-Ziele abgeglichen:

| Task                | Stand                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| 02e-1, 02e-3, 02e-4 | Erledigt im Workspace.                                                                                 |
| 02e-5               | `Dialog` und Settings-Nutzer umgestellt; Test-Setup und Dialog-Tests offen.                            |
| 02e-6               | `ConfirmDialog` und Single-Delete umgestellt; sechs Lead-Dialoge noch mit Eigenbau-Overlay/Fokusfalle. |
| 02e-7               | Komponenten und Nutzer umgestellt; Tests und generische Workspace-Konstante offen.                     |
| 02e-8               | Nur `Badge`/`BadgeTone` erledigt.                                                                      |
| 02e-9               | Nur Selection-Provider und Select-All-Checkbox erledigt.                                               |
| 02e-10              | Offen.                                                                                                 |

`apps/web` wird in keinem dieser Restschritte verändert. Der verbindliche Web-Nachlauf bleibt Task 39 in Ordner 23 nach
dem gesamten CRM-Umbau.

Die Reihenfolge ist verbindlich, weil spätere Tasks auf früheren aufbauen. Die Dateizahlen sind aus dem Repository
(14.09.2026) gezählt; Umbenennungen zählen einfach.

| Task                                                 | Tickets | Inhalt                                                        | Changeset | Aufwand |
| ---------------------------------------------------- | ------- | ------------------------------------------------------------- | --------: | ------- |
| [02e-1](./02e-1-regeln-und-button-workspace.md)      | T0, T1  | Status, Regeldateien; Button nach `packages/ui`, Workspace    |       ~31 | M       |
| [02e-3](./02e-3-formularfeld.md)                     | T3, T4  | `FormRequiredMarker`, `FormFieldLabel`, `FormField`           |       ~11 | S       |
| [02e-4](./02e-4-formularstatus-und-aktionen.md)      | T5      | `FormStatus`, `FormActions`                                   |       ~10 | S       |
| [02e-5](./02e-5-dialog-und-settings.md)              | T6, T7  | Natives `Dialog`, Test-Setup, Settings-Dialoge, Portal-Root   |       ~20 | M       |
| [02e-6](./02e-6-lead-dialoge.md)                     | T8–T13  | `ConfirmDialog`, alle sieben Lead-Dialoge, Fokusfalle löschen |       ~23 | M       |
| [02e-7](./02e-7-empty-state.md)                      | T14     | `EmptyState`, `ListEmptyState`, Settings-Empty-States         |       ~17 | S       |
| [02e-8](./02e-8-badge-und-detail-panel.md)           | T15–T17 | `Badge`, `DefinitionList`, `DetailSection`, `SidePanel`       |       ~28 | M       |
| [02e-9](./02e-9-tabellenbausteine.md)                | T18–T20 | Sortier-Header, Pagination, Selection                         |    ~17–20 | S       |
| [02e-10](./02e-10-toolbar-timeline-und-abschluss.md) | T21–T24 | Suchfeld, Facettenfilter, Timeline, Nachweis und Übergabe     |       ~18 | M       |

Jeder Task endet mit `pnpm -r lint`, `pnpm -r typecheck` und den betroffenen Test-Suites grün. Task 02e-10 zusätzlich
mit allen Qualitäts-Gates.

## Dialog-Umstellung im Detail

### Ziel-API (Skizze, lokale Props bleiben in der Komponentendatei)

```tsx
<Dialog
  open={open}
  onCloseAction={close}
  title={text.title}
  description={text.description}
  eyebrow={text.kicker}
  closeLabel={text.close}
  size={DialogSize.Wide}
  busy={isSubmitting}
  closeOnBackdropClick={false}
  initialFocusRef={firstFieldRef}
  className={styles.dialogSurface}
  footer={<FormActions>…</FormActions>}
>
  …
</Dialog>
```

`ConfirmDialog` baut darauf auf: Titel, Beschreibung, Bestätigen-/Abbrechen-Label, `tone` (`danger` oder `default`),
`busy`, Status- und Fehlermeldung als Props sowie ein optionaler `secondaryAction`-Slot (für „Archivieren" im
Lead-Löschdialog).

### Verhaltensregeln

| Aufgabe                   | Umsetzung                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Öffnen/Schließen          | `showModal()` im Layout-Effekt bei `open === true`, `close()` im Layout-Effekt-Cleanup. So schließt der Dialog, **bevor** React ihn aus dem DOM entfernt, und der Browser gibt den Fokus zurück. Test: Unmount bei geöffnetem Dialog.                                                                                                                             |
| Initialer Fokus           | Das native Verhalten fokussiert das erste fokussierbare Element im Dokumentfluss, also den Schließen-Button im Kopf. Heute landet der Fokus im ersten Body-Element. Die Hülle setzt deshalb nach `showModal()` den Fokus auf `initialFocusRef` oder das erste fokussierbare Body-Element. Test sichert das ab.                                                    |
| Escape                    | `cancel`-Event; bei `busy` wird `preventDefault()` aufgerufen und `onCloseAction` nicht ausgelöst.                                                                                                                                                                                                                                                                |
| Klick auf den Hintergrund | Klick auf das `<dialog>` selbst außerhalb der Inhaltsfläche; nur bei `closeOnBackdropClick` (Standard `true` wie `WorkspaceDialog`; das Lead-Formular übergibt `false`, weil es heute nicht schließt).                                                                                                                                                            |
| Überlagerung              | Top-Layer, Hintergrund über `::backdrop`. Die heutige Overlay-Optik (Farbmischung, `blur(6px)`, Abstand unter dem Workspace-Header) wandert 1:1 dorthin; Fallbacks für Custom Properties bleiben.                                                                                                                                                                 |
| Popups im Dialog          | Elemente außerhalb des Dialogs sind durch `showModal()` inert. `CustomSelect` rendert heute per `FloatingPortal` nach `document.body` und wäre im Dialog nicht bedienbar. T7 ergänzt einen Portal-Root-Kontext: Die Hülle stellt ihr `<dialog>`-Element bereit, `CustomSelect` rendert dort hinein. Heute nutzt kein Dialog `CustomSelect`; Ordner 04 braucht es. |
| SSR                       | Der Guard `typeof document === "undefined"` und `createPortal` entfallen; das `<dialog>` wird geschlossen gerendert.                                                                                                                                                                                                                                              |
| Tab-Verhalten             | Tab darf aus dem Dialog in die Browser-Oberfläche springen; das ist das gewollte Top-Layer-Verhalten und kein Fokus-Leck.                                                                                                                                                                                                                                         |

### Test-Setup

- jsdom implementiert `showModal()`/`close()` nicht. `packages/ui/src/testing/dialog-test-setup.ts` ergänzt beide
  Methoden minimal: `open`-Attribut setzen/entfernen, `close`-Event auslösen, zuvor fokussiertes Element merken und beim
  `close()` refokussieren.
- `packages/ui/vitest.config.ts` (neu) sowie `apps/workspace/vitest.config.ts`
  registrieren die Datei über `setupFiles`, weil App-Komponententests die Dialoge ebenfalls rendern.
- Der Mock ist nur für Tests exportiert (`@invessiv/ui/testing/dialog-test-setup`) und nie Teil von `src/index.ts`.

## Teststrategie

- **Import-only:** Alle Bestandstests, die Verhalten über Rollen, Texte und Callbacks prüfen, ändern ausschließlich
  Importpfade.
- **Benannte Ausnahme, weil sie die ersetzte Mechanik testen:**
  - `workspace-dialog.test.tsx` → wird zu `packages/ui/.../dialog.test.tsx`; der Tab-Wrap-Test entfällt zugunsten
    „Dialog ist modal geöffnet (`open`) und Escape per `cancel`" (Task 02e-5).
  - `lead-form-dialog.test.tsx` → „wraps focus from the last focusable element back to the close button" wird durch
    einen Test für den initialen Fokus ersetzt; der Overlay-Klick-Test adressiert das `<dialog>` statt
    `dialog.parentElement`; Escape wird als `cancel`-Event ausgelöst (Task 02e-6).
  - `import-leads-dialog.test.tsx` → Escape als `cancel`-Event (Task 02e-6).
- **Neu in `packages/ui`:** Jede interaktive Komponente hat jsdom-Tests für Tastatur, Fokus und Escape; der Dialog
  zusätzlich für `busy`-Sperre, Fokus-Rückgabe beim Schließen und beim Unmount sowie den Portal-Root.
- **Visuell:** Jeder Task mit Optikbezug enthält Vorher/Nachher-Screenshots (Mobil 390 px, Desktop; Dark und Light) der
  betroffenen Oberfläche.

## Verzeichnisstruktur (Zielbild)

```txt
packages/common/src/constants/ui/
  dialog-sizes.ts (+ test)                              ← apps/workspace/src/common/constants/ui/workspace-dialog-sizes.ts
  badge-tones.ts (+ test)                               ← packages/common/src/constants/leads/badges/lead-badge-tones.ts

packages/ui/
  vitest.config.ts
  src/index.ts                                          + neue Exporte
  src/testing/dialog-test-setup.ts
  src/components/
    button/{button.tsx,button.module.css,button.test.tsx}
    form/form-required-marker/
    form/form-field-label/
    form/form-field/{…,form-field.test.tsx}
    form/form-status/
    form/form-actions/
    dialog/dialog/{dialog.tsx,dialog.module.css,dialog.test.tsx}
    dialog/dialog-portal-root-context.ts
    dialog/confirm-dialog/{…,confirm-dialog.test.tsx}
    empty-state/
    badge/
    detail/definition-list/
    detail/detail-section/
    side-panel/{…,side-panel.test.tsx}
  src/components/custom-select/custom-select.tsx        + Portal-Root aus Kontext

apps/workspace/src/components/workspace/shared/
  AGENTS.md, CLAUDE.md
  table/list-empty-state/
  table/sortable-header/
  table/list-pagination/
  table/list-selection-provider/
  table/list-select-all-checkbox/
  toolbar/list-search-field/
  toolbar/facet-filter/                                 + Mehrfachauswahl
  activity/activity-timeline/

entfällt:
  apps/workspace/src/components/shared/button/**
  apps/workspace/src/components/shared/form/{form-field,form-field-label,form-required-marker,form-status,form-actions}/**
  apps/workspace/src/components/workspace/shared/dialog/**
  apps/workspace/src/components/workspace/shared/lead-badge/**
  apps/workspace/src/components/workspace/leads/table/{leads-empty-state,sortable-header,leads-pagination,leads-table-selection-provider,leads-table-select-all-checkbox}/**
  apps/workspace/src/components/workspace/leads/toolbar/{lead-search-field,lead-facet-filter}/**
  apps/workspace/src/components/workspace/leads/detail/lead-detail-activities/**
  apps/workspace/src/common/constants/ui/workspace-dialog-sizes.ts
```

Alle Web-Kopien und Web-Nutzer bleiben bis Ordner 23 unverändert. Fachliche Badges (`LeadStatusBadge`,
`LeadSourceBadge`, `LeadCategoryBadge`), `LeadScoreBar`,
`LeadSocialProfiles` und `leads-table-row` bleiben im Leads-Bereich.

## Umfangskontrolle

### Je Task

- **Messung:** Beim Start eines Tasks den Basis-Commit notieren. Vor der Übergabe
  `git diff --stat -M <Basis-Commit>` plus neue, noch ungetrackte Dateien aus `git status --short` zählen.
- **Ziel 20–30 Dateien.** Zeichnet sich während der Umsetzung mehr als 35 ab, wird gestoppt und mit dem Nutzer
  entschieden, ob der Task an einer Ticketgrenze geteilt wird.
- **50 Dateien werden in keinem Task überschritten.**
- Die Dateilisten in den Task-Dateien sind die erwartete Grundlage. Weicht das Changeset ab (zusätzliche Nutzer,
  Barrels, Tests), wird die Abweichung in der Übergabe genannt.

### Gesamt-PR

| Phase | Tasks               | Summe je Task (ohne Überschneidung) | Geschätzt im PR (Umbenennungen einfach) |
| ----- | ------------------- | ----------------------------------: | --------------------------------------: |
| 0 + A | 02e-1, 02e-3, 02e-4 |                                 ~52 |                                   45–55 |
| B     | 02e-5, 02e-6        |                                 ~43 |                                   35–45 |
| C     | 02e-7, 02e-8        |                                 ~45 |                                   35–40 |
| D + E | 02e-9, 02e-10       |                              ~35–38 |                                   30–35 |
|       |                     |                                     |                     **145–165 (≤ 200)** |

Die Summe je Task liegt höher als der PR, weil dieselben Dateien (etwa `packages/ui/src/index.ts`, Lead-Dialoge,
`lead-detail-panel`, `leads-table`) in mehreren Tasks geändert werden und im PR nur einmal zählen.

- Gemessen wird nach jedem Task zusätzlich mit `git diff --stat master...HEAD`.
- **Checkpoint nach Task 02e-8:** Liegt der PR über 160 Dateien, wird vor Task 02e-9 gestoppt und mit dem Nutzer
  entschieden, ob Task 02e-9 und 02e-10 als eigener Ordner 03e ausgegliedert werden. Beide Tasks sind bewusst so
  geschnitten, dass sie ohne Änderung an früheren Tasks abtrennbar sind.
- Die harte Grenze von 200 Dateien wird in keinem Fall überschritten.

## Deploy-Sicherheit

1. **Live sichtbar:** nichts. Leads und Settings sehen gleich aus und verhalten sich gleich; Web wird nicht geändert.
2. **Bricht nichts:** Gelöschte Altpfade lassen den Typecheck bei jedem übersehenen Import scheitern. Unveränderte
   Bestandstests belegen die Verhaltensgleichheit, benannte Ausnahmen belegen das native Dialogverhalten.
3. **Zwischenstände:** Jeder Task hinterlässt einen grünen, deploybaren Stand. Bis Task 02e-6 existieren alte
   Lead-Dialoge mit Fokusfalle und neue `Dialog`-Nutzer nebeneinander; das ist gewollt und verhaltensgleich.
4. **Browser-Voraussetzung:** `<dialog>`/`showModal()` und `::backdrop`-Vererbung von Custom Properties sind in allen
   aktuellen Evergreen-Browsern verfügbar. Die Umstellung wird in Task 02e-5 (T6) und 02e-6 (T13) in Chromium, Firefox
   und WebKit (Playwright) manuell geprüft.
5. **Offen im CRM-Ordner:** nichts. Mehrfachauswahl, Portal-Root und Panel-Opt-ins sind vorhanden, aber erst ab Ordner
   04/05 aktiv. Technische Web-Migration und Web-Gestaltung folgen erst nach dem gesamten CRM-Umbau in Ordner 23 und
   blockieren Merge oder Rollback von Ordner 03d nicht.

## Nicht Teil dieses Tasks

- Sämtliche technischen und visuellen Änderungen an der Web-App. Migration auf die geteilten Button- und
  Formularbausteine sowie deren bewusste Web-Ausprägung sind in Ordner 23, Task 39, erfasst und werden erst nach dem
  gesamten CRM-Umbau als eigenständiger Web-PR umgesetzt.
- Fachliche A11y-Änderung des Pflichtmarkers (Follow-up aus T3).
- Mobile Workspace-Sidebar (`workspace-sidebar`) auf `<dialog>` umstellen.
- Lead-spezifische Bausteine (`LeadScoreBar`, `LeadSocialProfiles`, `improvements-list-editor`, `leads-table-row`)
  verallgemeinern.
- `Owner-Wechsel`-Dialog auf `ConfirmDialog` umstellen; er nutzt `Dialog` und ist damit keine Doppelimplementierung.
- Kundenliste, Kundenakte und Kundendialoge — Ordner 04.

## Rollback

Reiner Code-Revert; keine Migration, keine Datenänderung. Weil jeder Task einzeln grün ist, kann im Review auch gezielt
ab einem Task zurückgerollt werden (etwa die Commits aus 02e-9 und 02e-10), ohne frühere Tasks anzufassen.
