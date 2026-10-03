# Task 58 — Datenmodell und Fundament der Feedbackrunden

> **Vor dem Start lesen:** [`README.md`](./README.md) dieses Ordners (Fachmodell, Status, Limits, Rechte, Merge-Gates),
> `../00-entscheidungen.md`, `../AGENTS.md` und die scoped `AGENTS.md` am Zielcode. Diese Task-Datei plus README sind
> vollständig; frühere Chat- oder Planstände (Task 22/23) gelten nicht.

> **Modelländerung aus Task 57 (29.09.2026, mit dem Owner abgestimmt, verbindlich):** Es gibt **keinen Feedbackblock**
> mit Rundenzahl mehr. Jede Runde ist ein eigener Rundenschritt in der Prozessleiste (`projects.feedback_round_positions`,
> Rundennummer = Reihenfolge). Wo diese Datei noch „Block“ sagt, gilt: „Block vorhanden“ → „Rundenschritt n vorhanden“;
> „am Feedbackschritt“ → aktueller Schritt ist der letzte Freitext-Schritt vor Rundenschritt n; „Projektschritt nach dem
> Block“ → Schritt direkt nach der abgenommenen Runde; „Block entfernen“ → übergebene Rundenschritte entfernen oder
> verschieben; Kontingent = Anzahl der Rundenschritte. Details: README, Abschnitt „Feedbackrunden in der Prozessleiste“.

> **Status:** gemerged · **Teil-PR:** 16.2 · **Branch:** `feat/crm-feedback-2-datenmodell`
> **Abhängigkeiten:** Task 57 (16.1), Ordner 08 (Aufgaben), Task 52 (14.2, `files`) gemerged · **Aufwand:** 2 T. ·
> **Dateien:** 45–65
> **Migration:** ja, eine (Nummer im Repo ermitteln)

## Ziel

Unsichtbares Fundament: Tabellen, Constraints, Konstanten, DTOs, Übergangstabelle und die geteilten Services, die
Portal- und Workspace-Handler in Task 59–61 gemeinsam nutzen. Nach dem Merge ist **nichts** sichtbar; bestehende
Pfade verhalten sich unverändert (bis auf die neuen Schutzregeln in „Guards“, die ohne Runden nie greifen).

## Datenmodell

Migration `<nr>_create_feedback_rounds.sql`, additiv und idempotent (`CREATE … IF NOT EXISTS`,
`--> statement-breakpoint`, Constraints über `DO $$ … IF NOT EXISTS`). Es gibt keine Produktivdaten; neue Spalten
entstehen direkt in Endform.

### `projects` (Erweiterung)

```txt
+ feedback_areas text[] NOT NULL DEFAULT '{}'
    CHECK (cardinality(feedback_areas) <= 30)          Elementlänge ≤ 80 prüft die Anwendung
```

Seitenliste für die Bereichsauswahl der Feedback-Punkte („Startseite“, „Über uns“ …). Gepflegt im Übergabe-Dialog
(Task 60). Der Default ist eine bewusste Ausnahme, damit Inserts der alten App-Version im Deploy-Fenster funktionieren.

### `feedback_rounds` (neu, präfixfrei)

```txt
feedback_rounds
  id                                     uuid PK
  project_id                             uuid NOT NULL
  customer_id                            uuid NOT NULL                   denormalisiert für Portalfilter
  round_number                           integer NOT NULL CHECK (round_number BETWEEN 1 AND 20)
  status                                 text NOT NULL   CHECK in FEEDBACK_ROUND_STATUS_VALUES
  preview_url                            text NULL       CHECK (preview_url LIKE 'https://%' AND length(preview_url) <= 2048)
  handover_note                          text NULL       CHECK (length(handover_note) <= 2000)   „Was ist neu“
  due_on                                 date NULL                        Frist, nur Anzeige
  area_options                           text[] NOT NULL CHECK (cardinality(area_options) <= 30) Snapshot
  handed_over_by_member_id               uuid NOT NULL → workspace_members.id
  handed_over_at                         timestamptz NOT NULL
  draft_updated_at                       timestamptz NULL
  draft_updated_by_portal_membership_id  uuid NULL → portal_memberships.id ON DELETE SET NULL
  submitted_at                           timestamptz NULL
  submitted_by_portal_membership_id      uuid NULL → portal_memberships.id ON DELETE SET NULL
  customer_notice                        text NULL       CHECK (length(customer_notice) <= 2000) Hinweis bei Gespräch/Zurück
  started_at                             timestamptz NULL
  completed_at                           timestamptz NULL
  completed_by_member_id                 uuid NULL → workspace_members.id
  approved_at                            timestamptz NULL
  approved_by_portal_membership_id       uuid NULL → portal_memberships.id ON DELETE SET NULL
  read_at                                timestamptz NULL                 Ungelesen im Eingang (Task 62)
  version                                integer NOT NULL CHECK (version > 0)
  created_at, updated_at                 timestamptz NOT NULL

  FK feedback_rounds_project_customer_fk (project_id, customer_id) → projects (id, customer_id) ON DELETE CASCADE
  UNIQUE feedback_rounds_id_project_uidx (id, project_id)             Ziel der FKs aus files und tasks
  UNIQUE feedback_rounds_project_number_uidx (project_id, round_number)
  UNIQUE feedback_rounds_active_uidx (project_id)
         WHERE status IN ('open','submitted','in_discussion','in_progress')
  UNIQUE feedback_rounds_approved_uidx (project_id) WHERE status = 'approved'
  INDEX  feedback_rounds_queue_idx (status, submitted_at)
         WHERE status IN ('submitted','in_discussion','in_progress')
  INDEX  feedback_rounds_unread_idx (project_id) WHERE status = 'submitted' AND read_at IS NULL
```

Konsistenz-CHECKs:

- `status = 'open'` ⇒ `submitted_at IS NULL AND submitted_by_portal_membership_id IS NULL`.
- `status IN ('submitted','in_discussion','in_progress','completed')` ⇒ `submitted_at IS NOT NULL`.
- `submitted_by_portal_membership_id IS NOT NULL` ⇒ `submitted_at IS NOT NULL` (die Membership darf per
  `SET NULL` verschwinden, der Zeitpunkt bleibt).
- `status = 'in_progress'` ⇒ `started_at IS NOT NULL`.
- `status = 'completed'` ⇒ `completed_at IS NOT NULL AND completed_by_member_id IS NOT NULL`.
- `completed_at IS NOT NULL` ⇒ `status IN ('completed','approved')`.
- `status = 'approved'` ⇔ `approved_at IS NOT NULL`.

Eine abgenommene Runde kann aus `open` (ohne Einreichen) oder aus `completed` kommen; deshalb sind `submitted_at` und
`completed_at` bei `approved` offen.

### `feedback_round_items` (neu)

```txt
feedback_round_items
  id                               uuid PK                       vom Client erzeugt (stabil über Autosave)
  round_id                         uuid NOT NULL → feedback_rounds.id ON DELETE CASCADE
  position                         integer NOT NULL CHECK (position >= 0 AND position < 30)
  area_label                       text NULL CHECK (area_label IS NULL OR (btrim(area_label) <> '' AND length(area_label) <= 80))
                                                                 NULL = „Allgemein“
  kind                             text NULL CHECK in FEEDBACK_ITEM_KIND_VALUES ('change_request','bug')
  body                             text NOT NULL CHECK (length(body) <= 5000)   im Entwurf darf er leer sein
  created_by_portal_membership_id  uuid NULL → portal_memberships.id ON DELETE SET NULL
  result                           text NULL CHECK in FEEDBACK_ITEM_RESULT_VALUES
  result_note                      text NULL CHECK (length(result_note) <= 2000)
  result_set_by_member_id          uuid NULL → workspace_members.id
  result_set_at                    timestamptz NULL
  version                          integer NOT NULL CHECK (version > 0)
  created_at, updated_at           timestamptz NOT NULL

  UNIQUE feedback_round_items_id_round_uidx (id, round_id)
  UNIQUE feedback_round_items_round_position_uidx (round_id, position) DEFERRABLE INITIALLY IMMEDIATE
                                                                 replaceDraftItems schiebt ihn zum Tauschen auf
  CHECK num_nonnulls(result, result_set_by_member_id, result_set_at) IN (0, 3)
  CHECK result_note IS NULL OR result IS NOT NULL
  CHECK result NOT IN ('not_implemented','additional_service') OR btrim(coalesce(result_note,'')) <> ''
```

- Präfix nach der Kindtabellen-Regel in `00-entscheidungen.md` („Tabellennamen“).
- `area_label` ist Text (Snapshot), kein Fremdschlüssel: Die Runde hält die Liste in `area_options`; der Handler prüft,
  dass ein gesetzter Bereich darin enthalten ist.

### `files` (Erweiterung)

`feedback_round_id` existiert seit Migration `0041_create_files.sql` ohne FK. Neu:

```txt
+ feedback_item_id uuid NULL
+ FK files_feedback_round_project_fk (feedback_round_id, project_id) → feedback_rounds (id, project_id)
+ FK files_feedback_item_round_fk   (feedback_item_id, feedback_round_id) → feedback_round_items (id, round_id)
+ CHECK files_feedback_scope_check      ((feedback_round_id IS NULL) = (feedback_item_id IS NULL))
+ CHECK files_feedback_project_check    (feedback_round_id IS NULL OR project_id IS NOT NULL)
+ CHECK files_feedback_origin_check     (feedback_round_id IS NULL OR (uploaded_by_side = 'customer' AND status = 'ready'))
+ INDEX files_feedback_item_idx (feedback_item_id) WHERE feedback_item_id IS NOT NULL
```

- Jede Feedbackdatei hängt an genau einem Punkt; „Allgemein“ ist ein Punkt ohne Bereich.
- `files_feedback_project_check` ist nötig, weil ein zusammengesetzter FK bei `project_id IS NULL` nach
  `MATCH SIMPLE` nicht greift.
- Beide FKs ohne `ON DELETE CASCADE`: Runden und Punkte werden nur per Kunden-Purge (Ordner 21) gelöscht, und der Purge
  löscht Dateien vorher. Beim Entfernen eines Entwurfspunkts löst der Service die Dateien zuerst (siehe unten).
- Es gibt **keinen** exactly-one-scope-CHECK an `files`; der Scope ist hierarchisch (Kunde ⊃ Projekt ⊃ Runde/Punkt).

### `tasks` (Erweiterung)

```txt
+ feedback_round_id uuid NULL
+ FK tasks_feedback_round_project_fk (feedback_round_id, project_id) → feedback_rounds (id, project_id)
+ UNIQUE tasks_feedback_round_uidx (feedback_round_id) WHERE feedback_round_id IS NOT NULL
+ CHECK tasks_feedback_round_side_check (feedback_round_id IS NULL OR action_side = 'internal')
```

### Drizzle

- `packages/db/src/record-configuration/crm/feedback-rounds.ts`, `feedback-round-items.ts`, Barrel `crm/index.ts`;
  Erweiterungen in `projects.ts`, `files.ts`, `tasks.ts`.
- Constraint-Namen in `packages/db/src/constraint-names/crm/feedback-rounds-constraint-names.ts`,
  `feedback-round-items-constraint-names.ts`, Ergänzungen in `files-`, `tasks-`, `projects-constraint-names.ts` (+ Tests
  nach Muster `files-constraint-names.test.ts`).
- Deckungsgleich zur Migration — expliziter Review-Punkt.

## Konstanten, Contracts, Patterns

`packages/common/src/constants/crm/`:

- `feedback-round-statuses.ts`: `FeedbackRoundStatus` (`Open`, `Submitted`, `InDiscussion`, `InProgress`, `Completed`,
  `Approved`), `FEEDBACK_ROUND_STATUS_VALUES`, `ACTIVE_FEEDBACK_ROUND_STATUS_VALUES` (open … in_progress),
  `INTERNAL_QUEUE_FEEDBACK_ROUND_STATUS_VALUES` (submitted, in_discussion, in_progress).
- `feedback-round-transitions.ts`: `FEEDBACK_ROUND_TRANSITIONS` (siehe Tabelle unten), je Eintrag `from`, `to`, `side`.
- `feedback-transition-sides.ts`: `FeedbackTransitionSide` (`Internal`, `Customer`).
- `feedback-item-kinds.ts`, `feedback-item-results.ts` (+ `FEEDBACK_ITEM_RESULTS_REQUIRING_NOTE`).
- `feedback-limits.ts`: `FEEDBACK_LIMITS` (30 Punkte, 5.000 Zeichen, Bereich 80, 30 Bereiche, Notizen 2.000,
  10 Dateien je Punkt, 50 je Runde).
- `errors/feedback-round-error-codes.ts`: `FEEDBACK_ROUND_NOT_FOUND`, `FEEDBACK_ITEM_NOT_FOUND`, `VALIDATION_ERROR`,
  `PROJECT_NOT_ELIGIBLE`, `FEEDBACK_ROUND_STEP_MISSING`, `PROJECT_NOT_AT_FEEDBACK_STEP`, `ROUND_ALREADY_ACTIVE`,
  `QUOTA_EXHAUSTED`, `PROJECT_ALREADY_APPROVED`, `INVALID_TRANSITION`, `ROUND_LOCKED`, `ITEMS_REQUIRED`,
  `ITEM_TEXT_REQUIRED`, `ITEMS_PRESENT`, `RESULTS_INCOMPLETE`, `NOT_LATEST_ROUND`, `CONFIRMATION_REQUIRED`,
  `ATTACHMENT_LIMIT_REACHED`, `FILE_NOT_ATTACHABLE` (+ Test nach Muster `project-error-codes.test.ts`).
- `errors/project-error-codes.ts`: `+ PROJECT_FEEDBACK_ROUND_IN_USE`.
- `packages/common/src/constants/files/…` (bestehende Datei-Fehlercodes): `+ FILE_FEEDBACK_BOUND`.
- `packages/common/src/constants/portal/portal-feedback-error-codes.ts` (Muster `portal-task-error-codes.ts`):
  `not_found`, `locked`, `validation`, `items_required`, `item_text_required`, `items_present`, `not_latest`,
  `confirmation_required`, `attachment_limit`, `not_attachable`.

`packages/common/src/contracts/crm/`: `feedback-round.dto.ts` (intern, inkl. Punkte, Anhänge, Ergebnisse,
`version`), `feedback-round-item.dto.ts`, `feedback-attachment.dto.ts`, `feedback-round-summary.dto.ts` (Liste je
Projekt), `task.dto.ts` `+ feedbackRoundId: string | null`.
`packages/common/src/contracts/portal/`: `portal-feedback-round.dto.ts`, `portal-feedback-item.dto.ts` (Ergebnis und
Antwort nur, wenn die Runde `completed` oder `approved` ist), `portal-project-feedback.dto.ts` (Seite: Kontingent,
verbraucht, aktive Runde, Verlauf, Rechte `canSubmit`), `portal-feedback-summary.dto.ts` (Widget).
Request-DTOs entstehen in dem Task, der ihre Route baut.

`packages/common/src/patterns/crm/feedback-round-state.ts` (seiteneffektfrei, getestet):

- `canTransition(from, to, side)` aus der Tabelle.
- `isActiveFeedbackRound(status)`.
- `feedbackQuota({ included, rounds })` → `{ included, used, remaining, activeRoundNumber, approvedRoundNumber }`.
- `isAtFeedbackStep({ processSteps, currentProcessStep, feedbackRoundPositions, roundNumber })` nach der Regel
  „aktueller Schritt ist der letzte Freitext-Schritt vor Rundenschritt n (Rundenschritt an Position 0: der erste
  Schritt)“.

## Übergangstabelle

| Von → Nach                                  | Seite    | Bedingungen (unter Sperre)                                                                                       | Nebenwirkungen (gleiche Transaktion)                                                    |
| ------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| – → `open` (Übergabe)                       | intern   | Projekt `active`; Rundenschritt n = max + 1 vorhanden; am Feedbackschritt; keine aktive, keine abgenommene Runde | Runde mit Snapshots; `projects.feedback_areas` aktualisieren; Activity; Systemnachricht |
| `open` → `submitted`                        | customer | `version`; ≥ 1 Punkt; jeder Punkt mit Text                                                                       | `submitted_*`; Sammelaufgabe anlegen bzw. wieder öffnen; Activity; Systemnachricht      |
| `open` → `approved`                         | customer | `version`; **0 Punkte**; `confirmFinal`                                                                          | `approved_*`; Projektschritt nach der Runde; Activity; Systemnachricht                  |
| `submitted` → `in_discussion`               | intern   | `version`; optional `customer_notice`                                                                            | Activity; Systemnachricht                                                               |
| `submitted`/`in_discussion` → `in_progress` | intern   | `version`                                                                                                        | `started_at`; Aufgabe `open` → `in_progress`; Activity                                  |
| `submitted`/`in_discussion` → `open`        | intern   | `version`; `customer_notice` Pflicht                                                                             | `submitted_*` leeren (Punkte bleiben); Aufgabe → `cancelled`; Activity; Systemnachricht |
| `in_progress` → `completed`                 | intern   | `version`; alle Punkte mit Ergebnis                                                                              | `completed_*`; Aufgabe → `done`; Activity; Systemnachricht                              |
| `completed` → `approved` (Abnahme)          | customer | höchste Runde des Projekts; keine aktive Runde; `confirmFinal`                                                   | `approved_*`; Projektschritt nach der Runde; Activity; Systemnachricht                  |

Alle anderen Kombinationen → `INVALID_TRANSITION` (409). Nach einer Abnahme ist keine Übergabe mehr möglich
(`PROJECT_ALREADY_APPROVED`). Die Tabelle ist die einzige Quelle für Server und UI (Buttons erscheinen nur, wenn
`canTransition` sie erlaubt).

## Geteilte Services

Unter `apps/workspace/src/server/shared/services/feedback/` (Portal- und Workspace-Handler nutzen sie gemeinsam; Regeln
in `apps/workspace/src/server/shared/AGENTS.md`, Abschnitt „feedback“ ergänzen):

- `feedback-round-task-service.ts` — Sammelaufgabe:
  - `ensureOpenForSubmission(tx, round)`: legt die Aufgabe an (Titel aus Workspace-Dictionary in `DEFAULT_LOCALE`,
    `action_side = internal`, `visible_to_customer = false`, Bearbeiter Projekt-Owner, falls aktiv, sonst Kunden-Owner,
    Membership `FOR SHARE`) oder öffnet eine `cancelled` Aufgabe dieser Runde wieder. Kein aktiver Owner → keine
    Aufgabe, Log ohne PII.
  - `markInProgress`, `cancelForReturn`, `completeForRound`: ändern nur aus dem erwarteten Ausgangsstatus; manuelle
    Änderungen bleiben unberührt. Aufgaben-Activities über die bestehende Aufgaben-Activity-Logik (Muster
    `change-task-status.command-handler.ts`).
- `feedback-round-item-service.ts` — Punkte und Anhänge einer Runde mit einer Abfrage laden; die Sichtbarkeitsbedingung
  für Dateien übergibt der Handler (Muster `server/shared/services/message/message-attachment-service.ts`).
  `replaceDraftItems(tx, round, items, actor)`: Insert/Update/Delete gegen den gespeicherten Stand; vor dem Löschen
  eines Punkts werden seine Dateien gelöst (`feedback_round_id`/`feedback_item_id` → NULL, die Datei bleibt unter
  „Von dir“).
- `feedback-project-step-service.ts` — `advancePastFeedbackRound(tx, projectId, roundNumber)`: sperrt das Projekt,
  setzt `current_process_step = process_steps[p_n]` (Position des Rundenschritts n), falls `p_n < cardinality`, über `updateVersioned`
  (`server/workspace/shared/update-versioned.ts`) mit der gesperrten Version.
- `feedback-round-activity-service.ts` — schreibt Activities über `server/shared/services/activity-service.ts`.
  **Keine neuen Activity-Typen und keine Activity-Migration:** `activities.type` hat einen CHECK auf
  `ACTIVITY_TYPE_VALUES` (`packages/common/src/constants/activity/activity-types.ts`). Genutzt werden die bestehenden
  Typen: Übergabe → `ActivityType.Created`; Einreichen → `ActivityType.SubmissionReceived`; jeder weitere
  Statuswechsel (inkl. Abnahme) → `ActivityType.FieldChange` mit Feld `status`, alt/neu. Die Zugehörigkeit zur Runde
  steht wie bei Aufgaben in `metadata` (`entity: "feedback_round"`, `feedbackRoundId`, `roundNumber`), Konstante
  `FEEDBACK_ROUND_ACTIVITY_ENTITY` in `apps/workspace/src/common/constants/crm/feedback-round-activity-metadata.ts`
  (Muster `task-activity-metadata.ts`). `customer_id` und `project_id` der Activity werden gesetzt. Actor: Mitglied
  bzw. Portal-Membership, nie E-Mail. Kein Feedbacktext in Activities.

## Guards in bestehenden Handlern

- `update-project.command-handler.ts`: Die Positionen der Rundenschritte 1 … höchste vergebene Rundennummer dürfen
  sich relativ zu den Freitext-Schritten nicht ändern und nicht wegfallen → sonst `PROJECT_FEEDBACK_ROUND_IN_USE`
  (409), unter `FOR UPDATE` des Projekts. Damit bleibt das Kontingent automatisch ≥ höchste Rundennummer.
- `update-file.command-handler.ts`: Projektwechsel einer Datei mit `feedback_round_id` → `FILE_FEEDBACK_BOUND` (409).
- `delete-file.command-handler.ts`: Löschen einer Datei, deren Runde nicht mehr `open` ist → `FILE_FEEDBACK_BOUND`.
- `tasks-mapper-service.ts`: liefert `feedbackRoundId`.

## Seed

`packages/db/scripts/crm-fixture/seed-feedback-rounds.ts`, eingebunden in `packages/db/scripts/seed-crm-fixture.ts`:
ein Projekt mit abgeschlossener Runde 1 (Punkte mit allen drei Ergebnissen), offener Runde 2 mit Entwurf, ein zweites
Projekt mit Abnahme. Bleibt optional, damit Empty-States prüfbar bleiben.

## Tickets

### CRM-58-T1 — Migration und Modelle

- **Files:** Migration, Drizzle-Modelle, Constraint-Namen, `scripts/smoke-crm-constraints.ts`
- **Akzeptanz (`pnpm db:smoke:crm`, Negativfälle):** doppelte Rundennummer; zwei aktive Runden; zwei abgenommene
  Runden; Runde mit Kunde ≠ Projektkunde; Datei an Punkt einer fremden Runde; Datei mit Runde ohne Projekt; interner
  Upload an einem Punkt; `pending`-Datei an einem Punkt; Aufgabe mit Runde eines fremden Projekts; zwei Aufgaben je
  Runde; kundenseitige Aufgabe mit Runde; Ergebnis ohne Actor; `not_implemented` ohne Antwort; `completed` ohne
  `completed_*`; 31. Bereich; Position 30. Zweiter Migrationslauf folgenlos.

### CRM-58-T2 — Common

- **Files:** alle Konstanten, Fehlercodes, DTOs, `feedback-round-state.ts` + Tests
- **Akzeptanz:** Übergangstabelle vollständig getestet (jede Kombination Status × Status × Seite erlaubt oder
  verboten); `isAtFeedbackStep` für Block an Position 0, Mitte, Ende und ohne Block; `feedbackQuota` für 0, 1, N Runden
  und Abnahme

### CRM-58-T3 — Geteilte Services

- **Files:** `server/shared/services/feedback/**`, `server/shared/AGENTS.md`, Integrationstests unter
  `server/tests/shared/feedback/`
- **Akzeptanz:** Sammelaufgabe wird genau einmal angelegt und bei erneutem Einreichen wieder geöffnet; manuell
  erledigte Aufgabe bleibt bei Abschluss unberührt; ohne aktiven Owner keine Aufgabe und kein Fehler;
  `replaceDraftItems` löst Dateien entfernter Punkte; `advancePastFeedbackRound` bei Block am Ende ändert nichts

### CRM-58-T4 — Guards

- **Files:** `update-project`, `update-file`, `delete-file`, `tasks-mapper-service` + Tests
- **Akzeptanz:** Fehlercodes wie oben; ohne Runden unverändertes Verhalten (bestehende Tests grün)

### CRM-58-T5 — Seed

- **Files:** `crm-fixture/seed-feedback-rounds.ts`, `seed-crm-fixture.ts`
- **Akzeptanz:** `pnpm db:seed:crm` idempotent; Daten erfüllen alle Constraints

## Deploy-Sicherheit

1. **Live sichtbar:** nichts.
2. **Bricht nichts:** neue Tabellen, additive Spalten (nullable bzw. mit Default), zusätzliche Constraints, die ohne
   Runden nie greifen. Bestehende Datei-, Aufgaben- und Projektpfade verhalten sich unverändert.
3. **Offen:** Endpunkte (Task 59) und UI (Task 60).

## End-to-End-Akzeptanz

1. Migration auf leerer und auf befüllter Development-DB idempotent.
2. Modell deckungsgleich (Review-Punkt).
3. Seed erzeugt alle Zustände.
4. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm db:smoke:crm`,
   `pnpm --filter @invessiv/workspace build` grün.
