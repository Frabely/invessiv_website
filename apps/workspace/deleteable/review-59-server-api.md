# Code-Review — Branch `feat/crm-feedback-3-api` (Task 59)

Stand: 29.09.2026 · Scope: kompletter Branch gegen `master` (≈ 95 Dateien, nicht committet).
Zwei Durchgänge: **Review 1** Struktur, Dateiaufbau, Duplikate, Längen · **Review 2** Logik, Nebenläufigkeit,
Sicherheit, Tests. Schweregrad: **hoch** (vor Merge beheben) · **mittel** (sollte in diesem PR) · **niedrig**
(Nacharbeit/Ticket).

Gates zum Zeitpunkt des Reviews: lint, typecheck, `pnpm -r test`, `db:smoke:crm` (145 Checks, 144 Tests),
`db:smoke:rbac` (117 Checks), Workspace-Build — alle grün. Die Befunde unten sind also Qualitäts-/Struktur- und
Logikbefunde, keine roten Gates.

---

## Review 1 — Struktur, Duplikate, Datei- und Funktionslängen

### R1-01 · hoch · Duplikat — identischer Prelude in allen fünf Portal-Commands

Dateien: `server/portal/command-handler/{save-portal-feedback-draft,submit-portal-feedback-round,
approve-portal-feedback,attach-portal-feedback-file,detach-portal-feedback-file}.command-handler.ts`

Jeder Handler wiederholt denselben Ablauf: Schema parsen → `getDrizzleDatabaseClient().transaction` →
`portalFeedbackService.lockRound` → `if (!locked) return NOT_FOUND` → `rejectUnlessOpen(tx, actor, round, version?)`.
Dazu die Konstanten `NOT_FOUND` / `VALIDATION` pro Datei neu (`attach…:26`, `detach…:17`, `save…:21`) bzw. inline
`{ ok: false, code: PortalFeedbackErrorCode.Validation }` (`submit…:77`, `approve…:48`, `attach…:106`).

Vorschlag: `portalFeedbackService.withOpenRound(actor, roundId, { version? }, run)` — öffnet die Transaktion, sperrt,
prüft offen/Version und ruft `run(tx, { round, projectTitle })`. Submit braucht vorher den Idempotenz-Check →
`withLockedRound` (ohne Offen-Prüfung) + `withOpenRound` darauf aufbauend. Task 61 bringt weitere Commands mit
demselben Prelude; ohne Extraktion wächst das Duplikat mit.

### R1-02 · hoch · Duplikat — „Aktivität + Chat-Systemnachricht" ist in jedem Command ein festes Paar

Dateien: `hand-over-feedback-round.command-handler.ts:151–160`, `submit-portal-feedback-round.command-handler.ts:104–113`,
`approve-portal-feedback.command-handler.ts:77–88`

Jedes Rundenereignis schreibt `feedbackRoundActivityService.record…` und direkt danach `announceFeedbackRound(…)`.
Die Paarung ist fachlich fest (README „Benachrichtigung": jedes Ereignis = Activity + Systemnachricht) und kommt in
Task 61 viermal dazu (Gespräch, Zurück, Abschluss, Abnahme nach Abschluss).

Vorschlag: `feedbackRoundActivityService` zu einem `feedbackRoundEventService` erweitern, der je Ereignis beides tut
(`handedOver(tx, round, actor, projectTitle)`, `submitted(…)`, `statusChanged(…, key)`). `announce-feedback-round.ts`
fällt dann als eigene Datei weg (ist heute ein Ein-Funktions-Helfer mit genau diesem einen Zweck).

### R1-03 · mittel · Duplikat (Bestand + Changeset) — „`updateVersioned` unter Sperre, sonst throw"

Fundstellen (9×): `portal-feedback-service.ts:149–163` (`writeRound`), `feedback-round-item-service.ts:79–96`
(`writeFileBinding`) und `:222–233`, `feedback-project-step-service.ts:39–47`, `feedback-round-task-service.ts:79–90`,
`hand-over-feedback-round.command-handler.ts:81–89`, `file-object-service.ts:227–235`,
`update-file.command-handler.ts:70–77`, `customer-contact-service.ts:99`.

Alle rufen `updateVersioned({ … expectedVersion: locked.version … })` und werfen bei `!write.ok`. Vorschlag: in
`server/workspace/shared/update-versioned.ts` ein zweites Export `updateLockedVersioned(args, message)` (gibt die
Row zurück, wirft sonst). `writeRound` und `writeFileBinding` werden dann überflüssig. Bestand im selben PR nur
für die Feedback-Dateien umstellen, Rest beim nächsten Anfassen (AGENTS-Regel „Bestand beim nächsten Ändern").

### R1-04 · mittel · Duplikat (Bestand + Changeset) — drei „privat + Fehler abfangen"-Wrapper

`lib/files/file-api-response.ts` (`privateFileResponse`), `lib/workspace/crm/feedback-round-api-error.ts`
(`privateFeedbackRoundResponse`), `lib/portal/portal-feedback-api-response.ts` (`privatePortalFeedbackResponse`).

Alle drei: `try { run() } catch { log; errorResponse }` + `Cache-Control: private, no-store`. Nur Logger und
Fehlerantwort unterscheiden sich. `markPrivateNoStore` wurde schon extrahiert, der Rest nicht. Vorschlag:
`lib/http/private-no-store.ts` → `privateResponse(run, onError: (error) => Response)`; die drei Wrapper werden
Einzeiler bzw. entfallen.

### R1-05 · mittel · Duplikat (Bestand + Changeset) — drei „JSON lesen, sonst 400"-Helfer

`parseFileBody` (`lib/files/file-api-response.ts`), privates `readValidBody` (`lib/workspace/crm/message-request-input.ts`),
neu `withPortalFeedbackBody` (`lib/portal/portal-feedback-api-response.ts`), dazu der Inline-Block in
`app/api/workspace/crm/projects/[projectId]/feedback-rounds/route.ts` (POST). Vorschlag: ein generischer
`lib/http/read-valid-body.ts` (Schema optional), die drei Varianten darauf umstellen.

### R1-06 · mittel · Struktur — Portal importiert direkt aus `server/workspace/`

`server/portal/services/feedback/portal-feedback-service.ts:27–28` importiert `updateVersioned` und `VersionedPatch`
aus `@/server/workspace/shared/…`. `server/portal/AGENTS.md`: „Getrennt von `server/workspace/`". Bisher hat nur
`server/shared/**` diesen Import, kein Portal-Code. Vorschlag: `update-versioned.ts` + `update-versioned-types.ts`
nach `server/shared/` verschieben (reiner Pfad-Refactor, ~20 Importstellen) — oder `writeRound` in einen Service
unter `server/shared/services/feedback/` legen (passt zu R1-02/R1-03).

### R1-07 · mittel · Struktur — „Erst bei echter Zweitnutzung" verletzt

`feedback-round-item-service.ts`: `attachFile` und `countAttachments` haben nur einen Aufrufer (Portal-Attach). Laut
`server/shared/AGENTS.md` gehören sie dann nicht in den geteilten Service. `detachFile` ist berechtigt (Portal-Detach +
`replaceDraftItems`). Vorschlag: Anhänge-Bindung in eigenen Service `feedback-attachment-service.ts` (siehe R1-08);
`countAttachments` in den Attach-Handler, bis Task 61 sie intern braucht — oder bewusst als Ausnahme in AGENTS
dokumentieren.

### R1-08 · mittel · Länge — `feedback-round-item-service.ts` (243 Zeilen, drei Verantwortungen)

Laden (`loadByRound`, 45 Z.), Entwurf abgleichen (`replaceDraftItems`, ~60 Z. mit Insert- und Update-Zweig in einer
Schleife) und Dateibindung (`writeFileBinding`/`attachFile`/`detachFile`/`detachFiles`/`countAttachments`).
Vorschlag: Dateibindung nach `feedback-attachment-service.ts`; in `replaceDraftItems` Insert- und Update-Zweig in
private `insertItem` / `updateItem` teilen.

### R1-09 · mittel · Duplikat — Datei sperren im Portal zweimal ähnlich

`attach-portal-feedback-file.command-handler.ts:51–69` (`lockCustomerFile`: id + Kunde + sichtbar, `FOR UPDATE`) vs.
`portal-file-service.ts` `lockOwnUpload` (id + Kunde + eigene Membership + Upload, `FOR UPDATE`). Datei-Sperren
gehören in `portalFileService` (dort liegt die Regel „was darf der Kontakt an Dateien anfassen"). Vorschlag:
`portalFileService.lockVisible(tx, actor, id)` neben `lockOwnUpload`.

### R1-10 · mittel · Duplikat — Punkt-Abfragen verstreut über vier Handler

`hasItems` (approve:25), `rejectIncompleteDraft`-Query (submit:27), `itemExists` (attach:32), `claimsForeignItem`
(save:38). Alle fragen `feedback_round_items` einer Runde ab. Task 61 braucht intern „alle Punkte mit Ergebnis" —
dasselbe Muster. Vorschlag: `feedbackRoundItemService.listItemHeads(tx, roundId)` (id, body, result) + `findForeignIds`.

### R1-11 · niedrig · Duplikat — Kunden-Activity-Actor viermal gebaut

`{ type: ActorType.Customer, userId: actor.userId }` in `complete-customer-task…:117`, `complete-portal-file-upload…:23`,
`create-portal-file-link…:46` und neu `portalFeedbackService.activityActor`. Der neue Helfer ist feedback-spezifisch
verortet, obwohl er portalweit gilt. Vorschlag: `server/portal/auth/portal-activity-actor.ts` (oder als Funktion
neben `createPortalActor`) und die drei Bestandsstellen umstellen. Gleiches Muster intern (`memberActor` in
`feedback-round-task-service.ts`, 35× inline `type: ActorType.User`) — separates Ticket.

### R1-12 · niedrig · Duplikat — „portal-sichtbares Projekt des Kunden" als Bedingung sechsmal

`PORTAL_VISIBLE_PROJECT_STATUS_VALUES` + `customer_id` wird in `complete-customer-task`, `get-portal-dashboard` (2×),
`list-portal-file-projects`, `portal-file-service.targetExists`, `customer-file-visibility-service` und neu
`portalFeedbackService.visibleProjectCondition` jeweils selbst gebaut. Vorschlag: eine `portalProjectCondition(reader)`
unter `server/portal/shared/` (neben `portalAccessCondition`) und dort konsolidieren.

### R1-13 · niedrig · Struktur — Cross-Domain-Import für „heute"

`feedback-round-schemas.ts:5,29` nutzt `taskDueStateService.businessToday()` aus `common/patterns/tasks/`. Die
Geschäftszeitzone ist kein Aufgabenkonzept. Vorschlag: `businessToday` nach `common/patterns/time/business-date.ts`
(oder `packages/common/src/patterns/crm/`) ziehen, `taskDueStateService` delegiert.

### R1-14 · niedrig · Struktur — Benennung/Ort der Response-Helfer uneinheitlich

Intern `lib/workspace/crm/feedback-round-api-error.ts` (enthält auch den Response-Wrapper), Portal
`lib/portal/portal-feedback-api-response.ts` (neuer Ordner `lib/portal/`). Plan verlangt „Message-Texte nur in
co-located `*-error.ts`". Vorschlag: Portal-Datei in `portal-feedback-api-error.ts` umbenennen; nach R1-04 enthält sie
ohnehin nur noch Map + Fehlerfunktion.

### R1-15 · niedrig · Struktur — Testpfad spiegelt Service-Pfad nicht

`server/tests/workspace/crm/services/feedback-round-mapping-service.test.ts` testet
`server/workspace/crm/services/feedback/feedback-round-mapping-service.ts` → Test gehört nach
`tests/workspace/crm/services/feedback/` (Regel „Tests spiegeln die Server-Struktur"; Portal-Seite macht es richtig).

### R1-16 · niedrig · Struktur — Mapping-Service ohne Testerweiterung

`feedback-mapping-service.ts` hat mit `fileToAttachmentDto` eine neue öffentliche Methode; `feedback-mapping-service.test.ts`
wurde nicht erweitert (AGENTS: jeder Mapping-Service mit eigener Testabdeckung).

### R1-17 · niedrig · Duplikat — Array-Gleichheit dreimal von Hand

`hand-over-feedback-round.command-handler.ts:76–78`, `message-service.ts:215`, `file-validation-service.ts:152`.
Vorschlag: `packages/common/src/patterns/collections/same-sequence.ts` (seiteneffektfrei, getestet).

### R1-18 · niedrig · Struktur — neuer Ordner `common/constants/feedback/`

`FeedbackApiPath` liegt in einem neuen Top-Level-Ordner, während Chat-Pfade unter `constants/crm/` liegen. Vertretbar
(Feedback wird wie `files/` von CRM und Portal genutzt), sollte aber bewusst so entschieden sein.

### Dateilängen / Funktionslängen (Übersicht)

| Datei                                            | Zeilen | Bewertung                                       |
| ------------------------------------------------ | -----: | ----------------------------------------------- |
| `feedback-round-item-service.ts`                 |    243 | zu lang, drei Verantwortungen → R1-08           |
| `portal-feedback-service.ts`                     |    180 | ok; wächst mit R1-01 → nach R1-03/R1-11 kleiner |
| `hand-over-feedback-round.command-handler.ts`    |    171 | ok, alle Funktionen < 40 Z.                     |
| `attach-portal-feedback-file.command-handler.ts` |    148 | grenzwertig; nach R1-01/R1-09 ≈ 90 Z.           |
| `replaceDraftItems` (Funktion)                   |    ~60 | zu lang → R1-08                                 |
| übrige neue Funktionen                           |   < 45 | ok                                              |

---

## Review 2 — Logik, Nebenläufigkeit, Sicherheit, Tests

### R2-01 · hoch · Logik/Struktur — `FEEDBACK_ROUND_TRANSITIONS` / `canTransition` wird nirgends genutzt

`grep canTransition apps/workspace/src` → keine Nutzung. Plan (Task 58) und `server/shared/AGENTS.md`: „Übergänge
entscheidet der Handler anhand von `canTransition` … die Tabelle ist die einzige Quelle für Server und UI". Die
Handler prüfen stattdessen hart `round.status !== Open` (`portal-feedback-service.ts:141`), die Übergabe prüft gar
keinen Übergang. Folge: Server und UI (Task 60 soll Buttons über `canTransition` zeigen) können auseinanderlaufen;
Task 61 (`completed → approved`) müsste die harte Prüfung wieder aufbohren.
Vorschlag: `rejectUnlessOpen` → `rejectUnlessTransition(round, target, FeedbackTransitionSide.Customer)` mit
`INVALID_TRANSITION`/`locked`-Abbildung; Freigabe zusätzlich „heute nur aus `open`" als bewusst dokumentierte
Einschränkung bis Task 61.

### R2-02 · mittel · Logik — Anhänge im Portal hängen an `portal.files.read`, Anhängen nicht

`portalFeedbackService.toRoundDtos` filtert Anhänge über `portalFileService.visibleCondition`, die
`portal.files.read` verlangt. Anhängen/Lösen verlangt nur `portal.feedback.submit`. Ein Kontakt mit Feedback-, aber
ohne Datei-Leserecht kann also Dateien anhängen, sieht sie danach aber nicht (Antwort von `attach` enthält sie, die
Seite nicht). Entscheiden: entweder Anhängen zusätzlich an `portal.files.read` koppeln, oder Feedback-Anhänge über
eine eigene Sichtbarkeit (eigene Kundenuploads der Runde) zeigen. Ist in der README nicht geregelt → mit Owner
klären.

### R2-03 · mittel · Logik — Freigabe prüft `confirmFinal` vor der Sperre

`approve-portal-feedback.command-handler.ts:50`: Ohne Häkchen kommt `confirmation_required` auch für eine bereits
eingereichte/abgenommene Runde; die UI würde den Bestätigungsdialog für eine gesperrte Runde erneut anbieten.
Reihenfolge besser: sperren → `locked`/Konflikt → erst dann `confirmation_required`.

### R2-04 · mittel · Logik — Idempotenz beim Einreichen greift in jedem Folgestatus

`submit-portal-feedback-round.command-handler.ts:47–64`: `alreadySubmitted` wird für jeden Status ≠ `open` geliefert,
solange `submitted_by` = eigene Membership — also auch nach `in_progress`, `completed` und (Task 61) nach einer
Abnahme aus `completed`. Ein veralteter Tab bekommt dann „Erfolg" statt `locked`. Vorschlag: nur bei Status
`submitted` idempotent antworten, sonst `locked`.

### R2-05 · mittel · Logik — fremde Punkt-ID: Prüfung ohne Sperre

`save-portal-feedback-draft.command-handler.ts:38–61` (`claimsForeignItem`) liest ungesperrt. Zwei gleichzeitige
Saves verschiedener Runden mit derselben (vom Client gewählten) ID führen zu PK-Verletzung → 503 statt 400. Nur mit
manipuliertem Client erreichbar, aber: Die DB-Verletzung sollte als `validation` abgebildet werden (Unique-Violation
auf `feedback_round_items_pkey` in `replaceDraftItems` abfangen) statt als „Feedback nicht verfügbar".

### R2-06 · niedrig · Logik — Übergabe erhöht die Projektversion

`saveProjectAreas` (`hand-over…:70–90`) schreibt `projects.feedback_areas` über `updateVersioned`. Ein parallel
offener Projekt-Editor bekommt danach 409, obwohl sich aus seiner Sicht nichts geändert hat. Plan-konform, aber in
Task 60 im Editor-Konfliktdialog berücksichtigen (Hinweis „Bereiche wurden bei der Übergabe geändert").

### R2-07 · niedrig · Logik — `answerRepeatedSubmission` vor Versionsprüfung

Eine Wiederholung mit beliebiger (auch falscher) Version bekommt Erfolg. Vertretbar für Idempotenz, sollte aber im
Contract-Doc von `SubmitPortalFeedbackRoundRequestDto.version` erwähnt werden.

### R2-08 · niedrig · Contract — `FeedbackAttachmentDto.sizeBytes` Doc falsch

`packages/common/src/contracts/crm/feedback-attachment.dto.ts:11`: „never links". Plan (Task 59 Endpunkte) und
Implementierung erlauben Links als Anhang (`sizeBytes` dann 0). Doc korrigieren oder Links bewusst ausschließen.

### R2-09 · niedrig · API-Konsistenz — Antwortformen uneinheitlich

Intern: `GET …/feedback-rounds` liefert das DTO direkt, `GET feedback-rounds/[id]` und `POST` liefern `{ round }`.
Portal: alles direkt. Vor Task 60 (erste Aufrufer) vereinheitlichen, sonst bleibt es dauerhaft.

### R2-10 · niedrig · API-Konsistenz — Validierung intern 400 statt 422

`feedback-round-api-error.ts`: `VALIDATION_ERROR → 400` (so im Plan), die übrigen CRM-Routen (Tasks, Projekte)
antworten bei Schemafehlern 422 und nur bei kaputtem JSON 400. Bewusste Planabweichung vom Bestand — dokumentieren
oder angleichen.

### R2-11 · niedrig · Sicherheit — interner Lesezugriff auf Entwürfe

`getFeedbackRound` zeigt dem Team eine offene Runde samt Entwurfspunkten, bevor der Kunde einreicht. Laut README
„intern vollständig lesbar" gewollt; sollte aber in der Portal-UI (Task 60) transparent sein („das Team sieht deinen
Entwurf").

### R2-12 · niedrig · Tests — Lücken

- Kein Unit-Test für `feedbackRoundSchemas` (nur indirekt über Integration: http, Vergangenheit, Duplikate, 31, 81).
- Kein Test, dass ein Kontakt **mit** `portal.feedback.submit`, aber ohne `portal.projects.read` nichts schreiben
  kann (nur „ohne feedback.read" ist getestet).
- Kein Test für `detach` mit Datei eines **anderen** Punkts derselben Runde (sollte `not_found` sein).
- `fileToAttachmentDto` ohne Test (R1-16).

### Geprüft, ohne Befund

- Nebenläufigkeit Übergabe (Projektsperre; Test mit `Promise.all`), Entwurf (Rundensperre; 409 mit aktuellem Stand),
  Einreichen vs. Speichern (kein halber Stand), Lock-Reihenfolge Freigabe (Runde → Projekt) vs. Übergabe/Editor
  (Projekt, Runden nur lesend) → kein Deadlock-Pfad.
- Rechte: `crmAccessCondition` in jeder internen Query + `canOn` im Command; Portal über `portalAccessCondition`,
  Owner-Sicht schreibt nie (Typ `PortalActor` + `canSubmit`), fremde Firma überall 404 (auch echte Sessions getestet).
- Übergabe/Freigabe ändern `projects.phase` nie; Freigabe setzt den Schritt hinter der Runde in derselben Transaktion.
- Rohtext (HTML/Markdown/Emoji) unverändert; Zeichenlimit in Codepoints wie Postgres.
- Systemnachricht scheitert nie den Fachwrite (Savepoint, getestet mit echter Session).
- Migration 0046 deckungsgleich zu Katalog/Rolle (`db:smoke:rbac` grün), Drizzle unverändert.

---

## Empfohlene Reihenfolge

1. R2-01 (Übergangstabelle), R1-01 (Portal-Prelude), R1-02 (Event-Service) — zusammen umsetzen, sie greifen ineinander.
2. R1-03, R1-06, R1-07, R1-08, R1-09, R1-10 — Service-Schnitt aufräumen.
3. R2-02 klären (Owner-Entscheidung), R2-03, R2-04, R2-05.
4. R1-04, R1-05, R1-11 bis R1-18, R2-06 bis R2-12 — Nacharbeit bzw. Tickets.

---

## Umsetzungsstand der Remarks (29.09.2026)

| ID    | Status                  | Umsetzung                                                                                                                                                                                                                                                              |
| ----- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1-01 | behoben                 | `portalFeedbackService.withLockedRound` (Transaktion + Sperre + `not_found`) und `rejectUnlessAllowed`; alle fünf Commands nutzen sie, Datei-Konstanten weitgehend entfallen                                                                                           |
| R1-02 | behoben                 | `server/shared/services/feedback/feedback-round-write-service.ts`: `recordHandOver`, `saveDraft`, `submit`, `approve` schreiben Status + Aufgabe + Activity + Chat gemeinsam; `announce-feedback-round.ts` gelöscht                                                    |
| R1-03 | behoben (Feedback-Pfad) | `updateLockedVersioned` in `update-versioned.ts` (+ Tests); genutzt in Write-, Attachment-, Item-, Task-, Step-Service und Übergabe. Bestand (`file-object-service`, `update-file`, `customer-contact-service`) bleibt bis zum nächsten fachlichen Anfassen            |
| R1-04 | behoben                 | `privateResponse(run, onError)` in `lib/http/private-no-store.ts`; Datei-, CRM- und Portal-Wrapper nutzen ihn                                                                                                                                                          |
| R1-05 | behoben                 | `lib/http/with-json-body.ts`; genutzt von `parseFileBody`, Portal-Feedback-Routen und der Übergabe-Route (`message-request-input` bleibt, liefert `null` statt Response)                                                                                               |
| R1-06 | behoben                 | Portal importiert nichts mehr aus `server/workspace/`; Rundenwrites laufen über den geteilten Write-Service                                                                                                                                                            |
| R1-07 | behoben                 | `countAttachments` in den Attach-Handler; `attachFile` bewusst neben `detachFile` in `feedback-attachment-service.ts` (in `server/shared/AGENTS.md` begründet)                                                                                                         |
| R1-08 | behoben                 | Dateibindung → `feedback-attachment-service.ts`; `replaceDraftItems` in `rejectForeignIds`/`removeMissingItems`/`insertItem`/`updateItem` geteilt (Item-Service 243 → 210 Z., alle Funktionen < 50 Z.)                                                                 |
| R1-09 | behoben                 | `portalFileService.lockVisible` ersetzt `lockCustomerFile`                                                                                                                                                                                                             |
| R1-10 | behoben                 | `portalFeedbackService.listItemHeads` für Submit, Approve, Attach; Fremd-ID-Prüfung wanderte in `replaceDraftItems`                                                                                                                                                    |
| R1-11 | behoben                 | `server/portal/auth/portal-activity-actor.ts`; drei Bestandsstellen umgestellt                                                                                                                                                                                         |
| R1-12 | behoben                 | `server/portal/shared/portal-project-condition.ts`; Feedback, Dateien (`targetExists`, Projektliste), Dashboard (2×) und `completeCustomerTask` umgestellt. `customer-file-visibility-service` (server/shared) bleibt eigenständig, da er kein Portal importieren darf |
| R1-13 | behoben                 | `common/patterns/time/business-today.ts` (+ Test); `taskDueStateService` delegiert                                                                                                                                                                                     |
| R1-14 | behoben                 | `lib/portal/portal-feedback-api-error.ts`                                                                                                                                                                                                                              |
| R1-15 | behoben                 | Test nach `tests/workspace/crm/services/feedback/` verschoben                                                                                                                                                                                                          |
| R1-16 | behoben                 | Test für `fileToAttachmentDto`                                                                                                                                                                                                                                         |
| R1-17 | behoben                 | `packages/common/src/patterns/collections/same-sequence.ts` (+ Test); Übergabe und `message-service` nutzen es (`file-validation-service` vergleicht Byte-Fenster mit Offset — anderes Muster, unverändert)                                                            |
| R1-18 | belassen                | `common/constants/feedback/` bleibt bewusst (von CRM und Portal genutzt, wie `files/`)                                                                                                                                                                                 |
| R2-01 | behoben                 | `rejectUnlessAllowed` prüft über `canTransition(status, ziel, customer)`; Entwurf = bearbeitbar, solange einreichbar; Freigabe zusätzlich „nur aus open" bis Task 61 (kommentiert)                                                                                     |
| R2-02 | behoben                 | `canAttach`: Anhängen/Lösen verlangt zusätzlich `portal.files.read`; AGENTS + Plan 60 ergänzt                                                                                                                                                                          |
| R2-03 | behoben                 | `confirmFinal` wird erst nach Sperre, Übergangs- und Versionsprüfung ausgewertet (Test: gesperrte Runde ohne Häkchen → `locked`)                                                                                                                                       |
| R2-04 | behoben                 | `alreadySubmitted` nur im Status `submitted` (Test: `in_progress` → `locked`)                                                                                                                                                                                          |
| R2-05 | behoben                 | `replaceDraftItems` wirft `FeedbackItemIdTakenError` (Vorprüfung + `ON CONFLICT DO NOTHING` am PK); Save fängt im Savepoint → `validation`                                                                                                                             |
| R2-06 | dokumentiert            | Hinweis in Plan 60                                                                                                                                                                                                                                                     |
| R2-07 | behoben                 | Doc an `SubmitPortalFeedbackRoundRequestDto.version`                                                                                                                                                                                                                   |
| R2-08 | behoben                 | Doc `FeedbackAttachmentDto` (Links: 0 Bytes)                                                                                                                                                                                                                           |
| R2-09 | behoben                 | Interne Endpunkte liefern das DTO direkt (wie Portal); in CRM-AGENTS dokumentiert                                                                                                                                                                                      |
| R2-10 | dokumentiert            | 400 laut Plan beibehalten, Abweichung in CRM-AGENTS festgehalten                                                                                                                                                                                                       |
| R2-11 | dokumentiert            | Hinweis in Plan 60                                                                                                                                                                                                                                                     |
| R2-12 | behoben                 | Unit-Tests `feedbackRoundSchemas`; Integration: ohne `projects.read`, ohne `files.read`, Lösen am falschen Punkt, veralteter Tab                                                                                                                                       |

Gates danach: lint (nur bestehende Warnungen), typecheck, `pnpm -r test` (Workspace 410 Dateien), `db:smoke:crm`
(145 Checks, 148 Tests), `db:smoke:rbac` (117 Checks), Portal-Suites im RBAC-Modus (14 Tests), Workspace-Build — grün.

---

## Review-Durchgang 2 (nach den Fixes, 29.09.2026)

Scope: kompletter Branch gegen `master` (118 Dateien, davon 90 ohne Tests/Pläne). Gates weiterhin grün. Keine
hohen Befunde mehr; die Struktur (Portal ↔ Shared ↔ Workspace) ist sauber getrennt, Schreibwege laufen über je eine
Stelle, Locks/Nebenläufigkeit unverändert korrekt (Übergabe sperrt Projekt und liest Runden nur; Freigabe sperrt
Runde → Projekt; kein Deadlock-Pfad).

### N-01 · mittel · Logik/Contract — `canAttach` erreicht die UI nicht

`PortalProjectFeedbackDto` kennt nur `canSubmit`. Seit R2-02 verlangt Anhängen/Lösen zusätzlich `portal.files.read`;
Plan 60 geht davon aus, dass der Bogen die Datei-Aktionen dann ausblendet — dafür fehlt das Feld. Folge in Task 60:
toter Button bzw. 404 beim Klick. Fix: `canAttach: boolean` im DTO (+ Docstring), gesetzt über
`portalFeedbackService.canAttach` (bzw. `false` für die Owner-Sicht).

### N-02 · niedrig · Logik — Übergabe nutzt die Übergangstabelle nicht

Portal-Commands prüfen jetzt über `canTransition`, die Übergabe nur über `findFeedbackHandOverBlocker`. Fachlich
gleichwertig, aber die Tabelle ist laut Plan „einzige Quelle". Fix: in `findFeedbackHandOverBlocker` zuerst
`canTransition(null, Open, Internal)` (1 Zeile), damit eine spätere Tabellenänderung auch die Übergabe sperrt.

### N-03 · niedrig · Logik — geparste ID wird nicht verwendet

`portal-feedback-service.ts:80/88` und `get-portal-project-feedback.query-handler.ts:28/41` validieren die ID über das
Schema (das auf Kleinbuchstaben normalisiert), filtern aber mit dem Rohwert. Heute unkritisch (Routen lowercasen, der
UUID-Vergleich in Postgres ist ohnehin case-insensitiv), aber inkonsistent zu Attach/Detach. Fix: `parsed.data`
verwenden.

### N-04 · niedrig · Effizienz — Existenzprüfung lädt alle Texte

`attach…:attachToItem` nutzt `listItemHeads` (id + body, bis 30 × 5.000 Zeichen) nur, um zu prüfen, ob der Punkt zur
Runde gehört. Fix: eigene Abfrage `select id … where id = itemId and round_id = …` oder `listItemHeads` ohne `body`
plus separater Body-Abfrage im Submit.

### N-05 · niedrig · Duplikat (Tests) — Portal-Session-Aufbau zweimal

`portal-feedback-sessions.integration.test.ts` (`session`) und `portal-task-completion.integration.test.ts`
(`insertMembership`) bauen dieselbe Membership mit `portal_standard`-Rolle. Fix: gemeinsamer Test-Helfer unter
`server/tests/support/` (z. B. `createPortalSession(db, customerId, assignedBy)`).

### N-06 · niedrig · Duplikat — Pfadsegment `projects` zweimal

`FeedbackApiPath.Projects` und lokales `PROJECTS_PATH` in `crm-api-endpoints.ts`. Fix: CRM-Endpunkte nutzen die
Konstante mit, oder ein gemeinsames `ProjectApiPath`.

### N-07 · niedrig · Duplikat — `NOT_FOUND`-Konstante in Attach und Detach

Zwei identische Result-Konstanten. Trivial; nur wenn R1-01-Rahmen erweitert wird (z. B. `withLockedRound` übernimmt
auch die ID-/Rechte-Vorprüfung von Attach/Detach), fällt beides weg.

### Geprüft, ohne Befund

- Schreib-Service: Status, Aufgabe, Activity, Chat laufen je Schritt an genau einer Stelle; Savepoint für den Entwurf
  rollt bei fremder ID auch den Entwurfsstempel zurück.
- `withLockedRound` committet bei Fehlerergebnissen nichts Halbes (alle Ablehnungen vor dem ersten Write).
- `portalProjectCondition`-Umbau in Dashboard, Dateiliste, `targetExists` und `completeCustomerTask` verhaltensgleich
  (RBAC-Integrationssuites 14/14 grün).
- `updateLockedVersioned` getestet; Bestand (3 Stellen) bewusst noch nicht umgestellt.
- Tests spiegeln die Struktur, Mapping-/Schema-Tests vollständig, keine fremden Dateien mehr im Diff.

### Umsetzungsstand Durchgang 2

| ID   | Status  | Umsetzung                                                                                                                                                                                                        |
| ---- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N-01 | behoben | `canAttach` in `PortalProjectFeedbackDto`; `portalFeedbackService.canAttach` nimmt jetzt einen `PortalReader` (Owner-Sicht → `false`); Integrationstests prüfen Kontakt, Owner-Sicht und Kontakt ohne Dateirecht |
| N-02 | behoben | `findFeedbackHandOverBlocker` prüft zuerst `canTransition(null, open, internal)`                                                                                                                                 |
| N-03 | behoben | `lockRound` und `getPortalProjectFeedback` filtern mit der geparsten ID                                                                                                                                          |
| N-04 | behoben | `portalFeedbackService.hasItem` (nur id) für Attach; `listItemHeads` bleibt für Submit/Approve                                                                                                                   |
| N-05 | behoben | `server/tests/support/portal-membership-fixture.ts` (`insertStandardPortalMembership`), genutzt von Feedback-Sessions- und Task-Completion-Test                                                                  |
| N-06 | behoben | `common/constants/crm/project-api-paths.ts` (`ProjectApiPath`, + Test); CRM-, Access- und Portal-Endpunkte nutzen es, `FeedbackApiPath.Projects` und zwei lokale Konstanten entfallen                            |
| N-07 | behoben | `portalFeedbackService.notFound()`; die beiden `NOT_FOUND`-Konstanten entfallen                                                                                                                                  |

Gates: typecheck, lint (nur bestehende Warnung), `pnpm -r test` (Workspace 411 Dateien), `db:smoke:crm`
(145 Checks, 148 Tests), Portal-RBAC-Suites 14/14, Workspace-Build — grün.
