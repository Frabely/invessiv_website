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
  `projects/project-overview/`; Prozessleiste und Chat-Dock kommen aus `@invessiv/ui`. Ab Task 57 liegt der
  Projekt-Editor in `projects/project-editor-dialog/`, die Schrittliste in `projects/process-step-editor/`.
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

## Prozessleiste und Feedbackrunden (ab Task 57)

Plan: `apps/workspace/plans/crm/16-feedbackrunden/57-feedbackblock-und-kontingent.md`.

- Die Leiste besteht aus Freitext-Schritten und **einzelnen Rundenschritten** (`feedbackRoundPositions`). Jede Runde
  wird im Editor über „+ Runde“ einzeln hinter einer Zeile eingefügt; es gibt keinen Block und kein Zahlenfeld. Die
  Rundennummer folgt aus der Reihenfolge, das Kontingent aus der Anzahl (serverseitig abgeleitet).
- Editor-Operationen laufen ausschließlich über `common/patterns/crm/project-process-plan.ts`, die Anzeige in CRM und
  Portal ausschließlich über `buildProjectProcessTrack` + `toProcessTrackSteps` aus `@invessiv/common`. Kein zweiter
  Weg, Positionen oder Rundennummern in einer Komponente zu berechnen.
- Es gibt keine Label-Erkennung: Ein Freitext-Schritt „Feedback“ ist ein normaler Schritt.
- Rundenschritte sind im Select „Aktueller Prozessschritt“ nicht wählbar; ein Klick auf eine Runde in der Leiste öffnet
  den Editor ohne Vorauswahl.
- Speichern läuft über `useVersionedMutation`; ein Konflikt übernimmt den aktuellen Stand und behält die Eingaben.
- Nummern in der Positionsspalte zählen nur Freitext-Schritte. Der sichtbare Button-Text („Runde“) steht am Anfang des
  zugänglichen Namens (WCAG 2.5.3).

## Feedbackrunden intern (ab Task 60)

Plan: `apps/workspace/plans/crm/16-feedbackrunden/60-ui-uebergabe-und-kundenbogen.md`.

- Komponenten liegen unter `feedback-rounds/`; Orchestrator ist `project-feedback-section`. Die Sektion existiert nur,
  wenn die Page ein `FeedbackRoundsViewModel` für das offene Projekt baut (`lib/workspace/crm/feedback-rounds-view-model.ts`).
- **Keine Fachlogik im Client.** Ob übergeben werden darf und warum nicht, kommt als `canHandOver` bzw.
  `handOverBlocker` vom Server; die UI zeigt nur Button oder Grundtext. Künftige Statusbuttons (Task 61) entstehen
  ausschließlich aus `canTransition` (`@invessiv/common/patterns/crm/feedback-round-state`), nie aus eigenen Abfragen.
- Ohne `projects.write` fehlt „Runde übergeben“ vollständig, ebenso der Sperrgrund. Anhänge und ZIP nur mit
  `files.read`; Punkte selbst sind ohne Dateirecht lesbar.
- Projektwahl und Runden-Detail sind URL-State (`project`, `feedbackRound`) über `useCockpitSelection`; Links entstehen
  nur über `buildCustomerCockpitHref` mit `CockpitSelection`. Eine fremde Runden-ID öffnet nichts.
- Kundentext erscheint nur als Text (`FeedbackItemText`/`LinkedText`), Links in neuem Tab mit
  `rel="noopener noreferrer"`. Portal und CRM teilen `components/shared/feedback/**`.
- Solange eine Runde läuft, ist „Aktueller Prozessschritt“ im Projekt-Editor gesperrt und nennt die Runde.
- **Bearbeitung (ab Task 61):** `feedback-round-status-actions` zeigt genau die internen Ziele, die `canTransition`
  vom aktuellen Status erlaubt; ohne `projects.write` fehlt die Gruppe. Gespräch und Zurückgeben laufen über den
  generischen `feedback-text-dialog` (eine versionierte Schreibaktion mit Text, Konflikt behält den Text),
  „Umsetzung starten“ direkt, der Abschluss über `feedback-complete-dialog` (Prüfliste, danach Angebot „Runde n+1
  übergeben“ nur unterhalb des Kontingents, sonst Abnahme-Hinweis).
- Ergebnisse je Punkt über `feedback-item-result-select` in der Zeile (`StatusRow`, `alignStart`): „Umgesetzt“
  speichert sofort, die beiden anderen öffnen die Antwort mit Vorschau in Kundensicht (`FeedbackItemResult` aus
  `components/shared/feedback/`). „Noch offen“ erscheint nur, solange kein Ergebnis gesetzt ist.
- Fehlercodes beider Befehle werden nur über `feedbackProcessingError` (`common/patterns/crm/`) in Texte übersetzt.
- **Eingang (ab Task 62):** `feedback-inbox` (Kopf, Filter, Liste, zwei unterscheidbare Empty-States),
  `feedback-inbox-card` und `feedback-inbox-toolbar`. Filter sind URL-State über
  `feedback-inbox-query` (`common/patterns/crm/`); Karten verlinken nur über `buildCustomerCockpitHref` mit
  Projekt und Runde. „Neu“ steht immer als Symbol **und** Text. Das Runden-Detail stempelt beim Anzeigen über
  `useMarkFeedbackRoundRead`; ein Fehler bleibt still, ein neuer Stempel löst `router.refresh()` für den
  Sidebar-Zähler aus.

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
  läuft über `useCrmChatAttachmentApi`; die Auswahl listet nur teilbare Einträge (`shareable`), Chat-Uploads
  landen kundenweit und intern. Solange ein interner Eintrag
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

## Fragebogen-Baukasten (`questionnaire`, ab Task 64)

Plan: `apps/workspace/plans/crm/15-onboarding/64-baustein-katalog-und-vorlagen.md`.

- **Fachneutral benannt:** Der Baukasten heißt im Code `questionnaire`, weil er außer dem Onboarding weitere
  Einsatzorte bekommen soll. Unter `questionnaire/` steht keine Onboarding-Fachlichkeit (Bogenstatus, Prüfung,
  Projektbezug) und kein Bezeichner mit `onboarding`; die lebt in eigenen `onboarding`-Ordnern und bindet den
  Baukasten ein.
- Komponenten unter `questionnaire/`: `catalog/` (Seite, Listen, Anlege-Dialoge, Katalog-Hülle der Baustein-Seite),
  `editor/` (owner-neutraler Block-Editor), `block-list/` (geordnete Blockliste und Baustein-Auswahl: Vorlagen
  und Bögen nutzen beide, Texte kommen über Props), `templates/` (Vorlagen-Editor).
- **`editor/**` importiert nichts aus `catalog/` und nichts aus `src/client/`** (Test in
  `questionnaire-block-editor.test.tsx`). Schreibzugriffe kommen als `QuestionnaireDefinitionClientApi` über die Props;
  Task 65 injiziert die Bogen-Implementierung und nutzt den Editor unverändert.
- **Die Schreibzugriffe des Editors baut `questionnaireDefinitionApiService.forEndpoints(...)`** (`src/client/crm/`)
  aus den Pfaden des Owners. Katalog und Bogen übergeben nur ihre Pfade (`QuestionnaireDefinitionEndpoints`); Anfragen,
  Antwortprüfung und Konfliktbehandlung gibt es einmal. Ein Bogen schreibt keinen eigenen Client für dieselben Aufrufe.
- Feld-Dialog, Löschbestätigung und Seiten-Dialoge leben in der URL (`QuestionnaireEditorQueryParam`), die
  Baustein-Auswahl des Vorlagen-Editors als Teil des ungespeicherten Entwurfs in React-State.
- Formularwerte ↔ Request nur über `common/patterns/crm/questionnaire/questionnaire-field-form.ts`, Strukturfragen
  (Ebene, Bedingungskandidaten) nur über `@invessiv/common/patterns/crm/questionnaire/questionnaire-block-structure`.
- Sprachnamen über `languageName` bzw. `languageList` aus `@invessiv/common/patterns/i18n/language-name`
  (`Intl.DisplayNames`), nie aus dem Dictionary.

## Onboarding-Bogen intern (ab Task 65)

Plan: `apps/workspace/plans/crm/15-onboarding/65-bogen-anlegen-und-anpassen.md`.

- Komponenten unter `onboarding/`: `project/` (Abschnitt im Projekt-Canvas, Startdialog, Status-Badge) und `form/`
  (Seitenkopf mit Tabs, Aufbau, Dialoge). Der Abschnitt existiert nur, wenn die Page ein `OnboardingViewModel` für
  das offene Projekt baut (`lib/workspace/crm/onboarding-view-model.ts`); er ersetzt die frühere Mock-Karte.
- **Keine Fachlogik im Client.** Ob gestartet werden darf, kommt als `canStart` und `projectEligible` vom Server. Ob
  der Aufbau änderbar ist, entscheidet `isOnboardingStructureEditable` aus `@invessiv/common`; ohne Recht oder nach
  dem Absenden fehlen die Aktionen und ein Hinweis erklärt warum.
- **Der Baukasten wird eingebunden, nicht kopiert** (Test in `onboarding-form-structure.test.tsx`):
  `QuestionnaireBlockEditor`, `OrderedBlockListEditor`, `QuestionnaireBlockPickerDialog` und
  `QuestionnaireBlockIdentityFields`. Die Schreibzugriffe des Editors baut
  `onboardingFormApiService.definitionApi(formId)` über `questionnaireDefinitionApiService.forEndpoints`; eigene Codes
  des Bogens (`ONBOARDING_NOT_EDITABLE`) übersetzt der Client dort in Codes des Baukastens, der Editor verzweigt nicht.
- Die Blockliste meldet eine Änderung als neue Reihenfolge; `detectOnboardingBlockListChange` liest daraus den einen
  Serverbefehl. Verschieben zeigt die neue Reihenfolge sofort (Fokus folgt der Zeile) und stellt sie bei Ablehnung
  wieder her; Entfernen fragt vorher nach. Nach einem Schreibvorgang des Editors wird der Bogen neu gelesen, damit die
  Liste die aktuelle Bogenversion kennt.
- Der gewählte Baustein steht in der URL (`OnboardingFormQueryParam.Block`), eine unbekannte ID öffnet nichts. Die
  kurzlebigen Dialoge (Auswahl, eigener Baustein, Entfernen, Start) sind React-State wie die Übergabe der
  Feedbackrunde.
- Das Löschen eines Felds zeigt über `renderDeleteDialogAction` des Editors den `OnboardingFieldDeleteDialog` mit der
  Zahl betroffener Antworten und Dateien; gelöscht wird erst, wenn die Zahl geladen ist.
- Fehlertexte nur über `onboardingFormErrorText` (`common/patterns/crm/onboarding/`).
