# AGENTS.md — Domänenübergreifende Server-Services

Gilt für `apps/workspace/src/server/shared/**`. Ergänzt `src/server/AGENTS.md`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Zweck

Dieser Ordner ist die einzige zulässige Ausnahme von der Trennung zwischen `server/portal/` und
`server/workspace/` (siehe `src/server/portal/AGENTS.md`): Er hält **Services**, die von Handlern
beider Welten aufgerufen werden, weil dieselbe Fachlogik in beiden gebraucht wird — z. B. das
Anlegen/Syncen einer `users`-Zeile für eine Clerk-Identität (`clerk-user-service.ts`),
Portal-Rollen-/Mitgliedschafts-Validierung, die sowohl vom Portal-Redeem-Flow als auch von
CRM-Command-Handlern gebraucht wird (`portal-access-validation-service.ts`), oder das Schreiben von
Security-Events (`security-event-service.ts`), das von Handlern beider Welten in derselben
`security_events`-Tabelle protokolliert wird.

## Verbindlich

- **Nur Services, keine Handler.** Ein Command- oder Query-Handler gehört immer zu genau einer
  API-Schnittstelle (Portal **oder** Workspace) und liegt entsprechend unter `server/portal/` oder
  `server/workspace/`. Sobald zwei Handler aus unterschiedlichen Welten dieselbe Logik brauchen,
  wandert **die Logik** hierher in ein Service-Objekt — nicht der Handler, und keiner der beiden
  Handler ruft den anderen auf.
- **Keine Autorisierung.** Services hier liefern reine Fachlogik (Existenzprüfungen, Sync,
  Validierung) und konstruieren nie einen `PortalActor` oder `WorkspaceActor`. Die Actor-Auflösung
  bleibt in `server/portal/auth/` bzw. `server/workspace/auth/`.
- **Erst bei echter Zweitnutzung.** Ein Service entsteht hier erst, wenn ein zweiter Handler aus
  der jeweils anderen Welt dieselbe Logik braucht — kein vorsorglicher Platz „für später“.
- Benennung und Exportform wie in `src/server/AGENTS.md` beschrieben (`*-service.ts`, ein
  Service-Objekt als öffentliche API).

## Dateien (ab Task 55)

`files/` hält die Bausteine, die CRM- und Portal-Handler für Dateien teilen: `file-object-service.ts` (Link-Anlage,
Ticket-Anlage inkl. Pending-Limit, Abschluss inkl. Aktivität, Abbruch offener Uploads, Entfernen mit
`orphaned_at`-Fallback, Download-URL, Stream und actor-neutrale Aktivitätszeilen), `file-archive-service.ts`
(ZIP-Spaltenliste, Vorprüfung und Streaming), `file-request-schemas.ts` (gemeinsame Request-Felder),
`customer-file-visibility-service.ts` (ab Task 56: einzige Definition „der Kunde könnte diesen Eintrag öffnen“ —
fertig, nicht verwaist, kundenweit oder in einem portal-sichtbaren Projekt — plus `allMatch` für ID-Listen), dazu
Validierung und Storage-Zugang. Autorisierung, Sichtbarkeitsfilter, die Sperre der Uploader-Zeile und die Prüfung „nur
der eigene Upload“ bleiben in den getrennten Handlern (`portalFileService` bzw. `fileAccessService`).

## Chat-Anhänge (ab Task 56)

- `services/message/message-attachment-service.ts` schreibt `message_files` in derselben Transaktion wie die Nachricht
  und lädt die Anhänge einer Seite mit **einer** Abfrage. Welche Anhänge ein Betrachter sehen darf, entscheidet eine
  Sichtbarkeitsbedingung, die der Handler übergibt (Portal: `portalFileService.visibleCondition`, intern:
  `fileAccessService.readableCondition`). Nicht sichtbare Anhänge bleiben als Platzhalter ohne Namen, Art oder URL.
- Die Anhangs-IDs prüft ausschließlich der Handler seiner Welt, bevor `messageService.appendTextMessage` sie schreibt.
  Die interne Freigabe beim Senden läuft über `updateVersioned` und erst, nachdem die Nachricht neu angelegt wurde —
  ein Retry gibt nichts erneut frei.
- Ein Retry gilt nur mit gleichem Text **und** gleicher Anhangsliste als dasselbe Senden.

## Feedbackrunden (ab Task 58)

`services/feedback/` hält die Bausteine, die Portal- und Workspace-Handler der Feedbackrunden (Task 59–61) teilen.
Übergänge, Sperren, Rechte und Fehlercodes entscheidet der Handler seiner Welt anhand von `canTransition`
(`@invessiv/common/patterns/crm/feedback-round-state`); die Services setzen nur die Nebenwirkungen in derselben
Transaktion um.

- `feedback-round-task-service.ts` — die eine interne Sammelaufgabe je Runde (`tasks.feedback_round_id`, nie über den
  Titel erkannt). `ensureOpenForSubmission` legt sie an (Titel aus dem Workspace-Dictionary in `DEFAULT_LOCALE`,
  Bearbeiter Projekt-Owner, sonst Kunden-Owner, Mitgliedszeile `FOR SHARE`) oder öffnet eine `cancelled` Aufgabe wieder.
  Ohne aktiven Owner entsteht keine Aufgabe und kein Fehler — Einreichen scheitert nie an interner Besetzung.
  `markInProgress`, `cancelForReturn` und `completeForRound` ändern nur aus dem erwarteten Ausgangsstatus; eine von Hand
  geänderte Aufgabe bleibt unberührt.
- `feedback-round-item-service.ts` — `loadByRound` lädt Punkte und Anhänge mehrerer Runden mit **einer** Abfrage; die
  Sichtbarkeitsbedingung für Dateien übergibt der Handler (wie bei Chat-Anhängen). `replaceDraftItems` gleicht den
  Entwurf gegen den gespeicherten Stand ab (Listenreihenfolge = Position); vor dem Löschen eines Punkts werden seine
  Dateien gelöst, die Datei selbst bleibt. Positionen dürfen sich innerhalb der Transaktion tauschen: der Unique-Index
  `(round_id, position)` ist `DEFERRABLE` und wird nur dort kurz aufgeschoben.
- `feedback-project-step-service.ts` — `advancePastFeedbackRound` setzt nach einer Abnahme `current_process_step` auf den
  Schritt direkt hinter der Runde (unter Projektsperre, über `updateVersioned`); eine Runde hinter dem letzten Schritt
  ändert nichts.
- `feedback-round-activity-service.ts` — Activities nur mit bestehenden Typen (Übergabe `created`, Einreichen
  `submission_received`, jeder weitere Statuswechsel `field_change` mit Feld `status`). Die Runde steht in `metadata`
  (`entity: FEEDBACK_ROUND_ACTIVITY_ENTITY`, `feedback_round_id`, `round_number`); Feedbacktext kommt nie ins Log.
- Zeilen- und Eingabetypen liegen in `feedback-service-types.ts`, das Anhangs-Mapping in `feedback-mapping-service.ts`.
- Ab Task 59:
  - `feedback-round-write-service.ts` ist der einzige Schreibweg einer **gesperrten** Runde samt aller Nebenwirkungen in
    derselben Transaktion: `recordHandOver` (Activity + Chat nach dem Insert), `saveDraft` (Entwurfsstempel +
    `replaceDraftItems`), `submit` (Status, Sammelaufgabe, Activity, Chat), `approve` (Status, Projektschritt,
    Activity, Chat). Welcher Schritt erlaubt ist, entscheidet der Handler über `canTransition`; kein Handler schreibt
    Rundenstatus, Activity oder Rundennachricht an diesem Service vorbei. Ab Task 61 zusätzlich die internen
    Schritte (`FeedbackMemberWrite`): `requestDiscussion` (Hinweis optional, Chat), `startImplementation`
    (`started_at`, Aufgabe `in_progress`, kein Chat), `returnToCustomer` (Hinweis Pflicht, `submitted_*` und `read_at`
    geleert, Aufgabe `cancelled`, Chat) und `complete` (`completed_*`, Aufgabe `done`, Chat). Jeder Schritt schreibt
    genau eine Activity.
  - `customer_notice` gehört immer zum aktuellen Schritt: Gespräch und Zurückgeben setzen ihn, Umsetzung starten und
    erneutes Einreichen leeren ihn. So zeigt keine Oberfläche einen veralteten Hinweis.
  - `feedback-attachment-service.ts` schreibt als einzige Stelle die Spalten `feedback_round_id`/`feedback_item_id`
    einer Datei (`attachFile`, `detachFile`, `detachItemFiles`). Anhängen liegt bewusst neben Lösen, obwohl nur das
    Portal anhängt: Binden und Lösen dürfen nicht auseinanderlaufen. Die Dateizeile sperrt der Handler vorher.
  - `replaceDraftItems` wirft `FeedbackItemIdTakenError`, wenn eine Client-ID einer anderen Runde gehört (auch im
    Wettlauf, über den Primärschlüssel); der Aufrufer fängt das in einem Savepoint als Validierungsfehler.
  - `loadByRound` nimmt einen reinen Lese-Executor, damit Query-Handler ohne Transaktion lesen.
  - Gesperrte Zeilen werden über `updateLockedVersioned` geschrieben (wirft statt 409, weil ein Versionsverlust unter
    Sperre ein Fehler ist).

## Systemnachrichten (ab Task 59)

`services/message/announce-system-message.ts` ist der einzige Weg für fachliche Chat-Hinweise: Savepoint, Fehler nur
geloggt (Name, Key, kein Text). Ein Fachwrite scheitert nie an seiner Systemnachricht. Neue Ereignisse rufen diesen
Helfer auf, statt Savepoint und Logging zu kopieren.

## Fragebogen-Baukasten lesen

`services/questionnaire/` hält, was beide Welten zum Lesen von Baustein-Definitionen brauchen:
`questionnaire-definition-read-service.ts` (Blöcke samt Feldern, Optionen und Übersetzungen laden, Owner in der
`WHERE`-Klausel), `questionnaire-mapping-service.ts` (Zeilen → DTOs) und `questionnaire-definition-types.ts`
(Zeilentypen, `QuestionnaireReadExecutor`, `QuestionnaireBlockOwner`). Der Bogen-Read-Service unten baut darauf auf;
kein Service hier importiert aus `server/workspace/crm/services/questionnaire/**`. Schreibwege, Validierung,
Kopierdienst und Vorlagen bleiben im Workspace-Pfad, weil nur das Team Definitionen ändert.

## Onboarding-Bogen (ab Task 65)

`services/onboarding/onboarding-form-read-service.ts` baut `OnboardingFormDto` und `OnboardingFormSummaryDto`;
das Mapping liegt in `onboarding-form-mapping-service.ts`, die Zeilentypen in `onboarding-form-types.ts`.

- Der Service liegt bewusst schon hier, obwohl bis Task 66 nur Workspace-Handler ihn nutzen: Die Portal-Handler aus
  Task 66 lesen denselben Bogen (Planvorgabe Task 65). Welche Dateien ein Betrachter sieht, entscheidet die
  Sichtbarkeitsbedingung des Aufrufers (`fileAccessService.readableCondition` bzw. der Portal-Filter); ein Link auf
  eine nicht sichtbare Datei entfällt.
- **Keine Regel zu Sichtbarkeit, Pflicht oder Fortschritt.** `toSummaryDto` beschafft nur die Eingaben und ruft
  `getQuestionnaireCompleteness` auf. Der Fortschritt zählt jede Datei-Verknüpfung, unabhängig vom Betrachter.
  Damit ein Client genauso zählt, liefert `toFormDto` die Verknüpfungen, deren Datei der Betrachter nicht öffnen darf,
  als `hiddenAnswerFiles` (nur Feld und Eintrag). Wer aus einem Bogen-DTO die Vollständigkeit berechnet, nimmt
  `toOnboardingCompletenessInput` (`@invessiv/common`) bzw. hängt `hiddenAnswerFiles` an `answerFiles` an.
- Die Quelle der Projektleistungen (aktuelle `project_line_items` außer `rejected`, nach Abschluss der Snapshot
  `onboarding_form_services`) wird ausschließlich in `loadServices` gewählt.

Ab Task 66:

- `onboardingFormReadService.toCompleteness` beschafft die Eingaben und ruft `getQuestionnaireCompleteness` auf;
  `toSummaryDto` und das Absenden im Portal nutzen genau diesen Weg. `findField` liefert ein Feld nur, wenn sein
  Block dem Bogen gehört.
- `onboarding-answer-write-service.ts` ist der einzige Schreibweg für `onboarding_answers`: `replaceSlot` (Portal,
  ersetzt alle Zeilen eines Slots, leerer Inhalt löscht) und `insertSlots` (Vorbefüllung beim Start). Wer schreibt,
  steht als `OnboardingAnswerAuthor` an jeder Zeile. Ob Feld und Inhalt zulässig sind, entscheidet der Aufrufer.
- `onboarding-form-transition-service.ts` führt Statuswechsel eines **gesperrten** Bogens samt Nebenwirkungen aus
  (`submit`: Status, `submitted_*`, Activity `submission_received`, Systemnachricht `onboardingSubmitted`). Ob der
  Wechsel erlaubt ist, entscheidet der Handler seiner Welt über `canTransitionOnboardingForm`. Freigeben,
  Nachfordern und Abschließen kommen mit ihren Tasks hier dazu.
- `services/load-portal-contact-names.ts` (früher unter `feedback/`) liefert Anzeigenamen von Kontakten je
  Portal-Mitgliedschaft für Feedbackrunden und Onboarding.

Ab Task 67:

- `onboarding-group-entry-service.ts` ist der einzige Schreibweg für `onboarding_group_entries`: `append`,
  `insertEntries` (Vorbefüllung), `remove`
  (Antworten und Datei-Verknüpfungen fallen über die zusammengesetzten Fremdschlüssel weg, die Dateien bleiben; die
  Einträge dahinter rücken in einem Statement auf) und `move` (Tausch mit kurz aufgeschobenem Positionsindex).
- `onboarding-attachment-service.ts` ist der einzige Schreibweg für `onboarding_answer_files` (`attach`, `detach` mit
  Aufrücken der Positionen im Slot, `insertLinks` für die Vorbefüllung). `isBound` beantwortet dem internen Datei-Löschpfad, ob eine Datei an einem Bogen
  hängt. Ob Feld, Art, Grenze und Besitz passen, entscheidet der Handler, der Bogen und Datei gesperrt hält.
- `onboardingFormReadService.toFormDto` setzt `servicesChangedSinceConfirmation`: wahr, wenn eine Projektleistung
  (jeder Status, auch `rejected`) nach `services_confirmed_at` geändert wurde; immer falsch ohne Bestätigung und nach
  dem Abschluss. Der Vergleich mischt die Anwendungsuhr (Bestätigung) mit der Datenbankuhr (`updated_at`) und ist
  deshalb auf Sekunden unscharf — für einen Hinweis an das Team reicht das.
- `onboardingFormTransitionService.release` öffnet einen gesperrten Entwurf (`released_*`, Activity `status_change`
  mit `previous_status`/`next_status`, Systemnachricht `onboardingReleased`). Ob freigegeben werden darf und welche
  Warnungen offen sind, entscheidet der Workspace-Handler.

Ab Task 68 (`apps/workspace/plans/crm/15-onboarding/68-pruefung-und-nachforderung.md`):

- `services/project-responsible-member-service.ts` — `findActiveMemberId` liefert den Zuständigen eines Projekts:
  Projekt-Owner, sonst Kunden-Owner, jeweils nur aktiv; die Mitgliedszeile bleibt `FOR SHARE` gesperrt. Aus
  `feedback-round-task-service` extrahiert; Feedbackrunden und Onboarding nutzen ihn, Task 69 ebenfalls. Bewusst ein
  Service mit einer Methode (Planvorgabe), weil er als eigener Fachkontext weitere Abfragen bekommt.
- `onboarding-task-service.ts` — die eine interne Sammelaufgabe je Bogen (`tasks.onboarding_form_id`, nie über den
  Titel erkannt). `ensureForSubmission` legt sie beim ersten Absenden an (Titel aus dem Workspace-Dictionary in
  `DEFAULT_LOCALE`) und fasst eine bestehende nie an: Nachforderung und erneutes Absenden ändern nichts, eine von Hand
  geänderte Aufgabe bleibt. Ohne aktiven Owner entsteht keine Aufgabe und kein Fehler (`assignee_member_id` ist
  `NOT NULL`, wie bei den Feedbackrunden). Den Abschluss (`done`) ergänzt Task 70.
- `onboarding-review-service.ts` ist der einzige Schreibweg der Prüfspalten an `onboarding_form_blocks`:
  `writeReview` (ein atomares `UPDATE … WHERE form_id, block_id, version`, weil die Tabelle weder `id` noch
  `updated_at` hat und `updateVersioned` deshalb nicht passt; der Aufrufer hält die Bogensperre, ein Fehlgriff wirft)
  und `reopenRequested` (setzt beim erneuten Absenden genau die Blöcke mit `clarification` + `customer` auf
  `pending` und leert Notiz und Prüfer). `listSteps`/`findStep` lesen die Schritte.
- `onboardingFormTransitionService.submit` ruft zusätzlich `reopenRequested` und `ensureForSubmission` auf;
  `requestChanges` setzt `changes_requested`, schreibt die Activity `status_change` mit
  `metadata.clarifications` (`block_id`, `note` — der einzige Ort, an dem die Rückfrage nach dem erneuten Absenden
  noch steht) und die Systemnachricht `onboardingChangesRequested` mit den Blocktiteln in `DEFAULT_LOCALE`.

Ab Task 69 (`apps/workspace/plans/crm/15-onboarding/69-onboarding-termin.md`):

- `projectResponsibleMemberService.findBookingContact` liefert, in wessen Kalender der Kunde eines Projekts bucht:
  der erste aus Projekt-Owner und Kunden-Owner, der aktiv ist **und** einen Buchungslink hat. Anders als
  `findActiveMemberId` gibt ein aktiver Projekt-Owner ohne Link die Frage an den Kunden-Owner weiter. Reine
  Leseabfrage ohne Sperre; ein inaktives Mitglied liefert nie einen Link.

Ab Task 70 (`apps/workspace/plans/crm/15-onboarding/70-abschluss-und-leseansicht.md`):

- `onboardingFormTransitionService.complete` schließt einen **gesperrten** Bogen in einer Transaktion: Snapshot der
  Leistungen, Status `completed` mit `completed_at/_by` und `call_held_on`, Sammelaufgabe, Activity `status_change`,
  Systemnachricht `onboardingCompleted`, zuletzt optional der Phasenwechsel (damit im Chat „abgeschlossen“ vor „neue
  Phase“ steht). Ob abgeschlossen werden darf (Übergang, Version, Call-Datum, Pflichtangaben), entscheidet der
  Workspace-Handler.
- `onboarding-services-snapshot-service.ts` hält beide Quellen der Projektleistungen: `listLive` (aktuelle
  `project_line_items` außer `rejected`, in Buchungsreihenfolge) und `listFrozen` (`onboarding_form_services`).
  `freeze` schreibt genau das, was `listLive` in diesem Moment zeigt. Welche Quelle ein Bogen liest, wählt weiterhin
  nur `loadServices` im Read-Service; ab `completed` erscheint keine spätere Leistungsanfrage mehr im Bogen.
- `onboarding-project-step-service.ts` — `advancePastOnboarding` sperrt das Projekt und schaltet nur aus der Phase
  `onboarding` nach `design`; `current_process_step` rückt nur weiter, solange er noch der erste Schritt ist. Jede
  andere Phase bleibt unberührt. Geschrieben wird über `updateLockedVersioned`. Bewusst ein Service mit einer Methode
  (Planvorgabe, Muster `feedbackProjectStepService`).
- `services/message/announce-phase-change.ts` — die eine Systemnachricht eines Phasenwechsels, aus
  `update-project.command-handler.ts` extrahiert. Projekt-Editor und Onboarding-Abschluss rufen denselben Helfer.
- `onboardingTaskService.completeForForm` setzt die Sammelaufgabe auf `done`, aber nur aus `open` oder `in_progress`;
  eine von Hand abgebrochene oder erledigte Aufgabe bleibt.
- **Nach `completed` ist der Bogen unveränderlich.** Es gibt dafür keinen eigenen Schalter: Die bestehenden Regeln
  schließen `completed` bereits aus (`isOnboardingStructureEditable`, `isOnboardingReviewOpen`,
  `canTransitionOnboardingForm`, `listCustomerEditableOnboardingBlockIds`). Ein neuer Schreibpfad am Bogen muss durch
  eine dieser Funktionen laufen; `onboarding-complete.integration.test.ts` prüft jede Endpunkt-Gruppe.
