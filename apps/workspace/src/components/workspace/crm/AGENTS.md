# AGENTS.md — Workspace CRM (UI)

Gilt für `apps/workspace/src/components/workspace/crm/**`. Ergänzt die Repo-Root-`AGENTS.md` und
`apps/workspace/src/app/[locale]/(app)/crm/AGENTS.md`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Struktur

- Gruppierte Subfolder nach Verantwortung: `shell/`, `list/`, `form/`, ab Task 05 `detail/`, ab Task 06 `contacts/`,
  ab Task 40 `services/` (Leistungstemplatekatalog), ab Task 41 `projects/` (Projektleistungen im Projekt-Canvas).
  Ab Task 50 zusätzlich `shared/section-collapse-toggle/`, `shared/mock-section-card/`,
  `projects/project-switcher-tabs/` und `detail/customer-chat-dock/`. Projektkopf (Status, Titel, Owner) und
  Prozessleiste liegen in `projects/project-overview/`.
- Pro Komponente ein Ordner `<gruppe>/<name>/<name>.tsx` mit co-located `<name>.module.css` und Test.
- App-neutrale Grundbausteine (Dialog, Formularfeld, Button, Badge, Empty-State) kommen aus `@invessiv/ui`, nicht aus
  Kopien. Domänenneutrale Workspace-Bausteine erst bei tatsächlicher Wiederverwendung nach `workspace/shared/`.

## Verbindlich

- **Keine Fachlogik im Client.** Eindeutigkeit, Owner, Status und Primärkontakt-Invariante entscheidet der Server.
  Der Dialog validiert nur Format und Pflichtfelder, damit Fehler früh sichtbar sind.
- **Mutationen nur über `src/client/crm/**`** und damit über die API-Routen; danach `router.refresh()`.
- **Versionierte Writes über `useVersionedMutation`:** Ein Konflikt übernimmt den aktuellen Stand und behält die
  Eingaben; nichts wird still verworfen.
- **Schreibaktionen erscheinen nur, wenn die Page ein Ziel übergibt.** Kein deaktivierter Platzhalter.
- **Texte ausschließlich aus `src/i18n/dictionaries/workspace/crm/**`**, DE und EN parallel. Statuswerte werden über
  den Enum-Wert im Dictionary aufgelöst. **Ausnahme:** Systemrollen-Labels (`SystemRoleKey` → übersetzter Name) kommen
  aus `SettingsPermissionsDictionary.systemRoles` über `resolveRoleLabel` (`src/lib/workspace/access/role-label.ts`) —
  auch in Portal-Access-Komponenten (`portal-access/**`). Systemrollen sind ein auth-weites Konzept, keine
  CRM-spezifische Übersetzung; eine zweite, separat gepflegte Übersetzung derselben Rolle ist die Fehlerquelle, die
  diese Ausnahme vermeidet.
- **Kundennummern** nur im View über `formatCustomerNumber` formatieren.
- **Keine PII in URLs, Logs oder Activity-Metadaten.** Query-Parameter tragen ausschließlich IDs und Modi.
- Farben nur über Theme-Tokens, Zustände über `data-*`; Dark und Light gleichwertig, mobil zuerst.

## Projektleistungen (ab Task 41)

- Der Leistungsbereich im Projekt-Canvas ersetzt den bisherigen „Coming soon"-Slot. Er wird **nur** gerendert, wenn die
  Page das Projekt in `readableProjectIds` übergibt; ohne Leserecht gibt es keinen Platzhalter und keinen Hinweis
  darauf, dass es den Bereich gibt.
- Zuweisen und Bearbeiten erscheinen nur für Projekte in `writableProjectIds`. Die Rechte kommen pro Projekt aus der
  Page (`canOn`), nie aus einer Auswertung im Client.
- Die Zuweisung geht ausschließlich über ein **aktives** Template. Der Dialog belegt die Angebotsfelder (`LineItemFields`) aus dem
  Template vor; was danach geändert wird, gilt nur für dieses Projekt. Der Client synchronisiert nie zurück zum
  Katalog.
- Preise werden im View über `formatEuroCents` formatiert, rechtsbündig und mit `tabular-nums`. Der Ledger zeigt keine
  Summe — Projektwerte entstehen in Task 42.
- Leerer Zustand erklärt den Zweck des Bereichs und unterscheidet Schreib- von Leserecht. Ist der Katalog ohne aktives
  Template, führt der Weg sichtbar dorthin statt in einen leeren Dialog.

## Aufgaben (ab Task 11-3)

- Komponenten liegen unter `tasks/`; die Projektsektion (`project-tasks-section`) und die globale Übersicht
  (`tasks/overview/**`) teilen sich Zeile, Statusauswahl, Handlungsseiten-Badge und Fälligkeitslabel.
- Die Sektion ersetzt den bisherigen „Coming soon“-Slot für Aufgaben und wird **nur** gerendert, wenn die Page das
  Projekt in `readableProjectIds` übergibt. Anlegen, Bearbeiten und Statuswechsel gibt es nur für Projekte in
  `writableProjectIds`; ohne Recht fehlen die Aktionen, sie sind nicht deaktiviert.
- Ein Statuswechsel läuft ausschließlich über `useTaskStatusChange` (Hook): sofort sichtbar, nach Bestätigung per
  Live-Region angekündigt, bei Fehler zurückgesetzt und mit Meldung versehen. Kein zweiter Weg in Komponenten.
- Überfällig und „bald fällig“ werden nie in der Komponente berechnet, sondern über `taskDueStateService`; der Text
  nennt die Dauer, das Symbol ist zusätzlich — nie Farbe allein.
- Mitgliedernamen kommen nur, wenn die Page sie übergibt (`members`, Recht `members.read`). Ohne Namen entfällt die
  Bearbeiter-Angabe bzw. die Bearbeiter-Auswahl.
- Server-Komponenten übergeben Client-Komponenten nur serialisierbare Daten (keine Funktionen); Links entstehen im
  Client aus Basispfaden über die Patterns in `common/patterns/crm/`.

## Cockpit-Layout (ab Task 50)

Plan: `apps/workspace/plans/crm/12c-cockpit-dashboard/50-cockpit-dashboard-redesign.md`.

- Das Cockpit ist ein Vollbild-Dashboard: Kopf (Meta-Zeile + Kennzahl-Chips), links der Projektbereich mit
  Projekt-Tabs, rechts die Kundenspalte in Themengruppen, ganz rechts der Kundenchat-Dock.
- **Jeder Abschnitt folgt demselben Kopf:** Titel · Anzahl · optionale Primäraktion · Toggle. Auf- und Zuklappen
  läuft ausschließlich über `shared/section-collapse-toggle`; kein zweiter Toggle-Weg.
- **Der Kopf bleibt immer sichtbar.** Primäraktionen funktionieren auch bei eingeklapptem Abschnitt.
- **Unterdialoge liegen außerhalb des einklappbaren Körpers**, damit sie sich auch bei eingeklapptem Abschnitt
  öffnen (auch über das Owner-Badge in der Meta-Zeile).
- **Roadmap-Bereiche ohne Umsetzung** erscheinen nur über `shared/mock-section-card`: ohne Daten-Props, ohne
  Aktion, immer mit „Bald verfügbar“-Badge. Wird ein Bereich echt gebaut, ersetzt er seine Mock-Karte an
  derselben Stelle.
- Mock-Kennzahlen zeigen „—“, nie eine erfundene Zahl. Der Chat-Dock zeigt kein Ungelesen-Badge, solange es
  keine echten Lesestände gibt (Ordner 17/18 docken dort an).
- Der zugängliche Name eines Projekt-Tabs ist exakt der Projekttitel; der Status hängt über `aria-describedby`.
- Offene und überfällige Aufgaben werden über `taskDueStateService.summarize` gezählt, nie in der Komponente.
