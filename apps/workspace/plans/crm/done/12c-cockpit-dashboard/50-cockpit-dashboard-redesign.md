# Task 50 — Cockpit-Redesign: Dashboard statt Formular-Stapel

> **Status:** läuft · **Abhängigkeiten:** 07, 08, 12b · **Branch:** `feat/cockpit-ui-redesign`

## Context

Das Kunden-Cockpit (`CustomerCockpitDialog` → `CustomerCockpitView`, geöffnet über `/crm?cockpit=<id>`)
hat nahezu alle Funktionen, ist aber unübersichtlich: Der Kundenname steht dreimal da (Dialog-Titel,
Hero, oft identischer Hauptansprechpartner), Status/Zuständig/Kontakt belegen drei große Karten, die
Projektauswahl ist eine sperrige Sidebar-Liste, und Portalzugang/Zugriff sind permanent ausgeklappt.
Man wird von Aktionen erschlagen, statt auf einen Blick zu sehen, was zu tun ist.

Ziel: Das Cockpit ist in UI und UX deutlich besser nutzbar und ähnelt einem übersichtlichen
Dashboard. **Keine bestehende Funktion geht verloren**, sie wird nur neu angeordnet. Reine
UI-Überarbeitung: keine Server-, Permission- oder Datenmodelländerung, keine neuen Dependencies.

Zusätzlich bekommen die noch offenen Roadmap-Bereiche aus `apps/workspace/plans/crm/14–20` schon jetzt
ihren festen Platz als klar gekennzeichnete Mocks ohne Funktion, damit das Layout später nicht erneut
umgebaut werden muss.

### Mit dem User abgestimmte Entscheidungen

| Thema            | Entscheidung                                                                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fenster          | Vollbild-Dialog, füllt den Inhaltsbereich unter dem Workspace-Header randlos; App-Navigation bleibt sichtbar                                                                |
| Seitenraster     | **Zwei Spalten**: links groß der Projektbereich, rechts schmalere Spalte mit den Kundenbereichen                                                                            |
| Chat             | **Ein** ausklappbarer Kundenchat-Dock am äußersten rechten Rand des Dialogs (Plan 17/18: ein Chat pro Kunde); keine separate Kundenchat-Kachel, kein Chat pro Projekt       |
| Kopf             | Kompakte Meta-Zeile + **Kennzahl-Chips** (echte: Kundenwert, offene/überfällige Aufgaben; Mock: Stunden übrig, Feedback offen)                                              |
| Projektauswahl   | Horizontale Tabs                                                                                                                                                            |
| Projekt-Bereiche | Aufgaben offen, Leistungen eingeklappt; Mocks Feedbackrunden + Onboarding-Bogen darunter                                                                                    |
| Kundenbereiche   | Inline, standardmäßig eingeklappt, **nach Thema gruppiert**: „Zusammenarbeit“ (Dateien, Stunden & Verlauf) und „Zugänge & Sicherheit“ (Portalzugang, Zugriff, Zugangsdaten) |
| Roadmap-Bereiche | Sichtbar als Mock („Bald verfügbar“), ohne Daten, ohne Aktionen, nur auf-/zuklappbar                                                                                        |

## Zielbild

```
┌───────────────────────────────────────────────────────────────────┬──┐
│ K0001                                                        [x]  │  │
│ Andrea Klug                                                       │  │
├───────────────────────────────────────────────────────────────────┤C │
│ ● Aktiv · 👤 Moritz Hecht · ✉ Andrea Klug, lead-028@…             │h │
│ [€ 2.400 einmalig · 90 €/Monat] [3 offene Aufgaben · 1 überfällig]│a │
│ [Stunden übrig — bald] [Feedback offen — bald]                    │t │
├──────────────────────────────────────────┬────────────────────────┤  │
│ [Projekt A ●] [Projekt B ●]        [+]   │ ZUSAMMENARBEIT         │▸ │
│ Geplant · Projekt A          [↗] Zust.:… │ ▸ Dateien       [bald] │  │
│ Onboarding ● Design ○ Entwicklung ○ …    │ ▸ Stunden & Verlauf    │  │
│ ▾ Aufgaben (3)          [Aufgabe anlegen]│ ZUGÄNGE & SICHERHEIT   │  │
│   Neue Aufgabe …                          │ ▸ Portalzugang [Einl.] │  │
│ ▸ Leistungen (2)      [Leistung zuweisen]│ ▸ Zugriff  [Zugr. geb.]│  │
│ ▸ Feedbackrunden               [bald]    │ ▸ Zugangsdaten  [bald] │  │
│ ▸ Onboarding-Bogen             [bald]    │                        │  │
└──────────────────────────────────────────┴────────────────────────┴──┘
```

Breakpoints: ≥ 1100 px drei Bereiche nebeneinander (Hauptspalte · Kundenspalte · Chat-Randreiter).
Unter 1100 px wandert die Kundenspalte unter den Projektbereich. Unter 760 px ist alles einspaltig,
und der Chat wird zu einem ausklappbaren Balken am unteren Rand.

## Leitprinzip: ein Abschnittsmuster für alle Bereiche

Am Ende gibt es 4 Projekt-Abschnitte (Aufgaben, Leistungen, Feedbackrunden, Onboarding-Bogen) und
5 Kunden-Abschnitte (Dateien, Stunden & Verlauf, Portalzugang, Zugriff, Zugangsdaten). Alle folgen
demselben Kopf-Aufbau: Titel · Anzahl-Badge · optionale Primäraktion · Auf-/Zuklapp-Toggle. Dafür gibt es
eine kleine gemeinsame Toggle-Komponente. Bei neun Verwendungen ab dem ersten Tag ist das keine
vorzeitige Abstraktion, und jeder weitere Roadmap-Bereich lässt sich später ohne Layoutumbau einfügen.

Zwei Regeln für alle Abschnitte:

1. **Der Kopf bleibt immer sichtbar, auch eingeklappt.** Primäraktionen (Aufgabe anlegen, Leistung
   zuweisen, Kontakt einladen, Zugriff geben) funktionieren ohne vorheriges Aufklappen.
2. **Die Unterdialoge liegen außerhalb des einklappbaren Körpers.** Einladen, Zugriff geben, Leistung
   zuweisen, Aufgabe anlegen/bearbeiten, Rollen und Widerruf öffnen sich auch bei eingeklapptem
   Abschnitt. Das gilt auch für das „Zugriff geben“ aus dem Owner-Badge in der Meta-Zeile, das
   `CustomerAccessSection` per `key`/`requestedMemberId` neu mountet. Der bestehende Unit-Test dafür
   muss grün bleiben.

## Umsetzung

### 1. Vollbild-Dialog (`packages/ui/src/components/dialog/dialog/dialog.module.css`)

`DialogSize.Full` hat genau einen Konsumenten, das Cockpit (per grep bestätigt).

- `.dialog:has(.surface[data-size="full"])`: Padding auf `var(--workspace-header-height, 68px) 0 0`.
  Die Fläche beginnt direkt unter dem App-Header und reicht randlos bis an die übrigen Kanten. (`:has()` wird im
  Workspace schon genutzt, z. B. in `workspace-shell.module.css`.)
- `.surface[data-size="full"]`: zusätzlich `border: 0; box-shadow: none`.
- Gleiche Übersteuerung im bestehenden `@media (max-width: 560px)`-Block mit `64px`, dem mobilen Wert aus
  `workspace-shell.module.css`.
- `.surface[data-size="full"] .body`: Padding `0`. Die Cockpit-Ansicht bringt ihr eigenes Raster und
  eigene Scrollbereiche mit.
- Fallback `60px` → `68px` angleichen (weicht bisher vom echten Token ab). Im PR als Nebenkorrektur
  nennen.
- Den Footer des Cockpit-Dialogs (Button „Schließen“) entfernen: Das X im Kopf reicht, und im
  Vollbild kostet der Footer nur Höhe. `footer` ist im `Dialog` Pflicht-Prop; deshalb `footer` in
  `DialogProps` optional machen und `<footer>` nur rendern, wenn übergeben. `initialFocusRef` zeigt
  dann nicht mehr auf den Footer-Button. Ohne Ref landet der Fokus beim nativen `showModal()` auf dem
  ersten fokussierbaren Element, also dem X-Button. Das ist in Ordnung.

### 2. Kopf: Identität, Meta-Zeile, Kennzahl-Chips

**`customer-cockpit-dialog.tsx`**

- `eyebrow={formatCustomerNumber(customer.customerNumber)}` (bisher ungenutzte Dialog-Prop).
- `showHeading={false}` an `CustomerCockpitView`.

**`customer-cockpit-view.tsx` + `.module.css`**

- Neue Prop `showHeading?: boolean` (Default `true`). Die im JSDoc versprochene Standalone-Ansicht
  behält so ihre Überschrift. Bei `false` entfallen Nummer-Chip und `<h2>` im Hero.
- Die drei umrandeten Karten (Status / Zuständig / Hauptansprechpartner) werden zu **einer Meta-Zeile**
  mit Icon, Label und Wert pro Eintrag, `flex-wrap`, ohne Kartenrahmen. `OwnerWithoutAccessBadge`
  bleibt am Zuständig-Eintrag, mailto bzw. `noEmail` am Kontakt.
- Darunter die **Kennzahl-Chips**:
  - _Kundenwert_: aus `projectLineItems.customerValue`, heute schon so vorhanden. Nur sichtbar, wenn die
    Page die Daten übergibt.
  - _Offene Aufgaben (davon überfällig)_: aus `tasks.tasks` + `tasks.today`. Nur sichtbar, wenn `tasks`
    übergeben wird.
  - _Stunden übrig_ und _Feedback offen_: Mock-Chips mit „Bald verfügbar“-Badge und Wert „—“. **Keine
    erfundenen Zahlen.**
- Offene und überfällige Aufgaben werden nicht in der Komponente gezählt. Stattdessen bekommt
  `taskDueStateService` (`src/lib/workspace/crm/task-due-state-service.ts`) eine Funktion
  `summarize(tasks, today)`, die auf `isStillOpen` und `dueState` aufsetzt. Laut Crm-AGENTS.md ist
  dieser Service die einzige Definition von „überfällig“. Der Rückgabetyp `TaskSummary` liegt in
  `apps/workspace/src/common/contracts/crm/`. Dazu kommt ein Unit-Test im bestehenden Service-Test.
- CSS: `.grid`, `.section`, `.contact` und deren Mobile-Overrides entfernen. Neu kommen `.metaRow`,
  `.metaItem`, `.kpiRow`, `.kpi` und `.kpi[data-mock]` (gestrichelter Rahmen, gedämpfte Farbe), nur mit
  bestehenden Tokens.

### 3. Seitenraster in `CustomerCockpitView`

- Wurzel-Layout per CSS-Grid mit den Bereichen `head` (Meta + KPIs, volle Breite), `main`
  (Projektbereich), `aside` (Kundenbereiche) und `chat` (Dock).
- ≥ 1100 px: `grid-template-columns: minmax(0, 1fr) minmax(18rem, 24rem) auto`. `main` und `aside`
  scrollen jeweils eigenständig (`overflow: auto`, Höhe = verfügbare Dialoghöhe). So bleiben die
  Kundenspalte und der Chat beim Scrollen der Aufgaben stehen.
- < 1100 px: `aside` unter `main`, eine Scrollfläche. < 760 px: siehe Chat (Punkt 6).
- Die `aside` bekommt `container-type: inline-size`. `PortalAccessSection` und `CustomerAccessSection`
  sind bisher für breite Flächen gebaut. Ihre `.module.css` erhalten Container-Queries, damit Kopf,
  Buttons und Listen in einer schmalen Spalte umbrechen statt überzulaufen. Beim Umsetzen prüfen,
  welche Regeln dort feste Mehrspaltigkeit erzwingen.
- Gruppen in der `aside`: `<div role="group" aria-labelledby>` mit gedämpftem Gruppen-Label (`<p>`,
  keine Überschrift, damit die bestehende h3-Hierarchie der Abschnitte intakt bleibt). Reihenfolge:
  1. **Zusammenarbeit**: Dateien (Mock), Stunden & Verlauf (Mock)
  2. **Zugänge & Sicherheit**: Portalzugang (echt), Zugriff (echt), Zugangsdaten (Mock)

  Echte Abschnitte werden weiterhin nur gerendert, wenn die Page ihre Props übergibt. Eine Gruppe
  ohne echte Abschnitte zeigt nur ihre Mocks.

### 4. Projektauswahl als Tabs: `ProjectSwitcherTabs`

**Neu:** `apps/workspace/src/components/workspace/crm/projects/project-switcher-tabs/` (`.tsx`, `.module.css`,
`.test.tsx`)

- Folgt der Konvention aus `settings/members/member-roles-tabs/member-roles-tabs.tsx` (`role="tablist"`/
  `"tab"`, `aria-controls`/`aria-selected`, Roving-`tabIndex`, Pfeiltasten/Home/End), mit einem Ref-Array
  für beliebig viele Tabs.
- **Der zugängliche Name des Tabs ist exakt der Projekttitel.** `tasks.e2e.ts` klickt
  `getByRole("tab", { name: <Titel>, exact: true })`. Der Status erscheint als `aria-hidden`-Punkt,
  der Statustext ist visuell versteckt und über `aria-describedby` verbunden.
- Props: `activeProjectId`, `onSelectAction`, `projects`, `statusLabels`, `tabsLabel`.
- `customer-projects-section.tsx`:
  - `<aside className={styles.sidebar}>` samt Switcher-CSS entfernen. Neu ist eine Tab-Leiste mit
    `ProjectSwitcherTabs` und dem bestehenden „+“-Button (außerhalb der `tablist`).
  - `<main className={styles.projectCanvas}>` wird zu `<div role="tabpanel" id aria-labelledby>`. Ein
    `<main>` in einem Dialog ist semantisch falsch.
  - „Bearbeiten“ (↗) wandert aus jeder Tab-Zeile in den Projektkopf, rechts neben den Owner-Block. Es
    wird nur bei `canWrite && activeProjectDetails` gezeigt.
  - `.workspace` wird einspaltig: Tab-Leiste oben, Canvas darunter. Die Tab-Leiste bekommt
    `overflow-x: auto` und wird auf engen Bildschirmen horizontal scrollbar.
  - Der Leerzustandstext erscheint nur noch einmal, im Canvas.
- Reihenfolge im Canvas: Kopf → Phasenleiste (unverändert) → **Aufgaben** (offen) → **Leistungen**
  (zu) → **Feedbackrunden** (Mock) → **Onboarding-Bogen** (Mock). Aufgaben stehen damit vor Leistungen,
  bisher war es umgekehrt.
- Den `.areaPreview`-Block (Projektchat „kommt bald“) ersatzlos entfernen. Der Chat wandert in den
  Dock (Punkt 6).

### 5. Abschnitte ein-/ausklappbar

**Neu:** `apps/workspace/src/components/workspace/crm/shared/section-collapse-toggle/` (`.tsx`,
`.module.css`, `.test.tsx`). Rein präsentational: Props `controls`, `expanded`, `onToggleAction`,
`labelExpand`, `labelCollapse`. Button mit `aria-expanded`/`aria-controls`, `faChevronDown` mit
Rotation über `data-expanded`, `prefers-reduced-motion` wird respektiert, sichtbarer Fokus.

**Bestehende Abschnitte** (lokaler `expanded`-State, wie beim vorhandenen `showClosed` in
`ProjectTasksSection`):

| Datei                                                                | Default | Bleibt im Kopf sichtbar            | Klappt ein                                                                     |
| -------------------------------------------------------------------- | ------- | ---------------------------------- | ------------------------------------------------------------------------------ |
| `tasks/project-tasks-section/project-tasks-section.tsx`              | offen   | Titel, Anzahl, „Aufgabe anlegen“   | Quick-Create, Listen, Leerzustand (der `showClosed`-Toggle bleibt unverändert) |
| `projects/project-line-items-section/project-line-items-section.tsx` | zu      | Titel, Anzahl, „Leistung zuweisen“ | Wertzeile, Liste, Leerzustand                                                  |
| `portal-access/portal-access-section/portal-access-section.tsx`      | zu      | Titel, „Kontakt einladen“          | Intro, Liste, Leerzustand, Fehlermeldung                                       |
| `detail/customer-access-section/customer-access-section.tsx`         | zu      | Titel, „Zugriff geben“             | Eyebrow/Beschreibung, Gruppen, `emptyMembers`                                  |

In allen vier Dateien bleiben die Unterdialoge außerhalb des Körpers (Leitprinzip, Regel 2).
`CustomerAccessSection` zeigt im Eyebrow die Kundennummer. Die steht jetzt schon im Dialogkopf,
deshalb wandert das Eyebrow in den Körper.

**Mock-Abschnitte.** **Neu:** `apps/workspace/src/components/workspace/crm/shared/mock-section-card/`
(`.tsx`, `.module.css`, `.test.tsx`)

- Props: `title`, `badgeLabel`, `body`, `labelExpand`, `labelCollapse`. Eigener `expanded`-State (Default zu),
  `useId()`.
- Kopf mit Badge „Bald verfügbar“ und Toggle, **ohne Primäraktion**. Das Fehlen der Aktion ist Teil des
  Signals. Körper: ein gedämpfter Satz, wofür der Bereich gedacht ist.
- Visuelle Abgrenzung: gestrichelter Rahmen, gedämpfte Titel-Farbe, Badge wie die Kundennummer-Chip,
  aber gestrichelt.
- Keine Daten-Props, keine Client-Services, keine weiteren Controls.
- Instanzen: Projektebene Feedbackrunden und Onboarding-Bogen (in `customer-projects-section.tsx`,
  immer bei aktivem Projekt). Kundenebene Dateien, Stunden & Verlauf und Zugangsdaten (in
  `customer-cockpit-view.tsx`).

### 6. Kundenchat-Dock (Mock)

**Neu:** `apps/workspace/src/components/workspace/crm/detail/customer-chat-dock/` (`.tsx`, `.module.css`, `.test.tsx`)

Der Dock liegt unter `detail/`, weil er zum Cockpit auf Kundenebene gehört (Plan 17: eine Conversation
pro Kunde, `project_id` optional). Die echte Umsetzung in Ordner 17/18 ersetzt den Mock-Inhalt an
genau dieser Stelle.

- Eingeklappt ist er ein schmaler, vertikaler Randreiter (~3 rem) ganz rechts im Dialog: Chat-Icon,
  gedrehtes Label „Kundenchat“, Chevron, eigener Toggle mit `aria-expanded`/`aria-controls`.
- Ausgeklappt wird er ein Panel von ~22 rem. Ab 1400 px schiebt es das Raster zusammen (Spaltenbreite über
  `data-expanded`). Zwischen 1100 und 1400 px legt es sich über die Kundenspalte,
  damit die Hauptspalte nicht zu schmal wird. Die Transition ist durch `prefers-reduced-motion`
  abgesichert.
- Unter 760 px ist der Dock ein Balken am unteren Rand des Dialogs, der sich auf ~70 % Höhe
  ausklappt.
- Inhalt (reiner Mock):
  - Kopf mit Titel, Badge „Bald verfügbar“ und dem Hinweis „Der Kunde liest später mit“. Den
    verlangt Plan 17 als unübersehbaren Hinweis, hier als Mock-Text.
  - 3 statische Skeleton-Blasen (`aria-hidden`) im Wechsel links/rechts, ohne erfundene Namen,
    Zeiten oder Texte.
  - Deaktiviertes Eingabefeld mit deaktiviertem Senden-Button.
- **Kein Ungelesen-Badge.** Kein Platzhalterpunkt, keine Zahl. Die Stelle am Randreiter bleibt frei;
  ein falscher Zustand wird nicht vorgetäuscht.
- Die Dictionary-Keys `projects.areas.chat`, `projects.areas.services` und `projects.comingSoon`
  sind danach unbenutzt (grep: einzige Nutzung ist der entfernte `.areaPreview`-Block). Sie werden
  entfernt. Dafür kommen neue Keys unter `chat.*`.

### 7. i18n (DE + EN parallel; `Record<Locale, typeof de>` erzwingt Parität im Typecheck)

Texte werden beim Umsetzen mit dem Pflicht-Skill `copywriting` finalisiert. Die folgenden Keys sind
die Struktur, Formulierungen nur Vorschläge.

- `crm/cockpit/{de,en}.json`
  - `mock.badge`: „Bald verfügbar“ / „Coming soon“
  - `groups.collaboration`: „Zusammenarbeit“ / „Collaboration“
  - `groups.accessSecurity`: „Zugänge & Sicherheit“ / „Access & security“
  - `kpis.customerValue`, `kpis.openTasks`, `kpis.overdueTasks`, `kpis.hoursLeft`,
    `kpis.openFeedback`, `kpis.mockValue` („—“)
  - `futureSections.files | hours | credentials` mit je `title`, `body`, `expandLabel`,
    `collapseLabel`
  - `projects.futureAreas.feedback | onboarding` mit derselben Struktur
  - `projects.tabsLabel`: „Projekte dieses Kunden“
  - `chat.title`: „Kundenchat“, `chat.readAlong`, `chat.inputPlaceholder`, `chat.send`,
    `chat.expand`, `chat.collapse`
  - Entfernen: `projects.areas`, `projects.comingSoon`
- `crm/tasks`, `crm/project-line-items`, `crm/portal-access`, `crm/access`: je
  `expandLabel`/`collapseLabel` am passenden Ort (`section.*` bzw. Top-Level bei portal-access).

Die Mock-Texte liegen bewusst im `cockpit`-Dictionary. Eigene Domain-Dictionaries entstehen erst mit
den echten Funktionen.

### 8. Doku (Projektregel: erst Plan und scoped AGENTS.md, dann Code)

- Diesen Plan als `apps/workspace/plans/crm/50-cockpit-dashboard-redesign.md` ablegen (Nummer vorher im
  Ordner prüfen).
- `apps/workspace/src/components/workspace/crm/AGENTS.md` um einen Abschnitt „Cockpit-Layout“
  ergänzen:
  - Die zwei Abschnittsregeln (Kopf immer sichtbar, Dialoge außerhalb des Körpers).
  - `SectionCollapseToggle` als einziger Toggle-Weg.
  - Mock-Abschnitte nur über `MockSectionCard`: ohne Daten, ohne Aktion, immer mit Badge.
  - Der Chat-Dock ist der Andockpunkt für Ordner 17/18.
  - Neue Roadmap-Bereiche ersetzen ihre Mock-Karte an derselben Stelle.
- Die Gruppen-Liste unter „Struktur“ in derselben Datei um `shared/section-collapse-toggle`,
  `shared/mock-section-card` und `detail/customer-chat-dock` ergänzen.
- Bei der Umsetzung sind die Pflicht-Skills `frontend-design` (Frontend) und `copywriting` (Texte)
  anzuwenden.

### 9. Tests

**Bestehende Tests anpassen**

- `customer-cockpit-view.test.tsx`:
  - Leerzustand der Projekte `toHaveLength(2)` → `1`.
  - Neue Fälle für `showHeading={false}` und für die KPI-Chips (echt ausgeblendet, wenn Daten fehlen;
    Mock-Chips ohne Zahl).
  - Der Owner-Badge-Test (Zugriff-Dialog öffnet sich) muss bei eingeklapptem Zugriffsabschnitt grün
    bleiben.
- `project-line-items-section.test.tsx`: Default ist jetzt eingeklappt. Tests, die in den Körper
  schauen, klappen vorher auf. Neuer Test: Körper vorher nicht vorhanden, „Leistung zuweisen“ trotzdem
  bedienbar.
- `project-tasks-section.test.tsx`: Neuer Test für den Top-Level-Toggle, getrennt vom
  `showClosed`-Toggle.
- `portal-access-section.test.tsx` und `customer-access-section.test.tsx`: Aufklappen vor
  Körper-Assertions. Neuer Test: Der Einladen- bzw. Zugriff-Dialog öffnet sich bei eingeklapptem
  Abschnitt.
- Test zu `task-due-state-service`: `summarize` (offen, überfällig, erledigt/abgebrochen zählen nicht).

**Neue Tests**

- `section-collapse-toggle`, `mock-section-card`, `project-switcher-tabs` (Tastatur, Wrap-Around,
  Roving-`tabIndex`, Name == Titel), `customer-chat-dock` (standardmäßig zu, Toggle, Eingabe/Senden
  `disabled`, kein Ungelesen-Element im DOM), `customer-projects-section` (existiert noch nicht: Tabs
  wechseln das Canvas, „+“ nur mit `canWrite`, Bearbeiten im Projektkopf, Mocks sichtbar),
  `customer-cockpit-dialog` (existiert noch nicht: Eyebrow = Kundennummer, Name nur einmal, kein
  Footer).

**E2E** (laufen gegen echte Sessions und werden nicht umgeschrieben, müssen aber weiter passen)

- `e2e/tasks.e2e.ts`: exakter Tab-Name und sichtbares Quick-Create (Aufgaben ist per Default offen).
- `e2e/portal-access.e2e.ts`: „Kontakt einladen“ ist im Kopf sichtbar, der Dialog öffnet bei
  eingeklapptem Abschnitt.
- `e2e/access-scopes.e2e.ts`: prüft nur Statuscodes, nicht betroffen.

## Reihenfolge (kleine, jeweils grüne Schritte)

1. Plan-Doku + AGENTS.md-Ergänzung (Punkt 8).
2. Dialog-Chrome in `packages/ui`, inklusive optionalem Footer.
3. Kopf: `showHeading`, Eyebrow, Meta-Zeile, `taskDueStateService.summarize` + KPI-Chips.
4. Seitenraster (`main`/`aside`/`chat`-Slot, noch ohne Dock) + Container-Queries für Portal- und
   Zugriffsabschnitt.
5. `SectionCollapseToggle` + Einbau in die 4 bestehenden Abschnitte + Test-Anpassungen.
6. `ProjectSwitcherTabs` + Umbau `customer-projects-section.tsx` (Tabs, Bearbeiten im Kopf, neue
   Reihenfolge, `.areaPreview` weg).
7. `MockSectionCard` + 5 Instanzen + Gruppen in der Kundenspalte.
8. `CustomerChatDock` + Breakpoint-Verhalten; alte Chat-Keys entfernen.
9. Abschluss: Typecheck, Lint, Tests, Build, visuelle QA.

## Was sich nicht ändert

- `crm/page.tsx`, alle Query-Handler und die Permission-Logik. Was gerendert wird, entscheidet
  weiterhin allein die Page über die übergebenen Props.
- Inhalte und Verhalten aller Unterdialoge (Projekt-, Leistungs- und Aufgabenformular, Einladen,
  Rollen, Widerruf, Zugriff, Verwerfen).
- Keine neuen Dependencies (FontAwesome ist bereits vorhanden).

## Kritische Dateien

- `apps/workspace/src/components/workspace/crm/detail/customer-cockpit-view/customer-cockpit-view.tsx` (+ `.module.css`)
- `apps/workspace/src/components/workspace/crm/detail/customer-cockpit-dialog/customer-cockpit-dialog.tsx`
- `apps/workspace/src/components/workspace/crm/projects/customer-projects-section/customer-projects-section.tsx` (+
  `.module.css`)
-

`apps/workspace/src/components/workspace/crm/{tasks/project-tasks-section,projects/project-line-items-section,portal-access/portal-access-section,detail/customer-access-section}/*`

- `packages/ui/src/components/dialog/dialog/dialog.tsx` + `dialog.module.css`
- `apps/workspace/src/lib/workspace/crm/task-due-state-service.ts`
-

`apps/workspace/src/i18n/dictionaries/workspace/crm/{cockpit,tasks,project-line-items,portal-access,access}/{de,en}.json`

- Neu: `crm/shared/section-collapse-toggle/`, `crm/shared/mock-section-card/`,
  `crm/projects/project-switcher-tabs/`, `crm/detail/customer-chat-dock/`

## Verifikation

1. `pnpm -r typecheck` (inklusive DE/EN-Parität der Dictionaries) und `pnpm -r lint`.
2. `pnpm -r test`, zuerst gezielt die geänderten und neuen `*.test.tsx`.
3. `pnpm --filter @invessiv/workspace build`.
4. Visuelle QA über den Dev-Server mit Playwright-MCP, `/de/crm?cockpit=<id>`:
   - Dark und Light; Breiten 1440, 1200, 900 und 390 px.
   - Name steht nur einmal da; Kopf, Meta-Zeile und Chips sind kompakt.
   - Tabs per Tastatur bedienbar.
   - Default-Zustände: Aufgaben offen, alles andere zu.
   - Primäraktionen funktionieren bei eingeklapptem Abschnitt.
   - Chat-Dock auf/zu an allen Breakpoints, Eingabe deaktiviert, kein Ungelesen-Badge.
   - Alle Mocks sind als „Bald verfügbar“ erkennbar.
   - Fokus überall sichtbar, keine horizontale Scrollleiste der Seite.
5. Falls E2E-Sessions konfiguriert sind: `tasks.e2e.ts` und `portal-access.e2e.ts` laufen lassen.

## Nachtrag: Aufgabenbereich verschlankt (nach Review durch den User)

- **Ein Einstieg zum Anlegen:** nur noch „Aufgabe anlegen“ im Abschnittskopf, der den vollen Dialog öffnet. Die
  Schnellanlage-Zeile (`TaskQuickCreate`, `toQuickCreateTaskRequest`, Dictionary `quickCreate`, `announce.created`)
  ist entfernt, weil zwei Wege zum selben Ziel verwirrten. Der Leerzustand verweist auf den Button.
- **Kompakte Zeile:** Status-Symbol links (kompakte `CustomSelect`, neue Größe `CustomSelectSize.Compact` in
  `packages/ui`; Label bleibt Accessible Name und Tooltip), Titel mit einzeiliger Beschreibung, rechts nur
  Aufmerksamkeitsmarker: „Kunde ist dran“ (intern ist Standard und bleibt unmarkiert), Auge für kundensichtbar,
  Fälligkeit nur wenn gesetzt, Bearbeiter als Initialen (`getMemberInitials`, gemeinsam mit der Mitgliederliste).
- `e2e/tasks.e2e.ts` legt die Aufgabe jetzt über Button und Dialog an.
