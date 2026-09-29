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
