# Paket M – Portal-Dateien als Tabelle

Status: **gemerged** am 18.10.2026 (`e1bd575d`). Vorschaubilder bleiben im
[offenen Plan L](../../26-portal-dateien-layout/L-file-thumbnails.md).

## Context

Paket K (Commit `b9692837`) hat die Dateiseite auf das Layout von Onboarding/Feedback gebracht, die Liste aber als
`FileEntryRow`-Liste mit Reitern „Von uns“ / „Von dir“ belassen. Ziel von Paket M: Die Einträge laufen über die
eigene Tabelle (`DataTableLayout` aus `@invessiv/ui`), die Mehrfachauswahl verhält sich wie die Bulk-Leiste der Leads,
und die Reiter weichen zwei Filtern.

Entscheidungen (17.10.2026):

- **Tabelle statt Liste:** `DataTableLayout` mit Mobile-Cards (wie die CRM-Tabellen). Desktop ab 1100 px: Tabelle
  höchstens zwei Drittel, rechts das Vorschau-Panel (ein Drittel). Darunter kein Panel, Klick öffnet Lightbox bzw.
  den Link.
- **Spalten (Vorschlag A):** Auswahl · Name (Typ-Icon, Name, Notiz gekürzt als zweite Zeile) · Von (Badge „Von uns“ /
  „Von dir“) · Projekt (nur unter „Alle Projekte“) · Typ (Endung bzw. Link-Host) · Größe · Hinzugefügt · Aktion
  (Herunterladen bzw. Öffnen). Vorschaubilder kommen später (Plan L), bis dahin nur das Icon.
- **Filter als `CustomSelect`:** Projekt (jedes freigegebene Projekt oder „Alle Projekte“) und Herkunft („Alle“,
  „Von uns“, „Von dir“). Standard ist „Alle“. Weitere Filter gibt es nicht.
- **Paginierung:** „Weitere laden“ bleibt (clientseitig über `usePortalFiles`); `DataTableLayout` bekommt dafür einen
  generischen `footer`-Slot. Grund: Die ZIP-Auswahl darf Einträge aus mehreren nachgeladenen Blöcken umfassen.
- **Auswahl-Leiste wie bei den Leads:** neuer app-neutraler Baustein `SelectionActionBar` in `packages/ui`
  (schwebende Pille unten mittig: Anzahl, optionaler Hinweis, Aktionen). Portal: „Auswahl aufheben“ und
  „Als ZIP herunterladen“. Die Leads-Bulk-Leiste wird auf denselben Baustein umgestellt.
- **„Datei hinzufügen“** bleibt immer sichtbar in der Fußleiste (`PortalPageBar`), unabhängig von der Auswahl.

## Umsetzung

### 1. `packages/ui`

- `SelectionActionBar` (`components/selection-action-bar/`): Hülle der Leads-Leiste, auf Theme-Tokens umgestellt.
  Abstand nach unten über `--selection-action-bar-offset` (Layout-Hook für Seiten mit eigener Fußleiste).
- `DataTableLayout`: `footer` (unter dem Scrollbereich, wie die Paginierung). Die Tabelle füllt die verfügbare
  Höhe (`fillAvailableHeight`) und scrollt selbst; Kopf und Footer bleiben stehen (Nachtrag 17.10.2026).
- `FileEntryRow`: `active` und `openOnRowClick` wieder entfernen (nur das Portal nutzte sie).
- `FilePickButton` entfernen (seit Paket K ungenutzt); `useFilePicker` bleibt für `FileDropZone`.
- `filePresentation.typeLabel` in `packages/common`: Endung, Link-Host oder Typname; `FileEntryMeta` und die
  Portal-Tabelle nutzen denselben Helfer.

### 2. `apps/workspace`

- Query-Parameter `tab` → `origin` mit `all` | `fromUs` | `fromYou` (`PortalFilesOriginFilter`), Standard `all`
  ohne Parameter. Projekt über `project` (wie im Dashboard), „Alle Projekte“ über `scope=all`.
- `usePortalFiles` nimmt `origin: PortalFileOrigin | null` (null = beide Herkünfte; der Server kann das bereits).
- Neue Komponenten unter `components/portal/files/`: `portal-file-table`, `portal-file-table-row`,
  `portal-files-filters`, `portal-files-selection-bar`. Entfallen: `portal-file-list`, `portal-file-row`.
  `portal-files-bar` zeigt nur noch „Datei hinzufügen“.
- Der Zurück-Link wird clientseitig aus dem gewählten Projekt gebaut (`dashboardPath` statt `dashboardHref`).
- Dictionaries DE/EN: `origin`, `table`, `empty.all`; `tabs` und `archive.selectShown` entfallen.

### 3. Aufräumen aus Paket K

- Siehe oben (`FileEntryRow`-Props, `FilePickButton`, Portal-Liste/-Zeile, Reiter-Texte).
- Die versehentlich gestagte, nie committete Datei `portal-step-events.ts` aus dem Index nehmen.

## Tests

- UI: `SelectionActionBar`, `DataTableLayout` (`footer`), `FileEntryRow` ohne die alten Props.
- Workspace: Konstanten/Parser für den Herkunftsfilter, `PortalFilesView` (Filter, Auswahl, Panel, Leiste),
  Leads-Bulk-Leiste unverändert grün, E2E `portal-files.e2e.ts` auf Filter statt Reiter.

## Nicht im Scope

- Vorschaubilder (Plan L), Sortierung, Suche, weitere Filter.
