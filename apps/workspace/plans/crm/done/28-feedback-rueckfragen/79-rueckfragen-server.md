# Task 79 — Rückfragen-Server (Teil 28.2)

> **Branch:** `feat/crm-feedback-rueckfragen` · **Basis:** Task 78 umgesetzt · **Aufwand:** L · **Dateien:** ≈ 70
> **Migration:** eine (Tabelle `feedback_round_item_clarifications`)
> **Zuerst lesen:** `README.md` dieses Ordners (Abschnitte 1–4, 7.1–7.6), Task 78,
> `apps/workspace/plans/crm/AGENTS.md` (harte Sicherheitsgrenzen), `packages/db/AGENTS.md`,
> `apps/workspace/src/server/AGENTS.md`, `apps/workspace/src/server/shared/AGENTS.md`,
> `apps/workspace/src/server/portal/AGENTS.md`, `apps/workspace/src/server/workspace/crm/AGENTS.md`

**Nach dem Merge:** Rückfragen können über die API gestellt, intern geschlossen und im Portal beantwortet werden.
Alle Regeln aus README 7.1–7.4 und 7.6 (Zustände, Sperren, Idempotenz, Chat) sind serverseitig durchgesetzt und
getestet. **Keine Oberfläche zeigt auf die neuen Routen**, deshalb entstehen in Produktion bis Task 80 keine
Rückfragen. Ergebnis-Command und Rundenabschluss beachten offene Rückfragen ab sofort. Die DTOs tragen
`clarifications` (in Produktion leer); der Portal-Punkt trägt zusätzlich `version`. Kein Schalter (README „Teilschritte“).

**Vorlagen im Code:**

- Tabelle und Historie: Task 78 (`feedback_round_item_result_history`, `feedbackResultHistoryService`).
- Interner Command unter Rundensperre `FOR SHARE`: `set-feedback-item-result.command-handler.ts` (nach Task 78).
- Portal-Command: `apps/workspace/src/server/portal/command-handler/save-portal-feedback-draft.command-handler.ts`
  (`portalFeedbackService.withLockedRound`, Rundensperre `FOR UPDATE`, nur mit `canSubmit`).
- Routen: `apps/workspace/src/app/api/workspace/crm/feedback-round-items/[itemId]/result/route.ts` (intern),
  `apps/workspace/src/app/api/portal/[customerId]/feedback-rounds/[roundId]/draft/route.ts` (Portal).
- Systemnachricht: `feedbackRoundWriteService.announce` und
  `apps/workspace/src/server/shared/services/message/announce-system-message.ts`.

## Festlegungen für diesen Teil

### Zustände und Sperren

Es gilt die Zustandstabelle aus README 7.1. Ergänzend:

- Erlaubte Rundenstatus für Stellen, Schließen und Beantworten: `RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES`
  (`submitted`, `in_discussion`, `in_progress`), sonst `RoundLocked` bzw. Portal `locked`.
- Sperrreihenfolge in jedem Schreibweg: **Runde → Punkt → Rückfrage.** Intern Runde `FOR SHARE` (wie das
  Ergebnis-Command), Portal Runde `FOR UPDATE` über `withLockedRound`. Danach Punkt `FOR UPDATE` frisch lesen, danach
  die betroffene Rückfragenzeile `FOR UPDATE`. Der Rundenabschluss nimmt die Runde `FOR UPDATE` und wartet damit auf
  alle laufenden Punktaktionen.
- Jede tatsächliche neue Frage, Antwort oder Schließung erhöht die **Punktversion genau einmal** (`updateVersioned`
  bzw. `updateLockedVersioned` mit leerem fachlichem Patch bzw. zusammen mit der Ergebnisrücknahme). Antwort und
  Schließung erhöhen zusätzlich die Rückfragenversion. Die Rundenversion bleibt unverändert.
- Frage zu einem bewerteten Punkt: Ergebnis im **selben** Punkt-Write leeren; `feedbackResultHistoryService.recordChange`
  schreibt `baseline` (falls nötig) und ein `reset` mit `command_id` = Rückfragen-ID (korreliertes Ereignis, README 7.4).
- Antwort oder Schließung lassen `result` unverändert `null`; ein Punkt mit offener Rückfrage hat nie ein Ergebnis
  (Schreiblogik + Integrationstest, kein Trigger).

### Idempotenz

Keine allgemeine Command-Tabelle. Kennungen werden **innerhalb eines Punkts aktionsübergreifend** geprüft:

- Stellen: `commandId` ist die neue Rückfragen-`id`. Existiert die ID bereits **an diesem Punkt** mit gleicher Frage,
  gleichem Anfrager und gleicher `request_version` → Wiederholung: aktuellen Punkt zurückgeben, ohne Write (auch wenn
  die Frage inzwischen beantwortet ist oder eine neuere Frage existiert). Andere Nutzlast oder die ID an einem anderen
  Punkt bzw. als Antwort-/Schließ-Kennung → `COMMAND_ID_REUSED`.
- Antworten/Schließen: `answer_command_id` bzw. `close_command_id` an der Rückfragenzeile. Gleiche Kennung, gleicher
  Akteur (Portal-Mitgliedschaft bzw. Mitglied), gleiche `*_request_version` und gleicher normalisierter Text →
  Wiederholung; abweichend → `COMMAND_ID_REUSED`.
- Eine Kennung, die bereits in der Ergebnishistorie desselben Punkts steht (und nicht das korrelierte `reset` dieser
  Frage ist), ist ebenfalls `COMMAND_ID_REUSED`.
- Die Prüfung erfolgt **nach** dem Sperren und **vor** Version und Zustand (README 7.4 Schritt 3). Rechte und
  Entitätskette werden auch bei Wiederholungen erneut geprüft.
- Chatmeldungen entstehen nur, wenn eine Frage bzw. Antwort erstmals gespeichert wurde.

### Fehler

| Fall                                                                         | CRM-Code (HTTP)                                        | Portal-Code (HTTP)             |
| ---------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------ |
| Body ungültig                                                                | `VALIDATION_ERROR` (400)                               | `validation` (400)             |
| Punkt/Rückfrage unbekannt oder fremd                                         | `ITEM_NOT_FOUND` / `CLARIFICATION_NOT_FOUND` (404)     | `not_found` (404)              |
| Runde nicht in Bearbeitung                                                   | `ROUND_LOCKED` (409)                                   | `locked` (409)                 |
| Punktversion veraltet                                                        | `VERSION_CONFLICT` (409 + `VersionConflictDto<Punkt>`) | dito, Portal-Punkt-DTO         |
| Stellen bei bereits offener Rückfrage; Ergebnis setzen bei offener Rückfrage | `CLARIFICATION_OPEN` (409)                             | –                              |
| Antworten/Schließen einer nicht mehr offenen Rückfrage                       | `CLARIFICATION_NOT_OPEN` (409)                         | `clarification_not_open` (409) |
| Kennung mit anderer Aktion/Nutzlast                                          | `COMMAND_ID_REUSED` (409, aus Task 78)                 | `command_id_reused` (409)      |
| Rundenabschluss mit offener Rückfrage                                        | `CLARIFICATIONS_OPEN` (422)                            | –                              |
| Rundenabschluss mit unbewertetem Punkt                                       | `RESULTS_INCOMPLETE` (422, unverändert)                | –                              |

Bei `CLARIFICATION_*`-Fehlern und Konflikten liefert die Antwort den aktuellen Punkt mit, wenn der Akteur lesen darf
(intern immer; Portal nur mit `canRead`), damit die UI den Stand neu zeigen und den Eingabetext behalten kann.
Reihenfolge der Abschlussprüfung: zuerst `CLARIFICATIONS_OPEN`, dann `RESULTS_INCOMPLETE` (eine offene Rückfrage
erklärt den fehlenden Wert besser).

## CRM-79-T1 — Schema, Constraint-Namen, Smoke, Seed

```txt
packages/db/migrations/<nr>_create_feedback_round_item_clarifications.sql       neu (Stand 18.10.2026: nr = 0060)
packages/db/src/record-configuration/crm/feedback-round-item-clarifications.ts   neu; Export im Barrel crm/index.ts
packages/db/src/constraint-names/crm/feedback-round-item-clarifications-constraint-names.ts   neu (+ .test.ts)
packages/db/scripts/crm-smoke/feedback-clarification-checks.ts                  neu; in smoke-crm-constraints.ts aufrufen
packages/db/scripts/crm-fixture/seed-feedback-rounds.ts                         offene, beantwortete, geschlossene Rückfrage
packages/db/src/record-configuration/crm/AGENTS.md                              Abschnitt „Rückfragen (Ordner 28)“
```

Tabelle `feedback_round_item_clarifications` (keine fachlichen Defaults, IDs und Versionen setzt die App):

| Spalte                             | Typ              | Regel                                                          |
| ---------------------------------- | ---------------- | -------------------------------------------------------------- |
| `id`                               | `UUID` PK        | = `commandId` des Stellens                                     |
| `item_id`                          | `UUID` NN        | FK `feedback_round_items(id) ON DELETE CASCADE`                |
| `status`                           | `TEXT` NN        | `IN ('open','answered','closed')`                              |
| `question`                         | `TEXT` NN        | `btrim(question) <> ''`, Länge ≤ 2000                          |
| `requested_by_member_id`           | `UUID` NN        | FK `workspace_members(id)` (ohne Kaskade, wie `result_set_by`) |
| `requested_at`                     | `TIMESTAMPTZ` NN |                                                                |
| `request_version`                  | `INTEGER` NN     | ursprüngliche Punktversion des Stellens, `> 0`                 |
| `answer`                           | `TEXT`           | `btrim <> ''`, Länge ≤ 2000                                    |
| `answered_by_portal_membership_id` | `UUID`           | FK `portal_memberships(id) ON DELETE SET NULL`                 |
| `answered_at`                      | `TIMESTAMPTZ`    |                                                                |
| `answer_command_id`                | `UUID`           |                                                                |
| `answer_request_version`           | `INTEGER`        | `> 0`                                                          |
| `close_note`                       | `TEXT`           | `btrim <> ''`, Länge ≤ 2000                                    |
| `closed_by_member_id`              | `UUID`           | FK `workspace_members(id)` (ohne Kaskade)                      |
| `closed_at`                        | `TIMESTAMPTZ`    |                                                                |
| `close_command_id`                 | `UUID`           |                                                                |
| `close_request_version`            | `INTEGER`        | `> 0`                                                          |
| `version`                          | `INTEGER` NN     | `> 0`                                                          |
| `created_at`, `updated_at`         | `TIMESTAMPTZ` NN | `DEFAULT NOW()`                                                |

Benannte Constraints (Präfix `feedback_round_item_clarifications_`, Konstanten
`FeedbackRoundItemClarificationsConstraintName`):

- `item_fk`, `requested_by_fk`, `answered_by_fk`, `closed_by_fk`
- `open_item_uidx`: partieller Unique-Index `(item_id) WHERE status = 'open'`
- `item_requested_idx` (nicht eindeutig) auf `(item_id, requested_at, id)` für das gesammelte Laden
- `answer_command_uidx` / `close_command_uidx`: partielle Unique-Indizes auf `(item_id, answer_command_id)` bzw.
  `(item_id, close_command_id)` wo gesetzt
- `status_check`, `question_check`, `answer_check`, `close_note_check`, `version_check`, `request_version_check`,
  `answer_request_version_check`, `close_request_version_check`
- `state_check`:
  - `open` ⇒ `num_nonnulls(answer, answered_by_portal_membership_id, answered_at, answer_command_id, answer_request_version, close_note, closed_by_member_id, closed_at, close_command_id, close_request_version) = 0`
  - `answered` ⇒ `answer`, `answered_at`, `answer_command_id`, `answer_request_version` gesetzt (Mitgliedschaft
    darf per `SET NULL` fehlen), alle Schließungsfelder leer
  - `closed` ⇒ `close_note`, `closed_by_member_id`, `closed_at`, `close_command_id`, `close_request_version` gesetzt,
    alle Antwortfelder leer

Die Grenze 2000 ist `FEEDBACK_LIMITS.noteMaxLength`; Literale in der Migration per Test nach Vorbild
`feedback-limits-migration.test.ts` absichern.

Smoke-Modul `runFeedbackClarificationChecks(context)`: jede Statuskombination erlaubt/abgelehnt, leere bzw. zu lange
Texte, **zweite offene Rückfrage am selben Punkt scheitert an `open_item_uidx`**, zweite nach Antwort erlaubt,
fehlende fachliche Werte ohne Default, `SET NULL` beim Entfernen der antwortenden Mitgliedschaft hält die
beantwortete Zeile gültig, Kaskade beim Löschen des Punkts.

Seed: in einer laufenden Beispielrunde je eine offene, beantwortete und geschlossene Rückfrage an verschiedenen Punkten
(Punkt mit offener Rückfrage hat `result = null`, Punktversion passend). Optional aufrufbar wie bisher.

## CRM-79-T2 — Common: Konstanten, Contracts, Fehler, Chat

```txt
packages/common/src/constants/crm/feedback-clarification-statuses.ts       neu: FeedbackClarificationStatus + VALUES
packages/common/src/patterns/crm/feedback-item-processing-state.ts         neu: getFeedbackItemProcessingState (+ .test.ts)
packages/common/src/constants/crm/feedback-item-processing-states.ts       neu: FeedbackItemProcessingState { Clarification, Pending, ...FeedbackItemResult }
packages/common/src/contracts/crm/feedback-item-clarification.dto.ts       neu (öffentliche Felder, README 7.5)
packages/common/src/contracts/crm/feedback-item-internal-clarification.dto.ts   neu: + requestedByName, answeredByName, closedByName
packages/common/src/contracts/crm/ask-feedback-item-clarification-request.dto.ts    neu { commandId, version, question }
packages/common/src/contracts/crm/close-feedback-item-clarification-request.dto.ts  neu { commandId, version, note }
packages/common/src/contracts/portal/answer-portal-feedback-clarification-request.dto.ts   neu { commandId, version, answer }
packages/common/src/contracts/crm/results/ask-feedback-item-clarification-result.ts       neu
packages/common/src/contracts/crm/results/close-feedback-item-clarification-result.ts     neu
packages/common/src/contracts/crm/feedback-round-item.dto.ts               + clarifications: FeedbackItemInternalClarificationDto[]
packages/common/src/contracts/portal/portal-feedback-item.dto.ts           + clarifications: FeedbackItemClarificationDto[], version
packages/common/src/contracts/portal/results/portal-feedback-result.ts     Konflikt-Entität als zweiter Typparameter (Default Runden-DTO)
packages/common/src/constants/crm/errors/feedback-round-error-codes.ts     + ClarificationOpen, ClarificationNotOpen, ClarificationNotFound, ClarificationsOpen
packages/common/src/constants/portal/portal-feedback-error-codes.ts        + ClarificationNotOpen, CommandIdReused (Objekt und VALUES)
packages/common/src/constants/crm/system-message-keys.ts                   + FeedbackClarificationRequested, FeedbackClarificationAnswered; Param ItemNumber
packages/common/src/constants/crm/message-constants.test.ts                angepasst
```

- `getFeedbackItemProcessingState({ result, clarifications })` liefert `clarification`, wenn eine Rückfrage `open`
  ist, sonst `result ?? pending`. Seiteneffektfrei, genutzt von Server (Abschlussprüfung im Test als Referenz),
  Zeile, Fortschritt und Abschlussdialog (Task 80). `FeedbackItemResult` bleibt unverändert.
- `FeedbackItemClarificationDto`: genau `id`, `status`, `question`, `requestedAt`, `answer`, `answeredAt`,
  `closeNote`, `closedAt` (fehlende Werte `null`), Docstring je Feld. Das interne DTO erweitert um aufgelöste Namen
  (`string | null`), ohne IDs.
- Ergebnis-Unions der neuen Commands: `{ ok: true; item }`, `ValidationError + errors`, `VersionConflict + conflict`,
  `ClarificationOpen | ClarificationNotOpen + item` (aktueller Punkt), `ItemNotFound | ClarificationNotFound |
RoundLocked | CommandIdReused`.
- `PortalFeedbackResult<T, TConflict = PortalFeedbackRoundDto>`: die bestehenden Aufrufer bleiben unverändert, die
  Antwort verwendet `PortalFeedbackResult<PortalFeedbackItemDto, PortalFeedbackItemDto>`. Für
  `clarification_not_open` wird der aktuelle Punkt als `current` mitgegeben (eigener Union-Zweig).
- Systemnachrichten: Parameter `projectTitle`, `roundNumber`, neu `itemNumber` (`position + 1` zum
  Ereigniszeitpunkt). Keine Frage-/Antworttexte.

## CRM-79-T3 — Server: geteilter Service, Commands, Abschluss

```txt
apps/workspace/src/server/shared/services/feedback/feedback-clarification-service.ts     neu
apps/workspace/src/server/shared/services/feedback/feedback-service-types.ts             + Rückfragen-Zeilentyp, Akteur
apps/workspace/src/server/shared/services/feedback/feedback-round-write-service.ts      + announceItemEvent (nutzt announce)
apps/workspace/src/server/workspace/crm/command-handler/ask-feedback-item-clarification.command-handler.ts     neu
apps/workspace/src/server/workspace/crm/command-handler/close-feedback-item-clarification.command-handler.ts   neu
apps/workspace/src/server/portal/command-handler/answer-portal-feedback-clarification.command-handler.ts       neu
apps/workspace/src/server/workspace/crm/command-handler/set-feedback-item-result.command-handler.ts     ClarificationOpen
apps/workspace/src/server/workspace/crm/command-handler/change-feedback-round-status.command-handler.ts hasOpenClarification
apps/workspace/src/server/workspace/crm/services/feedback/feedback-round-schemas.ts      + askClarification, closeClarification
apps/workspace/src/server/portal/services/feedback/portal-feedback-schemas.ts            + answerClarification
apps/workspace/src/server/workspace/crm/services/feedback/feedback-round-mapping-service.ts   clarifications intern
apps/workspace/src/server/workspace/crm/services/feedback/feedback-round-service.ts      toRoundDto lädt Rückfragen gesammelt
apps/workspace/src/server/portal/services/feedback/portal-feedback-mapping-service.ts    clarifications öffentlich, version
apps/workspace/src/server/portal/services/feedback/portal-feedback-service.ts            toRoundDtos lädt Rückfragen; toItemDto für Antworten
apps/workspace/src/server/shared/AGENTS.md                                               Abschnitt Feedbackrunden ergänzen
apps/workspace/src/server/portal/AGENTS.md                                               Abschnitt „Feedbackrunden (ab Task 59)“: Antwort-Command
```

**`feedbackClarificationService`** (geteilt, ohne Autorisierung):

- `loadByItems(reader, itemIds)` — eine Abfrage, sortiert nach `item_id, requested_at, id`. Gibt Zeilen zurück; das
  interne Mapping löst Mitgliedsnamen (Join `users.display_name`) und Kontaktnamen (`loadPortalContactNames`) gesammelt
  auf, das Portal-Mapping verwirft Autorenbezüge.
- `findOpen(tx, itemId)` mit `FOR UPDATE`; `findById(tx, itemId, clarificationId)` mit `FOR UPDATE` (immer mit
  `item_id` im `WHERE`, damit fremde IDs `null` sind); `findByCommand(tx, itemId, commandId)` über alle drei
  Kennungsspalten.
- `insertOpen(tx, { item, question, memberId, commandId, requestVersion, now })`
- `answer(tx, { clarification, answer, portalMembershipId, commandId, requestVersion, now })` und
  `close(tx, { clarification, note, memberId, commandId, requestVersion, now })` — schreiben über
  `updateLockedVersioned` (Zeile ist gesperrt; ein Versionsverlust wirft).
- `hasOpen(tx, roundId)` für die Abschlussprüfung.

**Internes Stellen** (`askFeedbackItemClarification(itemId, input, actor)`):

1. ID und Body (`strictObject({ commandId: uuid, version, question: requiredText(noteMaxLength) })`) prüfen.
2. Runde wie im Ergebnis-Command (`crmAccessCondition` + `ProjectsWrite`, `FOR SHARE`, `canOn`), Punkt `FOR UPDATE`.
3. Idempotenz → Rundenstatus → Punktversion → offene Rückfrage (`ClarificationOpen` mit aktuellem Punkt).
4. In einem Savepoint: `insertOpen`; Punkt per `updateVersioned` schreiben (bei Ergebnis zugleich leeren);
   `recordChange` (bei vorhandenem Ergebnis). Konflikt des Wrappers → Savepoint verwerfen, Konfliktstand lesen.
5. Chat `FeedbackClarificationRequested` über `announceSystemMessage` (eigener Savepoint, Fehler nur geloggt).
6. Antwort: aktueller Punkt über `feedbackRoundMappingService.toItemDto` inkl. Anhänge, Historie, Rückfragen.

**Internes Schließen** (`closeFeedbackItemClarification(itemId, clarificationId, input, actor)`): wie oben, Rückfrage
per `findById` sperren; nicht gefunden → `ClarificationNotFound`; Status nicht `open` → `ClarificationNotOpen` (+ Punkt);
`note` Pflicht. Punktversion +1, Rückfragenversion +1. **Keine Chatmeldung.**

**Portal-Antwort** (`answerPortalFeedbackClarification(actor, roundId, itemId, clarificationId, input)`):

1. Body `strictObject({ commandId, version, answer })`; IDs per `portalFeedbackSchemas.id`.
2. `portalFeedbackService.withLockedRound(actor, roundId, …)` — liefert `null`/`not_found` ohne `canSubmit`, für
   Owner-Ansicht, fremden Kunden oder nicht freigegebenes Projekt. Den Kunden liefert ausschließlich `actor`.
3. Punkt mit `round_id = locked.round.id` `FOR UPDATE`, Rückfrage mit `item_id` `FOR UPDATE`; jede fremde ID →
   `not_found`.
4. Idempotenz → Status `RESULT_EDITABLE_…` (sonst `locked`) → Punktversion → Rückfrage `open` (sonst
   `clarification_not_open` mit aktuellem Punkt).
5. Savepoint: `answer` + Punktversion +1. Danach Chat `FeedbackClarificationAnswered`.
6. Antwort über `portalFeedbackMappingService.toItemDto` (Ergebnis bleibt bis Abschluss verborgen, keine Historie,
   keine Autor-IDs). **Kein Einfluss auf `submitted_at`, `read_at`, Sammelaufgabe oder Rundenstatus.**

**Bestehende Commands:**

- `setFeedbackItemResult`: nach der Punktsperre `findOpen`; vorhanden → `ClarificationOpen` (+ Punkt). Gilt auch für
  `result: null`.
- `changeFeedbackRoundStatus`: bei `to === Completed` zuerst `feedbackClarificationService.hasOpen` →
  `ClarificationsOpen`, dann `hasItemWithoutResult` → `ResultsIncomplete`.

`server/shared/AGENTS.md`: `feedback-clarification-service.ts` dokumentieren (einziger Schreibweg der Rückfragen,
Sperrreihenfolge Runde → Punkt → Rückfrage, keine Autorisierung, Texte nie in Logs/Activities/Chat).

## CRM-79-T4 — Routen, Pfade, Zugriffsregeln, Fehler-Mapping

```txt
apps/workspace/src/app/api/workspace/crm/feedback-round-items/[itemId]/clarifications/route.ts                         neu (POST)
apps/workspace/src/app/api/workspace/crm/feedback-round-items/[itemId]/clarifications/[clarificationId]/close/route.ts  neu (POST)
apps/workspace/src/app/api/portal/[customerId]/feedback-rounds/[roundId]/items/[itemId]/clarifications/[clarificationId]/answer/route.ts  neu (POST)
apps/workspace/src/common/constants/auth/crm-endpoint-access-rules.ts             + FeedbackItemClarificationAsk/Close (ProjectsWrite, project)
apps/workspace/src/common/constants/crm/crm-operations.ts                          + AskFeedbackItemClarification, CloseFeedbackItemClarification
apps/workspace/src/lib/workspace/crm/feedback-round-api-error.ts                   STATUS/MESSAGES für die neuen Codes
apps/workspace/src/lib/portal/portal-feedback-api-error.ts                         ERRORS + generische Konflikt-Entität, Punkt im not_open-Körper
apps/workspace/src/common/patterns/crm/feedback-processing-error.ts                ClarificationOpen/NotOpen → Changed (Stand neu laden),
                                                                                    ClarificationsOpen → neuer Schlüssel in Task 80; bis dahin Changed
apps/workspace/src/i18n/dictionaries/workspace/crm/messages/de.json, en.json       systemMessages.feedbackClarificationRequested/Answered
apps/workspace/src/i18n/dictionaries/portal/messages/de.json, en.json              dito (Du-Form)
```

- Interne Routen folgen exakt dem Muster der Ergebnisroute (`privateFeedbackRoundResponse(CrmOperation.X, () =>
withCrmPermission(CrmEndpointAccessRule.X, … withJsonBody(…))`), Antwort 200 mit `result.item`, 409 mit
  `result.conflict` bzw. Fehlerkörper samt `current`. `crm-endpoint-access-rules.test.ts` erkennt neue Routen automatisch.
- Die Portalroute nutzt `privatePortalFeedbackResponse` → `withPortalActor(customerId.toLowerCase(), …)` →
  `withPortalFeedbackBody` → `portalFeedbackWriteResponse(actor, result)`; IDs aus der URL werden kleingeschrieben,
  `customerId` ist nur Routinginput.
- Es gibt **keinen Client-Aufrufer** in diesem Teil. Endpoint-Builder (`crm-api-endpoints.ts`,
  `portal-api-endpoints.ts`) und Client-Methoden entstehen erst mit ihren Aufrufern in Task 80, damit kein
  ungenutzter Code entsteht. Dasselbe gilt für neue Pfadsegmente in `FeedbackApiPath`; die Routentests importieren
  die Route-Handler direkt.
- Neue Chat-Texte (DE/EN, `copywriting`), z. B. „Rückfrage zu Punkt {itemNumber} in Feedbackrunde {roundNumber} für
  „{projectTitle}““ bzw. „Antwort auf die Rückfrage zu Punkt {itemNumber} …“. Bestehende `messages-dictionary.test.ts`
  deckt die Schlüssel ab.

## Tests

```txt
apps/workspace/src/server/tests/workspace/crm/feedback-round-processing.integration.test.ts   Stellen/Schließen/Abschluss/Ergebnis-Sperre
apps/workspace/src/server/tests/portal/feedback/portal-feedback-clarifications.integration.test.ts   neu (Ordner bereits in db:smoke:crm)
apps/workspace/src/server/tests/shared/services/feedback/feedback-integration-fixture.ts          Helfer für Runden in Bearbeitung mit Rückfrage
apps/workspace/src/server/tests/shared/services/feedback/feedback-round-fixtures.ts               clarifications/version in Fixtures
apps/workspace/src/server/tests/workspace/crm/api/feedback-round-processing-routes.test.ts        neue Routen, Bodies, 409-Körper
apps/workspace/src/server/tests/portal/api/portal-feedback-routes.test.ts                         Antwortroute, canRead-Gate
apps/workspace/src/server/tests/workspace/crm/services/feedback/feedback-round-schemas.test.ts    neue Schemas
apps/workspace/src/server/tests/portal/services/feedback/portal-feedback-schemas.test.ts          Antwortschema
apps/workspace/src/server/tests/portal/services/feedback/portal-feedback-mapping-service.test.ts  Rückfragen ohne Autor-IDs, Ergebnis verborgen
apps/workspace/src/server/tests/workspace/crm/services/feedback/feedback-round-mapping-service.test.ts   interne Rückfragen mit Namen
packages/common/src/patterns/crm/feedback-item-processing-state.test.ts                           neu
apps/workspace/src/components/** Fixtures                                                         neue Pflichtfelder (clarifications, version)
```

Integration (`CRM_DB_INTEGRATION=true`):

- Mehrere nacheinander gestellte Rückfragen mit vollständigem Verlauf; zweite gleichzeitig offene scheitert fachlich
  und – bei parallelem Stellen – an `open_item_uidx`.
- Stellen bei bewertetem Punkt (alle drei Ergebnisarten) leert das Ergebnis atomar, Historie hat `baseline` + `reset`
  mit Rückfragen-ID; Punktversion steigt genau um 1.
- Antwort bzw. Schließung → Punkt offen (`result = null`), Rückfrage `answered`/`closed`, Schließung ohne Hinweis
  abgelehnt.
- Ergebnis setzen und „Noch offen“ bei offener Rückfrage → `CLARIFICATION_OPEN`.
- Abschluss bei offener Rückfrage → `CLARIFICATIONS_OPEN`; parallel Rückfrage stellen vs. Abschluss: genau eins gelingt,
  und eine nach dem Abschluss gestellte Frage bekommt `ROUND_LOCKED`.
- Parallel zwei Antworten verschiedener berechtigter Kontakte und Antwort vs. interne Schließung: genau eine gewinnt,
  die andere erhält `clarification_not_open`/`CLARIFICATION_NOT_OPEN` bzw. Versionskonflikt mit aktuellem Punkt.
- Replays: Wiederholung nach Erfolg ohne neue Zeile, ohne neue Chatmeldung, ohne erneute Ergebnisrücknahme – auch
  nachdem die Frage beantwortet, eine neue Frage gestellt oder ein Ergebnis gesetzt wurde. Gleiche Kennung mit anderem
  Text → `COMMAND_ID_REUSED`.
- Fehler nach `insertOpen` bzw. beim Antwort-Update hinterlässt keine Teiländerung.
- Chatfehler (Savepoint-Fehler erzwungen) verhindert weder Frage noch Antwort.
- Portal: fremder Kunde, fremdes/nicht freigegebenes Projekt, Punkt einer anderen Runde, Rückfrage eines anderen Punkts
  → `not_found`; ohne `portal.feedback.submit` → `not_found`; Owner-Ansicht → `not_found`; ohne Leserecht nur
  `{ accepted: true }`. Jeder berechtigte Kontakt darf antworten, nicht nur der Verfasser. Echte Sessions nach Muster
  `portal-feedback-sessions.integration.test.ts`.
- Intern: fremder Kunde/fremdes Projekt per Zugriffsbereich → `ITEM_NOT_FOUND`.
- Antwort ändert weder `submitted_at`, `read_at`, Sammelaufgabe noch Rundenstatus/-version.
- Portal-Read in `in_progress` zeigt Rückfragen, aber kein Ergebnis; nach Abschluss Ergebnisse wie bisher.

## Abnahme

- [x] Migration idempotent, Modell deckungsgleich, Smoke grün; doppelte offene Rückfrage auf DB-Ebene verhindert.
- [x] Keine UI und kein Client-Code zeigt auf die neuen Routen; das Cockpit und Portal sehen unverändert aus.
- [x] Alle neuen Endpunkte in `CRM_ENDPOINT_ACCESS_RULES` bzw. über `withPortalActor`; Cross-Customer-Negativtests grün.
- [x] Keine Frage-, Antwort- oder Begründungstexte in Logs, Activities oder Chat-Metadaten.
- [x] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm db:smoke:crm`, `pnpm --filter @invessiv/workspace build` grün.
- [x] README-Tabelle „Teilschritte“: Status 28.2 gepflegt.

## Umsetzungsstand (19.10.2026)

Status: **im Review**, ungecommittet auf `feat/crm-feedback-rueckfragen`. T1–T4 sind umgesetzt.
Task 80 (UI, Client-Aufrufer und Entfernung der globalen Rückgabe) bleibt offen.

- Migration `0060_create_feedback_round_item_clarifications.sql` ist auf der Entwicklungsdatenbank angewendet.
  Zwei direkte SQL-Wiederholungen waren folgenlos erfolgreich. Modell-/Migrationstest und DB-Smoke sichern
  Zustände, Pflichtfelder ohne Defaults, Fremdschlüssel, Eindeutigkeit, Autorenentfernung und Kaskade ab.
- Stellen, Schließen und Portal-Antwort sperren Runde → Punkt → Rückfrage. Neue Aktionen erhöhen die
  Punktversion genau einmal; Wiederholungen prüfen Kennung, Akteur, ursprüngliche Version und normalisierten Text
  vor Zustand und Version. Die Kennung der Frage korreliert mit ihrer atomaren Ergebnisrücknahme.
- `feedbackItemProcessingService` bündelt die interne Zugriffssperre und das vollständige Punkt-DTO für alle
  drei internen Commands. Die HTTP-Abbildung liegt gemeinsam in `feedbackItemApiResponse`; die Result-Contracts
  teilen den generischen `FeedbackItemCommandResult` und behalten ihre jeweiligen fachlichen Fehlerzweige.
- `feedbackClarificationService` lädt und schreibt Rückfragen; sein getrennter Mapper erlaubt ausschließlich
  die öffentlichen Felder im Portal und aufgelöste Namen intern. Ergebnis-Sichtbarkeit bleibt an den Rundenabschluss
  gebunden, auch bei Erfolgs- und Konfliktantworten. Portal-Schreibrollen ohne Leserecht bekommen nur eine Bestätigung
  bzw. Fehlercode und ggf. aktuelle Version.
- Die drei neuen Routen sind autorisiert, privat und nicht cachebar. Es gibt keine neuen Client-Methoden,
  Endpoint-Builder oder UI-Einstiege. Alle sprachabhängigen Ergänzungen liegen in DE und EN vor.
- Der optionale Feedback-Seed enthält in Runde 2 offene, beantwortete und geschlossene Beispiele in `in_progress`
  mit passender Sammelaufgabe. Der Seed wurde nicht automatisch ausgeführt. Keine neuen Dependencies oder Env-Variablen.

**Testablage gegenüber der Planung:** Die neuen DB-Abläufe sind gebündelt in
`portal-feedback-clarifications.integration.test.ts` und `portal-feedback-clarification-access.integration.test.ts`
im bereits vom CRM-Gate erfassten Portal-Feedback-Testordner. Sie prüfen interne und Portal-Commands gemeinsam,
echte Kontaktsessions, projekt-/kundenbezogene Zugriffsbereiche, alle drei erlaubten Rundenstatus, parallele Aktionen,
alte Replays nach weiteren Aktionen/Abschluss sowie vollständige Savepoint-Rollbacks. Ein erzwungener Chatfehler
nach dem Nachrichten-Insert rollt die Meldung zurück und lässt die Frage bzw. Antwort bestehen.

**Rollback:** Vor Auslieferung von Task 80 kann Teil 28.2 per Code-Revert zurückgenommen werden; die additive
Tabelle bleibt bestehen. Nach Task 80 bleiben die Server-Sperren aktiv; dann Fehler vorwärts beheben.
Produktion wurde weder migriert noch mit Seeds oder schreibenden Tests angesprochen.

**Ausgeführte Qualitäts-Gates:**

| Prüfung                                   | Ergebnis                                                                                             |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `pnpm -r lint`                            | grün; bestehende Warnungen in `apps/web` und im `update-project`-Test                                |
| `pnpm -r typecheck`                       | grün                                                                                                 |
| `pnpm -r test`                            | grün; Workspace: 631 Dateien / 3.982 Tests bestanden, DB-Tests im Standardmodus separat übersprungen |
| `pnpm db:smoke:crm`                       | grün; 378 Constraint-Prüfungen sowie 45 Integrationsdateien / 504 Tests gegen Development            |
| `pnpm --filter @invessiv/workspace build` | grün; bestehende Turbopack-Warnung zu `packages/db/src/core/env.ts`                                  |
| Migration 0060 direkt wiederholt          | zweimal erfolgreich, anschließend weiterhin regulär registriert                                      |
