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
- Kundennummern haben Lücken. Das ist gültig; keine Nummer wird wiederverwendet, und es gibt keine
  Logik, die Lücken „reparieren" will.

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
  genau eine Herkunft bleibt). Einziger weiterer Schreiber ist der Portal-Command `completeCustomerTask`
  (`src/server/portal/`). `updateTask` fasst Status und Abschlussdaten nie an.
- **Kundenaufgabe heißt sichtbar.** Handler und DB-CHECK verlangen `visible_to_customer`, sobald `action_side` =
  `customer`; ein Widerspruch wird abgewiesen, nicht korrigiert.
- **Activities enthalten nie Titel oder Beschreibung**, nur Ids und die geänderten Werte (`task-activity-service`).
- **Alle Listen nutzen `taskListOrderService`, alle Filter `taskListConditionsService`.** Die Filter sind das
  SQL-Gegenstück zu `taskDueStateService`; der Zugriffsbereich steht zuerst und wird von keinem Filter erweitert.

## Feedbackrunden (ab Task 59)

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
  Union: Zurückgeben verlangt einen Hinweis, Gespräch erlaubt einen, Start und Abschluss verbieten ihn.
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
- **Alle Schreibwege an Bausteinen und Feldern sind im Service, nicht in den Handlern.**
  `questionnaireDefinitionWriteService` kennt `createBlock`, `updateBlock`, `deleteBlock` und die Feldoperationen, jeweils
  mit dem `QuestionnaireBlockOwner`. Ein Handler parst, ruft den Service mit seinem Owner auf und gibt das Ergebnis
  zurück. Schlüssel sind je Owner eindeutig (`isBlockKeyTaken`): im Katalog global, im Bogen innerhalb des Bogens.
  Die Bogen-Handler aus Task 65 rufen dieselben Methoden mit der Bogen-ID auf und ergänzen nur ihre Zugriffs- und
  Statusprüfung; eine zweite Fassung der Logik gibt es nicht.
- **Jeder Schreibweg an einem Block** sperrt die Blockzeile, vergleicht die Blockversion unter der Sperre und erhöht sie
  über `updateLockedVersioned`. Antwort ist immer der ganze Block (`QuestionnaireCommandResult<QuestionnaireBlockDto>`).
- **Invarianten ausschließlich über `questionnaireDefinitionValidation.validateBlock`** auf dem Block nach der Änderung;
  kein Handler prüft Typ-Konfiguration, Bedingungen, Gruppen, Limits oder Übersetzungen selbst.
- **Blockkopien ausschließlich über `questionnaireBlockCopyService.copyBlock`** (in der Transaktion des Aufrufers, neue IDs,
  Bedingungen auf die Kopien umgehängt, `source_block_id` nur bei Kopien in einen Bogen).
- Katalogrechte workspace-weit (`questionnaire_templates.read/write`, kein `canOn`); Endpunkte über
  `CrmEndpointAccessRule.QuestionnaireCatalog` bzw. `QuestionnaireCatalogWrite`.

## Onboarding-Bogen intern (ab Task 65)

Plan: `apps/workspace/plans/crm/15-onboarding/65-bogen-anlegen-und-anpassen.md`.

- Services unter `services/onboarding/`: `onboarding-form-access-service.ts` (Bogen und Projekt mit Zugriffsbedingung
  laden, `lockForStructure`), `onboarding-form-create-service.ts` (Bogen anlegen, Katalogblock als Schritt kopieren),
  `onboarding-prefill-service.ts` (Übernahme aus dem letzten abgeschlossenen Bogen, CRM-Vorbelegung),
  `onboarding-form-structure-service.ts` (Rahmen für Strukturbefehle, Schritte verschieben und entfernen),
  `onboarding-form-schemas.ts`. Das DTO baut `onboardingFormReadService` unter `server/shared/services/onboarding/`.
- Lesen über `projects.read`, alles Schreibende über `projects.write`, jeweils mit `crmAccessCondition` in der
  `WHERE`-Klausel und `canOn`. Ein Bogen außerhalb des Zugriffsbereichs antwortet `ONBOARDING_FORM_NOT_FOUND`.
- **Start nur unter Projektsperre** (`lockWritableProject`, dieselbe Sperre wie der Projekt-Editor): Status aus
  `isOnboardingProjectEligible`, ein Bogen je Projekt, Kopien, Vorbefüllung und Activity `created` in einer Transaktion.
- **Jede Strukturänderung hält die Bogenzeile `FOR UPDATE`** (`lockForStructure`) und prüft darunter Zugriff und
  `isOnboardingStructureEditable` (`draft`, `open`; sonst `ONBOARDING_NOT_EDITABLE`). Deshalb ist die Schlüsselprüfung
  `isBlockKeyTaken` im Bogen ohne Unique-Index sicher: derselbe Katalogbaustein lässt sich nicht zweimal hinzufügen
  (`QUESTIONNAIRE_KEY_TAKEN`).
- **Zwei Aggregate, zwei Versionen.** Befehle an der Blockliste (`add`, `remove`, `move`) laufen über
  `runBlockListCommand`: sie vergleichen `expectedFormVersion` und antworten mit dem ganzen `OnboardingFormDto` (auch im
  409). Kopf- und Feldbefehle laufen über `runDefinitionCommand`: sie rufen `questionnaireDefinitionWriteService` mit der
  Bogen-ID als Owner auf, vergleichen die Blockversion und antworten mit dem Block. Beide erhöhen bei Erfolg die
  Bogenversion über `updateLockedVersioned`. Kein Bogen-Handler enthält eigene Definitionslogik.
- **Vorbefüllung nie raten:** Felder über `key` und Typ, Optionen über `key`, Werte nur, wenn sie die Prüfung des
  neuen Feldes bestehen. Quelle ist ausschließlich der jüngste Bogen desselben Kunden im Status `completed`.
  `confirmation` und `project_services` werden nie übernommen. CRM-Werte füllen nur Felder ohne übernommene Antwort;
  nichts wird ins CRM zurückgeschrieben. Im Bogen selbst angelegte Bausteine werden nie vorbefüllt. Die Antwortzeilen
  schreibt die Vorbefüllung über `onboardingAnswerWriteService.insertSlots` (`server/shared/services/onboarding/`),
  denselben Schreibweg wie das Portal.
- **Die Vorbefüllung überschreitet nie die Rechte des Aufrufers.** Quelle ist der jüngste abgeschlossene Bogen, den
  der Aufrufer mit `projects.read` lesen darf (eine projektgebundene Rolle bekommt nichts aus dem Schwesterprojekt, und
  `prefillAvailable` verrät es auch nicht); CRM-Stammdaten kopiert nur, wer `customers.read` am Kunden hat. Beides
  hängt am `actor` in `onboardingPrefillService`, nicht an den Handlern.
- Entfernen eines Blocks läuft über `questionnaireDefinitionWriteService.deleteBlock`; Antworten und Datei-Verknüpfungen
  fallen per Cascade weg, die Dateien bleiben.
- Fehlerabbildung der Routen: `onboardingApiError` (`src/lib/workspace/crm/`) für `OnboardingErrorCode`, Codes des
  Baukastens gehen an `questionnaireApiError` weiter. Endpunkte über `CrmEndpointAccessRule.OnboardingForm` bzw.
  `OnboardingFormWrite`.
