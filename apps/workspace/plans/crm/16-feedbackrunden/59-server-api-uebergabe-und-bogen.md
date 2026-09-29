# Task 59 — Server-API: Übergabe und Kundenbogen

> **Vor dem Start lesen:** [`README.md`](./README.md) dieses Ordners (Fachmodell, Status, Limits, Rechte, Merge-Gates),
> `../00-entscheidungen.md`, `../AGENTS.md` und die scoped `AGENTS.md` am Zielcode. Diese Task-Datei plus README sind
> vollständig; frühere Chat- oder Planstände (Task 22/23) gelten nicht.

> **Modelländerung aus Task 57 (29.09.2026, mit dem Owner abgestimmt, verbindlich):** Es gibt **keinen Feedbackblock**
> mit Rundenzahl mehr. Jede Runde ist ein eigener Rundenschritt in der Prozessleiste (`projects.feedback_round_positions`,
> Rundennummer = Reihenfolge). Wo diese Datei noch „Block“ sagt, gilt: „Block vorhanden“ → „Rundenschritt n vorhanden“;
> „am Feedbackschritt“ → aktueller Schritt ist der letzte Freitext-Schritt vor Rundenschritt n; „Projektschritt nach dem
> Block“ → Schritt direkt nach der abgenommenen Runde; „Block entfernen“ → übergebene Rundenschritte entfernen oder
> verschieben; Kontingent = Anzahl der Rundenschritte. Details: README, Abschnitt „Feedbackrunden in der Prozessleiste“.

> **Status:** im Review · **Teil-PR:** 16.3 · **Branch:** `feat/crm-feedback-3-api`
> **Abhängigkeiten:** Task 58 (16.2), Task 55 (14.5, Portal-Upload), Ordner 13a (Chat, `appendSystemMessage`)
> gemerged · **Aufwand:** 2,5–3 T. · **Dateien:** 60–80
> **Migration:** ja, eine für die Portal-Permissions (Nummer im Repo ermitteln)

## Ziel

Alle Endpunkte für den ersten Teil des Kreislaufs — Runde übergeben (intern), Runde lesen (beide Seiten), Entwurf
speichern, Dateien an Punkte hängen, einreichen und ohne Änderungen freigeben (Portal) — vollständig mit Rechten,
Nebenläufigkeit und Negativtests, aber **ohne Aufrufer**. Präzedenz: Task 52 (14.2) lieferte die interne Datei-API
ebenfalls ohne UI. Die Abnahme nach einer abgeschlossenen Runde (`completed → approved`) und die interne Bearbeitung
folgen in Task 61.

## Rechte

- **Intern:** keine neue Permission. Lesen `projects.read`, Übergabe `projects.write`, jeweils `canOn` auf das Projekt
  (scopebar). Jeder Endpunkt in `apps/workspace/src/common/constants/auth/crm-endpoint-access-rules.ts`; jede Query über
  `crmAccessCondition`.
- **Portal:** Migration `<nr>_add_portal_feedback_permissions.sql` nach Muster
  `packages/db/migrations/0042_add_portal_file_permissions.sql`: `portal.feedback.read`, `portal.feedback.submit`
  (Realm `portal`, delegierbar, nicht bindbar), beide in `portal_standard`. Dazu in
  `packages/common/src/constants/auth/`: `permissions.ts` (`PortalFeedbackRead`, `PortalFeedbackSubmit`),
  `permission-definitions.ts` (`portal.feedback.read` in `PORTAL_READ_PERMISSION_VALUES`) und
  `system-role-definitions.ts` (`portal_standard`), jeweils mit den bestehenden Tests; Katalogabgleich in
  `packages/db/scripts/rbac-catalog-check.ts` (`pnpm db:smoke:rbac`). Vorgehen exakt wie bei `portal.files.*` in
  Task 55 — die Migration 0042 und ihre Code-Gegenstücke sind die Vorlage.
- Portal-Lesen verlangt `portal.feedback.read` **und** `portal.projects.read`; das Projekt muss in
  `PORTAL_VISIBLE_PROJECT_STATUS_VALUES` liegen. Schreiben verlangt `portal.feedback.submit` über `portalCanOn`.
  Die Owner-Sicht (`requirePortalReader`/`withPortalReader`) liest, schreibt aber nie.
- Kunde nur aus der validierten Mitgliedschaft (`withPortalActor`), nie aus dem Request-Body.

## Endpunkte

Intern (`/api/workspace/crm/…`):

| Methode + Pfad                              | Recht            | Zweck                                                     |
| ------------------------------------------- | ---------------- | --------------------------------------------------------- |
| `GET projects/[projectId]/feedback-rounds`  | `projects.read`  | Kontingent, Rundenliste (Summary), Übergabe-Verfügbarkeit |
| `POST projects/[projectId]/feedback-rounds` | `projects.write` | Runde übergeben                                           |
| `GET feedback-rounds/[roundId]`             | `projects.read`  | Detail: Punkte, Anhänge, Status, `version`                |

Portal (`/api/portal/[customerId]/…`):

| Methode + Pfad                                                   | Recht                    | Zweck                                                |
| ---------------------------------------------------------------- | ------------------------ | ---------------------------------------------------- |
| `GET projects/[projectId]/feedback`                              | `portal.feedback.read`   | Seite: Kontingent, aktive Runde mit Punkten, Verlauf |
| `PUT feedback-rounds/[roundId]/draft`                            | `portal.feedback.submit` | Entwurf speichern (alle Punkte, versioniert)         |
| `POST feedback-rounds/[roundId]/submit`                          | `portal.feedback.submit` | Einreichen                                           |
| `POST feedback-rounds/[roundId]/approve`                         | `portal.feedback.submit` | Ohne Änderungen freigeben (hier nur aus `open`)      |
| `POST feedback-rounds/[roundId]/items/[itemId]/files`            | `portal.feedback.submit` | Fertige eigene Datei/Link an einen Punkt hängen      |
| `DELETE feedback-rounds/[roundId]/items/[itemId]/files/[fileId]` | `portal.feedback.submit` | Datei vom Punkt lösen (Datei bleibt unter „Von dir“) |

Hochladen selbst läuft über die bestehenden Portal-Endpunkte aus Task 55 (`POST files/uploads`,
`POST files/[fileId]/complete`, `POST files/links`, `portal.files.write`), mit `projectId` der Runde. Danach wird die
fertige Datei angehängt. Alle Antworten `Cache-Control: private, no-store`. Keine URL-Literale: interne Endpunkte
über `apps/workspace/src/common/constants/api-endpoints.ts` bzw. `apps/workspace/src/common/patterns/crm/crm-api-endpoints.ts`,
Portal-Endpunkte als neue Funktionen in `apps/workspace/src/common/patterns/portal/portal-api-endpoints.ts`
(Muster `portalFileEndpoint`: `portalProjectFeedbackEndpoint`, `portalFeedbackDraftEndpoint`,
`portalFeedbackSubmitEndpoint`, `portalFeedbackApproveEndpoint`, `portalFeedbackItemFilesEndpoint`,
`portalFeedbackItemFileEndpoint`, jeweils mit Test).

## Handler

Intern (`apps/workspace/src/server/workspace/crm/`):

- `command-handler/hand-over-feedback-round.command-handler.ts`
  - Request-DTO `hand-over-feedback-round-request.dto.ts`: `previewUrl?` (https, ≤ 2048), `handoverNote?` (≤ 2000),
    `dueOn?` (Datum, nicht in der Vergangenheit), `areaOptions` (≤ 30, je ≤ 80, getrimmt, eindeutig).
  - Projekt `FOR UPDATE`; prüft `canOn`, Projektstatus `active` (`PROJECT_NOT_ELIGIBLE`), Block
    (`FEEDBACK_BLOCK_MISSING`), `isAtFeedbackStep` (`PROJECT_NOT_AT_FEEDBACK_STEP`), keine aktive Runde
    (`ROUND_ALREADY_ACTIVE`, Antwort enthält die aktive Runde — ein Doppelklick sieht damit dieselbe Runde), keine
    Abnahme (`PROJECT_ALREADY_APPROVED`), Kontingent (`QUOTA_EXHAUSTED`).
  - Legt die Runde an (`round_number = max + 1`), schreibt `area_options` und aktualisiert `projects.feedback_areas`
    über `updateVersioned`; Activity; Systemnachricht `feedbackRoundHandedOver` (Savepoint, nur loggen).
- `query-handler/list-project-feedback-rounds.query-handler.ts` (inkl. `feedbackQuota`, `canHandOver` mit Grund).
- `query-handler/get-feedback-round.query-handler.ts` (Punkte + Anhänge mit einer Abfrage über
  `feedback-round-item-service`; Dateisichtbarkeit über die bestehende interne Lesebedingung für Dateien).
- `services/feedback-round-mapping-service.ts`.

Portal (`apps/workspace/src/server/portal/`):

- `query-handler/get-portal-project-feedback.query-handler.ts`.
- `command-handler/save-portal-feedback-draft.command-handler.ts`
  - Request `save-portal-feedback-draft-request.dto.ts`: `version`, `items[{ id (UUID vom Client), areaLabel | null,
kind | null, body }]` (≤ 30; `areaLabel` muss in `area_options` liegen).
  - Runde `FOR UPDATE`; Status muss `open` sein (`ROUND_LOCKED`); `updateVersioned` auf der Runde (409 mit
    `VersionConflictDto` inkl. aktuellem Stand); `replaceDraftItems`; `draft_updated_*`. Keine Activity je Speichern.
- `command-handler/submit-portal-feedback-round.command-handler.ts`
  - Request: `version`. Bei bereits eingereichter Runde mit derselben Membership → `alreadySubmitted` (idempotent,
    kein Fehler, keine zweite Aufgabe); sonst `ROUND_LOCKED`.
  - Prüft ≥ 1 Punkt (`ITEMS_REQUIRED`) und Text in jedem Punkt (`ITEM_TEXT_REQUIRED` mit Punkt-IDs); setzt
    `submitted_*`; `feedbackRoundTaskService.ensureOpenForSubmission`; Activity; Systemnachricht
    `feedbackRoundSubmitted`.
- `command-handler/approve-portal-feedback.command-handler.ts`
  - Request: `version`, `confirmFinal: true` (sonst `CONFIRMATION_REQUIRED`, 422).
  - In diesem Task nur aus `open` mit **0 Punkten** (`ITEMS_PRESENT`, falls Punkte vorhanden). Setzt `approved_*`,
    ruft `advancePastFeedbackRound`; Activity; Systemnachricht `feedbackApproved`. Task 61 ergänzt `completed →
approved`.
- `command-handler/attach-portal-feedback-file.command-handler.ts`
  - Runde `FOR UPDATE`, Status `open`; Datei ist eigene Kundendatei (`uploaded_by_side = customer`) desselben Kunden,
    `ready`, noch keinem Punkt zugeordnet, Projekt = Projekt der Runde (ohne Projekt: wird auf das Rundenprojekt
    gesetzt) — sonst `FILE_NOT_ATTACHABLE`; Limits je Punkt/Runde (`ATTACHMENT_LIMIT_REACHED`).
- `command-handler/detach-portal-feedback-file.command-handler.ts` — nur `open`; setzt beide Spalten auf `NULL`.

Portal-Handler liegen ausschließlich unter `server/portal/`, interne unter `server/workspace/crm/`; gemeinsam genutzte
Logik nur über die Services aus Task 58 (`server/shared/services/feedback/`). Muster für Portal-Mutationen mit Sperre:
`server/portal/command-handler/complete-customer-task.command-handler.ts`.

## Fehlerabbildung

Je Route eine nicht exportierte Message-Map; Statuscodes aus `HttpResponseCode`:

- 404: `FEEDBACK_ROUND_NOT_FOUND`, `FEEDBACK_ITEM_NOT_FOUND`, fremder Kunde/Projekt, fehlende Leseberechtigung
- 400: `VALIDATION_ERROR`
- 409: `ROUND_ALREADY_ACTIVE`, `QUOTA_EXHAUSTED`, `PROJECT_ALREADY_APPROVED`, `FEEDBACK_BLOCK_MISSING`,
  `PROJECT_NOT_AT_FEEDBACK_STEP`, `PROJECT_NOT_ELIGIBLE`, `INVALID_TRANSITION`, `ROUND_LOCKED`, Versionskonflikt (mit
  `VersionConflictDto`)
- 422: `ITEMS_REQUIRED`, `ITEM_TEXT_REQUIRED`, `ITEMS_PRESENT`, `CONFIRMATION_REQUIRED`, `ATTACHMENT_LIMIT_REACHED`,
  `FILE_NOT_ATTACHABLE`

Portal-Routen mappen auf `portal-feedback-error-codes.ts`; Message-Texte nur in co-located `*-error.ts`.

## Systemnachrichten

- Neue Keys in `packages/common/src/constants/crm/system-message-keys.ts`: `feedbackRoundHandedOver`,
  `feedbackRoundSubmitted`, `feedbackRoundDiscussionRequested`, `feedbackRoundReturned`, `feedbackRoundCompleted`,
  `feedbackApproved`; Parameter `RoundNumber` in `SystemMessageParam`. (Die letzten vier werden in Task 61 bzw. hier
  beim Freigeben ausgelöst; die Keys entstehen gesammelt hier.)
- Texte in `dictionaries/workspace/crm/messages` und `dictionaries/portal/messages` (DE/EN, Portal in Du-Form),
  `apps/workspace/src/common/patterns/crm/describe-system-message.ts` erweitern (+ Test).
- Aufruf immer mit Savepoint, Fehler nur geloggt (Muster `announcePhaseChange` in `update-project.command-handler.ts`).

## Tickets

### CRM-59-T1 — Intern: Übergabe, Liste, Detail

- **Files:** drei Handler, Mapping-Service, Request-/Result-DTOs, Routen, Zugriffsregeln, Endpunkt-Konstanten + Tests
- **Akzeptanz:** zwei parallele Übergaben → genau eine Runde, die zweite bekommt `ROUND_ALREADY_ACTIVE` mit der Runde;
  jede Bedingung aus der Übergangstabelle einzeln negativ getestet (planned/paused, ohne Block, nicht am
  Feedbackschritt, aktive Runde, Abnahme, Kontingent); fremder Kunde und gebundene Rolle ohne Projektrecht → 404;
  Übergabe ändert `projects.phase` und `current_process_step` nicht

### CRM-59-T2 — Portal: Lesen, Entwurf, Anhänge

- **Files:** Query-/Command-Handler, Routen, Request-DTOs + Tests
- **Akzeptanz:** zwei parallele Speicherungen mit gleicher `version` → einmal Erfolg, einmal 409 mit aktuellem Stand;
  31 Punkte, 5.001 Zeichen, unbekannter Bereich → 400; Umlaute und Emoji unverändert; HTML/Markdown als Rohtext
  gespeichert; 11. Datei am Punkt → 422; fremde, interne, `pending` oder bereits zugeordnete Datei → 422 bzw. 404;
  entfernter Punkt löst seine Dateien; Owner-Sicht liest, jede Mutation → 403/404 nach Muster

### CRM-59-T3 — Portal: Einreichen und Freigeben

- **Files:** Submit-/Approve-Handler, Routen + Tests
- **Akzeptanz:** doppeltes Einreichen → `alreadySubmitted`, genau eine Aufgabe; ohne Punkte → `ITEMS_REQUIRED`;
  leerer Punkt → `ITEM_TEXT_REQUIRED` mit IDs; nach Einreichen liefern Speichern, Anhängen, Lösen, Freigeben
  `ROUND_LOCKED`; Freigeben mit Punkten → `ITEMS_PRESENT`; ohne `confirmFinal` → `CONFIRMATION_REQUIRED`; Freigabe
  setzt den Projektschritt nach dem Block in derselben Transaktion; danach Übergabe → `PROJECT_ALREADY_APPROVED`;
  Einreichen parallel zum Speichern → kein halber Stand (409 oder `ROUND_LOCKED`)

### CRM-59-T4 — Permissions und Systemnachrichten

- **Files:** Permission-Migration, `packages/common/src/constants/auth/**`, Rollen-Definition, System-Message-Keys,
  Dictionaries, `describe-system-message.ts` + Tests
- **Akzeptanz:** `pnpm db:smoke:rbac` grün; ohne `portal.feedback.read` → 404 auf allen Portal-Feedbackpfaden; ohne
  `portal.feedback.submit` → keine Mutation; fehlschlagende Systemnachricht verhindert den Fachwrite nicht

## Deploy-Sicherheit

1. **Live sichtbar:** nichts (keine UI ruft die Endpunkte auf).
2. **Bricht nichts:** neue Routen und additive Permissions; `portal_standard` erhält zwei Rechte, die noch keine
   Oberfläche nutzt.
3. **Offen:** UI (Task 60), interne Bearbeitung und Abnahme nach Abschluss (Task 61).

## End-to-End-Akzeptanz (Integration über `pnpm db:smoke:crm` mit echten Portal-Sessions)

1. Übergabe → Kontakt A speichert zwei Punkte mit Datei → Kontakt B speichert mit alter Version → 409 → A reicht ein →
   Runde `submitted`, Aufgabe existiert, Systemnachricht im Chat.
2. Zweites Projekt: Übergabe → Kunde gibt ohne Punkte frei (mit `confirmFinal`) → Runde `approved`, Leiste springt
   hinter den Block, weitere Übergabe abgelehnt.
3. Kein Zugriff auf Runden, Punkte oder Dateien eines fremden Kunden, auch nicht mit geratener ID.
4. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm db:smoke:crm`, `pnpm db:smoke:rbac`,
   `pnpm --filter @invessiv/workspace build` grün.
