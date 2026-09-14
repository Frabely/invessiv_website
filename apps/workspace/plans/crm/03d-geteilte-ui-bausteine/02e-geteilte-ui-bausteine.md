# Task 02e — Geteilte UI-Bausteine

> **Merge-Einheit:** Ordner 03d · **Branch:** `chore/crm-geteilte-ui-bausteine`
> **Aufwand:** L (4–5 Tage) · **Abhängigkeiten:** Task 02c (Ordner 03b) und Task 02d (Ordner 03c) gemerged
> **Migration:** keine · **Reviewziel:** 170–195 Dateien in 25 kleinen Review-Schritten (siehe „Umfangskontrolle")

## Kontext

Stand 14.09.2026: Ordner 03b ist gemerged, Ordner 03c befindet sich im Review. Dieser Plan setzt voraus, dass 03c beim
Start gemerged ist, und behandelt dessen neuen Lifecycle-Dialog als bestehenden Nutzer der
Dialog-Hülle.

Ordner 04 baut Kundenliste, Create/Edit-Dialog und Kundenakte. Heute existiert jeder Baustein dafür mehrfach oder nur
im Leads-Bereich:

| Baustein            | Ist-Zustand (Repository, 14.09.2026)                                                                                                                                                                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dialog-Hülle        | `components/workspace/shared/dialog/workspace-dialog` (4 Settings-Nutzer, nach 03c 5) plus **sieben** Lead-Dialoge mit eigener Overlay-, Portal- und Fokuslogik über `dialog-focus-trap.ts`: Lead-Formular (1050 Zeilen), Import (538), Outreach (452), Bulk-Edit (608), Lead löschen (202), Bulk-Archiv (183), Bulk-Löschen (187) |
| Button              | `components/shared/button/button.tsx` in `apps/web` **und** `apps/workspace` — TSX identisch, CSS weicht ab (Schriftfamilie per Token vs. Literal, Disabled-Opacity nur im Web); 17 Web- und 19 Workspace-Nutzer                                                                                                                   |
| Formularbausteine   | `components/shared/form/*` in beiden Apps — `FormFieldLabel`, `FormStatus`, `FormActions` identisch; `FormField` im Web weiter (`FormFieldKind.Custom`, `labelSuffix`); `FormRequiredMarker` im Web `aria-hidden`, im Workspace nicht                                                                                              |
| Empty-State         | `leads/table/leads-empty-state` (mit `next/link`), in Settings als Inline-Markup in `roles-list` und `add-member-dialog`                                                                                                                                                                                                           |
| Badge               | `components/workspace/shared/lead-badge` — generische Tones, aber lead-benannt; Tones in `packages/common/src/constants/leads/badges/lead-badge-tones.ts`                                                                                                                                                                          |
| Detail-Panel        | `leads/detail/lead-detail-panel` — `<aside>` im Seiten-Slot, lokale `DetailField`-Komponente als Definitionsliste, Sektionen als Inline-Markup; kein Escape, keine Fokussteuerung                                                                                                                                                  |
| Listenbausteine     | ausschließlich unter `leads/table/**` und `leads/toolbar/**`; Facettenfilter nur Single-Select                                                                                                                                                                                                                                     |
| Timeline            | `leads/detail/lead-detail-activities` (298 Zeilen, lead-gebunden)                                                                                                                                                                                                                                                                  |
| `packages/ui` heute | `CheckboxControl`, `CustomSelect` (Floating-UI mit `FloatingPortal` nach `document.body`); keine Vitest-Config, Tests setzen jsdom per Dateikommentar                                                                                                                                                                              |

Dieser Task führt die Bausteine an genau einer Stelle zusammen, ohne Verhalten oder Optik zu ändern. Einzige bewusste
technische Umstellung ist das native `<dialog>` (Entscheidung vom 13.09.2026 in der Ordner-README).

## Entscheidungen

| Bereich              | Entscheidung                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Zuschnitt            | **Ein Ordner, ein PR** (mit dem Nutzer abgestimmt am 14.09.2026), aber in **25 Review-Schritten** mit je höchstens zwei umgezogenen Bausteinen. Jeder Schritt ist für sich grün (lint, typecheck, betroffene Tests) und wird vom Nutzer einzeln reviewt und committet, bevor der nächste beginnt.                                                                  |
| Split-Gate           | Die Schätzung liegt über dem Split-Gate von 120 und unter der harten Grenze von 200. Die Überschreitung ist bewusst: Der Großteil sind reine Importpfad-Diffs. Checkpoints stehen unter „Umfangskontrolle".                                                                                                                                                        |
| Apps                 | **Beide Apps stellen um** (mit dem Nutzer abgestimmt am 14.09.2026). Button und Formularbausteine liegen danach nur noch in `packages/ui`; die Kopien in `apps/web` und `apps/workspace` werden gelöscht.                                                                                                                                                          |
| Ablage               | Hybrid wie am 13.09.2026 entschieden. `packages/ui`: Button, Formularfeld samt Label/Marker/Status/Actions, Dialog, Bestätigungsdialog, Seitenpanel, Detail-Sektion, Definitionsliste, Empty-State, Badge. `components/workspace/shared/`: Link-gebundener Listen-Empty-State, Sortier-Header, Pagination, Selection, Suchfeld, Facettenfilter, Activity-Timeline. |
| `packages/ui`-Grenze | Keine Importe aus `next/*`, App-Code, Dictionaries, Analytics oder Fachdomänen. Texte, Links, Icons und Callbacks kommen als Props. Links werden über eine `linkComponent`-Prop injiziert, nie importiert.                                                                                                                                                         |
| Verhalten            | Reines Refactoring. Leads, Settings und Web-Formulare verhalten sich identisch. Neue Fähigkeiten (Mehrfachauswahl im Facettenfilter, Escape/Fokus im Seitenpanel, Portal-Root für `CustomSelect`) sind opt-in und werden in diesem Ordner von niemandem aktiviert.                                                                                                 |
| Optik                | Mobil, Dark und Light bleiben pixelnah unverändert. Abweichungen zwischen den App-Kopien werden über app-seitig definierte Tokens aufgelöst, nicht durch Angleichen der Optik.                                                                                                                                                                                     |
| Dialog               | Natives `<dialog>` mit `showModal()`/`close()`; `dialog-focus-trap.ts` und alle `createPortal`-Dialoge entfallen (Details unten).                                                                                                                                                                                                                                  |
| Konstanten           | `WorkspaceDialogSize` wird zu `DialogSize` in `packages/common/src/constants/ui/`; `LeadBadgeTone` wird zu `BadgeTone` am selben Ort. Const-Objekt plus abgeleiteter Typ, Tests ziehen mit.                                                                                                                                                                        |
| Tests                | Bestandstests ändern nur Importpfade — **mit einer benannten Ausnahme**: Tests, die die ersetzte Eigenbau-Mechanik prüfen (siehe „Teststrategie"), werden auf das native Verhalten umgeschrieben. Die Abweichung steht im PR.                                                                                                                                      |
| Doku                 | Regeländerungen landen im selben Review-Schritt wie der Code, der sie auslöst — nicht gesammelt am Ende.                                                                                                                                                                                                                                                           |

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
- `packages/ui/vitest.config.ts` (neu) sowie `apps/workspace/vitest.config.ts` und `apps/web/vitest.config.ts`
  registrieren die Datei über `setupFiles`, weil App-Komponententests die Dialoge ebenfalls rendern.
- Der Mock ist nur für Tests exportiert (`@invessiv/ui/testing/dialog-test-setup`) und nie Teil von `src/index.ts`.

## Teststrategie

- **Import-only:** Alle Bestandstests, die Verhalten über Rollen, Texte und Callbacks prüfen, ändern ausschließlich
  Importpfade.
- **Benannte Ausnahme, weil sie die ersetzte Mechanik testen:**
  - `workspace-dialog.test.tsx` → wird zu `packages/ui/.../dialog.test.tsx`; der Tab-Wrap-Test entfällt zugunsten
    „Dialog ist modal geöffnet (`open`) und Escape per `cancel`".
  - `lead-form-dialog.test.tsx` → „wraps focus from the last focusable element back to the close button" wird durch
    einen Test für den initialen Fokus ersetzt; der Overlay-Klick-Test adressiert das `<dialog>` statt
    `dialog.parentElement`; Escape wird als `cancel`-Event ausgelöst.
  - `import-leads-dialog.test.tsx` → Escape als `cancel`-Event.
- **Neu in `packages/ui`:** Jede interaktive Komponente hat jsdom-Tests für Tastatur, Fokus und Escape; der Dialog
  zusätzlich für `busy`-Sperre, Fokus-Rückgabe beim Schließen und beim Unmount sowie den Portal-Root.
- **Visuell:** Jeder Review-Schritt mit Optikbezug enthält Vorher/Nachher-Screenshots (Mobil 390 px, Desktop; Dark und
  Light) der betroffenen Oberfläche.

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
  apps/{web,workspace}/src/components/shared/button/**
  apps/{web,workspace}/src/components/shared/form/{form-field,form-field-label,form-required-marker,form-status,form-actions}/**
  apps/workspace/src/components/workspace/shared/dialog/**
  apps/workspace/src/components/workspace/shared/lead-badge/**
  apps/workspace/src/components/workspace/leads/table/{leads-empty-state,sortable-header,leads-pagination,leads-table-selection-provider,leads-table-select-all-checkbox}/**
  apps/workspace/src/components/workspace/leads/toolbar/{lead-search-field,lead-facet-filter}/**
  apps/workspace/src/components/workspace/leads/detail/lead-detail-activities/**
  apps/workspace/src/common/constants/ui/workspace-dialog-sizes.ts
```

`apps/web/src/components/shared/form/contact-consent-field` bleibt app-lokal (Web-Fachdomäne) und importiert danach
aus `@invessiv/ui`. Fachliche Badges (`LeadStatusBadge`, `LeadSourceBadge`, `LeadCategoryBadge`), `LeadScoreBar`,
`LeadSocialProfiles` und `leads-table-row` bleiben im Leads-Bereich.

## Tickets (Review-Schritte)

Jeder Schritt: höchstens zwei umgezogene Bausteine, eigene Akzeptanz, danach `pnpm -r lint`, `pnpm -r typecheck` und
die betroffenen Test-Suites grün. Die Reihenfolge ist verbindlich, weil spätere Schritte auf früheren aufbauen.

### Phase 0 — Start

#### CRM-03d-T0 — Status und Regeldateien

- Status `läuft` in Ordner-README und Tabelle `00-entscheidungen.md`.
- `components/workspace/shared/AGENTS.md` (+ `CLAUDE.md` mit `@AGENTS.md`): keine Dictionary-Importe, keine
  Domänenannahmen, Texte als Props, jeder Baustein aus mindestens zwei Bereichen nutzbar, Link-Bindung ist hier erlaubt.
- `packages/AGENTS.md`, Abschnitt `packages/ui`: kein `next/*`, `linkComponent`-Muster, Test-Setup-Pflicht für Dialoge.
- Root-`AGENTS.md`: Index um `apps/workspace/src/components/workspace/shared/` ergänzen.
- **Akzeptanz:** Die Regeln sind vor dem ersten Codeschritt dokumentiert; Index vollständig.

### Phase A — Button und Formular (beide Apps)

#### CRM-03d-T1 — Button nach `packages/ui`, Workspace umstellen

- `ButtonControl`, `ButtonLink`, `PrimaryCtaButton`, `PrimaryCtaLink` nach `packages/ui/src/components/button/`.
- `ButtonLink` ersetzt `useNextLink` durch `linkComponent` (Komponente mit Anchor-Props und `href`); ohne Prop rendert
  es `<a>`.
- CSS nutzt `var(--font-family-base)` sowie neue Tokens `--button-disabled-opacity` und `--button-disabled-filter`.
  `apps/workspace/src/app/globals.css` definiert `--font-family-base` mit dem heutigen Literal und die Disabled-Tokens
  neutral (`1`/`none`).
- 19 Workspace-Nutzer umstellen, Workspace-Kopie löschen. Die Web-Kopie bleibt bis T2 bestehen.
- **Akzeptanz:** zusammengeführter Button-Test in `packages/ui` grün; Workspace-Buttons visuell unverändert inklusive
  Disabled-Zustand.

#### CRM-03d-T2 — Web auf den geteilten Button umstellen

- 17 Web-Nutzer umstellen; `references-closing-cta` übergibt `linkComponent={Link}`.
- `apps/web/src/app/globals.css` definiert `--button-disabled-opacity: 0.5` und `--button-disabled-filter: saturate(0.7)`.
- Web-Kopie löschen.
- **Akzeptanz:** Conversion-Gate: Kontaktformular und LinkedIn-Generator (Submit, Disabled-Zustand, CTA-Ziele) manuell
  geprüft; kein toter CTA; Web visuell unverändert.

#### CRM-03d-T3 — `FormRequiredMarker` und `FormFieldLabel`

- Beide Bausteine nach `packages/ui/src/components/form/`.
- Der Marker erhält `decorative?: boolean` (`true` → `aria-hidden`). Das Web übergibt `decorative` über das Label; der
  Workspace behält den Standard, damit Accessible Names wie „Anzeigename \*" in Bestandstests gleich bleiben.
- Die fachliche Angleichung (Marker immer dekorativ, Pflicht über `required`/`aria-required`) als Follow-up in
  `plans/Todo.md` eintragen.
- Nutzer beider Apps umstellen (Web: `contact-consent-field`, `project-scope-field`), App-Kopien löschen.
- **Akzeptanz:** Accessible Names in beiden Apps unverändert (Bestandstests Import-only grün).

#### CRM-03d-T4 — `FormField`

- Die Web-Variante (`FormFieldKind.Custom`, `labelSuffix`, `labelRow`-Styles) ist die Basis; für den Workspace ist das
  eine rein additive Obermenge.
- Web-Test (Obermenge) und Workspace-Test in `packages/ui` zusammenführen.
- Nutzer umstellen (Web 3, Workspace 6), App-Kopien löschen.
- **Akzeptanz:** Lead-Formular, Bulk-Edit, Rollen-Dialog, Kontaktformular und Generator-Formular visuell und in den
  Tests unverändert.

#### CRM-03d-T5 — `FormStatus` und `FormActions`

- Beide Dateien sind in den Apps identisch; Umzug nach `packages/ui`, Nutzer umstellen, Kopien löschen.
- **Akzeptanz:** Status-Live-Region und Aktionsleiste unverändert; Conversion-Smoke Kontaktformular (Fehler-, Lade- und
  Erfolgszustand).

### Phase B — Dialog

#### CRM-03d-T6 — `Dialog` nach `packages/ui`, Settings umstellen

- `Dialog` mit nativem `<dialog>` gemäß „Dialog-Umstellung im Detail"; `DialogSize` nach `packages/common`.
- `packages/ui/vitest.config.ts`, `dialog-test-setup.ts` und `setupFiles` in beiden App-Configs.
- Alle Nutzer von `WorkspaceDialog` umstellen (heute: Mitglied hinzufügen, Rollen zuweisen, Owner-Wechsel,
  Rollen-Dialog; nach 03c zusätzlich Status- und Übergabedialog). `workspace-dialog/**` löschen.
- `components/workspace/settings/AGENTS.md`: Regel „Dialog-Hülle aus `components/workspace/shared/dialog/`" auf
  `@invessiv/ui` ändern.
- **Akzeptanz:** Dialog-Tests für Escape, `busy`-Sperre, Hintergrundklick, initialen Fokus, Fokus-Rückgabe (Schließen
  und Unmount); Settings-Dialogtests Import-only grün; Settings-Dialoge visuell unverändert.

#### CRM-03d-T7 — Portal-Root für `CustomSelect`

- `Dialog` stellt sein Element über `DialogPortalRootContext` bereit; `CustomSelect` übergibt es an `FloatingPortal`
  (`root`). Außerhalb eines Dialogs bleibt `document.body`.
- **Akzeptanz:** jsdom-Test: `CustomSelect` im `Dialog` rendert die Liste innerhalb des `<dialog>`; manueller
  Browser-Check mit temporärem Test-Harness (nicht committet), dass die Liste im Top-Layer klickbar ist. Bestehende
  `CustomSelect`-Nutzer außerhalb von Dialogen unverändert.

#### CRM-03d-T8 — `ConfirmDialog` und Lead-Löschdialog

- `ConfirmDialog` auf Basis von `Dialog` inklusive `secondaryAction`-Slot.
- `lead-delete-confirm-dialog` nutzt ihn; eigene Overlay-, Portal- und Fokuslogik entfällt, lead-spezifische Texte und
  Mutationen bleiben.
- **Akzeptanz:** Archivieren, Löschen, Fehler- und Busy-Zustand wie bisher; neue ConfirmDialog-Tests.

#### CRM-03d-T9 — Bulk-Archiv- und Bulk-Löschbestätigung

- Beide Dialoge auf `ConfirmDialog` umstellen; die doppelten CSS-Module schrumpfen auf den fachlichen Rest.
- **Akzeptanz:** Bulk-Action-Bar-Tests Import-only grün; Optik unverändert.

#### CRM-03d-T10 — Bulk-Edit-Dialog

- `leads-bulk-edit-dialog` auf `Dialog` umstellen.
- **Akzeptanz:** `leads-bulk-edit-dialog.test.tsx` Import-only grün.

#### CRM-03d-T11 — Outreach-Dialog

- `lead-outreach-dialog` auf `Dialog` umstellen; eigener `portalRoot` entfällt.
- **Akzeptanz:** `lead-outreach-dialog.test.tsx` grün (Fokus im Kontextfeld bleibt über `initialFocusRef`).

#### CRM-03d-T12 — Import-Dialog

- `import-leads-dialog` auf `Dialog` umstellen (Hintergrundklick bleibt aktiv); `import/dialog-footer` bleibt fachlich.
- **Akzeptanz:** `import-leads-dialog.test.tsx` grün, Escape als `cancel` (benannte Ausnahme).

#### CRM-03d-T13 — Lead-Formular-Dialog und Abbau der Fokusfalle

- `lead-form-dialog` auf `Dialog` umstellen (`closeOnBackdropClick={false}`, Fokus auf das erste verfügbare Feld über
  `initialFocusRef`).
- `dialog-focus-trap.ts` löschen; Suche belegt: kein `createPortal` und kein `aria-modal`-Eigenbau mehr in Dialogen.
  Die mobile Sidebar ist kein Dialog-Baustein und bleibt unberührt.
- **Akzeptanz:** `lead-form-dialog.test.tsx` grün mit den benannten Ausnahmen; Tastatur-Smoke im Browser (Öffnen,
  Tab-Reihenfolge, Escape, Fokus-Rückgabe auf den Auslöser).

### Phase C — Anzeige-Bausteine

#### CRM-03d-T14 — `EmptyState` und `ListEmptyState`

- `EmptyState` in `packages/ui` (Icon, Titel, Beschreibung, Aktions-Slot, `variant` über `data-*`).
- `components/workspace/shared/table/list-empty-state` bindet die Link-Aktion an `next/link` und ersetzt
  `leads-empty-state`; das Const-Objekt `LeadsEmptyStateVariant` wird zu einer generischen Variante (Umbenennung samt
  Test).
- `roles-list` und `add-member-dialog` nutzen `EmptyState` statt Inline-Markup.
- **Akzeptanz:** Leads „nichts angelegt"/„keine Treffer" und beide Settings-Empty-States visuell unverändert; ohne
  `actionHref` wird keine Aktion gerendert (kein toter Button).

#### CRM-03d-T15 — `Badge`

- `Badge` in `packages/ui` übernimmt `lead-badge` (Styles und Tones 1:1); `BadgeTone` nach `packages/common`.
- `LeadStatusBadge`, `LeadSourceBadge`, `LeadCategoryBadge` rendern `Badge`; `kind` und `categoryKey` bleiben als
  durchgereichte `data-*`-Attribute erhalten, falls Selektoren oder Tests sie nutzen (im Schritt per Suche prüfen).
  `lead-badge/**` und der Barrel-Eintrag entfallen.
- **Akzeptanz:** `lead-badge.test.tsx` und `lead-status-badge.test.tsx` grün (Import-only oder nach `packages/ui`
  verschoben); alle Tones in Dark/Light unverändert.

#### CRM-03d-T16 — `DefinitionList` und `DetailSection`

- `DefinitionList` (`items` oder Kinder mit Label/Wert) und `DetailSection` (Überschrift mit `id`, Aktions-Slot,
  Inhalt) in `packages/ui`.
- `lead-detail-panel` ersetzt die lokale `DetailField`-Komponente und das Sektions-Markup.
- **Akzeptanz:** `lead-detail-panel.test.tsx` Import-only grün; `aria-labelledby` der Sektionen unverändert;
  Screenshot-Vergleich des Panels.

#### CRM-03d-T17 — `SidePanel`

- `SidePanel` in `packages/ui`: `<aside>` mit Kopf (Eyebrow, Titel, Aktions-Slot, Schließen-Button), Inhalt und
  responsivem Verhalten des heutigen Lead-Panels.
- Opt-in-Props `closeOnEscape` und `focusOnOpen` (Fokus beim Öffnen ins Panel, beim Schließen zurück); Leads aktiviert
  sie nicht, Ordner 04 schon.
- `lead-detail-panel` nutzt `SidePanel` als Hülle; die URL-gesteuerte Schließ-Navigation bleibt im Lead-Code.
- **Akzeptanz:** SidePanel-Tests für die Opt-in-Props; Lead-Panel-Verhalten und -Optik unverändert (Desktop, ≤ 1024 px,
  ≤ 520 px).

### Phase D — Listenbausteine nach `components/workspace/shared/` (ersetzt Task 02a)

#### CRM-03d-T18 — `SortableHeader`

- `leads/table/sortable-header` → `shared/table/sortable-header`; Beschriftungen als Props.
- **Akzeptanz:** Sortierung in `leads-table.test.tsx` Import-only grün.

#### CRM-03d-T19 — `ListPagination`

- `leads-pagination` (+ `utils`, Test) → `shared/table/list-pagination`.
- **Akzeptanz:** Pagination-Test Import-only grün.

#### CRM-03d-T20 — `ListSelectionProvider` und `ListSelectAllCheckbox`

- Provider samt Context und Select-All-Checkbox → `shared/table/`.
- **Akzeptanz:** Selection-Provider-Test Import-only grün; Selection leert sich weiter bei Filter-, Sortier- und
  Seitenwechsel.

#### CRM-03d-T21 — `ListSearchField`

- `lead-search-field` → `shared/toolbar/list-search-field`; Verzögerung und Beschriftungen als Props.
- **Akzeptanz:** Suche in der Lead-Liste verhält sich identisch (Verzögerung, Löschen, URL-State).

#### CRM-03d-T22 — `FacetFilter` mit Mehrfachauswahl

- `lead-facet-filter` → `shared/toolbar/facet-filter`; `activeValues: readonly string[]`,
  `selectionMode: "single" | "multiple"` als Const-Objekt in `apps/workspace/src/common/constants/`.
- Leads nutzt `single` und übergibt null oder einen Wert.
- **Akzeptanz:** Lead-Filter unverändert; neuer Komponententest für `multiple` (zwei wählen, einen entfernen, alle
  leeren, `aria-pressed`, Live-Region).

#### CRM-03d-T23 — `ActivityTimeline`

- `lead-detail-activities` → `shared/activity/activity-timeline`; Einträge, Typ-Symbole, Beschriftungen und
  Datumsformatierung als Props; Metadaten über übergebene Type-Wächter.
- `lead-detail-panel` übergibt seine bisherigen Texte und Symbole.
- **Akzeptanz:** `lead-detail-activities.test.tsx` Import-only grün; unbekannter Aktivitätstyp ergibt eine
  verständliche Zeile.

### Phase E — Abschluss

#### CRM-03d-T24 — Nachweis und Übergabe

- `components/workspace/leads/AGENTS.md`: Subfolder-Tabelle und Regel 15 („Reuse") auf die geteilten Orte verweisen.
- Suchen belegen: kein Import aus gelöschten Pfaden, kein `next/*` in `packages/ui`, kein `createPortal` in Dialogen.
- Visueller Gesamtcheck Mobil/Dark/Light: Leads (Liste, Panel, alle sieben Dialoge), Settings (Listen, alle Dialoge),
  Web (Startseite, Kontaktformular, LinkedIn-Generator, Referenzen-CTA).
- A11y-Smoke: Tastatur, Fokus-Reihenfolge und Kontrast für Dialoge, Panel, Kontaktformular.
- Status `im Review` in README und Tabelle; PR mit Testplan, Screenshots, benannten Testausnahmen, Dateizahl und
  Rollback.
- **Akzeptanz:** `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/workspace build` und
  `pnpm --filter @invessiv/web build` grün.

## Umfangskontrolle

| Phase | Schritte | Geschätzte Dateien (Umbenennungen zählen einfach) |
| ----- | -------- | ------------------------------------------------: |
| 0     | T0       |                                                ~5 |
| A     | T1–T5    |                                             80–85 |
| B     | T6–T13   |                                             40–45 |
| C     | T14–T17  |                                             25–30 |
| D     | T18–T23  |                                             30–35 |
| E     | T24      |                                               3–5 |
|       |          |                               **170–195 (≤ 200)** |

- Gemessen wird nach jedem Schritt mit `git diff --stat master...HEAD`.
- **Checkpoint nach Phase C:** Liegt der Stand über 160 Dateien, wird vor Phase D gestoppt und mit dem Nutzer
  entschieden, ob Phase D als eigener Ordner 03e ausgegliedert wird. Phase D ist bewusst so geschnitten, dass sie ohne
  Änderung an A–C abtrennbar ist.
- Die harte Grenze von 200 Dateien wird in keinem Fall überschritten.

## Deploy-Sicherheit

1. **Live sichtbar:** nichts. Web, Leads und Settings sehen gleich aus und verhalten sich gleich.
2. **Bricht nichts:** Gelöschte Altpfade lassen den Typecheck bei jedem übersehenen Import scheitern. Unveränderte
   Bestandstests belegen die Verhaltensgleichheit, benannte Ausnahmen belegen das native Dialogverhalten.
3. **Browser-Voraussetzung:** `<dialog>`/`showModal()` und `::backdrop`-Vererbung von Custom Properties sind in allen
   aktuellen Evergreen-Browsern verfügbar. Die Umstellung wird in T6 und T13 in Chromium, Firefox und WebKit
   (Playwright) manuell geprüft.
4. **Offen:** nichts. Mehrfachauswahl, Portal-Root und Panel-Opt-ins sind vorhanden, aber erst ab Ordner 04/05 aktiv.

## Nicht Teil dieses Tasks

- Visuelles Redesign oder Angleichung der Button-Optik zwischen Web und Workspace.
- Fachliche A11y-Änderung des Pflichtmarkers (Follow-up aus T3).
- Mobile Workspace-Sidebar (`workspace-sidebar`) auf `<dialog>` umstellen.
- Lead-spezifische Bausteine (`LeadScoreBar`, `LeadSocialProfiles`, `improvements-list-editor`, `leads-table-row`)
  verallgemeinern.
- `Owner-Wechsel`-Dialog auf `ConfirmDialog` umstellen; er nutzt `Dialog` und ist damit keine Doppelimplementierung.
- Kundenliste, Kundenakte und Kundendialoge — Ordner 04.

## Rollback

Reiner Code-Revert; keine Migration, keine Datenänderung. Weil jeder Review-Schritt einzeln grün ist, kann im Review
auch gezielt ab einem Schritt zurückgerollt werden (etwa die Phase-D-Commits), ohne frühere Schritte anzufassen.
