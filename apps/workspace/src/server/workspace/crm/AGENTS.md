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
