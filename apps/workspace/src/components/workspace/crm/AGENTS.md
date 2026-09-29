# AGENTS.md — Workspace CRM (UI)

Gilt für `apps/workspace/src/components/workspace/crm/**`. Ergänzt die Repo-Root-`AGENTS.md` und
`apps/workspace/src/app/[locale]/(app)/crm/AGENTS.md`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Struktur

- Gruppierte Subfolder nach Verantwortung: `shell/`, `list/`, `form/`, ab Task 05 `detail/`, ab Task 06 `contacts/`,
  ab Task 40 `services/` (Leistungstemplatekatalog), ab Task 41 `projects/` (Projektleistungen im Projekt-Canvas).
  Ab Task 50 zusätzlich `shared/section-collapse-toggle/`, `shared/mock-section-card/`,
  `projects/project-switcher-tabs/`, ab Task 53 `files/` (Dateien & Links). Projektkopf (Status, Titel, Owner) liegt in
  `projects/project-overview/`; Prozessleiste und Chat-Dock kommen aus `@invessiv/ui`.
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
- Mock-Kennzahlen zeigen „—“, nie eine erfundene Zahl. Der Chat-Dock zeigt ab Ordner 13a den echten Verlauf und
  als Badge nur die echte Ungelesen-Zahl; ohne `chat.read` am Kunden wird er gar nicht gerendert.
- Der zugängliche Name eines Projekt-Tabs ist exakt der Projekttitel; der Status hängt über `aria-describedby`.
- Offene und überfällige Aufgaben werden über `taskDueStateService.summarize` gezählt, nie in der Komponente.

## Kundenchat (ab Task 25)

Plan: `apps/workspace/plans/crm/13a-kundenchat/25-chat-im-crm.md`.

- Komponenten liegen unter `messages/`. Der Verlauf selbst ist `MessageThread` aus `@invessiv/ui` (seit Task 26,
  gemeinsam mit dem Portal); er bekommt alle Texte als `MessageThreadLabels`. Lade-/Fehlerzustand vor dem ersten
  Laden über `MessageThreadStatus`.
- Laden, Senden, Lesestand und Ausblenden laufen ausschließlich über `useCustomerConversation`
  (`src/hooks/workspace/crm/`), der auf dem geteilten `useConversationThread` (`src/hooks/shared/`) aufsetzt und nur
  das Ausblenden ergänzt. Kein Polling: Laden beim Öffnen, nach dem Senden und bei `visibilitychange`.
- Nachrichten sind unveränderlich: kein Bearbeiten, kein Löschen. „Ausblenden“ erscheint nur, wenn der Server
  `canRedact` (Permission `chat.redact`) durchreicht, und immer mit Bestätigungsdialog.
- Ohne `chat.write` fehlt das Eingabefeld, ohne Recht zum Neuzuweisen die Verantwortlichen-Auswahl — nie deaktiviert.
- Nachrichtentext wird nur als Text gerendert; Links erkennt `splitMessageLinks` (nur http/https).
- Systemnachrichten werden über `describeSystemMessage` aus Dictionary-Key + Parametern formuliert.
- **Anhänge (ab Task 56):** 📎 erscheint nur mit `filesContent` und serverseitigem `attachmentAccess`. Datei-Zugriff
  läuft über `useCrmChatAttachmentApi`; Chat-Uploads landen kundenweit und intern. Solange ein interner Eintrag
  angehängt ist, zeigt der Composer den Hinweis „Diese Datei wird für den Kunden freigegeben“; erst dann sendet der
  Client `releaseHiddenAttachments: true`. Ohne das Flag lehnt der Server mit `ATTACHMENT_RELEASE_REQUIRED` ab.

## Dateien & Links (ab Task 53)

Plan: `apps/workspace/plans/crm/14-dateien/53-drop-zone-und-interne-ui.md`.

- Komponenten liegen unter `files/`. Orchestrator ist `files/customer-files-section`; im Cockpit kundenweit, im
  Projekt-Canvas mit `projectId` fest auf das Projekt (ohne Projektfilter und Projektspalte).
- Der Bereich existiert nur, wenn die Page ein `FilesViewModel` übergibt (`buildFilesViewModel`, `canOn` je Scope).
  Schreib- und Löschaktionen erscheinen nur für Scopes in `write` bzw. `remove`; der Client schlägt über
  `filesScopeRights` nach und wertet nie selbst Rollen aus. Projektrechte öffnen nie kundenweite Einträge.
- Typ-Symbol, Upload-Zeile, Lightbox und Formular-Dialog kommen seit Task 55 aus `@invessiv/ui` (`FileKindIcon`,
  `UploadQueueRow`, `FileLightbox`, `FormDialog`), weil das Portal sie ebenfalls nutzt; Texte gehen als Labels hinein.
- Upload- und Link-Dialoge, Dateizeile, Listenrahmen und ZIP-Auswahlleiste verwenden die geteilten UI-Bausteine
  `FileUploadDialogFrame`, `FileLinkDialogFrame`, `FileEntryRow`, `FileListFrame` und `FileArchiveToolbar`.
  CRM-Komponenten ergänzen nur Rechte, Zielauswahl, Sichtbarkeit und ihre API-Aufrufe.
- Die Liste lädt über `useCustomerFiles` (auf dem geteilten `usePagedFiles`) aus der API, nicht über die Page.
  Die ZIP-Auswahl läuft über das geteilte `useFileSelection`. Nach jeder Änderung ruft der Abschnitt
  `onChangedAction` auf; das Cockpit erhöht `filesRevision`, damit alle Dateiabschnitte neu laden.
- Filter Projekt/Art/Herkunft leben in der URL (`CustomerFilesQueryParam`, `history.replaceState`); die Freitextsuche
  bleibt außerhalb der URL.
- Uploads laufen ausschließlich über `useUploadQueue` (`src/hooks/shared/`) mit einem `UploadQueueTransport`; Datei-
  auswahl ausschließlich über `FileDropZone` aus `@invessiv/ui`. Signierte URLs landen nie in State, der persistiert,
  geloggt oder in die URL geschrieben wird.
- Vorschau nur für `filePresentation.previewKindOf(...) !== null`; SVG ausschließlich als `<img>`, Text nur als Text.
