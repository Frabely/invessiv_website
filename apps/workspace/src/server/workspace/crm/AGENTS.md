# AGENTS.md — Workspace CRM (Server)

Gilt für `apps/workspace/src/server/workspace/crm/**`. Ergänzt `src/server/AGENTS.md`; bei
Widerspruch gewinnt die spezifischere Datei. Die Umsetzungsregeln des Vorhabens stehen in
`apps/workspace/plans/crm/AGENTS.md`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Abgrenzung

- Hier liegt ausschließlich der **interne** CRM-Serverpfad: Command-Handler, Query-Handler,
  Services und Schemas.
- Portalcode gehört nach `src/server/portal/**` und wird **nie** von hier importiert oder
  wiederverwendet — auch nicht mit einem Parameter, der entscheidet, wer fragt.
- DTOs und Konstanten gehören nach `packages/common`, nicht hierher. Sobald ein Typ, eine Konstante
  oder ein Pattern exportiert wird, wandert es vorher dorthin.

## Verbindliche Invarianten

- **Ein Kunde hat immer genau einen Primärkontakt.** Die Datenbank erzwingt höchstens einen (partieller Unique-Index),
  der atomare Create-Command mindestens einen. Ein Handler, der eine
  Zuordnung löst, prüft vorher, dass danach noch ein Primärkontakt existiert.
- `CustomerSummaryDto.primaryContactName` ist non-nullable. Der Mapper wirft
  `MissingPrimaryContactError`, statt einen fehlenden Primärkontakt still darzustellen.
  `primaryContactEmail` ist dagegen nullable: Ein gültiger Primärkontakt kann Name und Telefon,
  aber keine E-Mail besitzen.
- Kontakt-Contracts führen `personVersion` und `assignmentVersion` getrennt. Ein einzelnes
  `version`-Feld darf die unabhängigen Versionsstände der globalen Person und ihrer
  kundenspezifischen Zuordnung nicht vermischen.
- **Kein Löschpfad für Kunden.** Archivierung ist ausschließlich `status = 'archived'` und
  reversibel. Der einzige echte Löschweg ist der Owner-Purge aus Task 34.
- **Eine Projektleistung gehört zu genau einem Projekt.** `project_line_items` hat bewusst keine Kundenspalte:
  der Kunde wird über das Projekt abgeleitet. Kein Handler nimmt eine `customerId` für diesen Pfad entgegen, und es
  gibt weder kundenweite Positionen noch eine Tabelle `customer_packages`.
- **Eine Projektleistung ist ein vollständiger Snapshot.** Titel, Beschreibung, Preis, Preisart und Intervall werden
  beim Zuweisen kopiert. `source_line_item_template_id` ist ausschließlich Herkunftsnachweis, wird nie mitgeschrieben
  und wird beim Löschen des Templates auf null gesetzt. Es gibt keine Synchronisation in beide Richtungen.
- **Zuweisen geht nur aus einem aktiven Template.** Archivierte oder unbekannte Templates werden im Command
  abgewiesen, nicht erst in der UI ausgeblendet.
- **Kein Löschpfad für Projektleistungen.** Eine Position verschwindet nur mit ihrem Projekt (`ON DELETE CASCADE`).
- **Kundennummern vergibt der Anlegende (ab Ordner 29).** `CreateCustomerRequestDto.customerNumber` ist Pflicht und
  wird ausdrücklich geschrieben; der Sequenz-Default greift im Produktivpfad nicht mehr (Abbau in 29.2). Den Vorschlag
  liefert `customerReadService.findLowestFreeCustomerNumber` (kleinste freie Nummer, bewusst **ohne** Zugriffsbereich,
  weil die Eindeutigkeit global gilt; preisgegeben wird nur die Belegung). Ob eine Nummer frei ist, entscheidet allein
  der eindeutige Index: ein Treffer wird über `isCustomerNumberTaken` zu `CUSTOMER_NUMBER_TAKEN` bzw.
  `LEAD_CONVERSION_CUSTOMER_NUMBER_TAKEN` (409), nie vorab per SELECT geprüft. Updates tragen keine Nummer.

## Schreibpfad

- Client-`fetch` → Route Handler → Command-Handler. Keine Server Actions.
- Handler liefern Result-Unions und werfen nicht für erwartete Fachfehler. Die Route mappt
  Fehlercodes über eine nicht-exportierte Message-Map auf `HttpResponseCode`.
- **Versionierte Writes ausschließlich über `updateVersioned`** aus
  `src/server/workspace/shared/update-versioned.ts`. Kein SELECT-dann-UPDATE, kein eigenes
  `version`-Handling.
- Jede Mutation an einer bearbeitbaren Entität nimmt `VersionedWriteInput` an. Ohne Version ist es
  ein Contract-Fehler, kein „optional".

## Datenbank

- Zugriff über die kanonischen Drizzle-Modelle aus
  `packages/db/src/record-configuration/crm/**`. Keine Tabellen- oder Spaltennamen als freie
  SQL-Strings.
- Mehrschrittige Writes laufen in einer Transaktion. Kunde und Primärkontakt entstehen gemeinsam
  oder gar nicht.
- Sichtbarkeitsfilter gehören in die `WHERE`-Klausel, nie ins Rendering.
- **Zugriffsbereiche:** Jede CRM-Query erhält den `WorkspaceActor` und grenzt ihre Daten über
  `accessScope` und `crmAccessCondition` in der `WHERE`-Klausel ein. Jeder ressourcenbezogene
  Command prüft `canOn`; fremde Kunden und Projekte verhalten sich wie nicht vorhanden (404),
  nicht wie ein Berechtigungsfehler.

## Kundenchat (ab Task 24)

- **Eine Unterhaltung entsteht erst mit der ersten Nachricht** (Text oder System) über
  `conversationService.ensureCustomerConversation` (`src/server/shared/services/message/`). Lesende Handler legen nie
  an; ohne Row liefern sie einen leeren Verlauf mit `id: null` und `ownership: null`.
- **Der Verantwortliche folgt dem Kunden-Owner:** Beim Anlegen übernimmt die Unterhaltung den aktuellen Kunden-Owner.
  Ein künftiger Owner-Wechsel am Kunden muss die Unterhaltung in derselben Transaktion über `updateVersioned`
  mitziehen; die Auswahl in der Inbox bleibt als manuelle Abweichung möglich.
- **Offene Verantwortung nur bei aktiven Kunden** (`conversation-responsibility-counter.ts`), analog zu Kunden.
- **Ausblenden nur mit `chat.redact`** (nicht delegierbar). Keine Rollenprüfung im Chat-Code.
- **Anhänge (ab Task 56):** `sendInternalMessage` sperrt jeden Anhang, verlangt `files.read` im Scope (sonst 404),
  lehnt `pending`, verwaiste und Einträge in nicht portal-sichtbaren Projekten mit `ATTACHMENT_UNAVAILABLE` ab und gibt
  interne Einträge nur mit `files.write` am Scope und `releaseHiddenAttachments` frei. Ein Retry wird vor dieser
  Prüfung erkannt und liefert die zugestellte Nachricht, auch wenn ein Anhang inzwischen nicht mehr teilbar ist. Die
  Dateiliste bietet mit `shareable` nur Einträge an, die der Kunde öffnen könnte (Dateiauswahl im Chat).
- **„Ungelesen“ ist genau einmal definiert:** `conversationService.unreadMessageCondition` speist Verlauf, Inbox und
  Sidebar-Zähler.

## Aufgaben (ab Task 11-2)

- **Eine Aufgabe gehört zu genau einem Projekt.** `tasks` hat bewusst keine Kundenspalte; der Kunde folgt aus dem
  Projekt. Es gibt keinen Löschpfad, `cancelled` ersetzt ihn.
- **Abschlussdaten schreibt intern nur `changeTaskStatus`** (`done` setzt Zeitpunkt und Mitglied, jeder andere Status
  löscht beide; die Portal-Herkunft `completed_by_portal_membership_id` wird bei jedem internen Wechsel geleert, damit
  genau eine Herkunft bleibt). Weitere Schreiber sind nur die Portal-Commands `completeCustomerTask` und
  `reopenCustomerTask` (`src/server/portal/`). `updateTask` fasst Status und Abschlussdaten nie an.
- **Vom Kunden angelegte Aufgaben** (`created_by_portal_membership_id`, DTO `createdByCustomer`) entstehen nur über
  den Portal-Command `createCustomerRequestTask`. Annehmen, Bearbeiten und Ablehnen (`cancelled`) laufen über die
  bestehenden Befehle `changeTaskStatus` und `updateTask`; es gibt keinen zweiten Weg.
- **Kundenaufgabe heißt sichtbar.** Handler und DB-CHECK verlangen `visible_to_customer`, sobald `action_side` =
  `customer`; ein Widerspruch wird abgewiesen, nicht korrigiert.
- **Activities enthalten nie Titel oder Beschreibung**, nur Ids und die geänderten Werte (`task-activity-service`).
- **Alle Listen nutzen `taskListOrderService`, alle Filter `taskListConditionsService`.** Die Filter sind das
  SQL-Gegenstück zu `taskDueStateService`; der Zugriffsbereich steht zuerst und wird von keinem Filter erweitert.

## Feedbackrunden (ab Task 59)

- Ab Task 79 verwenden Stellen, Schließen und Ergebniswahl `feedbackItemProcessingService` für den
  berechtigten Rundenzugriff (`FOR SHARE`), das frische Sperren des Punkts und das interne Punkt-DTO.
  Rückfragen schreiben ausschließlich über den geteilten `feedbackClarificationService`.
  Eine offene Rückfrage sperrt jede Ergebniswahl einschließlich „Noch offen“; der Rundenabschluss
  prüft unter `FOR UPDATE` zuerst offene Rückfragen, danach fehlende Ergebnisse.

- **Übergabe nur unter Projektsperre.** `handOverFeedbackRound` sperrt das Projekt (`FOR UPDATE`, dieselbe Sperre wie
  der Projekt-Editor) und prüft dann `findFeedbackHandOverBlocker`
  (`@invessiv/common/patterns/crm/feedback-hand-over-blocker`). Dieselbe Funktion liefert der Rundenliste den Grund
  `handOverBlocker`; Liste und Command dürfen nie eigene Bedingungen ergänzen.
- Eine zweite Übergabe während einer laufenden Runde antwortet mit `ROUND_ALREADY_ACTIVE` **und** der laufenden Runde.
- Übergabe ändert `projects.phase` und `current_process_step` nie; sie schreibt nur die Runde, `feedback_areas`
  (über `updateVersioned`), die Activity und die Systemnachricht.
- Lesen über `projects.read`, Übergabe über `projects.write`, jeweils mit `crmAccessCondition` in der `WHERE`-Klausel
  und `canOn`. Anhänge im Detail folgen `fileAccessService.readableCondition` — ohne `files.read` keine Dateien.
- Services unter `services/feedback/`: `feedback-round-service.ts` (Projektspur, Rundenliste mit Punktzahl, Blocker),
  `feedback-round-mapping-service.ts`, `feedback-round-schemas.ts`. Activity und Chat nach der Übergabe schreibt
  `feedbackRoundWriteService.recordHandOver` (`server/shared/services/feedback/`).
- **Bearbeitung (ab Task 61):** `changeFeedbackRoundStatus` sperrt die Runde (`FOR UPDATE`), vergleicht die Version
  unter der Sperre (409 mit `VersionConflictDto` und aktueller Runde), prüft `canTransition(…, internal)` und für den
  Abschluss, dass jeder Punkt ein Ergebnis hat (`RESULTS_INCOMPLETE`). Der Request ist eine nach `to` diskriminierte
  Union: Gespräch erlaubt einen Hinweis, Start und Abschluss verbieten ihn. Der Zweig `to: open` bleibt nur als
  Kompatibilität für alte Tabs und endet immer in `INVALID_TRANSITION` (Task 80); Entfernen in einem späteren Cleanup.
- `setFeedbackItemResult` hält die Runde nur `FOR SHARE`: Ergebnisse mehrerer Punkte laufen parallel, der Abschluss
  wartet auf sie. Ergebnisse gehen nur in `RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES`, sonst `ROUND_LOCKED`; der
  Punkt wird über `updateVersioned` geschrieben. Ergebnisse schreiben keine Activity (sonst Log-Flut je Punkt).
- Das Runden-DTO baut ausschließlich `feedbackRoundService.toRoundDto` (Detail-Query und Statusbefehl).
- **Eingang und Zähler (ab Task 62):** `feedback-inbox-service.ts` ist die einzige Quelle für Eingang
  (`listFeedbackInbox`), Sidebar-Zähler (`countUnreadFeedbackRounds`) und Lesestempel (`markFeedbackRoundRead`).
  Der Eingang zeigt nur `INTERNAL_QUEUE_FEEDBACK_ROUND_STATUS_VALUES`, filtert über `crmAccessCondition` mit
  `projects.read` und lädt Punktzahl, lesbare Dateien und den Anfang des ersten Punkts in einer Abfrage.
  „Ungelesen“ heißt `submitted` und `read_at IS NULL`. Der Lesestempel setzt `read_at` nur einmal, nie für
  `open`-Runden, ändert weder Status noch Version und schreibt keine Activity.
- Bewusste Abweichung vom übrigen CRM (Planvorgabe Task 59): `VALIDATION_ERROR` der Feedback-Endpunkte antwortet
  **400**, nicht 422. Antworten liefern das DTO direkt, ohne Hülle (`{ round }`), wie die Portal-Endpunkte.

## Fragebogen-Baukasten (`questionnaire`, ab Task 64)

Plan: `apps/workspace/plans/crm/15-onboarding/64-baustein-katalog-und-vorlagen.md`.

- **Fachneutral benannt:** Definitionen (Bausteine, Felder, Optionen, Vorlagen) heißen `questionnaire`, weil der
  Baukasten weitere Einsatzorte bekommen soll. Onboarding-Fachlichkeit (Bogen, Statusfluss, Prüfung, Antworten) heißt
  weiter `onboarding` und liegt nicht unter `services/questionnaire/`.
- Services unter `services/questionnaire/`. **Owner-neutral:** `questionnaireDefinitionWriteService` und
  `questionnaireDefinitionReadService` nehmen einen `QuestionnaireBlockOwner` (`null` = Katalog, sonst Bogen-ID) und filtern
  ihn in der `WHERE`-Klausel; ein Block oder Feld eines anderen Owners verhält sich wie nicht vorhanden (404).
- **Lesen liegt unter `server/shared/`:** `questionnaireDefinitionReadService`, `questionnaireMappingService` und die
  Zeilentypen (`questionnaire-definition-types.ts`) stehen in `server/shared/services/questionnaire/`, weil der
  geteilte Bogen-Read-Service und damit das Portal sie brauchen. Hier bleiben Schreibwege, Validierung, Kopierdienst,
  Vorlagen und Schemas.
- **Alle Schreibwege an Bausteinen und Feldern sind im Service, nicht in den Handlern.**
  `questionnaireDefinitionWriteService` kennt `createBlock`, `updateBlock`, `deleteBlock` und die Feldoperationen, jeweils
  mit dem `QuestionnaireBlockOwner`. Ein Handler parst, ruft den Service mit seinem Owner auf und gibt das Ergebnis
  zurück. Schlüssel sind je Owner eindeutig (`isBlockKeyTaken`): im Katalog global, im Bogen innerhalb des Bogens.
  Die Bogen-Handler aus Task 65 rufen dieselben Methoden mit der Bogen-ID auf und ergänzen nur ihre Zugriffs- und
  Statusprüfung; eine zweite Fassung der Logik gibt es nicht.
- **Der Schreibzugang ist eine Fassade.** `questionnaireDefinitionWriteService` leitet nur weiter: Blockkopf in
  `questionnaire-block-write-service`, Felder in `questionnaire-field-write-service`, Optionen und Texte eines Felds in
  `questionnaire-field-persistence-service`, Sperre, Antwortform und `withSiblings` in `questionnaire-block-session`.
  Neue Befehle kommen in den passenden Teil, nicht in die Fassade.
- **Jeder Schreibweg an einem Block** sperrt die Blockzeile, vergleicht die Blockversion unter der Sperre und erhöht sie
  über `updateLockedVersioned`. Antwort ist immer der ganze Block (`QuestionnaireCommandResult<QuestionnaireBlockDto>`).
- **Invarianten ausschließlich über `questionnaireDefinitionValidation.validateBlock`** auf dem Block nach der Änderung;
  kein Handler prüft Typ-Konfiguration, Bedingungen, Gruppen, Limits oder Übersetzungen selbst. Die Prüfung ist
  seiteneffektfrei und liegt als Pattern in
  `@invessiv/common/patterns/crm/questionnaire/questionnaire-definition-validation`, nicht unter `server/`.
- **Blockkopien ausschließlich über `questionnaireBlockCopyService.copyBlock`** (in der Transaktion des Aufrufers, neue IDs,
  Bedingungen auf die Kopien umgehängt, `source_block_id` nur bei Kopien in einen Bogen).
- Katalogrechte workspace-weit (`questionnaire_templates.read/write`, kein `canOn`); Endpunkte über
  `CrmEndpointAccessRule.QuestionnaireCatalog` bzw. `QuestionnaireCatalogWrite`.

## Onboarding-Bogen intern (ab Task 65)

Plan: `apps/workspace/plans/crm/15-onboarding/65-bogen-anlegen-und-anpassen.md`.

- Services unter `services/onboarding/`: `onboarding-form-access-service.ts` (Bogen und Projekt mit Zugriffsbedingung
  laden, `lockForStructure`), `onboarding-form-create-service.ts` (Bogen anlegen, Katalogblock als Schritt kopieren),
  `onboarding-prefill-service.ts` (Ablauf; Übernahme aus dem letzten abgeschlossenen Bogen in `onboarding-prefill-carry-service.ts`,
  CRM-Vorbelegung in `onboarding-prefill-crm-service.ts`),
  `onboarding-form-structure-service.ts` (Rahmen für Strukturbefehle, Schritte verschieben und entfernen),
  `onboarding-form-schemas.ts`. Das DTO baut `onboardingFormReadService` unter `server/shared/services/onboarding/`.
- Lesen über `projects.read`, alles Schreibende über `projects.write`, jeweils mit `crmAccessCondition` in der
  `WHERE`-Klausel und `canOn`. Ein Bogen außerhalb des Zugriffsbereichs antwortet `ONBOARDING_FORM_NOT_FOUND`.
- **Start nur unter Projektsperre** (`lockWritableProject`, dieselbe Sperre wie der Projekt-Editor): Status aus
  `isOnboardingProjectEligible`, ein Bogen je Projekt, Kopien, Vorbefüllung und Activity `created` in einer Transaktion.
- **Eine Vorlage mit archiviertem Baustein startet nichts:** `onboardingFormCreateService.createForm` antwortet
  `ONBOARDING_TEMPLATE_BLOCK_ARCHIVED` (409). Ein archivierter Baustein kommt weder über die Vorlage noch von Hand
  (`addOnboardingFormBlock`, `BLOCK_NOT_FOUND`) in einen Bogen.
- **Jede Strukturänderung hält die Bogenzeile `FOR UPDATE`** (`lockForStructure`) und prüft darunter Zugriff und
  `isOnboardingStructureEditable` (`draft`, `open`; sonst `ONBOARDING_NOT_EDITABLE`). Deshalb ist die Schlüsselprüfung
  `isBlockKeyTaken` im Bogen ohne Unique-Index sicher: derselbe Katalogbaustein lässt sich nicht zweimal hinzufügen
  (`QUESTIONNAIRE_KEY_TAKEN`).
- **Zwei Aggregate, zwei Versionen.** Befehle an der Blockliste (`add`, `remove`, `move`) laufen über
  `runBlockListCommand`: sie vergleichen `expectedFormVersion` und antworten mit dem ganzen `OnboardingFormDto` (auch im
  409). Kopf- und Feldbefehle laufen über `runDefinitionCommand`: sie rufen `questionnaireDefinitionWriteService` mit der
  Bogen-ID als Owner auf, vergleichen die Blockversion und antworten mit dem Block. Beide erhöhen bei Erfolg die
  Bogenversion über `updateLockedVersioned`. Kein Bogen-Handler enthält eigene Definitionslogik.
- **Statusbefehle des Teams** (`release`, `requestChanges`, `complete`) laufen über
  `onboardingFormCommandSupport.runFormTransition` (`services/onboarding/onboarding-form-command-support.ts`): Sperre über
  `lockWritableForm`, Übergang **vor** der Version, Konfliktantwort mit dem ganzen Bogen. Der Handler parst mit
  `onboardingFormCommandSupport.parse` (Bogen-ID zuerst) und liefert in `command` nur das Spezifische. Den
  Projekttitel lädt `loadProjectTitle`. Die Prüfung eines Blocks (`reviewOnboardingBlock`) vergleicht die Schrittversion
  und passt deshalb nicht in diesen Rahmen.
- **Vorbefüllung nie raten:** Felder über `key` und Typ, Optionen über `key`, Werte nur, wenn sie die Prüfung des
  neuen Feldes bestehen. Quelle ist ausschließlich der jüngste Bogen desselben Kunden im Status `completed`.
  `confirmation` und `project_services` werden nie übernommen. CRM-Werte füllen nur Felder ohne übernommene Antwort;
  nichts wird ins CRM zurückgeschrieben. Im Bogen selbst angelegte Bausteine werden nie vorbefüllt. Die Vorbefüllung
  schreibt ausschließlich über die Schreibwege unter `server/shared/services/onboarding/`: Antworten über
  `onboardingAnswerWriteService.insertSlots`, Gruppeneinträge über `onboardingGroupEntryService.insertEntries`,
  Datei-Verknüpfungen über `onboardingAttachmentService.insertLinks` — kein eigenes `tx.insert` auf diese Tabellen.
- **Die Vorbefüllung überschreitet nie die Rechte des Aufrufers.** Quelle ist der jüngste abgeschlossene Bogen, den
  der Aufrufer mit `projects.read` lesen darf (eine projektgebundene Rolle bekommt nichts aus dem Schwesterprojekt, und
  `prefillAvailable` verrät es auch nicht); CRM-Stammdaten kopiert nur, wer `customers.read` am Kunden hat. Beides
  hängt am `actor` in `onboardingPrefillService`, nicht an den Handlern.
- **Ein freigegebener Bogen verliert nichts unbemerkt** (`isOnboardingFormReleased`, also ab `open`): Ein Feld-Update,
  das eine bereits beantwortete Option entfernt oder ihren `key` ändert, antwortet `QUESTIONNAIRE_CHOICE_IN_USE`
  (`onboardingFormStructureService.dropsAnsweredChoice`, unter der Bogensperre). Das letzte Feld eines Blocks und das
  letzte Unterfeld einer Gruppe bleiben (`QUESTIONNAIRE_LAST_FIELD`, Option `keepLevelFilled` an `deleteField`), ebenso
  der letzte Block mit einem Feld (`ONBOARDING_EMPTY_FORM` in `removeStep`). Alle drei antworten 409; im Entwurf gilt
  keine dieser Regeln.
- Entfernen eines Blocks läuft über `questionnaireDefinitionWriteService.deleteBlock`; Antworten und Datei-Verknüpfungen
  fallen per Cascade weg, die Dateien bleiben.
- Fehlerabbildung der Routen: `onboardingApiError` (`src/lib/workspace/crm/`) für `OnboardingErrorCode`, Codes des
  Baukastens gehen an `questionnaireApiError` weiter. Endpunkte über `CrmEndpointAccessRule.OnboardingForm` bzw.
  `OnboardingFormWrite`.
- **Freigeben (ab Task 67):** `releaseOnboardingForm` sperrt den Bogen über `lockWritableForm` (ohne Statusprüfung,
  damit ein zweites Freigeben `ONBOARDING_INVALID_TRANSITION` statt `ONBOARDING_NOT_EDITABLE` antwortet) und prüft den
  Übergang **vor** der Version. Blockierend ist `isOnboardingFormReleasable` (`QUESTIONNAIRE_INVALID_FIELD_CONFIG`),
  bestätigbar sind die Warnungen aus `listOnboardingReleaseWarnings` (`@invessiv/common`, gefüttert mit den
  `preferred_locale` der nicht widerrufenen Portal-Mitgliedschaften des Kunden): ohne `acknowledgeWarnings` antwortet
  der Befehl `ONBOARDING_RELEASE_WARNINGS` (409, Liste unter `details.warnings`). Status, Zeitpunkt, Person, Activity
  und Systemnachricht schreibt `onboardingFormTransitionService.release`.
- **Dateien an einem Bogen bleiben:** `deleteFile` lehnt eine Datei mit Verknüpfung in `onboarding_answer_files` mit
  `FILE_ONBOARDING_BOUND` (409) ab, unabhängig vom Bogenstatus; geprüft wird unter der Dateisperre.

- **Prüfung und Nachforderung (ab Task 68):** `reviewOnboardingBlock` und `requestOnboardingChanges` sperren den
  Bogen über `lockWritableForm` (`projects.write` + `canOn`, sonst `ONBOARDING_FORM_NOT_FOUND`). Geprüft wird nur,
  solange `isOnboardingReviewOpen` gilt (Status `submitted`), sonst `ONBOARDING_INVALID_TRANSITION` (409). Die
  Prüfung vergleicht die **Version des Schritts** (409 mit `VersionConflictDto`, `current` ist der ganze Bogen) und
  erhöht die Bogenversion bewusst nicht, damit zwei Mitglieder verschiedene Blöcke parallel prüfen können. Eine
  Rückfrage braucht Klärungsart und Notiz (422); `pending` und `complete` tragen keine Notiz. Ein Block eines
  anderen Bogens ist `QUESTIONNAIRE_BLOCK_NOT_FOUND`.
- Die Nachforderung prüft den Übergang **vor** der Bogenversion, verlangt mindestens einen Block mit
  `clarification` + `customer` (`ONBOARDING_REVIEW_INCOMPLETE`, 422) und lässt Call-Rückfragen stehen. Status,
  Activity und Systemnachricht schreibt `onboardingFormTransitionService.requestChanges`.
- `getProjectOnboarding` liefert zusätzlich `review` (`summarizeOnboardingReview` aus `@invessiv/common`); kein
  Handler zählt Prüfstände selbst.
- **Abschließen (ab Task 70):** `completeOnboardingForm` sperrt den Bogen über `lockWritableForm` und prüft in dieser
  Reihenfolge: Übergang (`ONBOARDING_INVALID_TRANSITION`, nur aus `submitted`), Bogenversion (409 mit dem ganzen
  Bogen), Call-Datum über `isOnboardingCallDateAcceptable` gegen `businessToday()` (`ONBOARDING_CALL_DATE_REQUIRED`,
  422 — leer, kein Kalendertag oder in der Zukunft) und fehlende sichtbare Pflichtangaben über
  `onboardingFormReadService.toCompleteness` (`ONBOARDING_REQUIRED_MISSING`, 422, Liste unter `details.missing`).
  Ungeprüfte Blöcke und Call-Rückfragen blockieren nicht. Alles Weitere schreibt
  `onboardingFormTransitionService.complete`; ein Fehler darin rollt den ganzen Abschluss zurück.
- `getOnboardingFormContext` liefert zusätzlich `projectPhase`, damit der Abschlussdialog den Phasenwechsel nur
  anbietet, solange das Projekt in `onboarding` steht. Die Entscheidung trifft trotzdem der Server.

## Onboarding-Export (Ordner 32)

Plan: `apps/workspace/plans/crm/32-onboarding-export/README.md`.

- `exportOnboardingForm` liefert in **jedem Status** ein ZIP aus `onboarding.json` (`OnboardingExportDto`) und den
  Dateien unter `files/`. Lesen genügt (`CrmEndpointAccessRule.OnboardingForm`, `projects.read`); Dateien folgen
  `fileAccessService.readableCondition` wie im Antworten-Tab, eine nicht lesbare Datei erscheint nur als
  `no_access` ohne Namen.
- **Alle Fragen stehen im Export**, auch unbeantwortete und per Bedingung ausgeblendete (`visible: false`).
  `isQuestionnaireFieldVisible` liefert nur dieses Flag und filtert nie. Auswahlfragen listen alle Optionen mit
  `selected`, Gruppen ihre Unterfragen unter `questions`.
- Bogen → JSON ausschließlich über `onboardingExportMappingService.map`, Datei → Eintrag über `toExportFile`,
  Ablage je Datei über `toFileLocations` (Block-Key/Feld-Key, in Gruppen `entry-<n>/<child-key>`).
- **Eine Datei wird einmal gepackt.** Geplant und gezählt wird je `file.id`; nutzen mehrere Fragen dieselbe Datei,
  liegt sie unter `files/shared/`, und jede Frage nennt sie mit derselben `fileId`, demselben `path` und `usedIn`.
- **Das ZIP erklärt sich selbst:** `README.md` aus `ONBOARDING_EXPORT_README`; die deutsche Fassung für das Team
  steht in `docs/guides/onboarding-export.md`. Wer `OnboardingExportDto` ändert, passt beide an (`onboarding-export-readme.test.ts` prüft jede Property und jeden Wert) und erhöht bei einer
  Formänderung `ONBOARDING_EXPORT_SCHEMA_VERSION`.
- **Der Export scheitert nie an Dateien.** Links, Videos, Byte- oder Anzahl-Limit (`size_limit`) entscheidet der
  Handler vor dem Stream; Zeitbudget und Lesefehler meldet der Stream. Das Manifest wird zuletzt geschrieben
  (`ArchiveManifest`), damit `status` und `path` den echten Inhalt des ZIPs zeigen.
- Kopf (Kunde, Projekt, Vorlage) über `onboardingFormAccessService.findReadableContext`, den auch
  `getOnboardingFormContext` nutzt. Kein Inhalt in Logs oder Activities.

## Zugangsdaten (ab Task 18)

Plan: `apps/workspace/plans/crm/19-credentials/18-credentials-ui.md`.

- Services unter `services/credentials/`: `credential-access-service.ts` (`condition`, `targetExists`, `lock`,
  `metadataColumns`), `credential-mapping-service.ts`, `credential-schemas.ts`, `credential-types.ts`. Der Aufbau folgt
  dem Dateien-Modul (`services/files/`).
- **Listen entschlüsseln nie.** `listCustomerCredentials` selektiert ausschließlich `metadataColumns`; beide
  Chiffrat-Spalten gehören nicht dazu, `hasNote` entsteht als `note_ciphertext IS NOT NULL`. `CredentialDto` hat kein
  Feld für Geheimnis oder Notiztext (Typtest in `packages/common`). Wer eine Spalte ergänzt, ergänzt sie in
  `metadataColumns` — nie über `select()` ohne Spaltenliste.
- **Die ID entsteht vor dem Verschlüsseln.** Sie ist Teil der AAD (`customerId`, `credentialId`, `field`). Der Kontext
  kommt immer aus der gesperrten Zeile bzw. der frisch erzeugten ID, nie aus der Anfrage. Die Projekt-ID gehört nicht
  dazu; ein Projektwechsel lässt beide Chiffrate gültig.
- **Ver- und Entschlüsseln nur über `credentialCryptoService`** (`server/shared/services/credential/`). Ohne
  Schlüsselring antworten Anlegen, Ändern mit neuem Geheimnis oder Notiztext und Aufdecken mit `not_configured` (503);
  Liste, Metadaten-Änderung und Löschen funktionieren weiter.
- **Aufdecken** (`revealCredential`) ist der einzige Weg, auf dem Klartext den Server verlässt, immer für genau ein
  Feld: Zeile mit `credentials.reveal` sperren → fehlende Notiz ist `not_found` → Rate-Limit
  (`credentialRevealLimitService`) → entschlüsseln → `last_revealed_at` setzen → Event → Wert. Alles in einer
  Transaktion; scheitert das Event, verlässt kein Klartext den Server. Ein Cipher-Fehler wird zu `internal` und loggt
  nur den Code.
- `last_revealed_at` wird **bewusst ohne `updateVersioned`** geschrieben: Ein Aufdecken ist keine Bearbeitung, `version`
  und `updated_at` bleiben, und ein offener Editor läuft nicht in einen Konflikt. Jede andere Änderung geht über
  `updateVersioned`.
- **Einziger Event-Schreibweg ist `credentialEventService.record`.** Die Metadaten sind je Eventtyp typisiert
  (`CredentialEventDetail`); es gibt kein freies Feld, in das Titel oder Wert geraten könnten. `activities` bekommt
  keine Credential-Einträge.
- `updateCredential` schreibt nur, was sich unterscheidet. Ändert sich nichts, gibt es weder Write noch Event. Das
  Geheimnis wird nur ersetzt, wenn es gesendet wird; die Notiz ist dreiwertig (weggelassen, Text, `null`).
- Zugriff: `crmAccessCondition.forScope` mit Kunden- **und** Projektspalte. Eine Projektbindung zeigt keine
  kundenweiten Einträge. Ein Projektwechsel prüft `targetExists` am neuen Ziel. Ein Kunde außerhalb des
  Zugriffsbereichs ergibt eine leere Liste, kein 404.
- Routen bauen ihre Antwort über `lib/credentials/` (`privateCredentialResponse` setzt `no-store` auch auf abgewiesene
  Antworten; der Fehler-Callback loggt nie den Fehler selbst). Die Helfer liegen dort, weil die Portal-Routen aus
  Task 71 sie mitnutzen.
- **Freigabe (ab Task 71):** Drei interne Wege schreiben `visible_to_customer`, alle mit denselben Regeln und
  demselben Event: der Befehl `setCredentialPortalVisibility`, **Anlegen** mit `visibleToCustomer: true` (sonst
  intern) und **Bearbeiten** mit `visibleToCustomer` (weggelassen = unverändert). Regeln: Rücknahme bei
  `created_by_side = customer` ist `customer_owned`; Freigabe an einem im Portal nicht sichtbaren Projekt ist
  `project_hidden` — beim Bearbeiten zählt das Projekt **nach** der Änderung; in beiden Fällen wird nichts
  geschrieben. Jede tatsächliche Änderung der Freigabe schreibt ein eigenes
  `credential_portal_visibility_changed` neben `credential_created` bzw. `credential_updated`; ein Bearbeiten,
  das nur die Freigabe ändert, schreibt nur dieses eine Event. Der gleiche Wert wie gespeichert ist auf jedem Weg
  ein Erfolg ohne Write und ohne Event. Die Projektprüfung läuft über `credentialPortalProjectService`; beide
  Ablehnungen antworten 409.
- **Anlegen, Patch und Aufdecken teilen sich die Logik mit dem Portal:** `credentialWriteService.insert` und
  `.buildPatch`, `credentialRevealService.reveal` und die Feldregeln `credentialRequestSchemas` liegen unter
  `server/shared/services/credential/`. Die Handler hier behalten Zugriff, Zielprüfung, Version und Event-Actor.

## Stunden (ab Task 27)

Plan: `apps/workspace/plans/crm/20-stunden-und-history/27-kontingent-und-zuweisung.md`.

- Services unter `services/hours/`: `hours-ledger-service.ts` (Kundensperre, Einfügen und Wiederfinden der
  Buchungszeilen), `hours-mapping-service.ts`, `hours-schemas.ts`, `hours-activity-service.ts`. Die Summen liest
  `hoursBalanceService` unter `server/shared/services/hours/`, weil das Portal sie ebenfalls braucht.
- **Kein Stand wird gespeichert.** Jede Zahl entsteht aus den Zeilen über `computeCustomerHoursBalance` bzw.
  `computeProjectHoursBalance` (`@invessiv/common/patterns/crm/hours/hours-balance`). Kein Handler rechnet selbst.
- **Jede Kaufbuchung, Zuweisung und Freigabe sperrt zuerst die Kundenzeile** (`hoursLedgerService.lockCustomer`,
  `FOR NO KEY UPDATE`) und liest die Summen erst danach. Nur so können zwei parallele Zuweisungen den freien Bestand
  nicht gemeinsam überziehen.
- **Kein automatischer Ausgleich.** Ein überzogenes Projekt bedient sich nie aus einem anderen Projekt oder aus dem
  freien Bestand. Zuweisen zieht nur aus „Frei“ (`INSUFFICIENT_FREE_HOURS`), Freigeben gibt nur zurück, was das eigene
  Projekt nicht verbraucht hat (`INSUFFICIENT_RELEASABLE_HOURS`), eine Korrektur fällt nie unter die zugewiesene Summe
  (`BELOW_ALLOCATED_HOURS`). Alle drei antworten 409 und tragen die aktuellen Zahlen.
- **Buchungszeilen sind unveränderlich.** Es gibt weder Update noch Delete für Kaufbuchungen und Zuweisungen; eine
  Korrektur ist eine neue Zeile. Deshalb gibt es dort keine Version und kein `updateVersioned`.
- **Idempotenz:** Derselbe `idempotencyKey` am selben Kunden (und Projekt) liefert die bestehende Zeile als Erfolg und
  schreibt keine zweite Activity; an einem anderen Kunden ist er `VALIDATION_ERROR`.
- Rechte: Lesen `hours.read` (Kunde oder Projekt), Kaufbuchung und Zuweisung `hours.manage` (nur am Kunden bindbar,
  deshalb liegt auch die Zuweisung unter dem Kundenpfad und trägt `projectId` im Body). Ein Kunde außerhalb des
  Zugriffsbereichs antwortet `CUSTOMER_NOT_FOUND`, ein fremdes Projekt `PROJECT_NOT_FOUND`.
- Eine Projektbindung von `hours.read` zeigt nur die eigenen Projekte: `getCustomerHours` liefert dann
  `balance: null` und keine Kaufbuchungen.
- Zuweisen geht nicht an Projekte in `HOURS_CLOSED_PROJECT_STATUS_VALUES` (`PROJECT_CLOSED`); Freigeben geht immer.
- **Activities enthalten nie die Notiz**, nur Ids und Minuten (`metadata.entity` = `hour_purchase` bzw.
  `hour_allocation`). Es gibt keinen eigenen Activity-Typ.
- `hoursLedgerService.insertPurchase` nimmt `source` als Argument: Leistungsanfragen (Ordner 13c) und die monatliche
  Zubuchung (Ordner 20c) rufen später dieselbe Methode unter derselben Kundensperre auf.

Ab Task 72 (`apps/workspace/plans/crm/20-stunden-und-history/72-zeitbuchungen-und-aufgaben.md`):

- **Eine Zeitbuchung gehört zu genau einem Projekt und wechselt es nie.** Der Kunde kommt aus dem Projekt, der
  Buchende ist immer der Aufrufer (`performed_by_member_id`); es gibt kein Buchen im Namen anderer. Wer falsch gebucht
  hat, löscht und bucht neu.
- **Keine Prüfung gegen die zugewiesenen Stunden.** `createTimeEntry` und `updateTimeEntry` vergleichen nichts mit
  „Zugewiesen“ und sperren nichts: Überziehung ist erlaubt und wird nur angezeigt. Ein überzogenes Projekt gleicht
  sich nie automatisch aus.
- Buchen geht nicht auf Projekte in `HOURS_CLOSED_PROJECT_STATUS_VALUES` (`PROJECT_CLOSED`); Ändern und Löschen
  bestehender Buchungen gehen immer, damit sich korrigieren lässt, was der Kunde liest.
- **Aufgabe verknüpfen nur über `timeEntryAccessService.isTaskLinkable`:** dieselbe Projekt-ID und nicht `cancelled`,
  sonst `TASK_NOT_LINKABLE`. Die Regel gilt im Moment des Verknüpfens: Eine später abgebrochene Aufgabe behält ihre
  Buchungen, und eine unveränderte Verknüpfung bleibt beim Bearbeiten gültig. `tasks` bekommt keine Zeitspalte; eine
  Aufgabe braucht nie eine Buchung.
- Dauer 15 bis 600000 Minuten im 15-Minuten-Raster (`HoursLimits.MaxEntryMinutes`), Datum nie in der Zukunft (`businessToday()`), Beschreibung
  Pflicht. Das Datum prüft der Handler, weil das Schema den Geschäftstag nicht kennt.
- **Ändern über `updateVersioned`, Löschen unter Zeilensperre mit Versionsvergleich** (`timeEntryAccessService.lock`,
  Muster `deleteFile`). Beide antworten bei veralteter Version 409 mit der aktuellen Buchung.
- Zugriff über `timeEntryAccessService.condition` (`crmAccessCondition` mit Kunden- **und** Projektspalte): Eine
  Projektbindung erreicht nur die Buchungen ihres Projekts. Lesen `hours.read`, Schreiben `hours.write`; jeder
  Fehlgriff ist `PROJECT_NOT_FOUND` bzw. `TIME_ENTRY_NOT_FOUND`.
- Jede Schreibantwort trägt die neuen Zahlen des Projekts (`hoursBalanceService.loadProjectBalance`).
- **Activities enthalten nie die Beschreibung.** `created` beim Buchen, je geändertem Feld ein `field_change` mit
  Vorher/Nachher (Dauer, Datum, Kulanz, Aufgabe); eine geänderte Beschreibung wird nur als Feldname vermerkt. Löschen
  schreibt `field_change` mit Feld `deleted` und den Zahlen der gelöschten Zeile.
- **Die Liste blättert per Keyset** (`listProjectTimeEntries`): Sortierung `performed_on`, Buchungszeitpunkt auf
  Millisekunden gekürzt, `id` — jeweils absteigend. Der Cursor ist genau dieser Schlüssel
  (`@invessiv/common/patterns/crm/hours/time-entry-cursor`); die Kürzung auf Millisekunden steht in Sortierung **und**
  Vergleich, weil der Cursor als JS-Zeitstempel reist. Ein unlesbarer Cursor ist `VALIDATION_ERROR`.
- `getTaskBookedMinutes` liefert die gebuchte Zeit je Aufgabe eines Kunden in einer gruppierten Abfrage, Kulanz
  eingeschlossen: Die Zahl sagt, wie lange eine Aufgabe gedauert hat, nicht was berechnet wurde.

## Leistungsarten (ab Task 74)

Plan: `apps/workspace/plans/crm/13c-portal-leistungsanfragen/74-leistungsarten-und-zuweisung.md`.

- **Eine Vorlage hat eine Art** (`LineItemKind`: `standard`, `hours`, `feedback_round`), einen Projektbezug
  (`LineItemProjectMode`) und eine Portal-Freigabe mit eigenem Kundentext. Die Regeln stehen genau einmal in
  `lineItemTemplateSchemas` (`refineKind`) und als CHECK in der Datenbank: Stunden nur als `rate`, Zusatzrunde nur
  `one_time`, beide nur an einem bestehenden Projekt, Freigabe nur mit Kundentext. Die interne Beschreibung ersetzt
  den Kundentext nie.
- **Die vier neueren Spalten sind nullable** (Zeilen von vor Task 74). `NULL` liest der Mapper als Standard,
  bestehendes Projekt und nicht freigegeben; der Schreibpfad setzt immer einen Wert.
- **Eine Projektleistung entsteht nur über `projectLineItemAssignmentService.assign`.** Der Aufrufer lädt das
  Projekt, prüft `project_line_items.write` und dass die Vorlage aktiv ist; der Service prüft, was die Art
  zusätzlich braucht, und schreibt alles in der Transaktion des Aufrufers. Kein Handler fügt selbst in
  `project_line_items` ein. Die Annahme einer Leistungsanfrage (Task 75) ruft dieselbe Methode auf.
- **Stunden:** Menge Pflicht (Vielfaches von 15), `hours.manage` am Kunden (sonst `EFFECT_NOT_PERMITTED`, 403),
  kein abgebrochenes oder archiviertes Projekt (`PROJECT_CLOSED`, 409). Unter der Kundensperre
  (`hoursLedgerService.lockCustomer`) entstehen Leistung, Kaufbuchung (`source = project_line_item`) und
  Zuweisung an das Projekt gemeinsam; beide Buchungszeilen tragen die ID der Leistung als `idempotency_key`.
  Mit `allocateHoursToProject: false` entfällt nur die Zuweisung: Die Stunden bleiben frei, die Leistung
  dokumentiert weiter den Verkauf an ihrem Projekt, und `PROJECT_CLOSED` greift dann nicht.
- **Zusatzrunde:** `projects.write` am Projekt (sonst `EFFECT_NOT_PERMITTED`), dann
  `feedbackRoundService.addExtraRoundStep`: Projektsperre wie bei Übergabe und Projekt-Editor, Regel aus
  `findExtraFeedbackRoundBlocker` und `nextExtraFeedbackRoundPosition` (`@invessiv/common`), Schreiben über
  `updateLockedVersioned`, eine Activity `field_change` (`included_feedback_rounds`). Ein abgenommenes Projekt
  oder 20 Runden antworten `FEEDBACK_ROUND_NOT_AVAILABLE` (409).
- **Automatik-Arten entstehen als `confirmed` und bleiben es.** `updateProjectLineItem` lehnt einen anderen Status
  oder eine andere Preisart ab; die Menge ist nicht Teil des Update-Schemas. Korrekturen laufen über „Stunden
  gutschreiben → Korrektur“ bzw. den Projekt-Editor.
- **Wert:** `rate` ohne Menge bleibt ein Konditionswert; eine Stunden-Leistung zählt über
  `hoursLineItemAmountCents` als Einmalwert.
- `loadExtraFeedbackRoundBlockers` (`server/shared/services/feedback/`) nimmt nur Projekte, die der Aufrufer über seinen eigenen Zugriffsbereich
  gelesen hat; es ergänzt die Rundenstände und wendet dieselbe Regel wie die Zuweisung an. Die Abfrage selbst
  liegt seit Task 76 als `loadExtraFeedbackRoundBlockers` unter `server/shared/services/feedback/`, weil das Portal
  sie für seinen Katalog ebenfalls braucht.

## Leistungsanfragen intern (ab Task 75)

- Lesen und Sperren laufen über `serviceRequestAccessService` mit
  `service_requests.customer_id` und dem jeweiligen unabhängigen Lese-/Schreibrecht.
  Sidebar-Zähler und offener Eingang zählen dasselbe: `requested` und `offered`
  (`countOpen`). Ein Angebot ohne Antwort bleibt damit sichtbar, bis es entschieden ist.
- Der Eingang blättert serverseitig (`SERVICE_REQUEST_INBOX_PAGE_SIZE`): `countInbox` zählt mit
  derselben Bedingung wie `list`, `resolveListPage` klemmt eine zu hohe Seite auf die letzte.
  Die Cockpit-Liste eines Kunden bleibt ungeblättert. `list` nimmt seine Eingrenzung als
  `ServiceRequestListFilter`, nie als Positionsparameter.
- Angebot, Ablehnung und Annahme sperren zuerst die Anfrage, prüfen dann den Übergang und erst
  danach die Version. Terminale Wiederholungen sind `INVALID_TRANSITION`, auch mit alter Version.
- Annahme legt Vorlage, Projekt, Projektleistung und Stunden-/Rundenwirkung in **einer**
  Transaktion an. Ein erwarteter Fehler aus der Zuweisung wird intern zum Rollback-Signal und
  außerhalb der Transaktion wieder zum Result-Union; keine halben Neuanlagen.
- **Angebot zuerst:** `offered` verlangt den angebotenen Preis (`priceCents`, bei Stunden der
  Stundensatz) und genau bei Stunden die Menge (`minutes`); beides steht danach in
  `offered_price_cents` / `offered_minutes` und geht nie ins Portal. Aus `offered` führt intern
  auch `withdrawn` heraus („Kunde hat abgesagt“, ohne Grund, mit `decided_by_member_id`).
- Annahme prüft nach Sperre, Übergang und Version in dieser Reihenfolge: `OFFER_REQUIRED`, wenn
  die Anfrage noch `requested` ist und `acceptWithoutOffer` fehlt
  (`isServiceRequestWithoutOffer` aus `@invessiv/common`); `CATALOG_NOT_READABLE` ohne
  `line_item_templates.read`; dann die Vorlagenbindung: Eine Kataloganfrage, deren Vorlage noch
  aktiv ist und dieselbe Art hat, nimmt nur diese Vorlage und nie `mode: new`
  (`VALIDATION_ERROR`).
- Fehlercodes der Zuweisung werden über die Map `ASSIGNMENT_FAILURE` übersetzt, nie über
  Stringvergleich.
- `projectLineItemAssignmentService.listBlockers` liest die Rundenregel direkt über
  `loadExtraFeedbackRoundBlockers`; ein Service importiert keinen Query-Handler.
- `insertProject` und `insertLineItemTemplate` sind geteilte Insert-Helfer ohne Rechteprüfung.
  Rechte, Kundenzugehörigkeit, aktive Vorlage und Art prüft der aufrufende Handler.
  Neue Projekte übernehmen den Kunden-Owner; neue Vorlagen bleiben im Portal unveröffentlicht.
- Statusübergänge kommen ausschließlich aus `canTransitionServiceRequest`; die fachliche
  Zuweisung nutzt unverändert `projectLineItemAssignmentService` aus Task 74.
