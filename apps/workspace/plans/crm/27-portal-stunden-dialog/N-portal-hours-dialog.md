# Paket N – Stunden-Dialog im Portal überarbeiten

## Context

Der Stunden-Dialog (`?widget=hours`, `components/portal/hours/`) ist eine lange Seite mit drei gleichrangigen
Abschnitten. Die Kennzahlen gehen darin unter. Der Projektfilter besteht aus selbstgebauten Chip-Buttons statt
Portal-Bausteinen und filtert nur die Buchungen, während Stand und Käufe immer firmenweit bleiben. Ziel: Die
wichtigen Zahlen (gekauft, verbraucht, übrig) stehen klar oben. Ein Projekt-Select schaltet den ganzen Dialog um.
Der Rest liegt in Reitern. Alle Schaltflächen sind `@invessiv/ui`-Bausteine.

Entscheidungen (17.10.2026):

- **Projektwahl schaltet den ganzen Dialog.**
- **Reiter** unter festen Kennzahlen.
- **Vorauswahl** ist das Dashboard-Projekt, falls es Stunden hat. Sonst „Alle Projekte“. `?hoursProject` geht vor.
- **Keine `DataTableLayout`.** Der Dialog scrollt selbst, und ein Tabellenrahmen mit fester Höhe darin hätte einen
  zweiten Scrollbereich. Dazu sind die Buchungen nach Monat gruppiert. Die kleine Projektaufteilung bleibt eine
  semantische `<table>`.

## Aufbau

```
[ Projekt: CustomSelect  Alle Projekte ▾ ]

 ┌ Kennzahlen (fest) ───────────────────────────────┐
 │ 🪙 Gekauft 10:00  │ 🕒 Verbraucht 8:30 │ ⏳ Übrig 1:30 │   ← Projekt: 📂 Zugewiesen / 🕒 Verbraucht / ⏳ Übrig
 │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░  (progress aria-hidden)        │
 │ „1:00 über dem Kontingent“ / „x noch keinem Projekt zugewiesen“ │
 └───────────────────────────────────────────────────┘
 [ Buchungen | Je Projekt | Käufe ]   ← TabList; „Je Projekt“ nur unter „Alle“
   Panel …
```

- **Projekt-Select:** `CustomSelect` (wie bei den Portal-Dateien) mit Optionen „Alle Projekte“ (`all`), jedem
  Projekt aus `hours.projects` und, falls vorhanden, „Frühere Projekte“ nur als Zeile in „Je Projekt“, nicht im
  Select (der Server filtert nur nach sichtbaren Projekten). Kein Select ohne Projekte.
- **Kennzahlen:** neue Komponente `portal-hours-figures`. Drei Kacheln mit FA-Icon und Text-Label (Icons wie im CRM
  `hours-balance-summary`: `faCoins`, `faClock`, `faHourglassHalf`, für das Projekt `faFolderOpen`). „Übrig“ ist
  betont, ein negativer Wert ist warm gefärbt und wird immer als Satz wiederholt. Darunter ein `<progress aria-hidden>`
  wie im Widget.
- **Reiter (`TabList` + Panels):**
  - **Buchungen:** nur mit `canReadEntries`, Standard-Reiter. Monatsliste wie bisher, ohne Chips. Projektzeile je
    Eintrag nur unter „Alle“. Nachladen und Fehler über `ButtonControl`.
  - **Je Projekt:** nur unter „Alle“ und wenn Zeilen da sind. Tabelle wie bisher (Projekt, Zugewiesen, Verbraucht,
    Übrig, Überzugssatz), dazu eine letzte Spalte mit `ButtonControl` `variant="quiet"` `size="icon"`
    (`faArrowRight`, `aria-label`/`title` „Nur {Projekt} anzeigen“). Sie stellt das Select auf dieses Projekt. Die
    Zeile „Frühere Projekte“ hat keinen Button.
  - **Käufe:** Kaufhistorie wie bisher. Unter einem Projekt steht oben der Hinweis „Stunden kaufst du für alle
    Projekte gemeinsam.“
  - Bleibt nur ein Reiter übrig, entfällt die `TabList` und das Panel steht direkt da.
- Der Reiter ist lokaler State, nicht in der URL. Ist der gewählte Reiter nach einem Projektwechsel nicht mehr da
  (z. B. „Je Projekt“), fällt die Wahl auf den ersten verfügbaren.

## Umsetzung

### Common (`apps/workspace/src/common/`)

- `constants/portal/portal-hours-scope.ts`: `PortalHoursScope = { All: "all" }` (Wert für `?hoursProject=all`).
- `constants/portal/portal-hours-tabs.ts`: `PortalHoursTab = { Entries, Projects, Purchases }` + Werteliste.
- `patterns/portal/portal-hours-project.ts`, mit Test:
  - `read(requested, projectIds, dashboardProjectId)`: eine gültige ID oder `all` aus der URL geht vor, danach das
    Dashboard-Projekt, falls es in `projectIds` ist, sonst `null` (= alle).
  - `tabsFor({ projectId, canReadEntries, hasProjectRows })`: verfügbare Reiter in fester Reihenfolge.
- `packages/common/src/patterns/time/hours-meter.ts` (oder bei `format-duration`), mit Test: `{ max, value }` aus
  „verbraucht von gekauft/zugewiesen“. Widget und Dialog nutzen denselben Helfer statt der doppelten Rechnung.

### Hooks

- `hooks/portal/use-portal-hours-project.ts` (neu): liest `?hoursProject` über `useSearchParams` und
  `portalHoursProject.read`. `selectProject(id | null)` schreibt per `history.replaceState`, `null` als `all`.
- `hooks/portal/use-portal-time-entries.ts`: nimmt `projectId` als Argument statt die URL selbst zu lesen. Die
  Filterlogik zieht in den neuen Hook.

### Komponenten (`components/portal/hours/`)

- `portal-hours-dialog`: Orchestrator. Bekommt neu `dashboardProjectId` (aus `dashboard.selectedProjectId` in
  `portal-dashboard-dialogs.tsx`). Rendert Select, `portal-hours-figures`, `TabList` und Panels.
- `portal-hours-figures` (neu, tsx + css): Kacheln, Balken und Hinweissätze für den Firmenstand bzw. ein Projekt.
- `portal-hours-summary` wird zu `portal-hours-projects`: nur noch die Projekttabelle mit Wechsel-Button. Die
  Gesamtzahlen wandern in `portal-hours-figures`.
- `portal-time-entry-list`: Chips und eigene Überschrift entfernen (der Reiter benennt das Panel). Bekommt
  `projectId`, `projects` nur noch für die Projektzeile.
- `portal-hours-purchases`: Überschrift entfernen, optionaler Hinweis `sharedHint`.
- Chip-CSS (`.chip`, `.filter`) entfällt ersatzlos.
- `dashboard/widgets/portal-hours-widget`: Balken über den neuen `hours-meter`-Helfer.

### i18n (`dictionaries/portal/hours/de.json` + `en.json`, Du-Form)

- Neu:
  - `scope.label` „Stunden nach Projekt“, `scope.all` „Alle Projekte“;
  - `tabs` mit `label`, `entries` „Buchungen“, `projects` „Je Projekt“, `purchases` „Käufe“;
  - `figures` mit `label`, `purchased`, `allocated`, `used`, `remaining`, `projectLabel` „Stand von {project}“;
  - `projects.show` „Nur {project} anzeigen“;
  - `purchases.shared` „Stunden kaufst du für alle Projekte gemeinsam.“
- Entfällt: `entries.filterLabel`, `entries.allProjects`, die Abschnittsüberschriften (`summary.title`,
  `purchases.title`, `entries.title`), soweit sie nicht als Panel-Labels weiterleben.

### Doku

- Neuer Plan `apps/workspace/plans/crm/27-portal-stunden-dialog/N-portal-hours-dialog.md` mit diesem Inhalt
  (zuerst angelegt, vor dem Code).
- `components/portal/AGENTS.md`, Abschnitt „Stunden“, anpassen:
  - Projekt-Select statt Chips; schaltet den ganzen Dialog.
  - Vorauswahl über das Dashboard-Projekt, `?hoursProject=all`.
  - Reiter und ihre Bedingungen.
  - Keine `DataTableLayout` im Dialog, mit Begründung.

## Tests

- Unit: `portalHoursProject.read`/`tabsFor`, `hoursMeter`, Konstanten.
- `portal-hours-dialog.test.tsx` umbauen:
  - Kennzahlen „Alle“ und Projekt;
  - Vorauswahl aus dem Dashboard und Vorrang von `?hoursProject`;
  - Wechsel per Select (Button über `aria-label`, dann die Option, wie in den Portal-Dateien-Tests);
  - Projekt-Button in „Je Projekt“;
  - Reiter je nach `canReadEntries` und Projekt; Fallback des Reiters;
  - Hinweis unter „Käufe“ im Projektmodus;
  - Überzugssätze, Empty-States, Nachladen und Fehler wie bisher.
- `portal-dashboard.hours.test.tsx` und Widget-Tests grün halten bzw. anpassen.

## Verifikation

- `pnpm --filter @invessiv/workspace test -- portal/hours portal-dashboard` und `pnpm --filter @invessiv/common test`.
- `pnpm -r lint`, `pnpm -r typecheck`, `pnpm --filter @invessiv/workspace build`.
- Prettier nur auf die geänderten Dateien (CRLF).
- Sichtprüfung im Portal (Desktop, Mobil, Dark/Light) bleibt beim Nutzer. Kein Commit.

## Nachtrag (17.10.2026): Übersicht → Projekt

Feedback zur ersten Fassung:

- Die Anordnung war unintuitiv.
- Unter einem Projekt waren „Über alle Projekte sind noch … übrig“ und der Käufe-Hinweis irreführend.
- Die Kennzahlen sollen dieselben Farben wie im Cockpit tragen.

Umgesetzt (ersetzt Select, Reiter „Je Projekt“ und Projekttabelle von oben):

- **Kein Select mehr.** Die Übersicht zeigt die Kennzahlen, die Projekte als Zeilen-Buttons mit Mini-Balken und die
  Reiter „Buchungen | Käufe“. Ein Klick öffnet das Projekt mit „← Alle Projekte“, eigenen Kennzahlen und nur seinen
  Buchungen.
- Im Projekt gibt es **keine Käufe und keinen Zusatzsatz**. Die freien Stunden stehen in der Übersicht unter den
  Projekten.
- **Cockpit-Farben:** Verbraucht warm, Zugewiesen blau, Übrig grün, negativ rot. Der Balken
  (`portal-hours-meter`) füllt warm auf grüner Spur.
- `?hoursProject` und die Vorauswahl über das Dashboard-Projekt bleiben.

## Nachtrag 3 (17.10.2026): Projekte ohne Stunden

- Die Auswahl enthält alle im Portal sichtbaren Projekte, auch ohne Zuweisung oder Buchung.
- Diese Projekte lassen sich mit Kennzahlen, Balken und leerer Buchungsliste öffnen. Ohne Stunden sind alle Werte 0:00.
- Die Sichtbarkeitsregeln bleiben bestehen; unsichtbare Projekte ohne Stunden erzeugen keine Sammelzeile.

## Nachtrag 2 (17.10.2026): Aufschlüsselung und Buchungstabelle

- **Übersicht in vier Kennzahlen:** Gekauft, Verbraucht, In Projekten offen und Frei.
  - Es gilt Gekauft = Verbraucht + offen + frei − Überzug.
  - Gerechnet wird nur in `portalHoursBreakdown`.
  - „Offen“ zählt nur Projektreste. Ein überzogenes Projekt erscheint als roter Überzug.
  - Der Satz „Noch keinem Projekt zugewiesen“ unter den Projekten entfällt, weil „Frei“ das sagt.
- **Gestapelter Balken** (SVG) mit den Segmenten Verbraucht (warm), Überzug (rot), offen (blau) und frei (grün).
  Projektzeilen und Projektansicht zeigen Verbraucht, Überzug und offen.
- **Buchungen als `DataTableLayout`:**
  - Spalten Datum, Beschreibung, Aufgabe (eigene Spalte), Projekt (nur in der Übersicht) und Dauer, alle linksbündig.
  - Keine Monatszeilen, das Datum steht in jeder Zeile. „Weitere laden“ im Footer, Mobile-Cards.
  - Kompakte feste Höhe im Dialog (`min(22rem, 42dvh)`), damit Kopf und Footer stehen bleiben und die Tabelle in den
    Dialog passt.
