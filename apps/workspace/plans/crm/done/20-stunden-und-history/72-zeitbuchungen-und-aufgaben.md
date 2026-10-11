# Task 72 — Zeitbuchungen und Aufgaben

> **Merge-Einheit:** Ordner 20, PR 20.2 · **Branch:** `feat/crm-stunden-2-buchungen`
> **Aufwand:** L · **Abhängigkeiten:** PR 20.1 gemergt (Task 27)
> **Migration:** keine (Tabelle `project_time_entries` und der Index an `tasks` entstehen in Task 27)
> **Zuerst lesen:** [README](./README.md), [Task 27](./27-kontingent-und-zuweisung.md),
> `apps/workspace/src/server/workspace/crm/AGENTS.md` (Abschnitte „Aufgaben“ und „Stunden“),
> `apps/workspace/src/components/workspace/crm/AGENTS.md` (Abschnitte „Aufgaben“ und „Stunden“)

- Mitarbeiter mit `hours.write` buchen Zeit in 15-Minuten-Schritten auf ein Projekt.
- Eine Buchung kann eine Aufgabe des Projekts nennen; eine Aufgabe braucht nie eine Buchung.
- Buchungen sind änder- und löschbar, mit Versionsprüfung und Activity.
- Das Projekt zeigt Zugewiesen, Verbraucht und Rest; ein überzogenes Projekt ist sichtbar, nie blockiert.

## Context

Seit Task 27 lassen sich Stunden gutschreiben und Projekten zuweisen, aber nichts verbraucht sie. Dieser Task ergänzt
die Zeitbuchung. Sie ist das, was der Kunde später im Portal liest („1:00 — Umbau Hero-Section“), deshalb ist die
Beschreibung Pflicht und kundensichtbar.

Aufgaben werden **genutzt, nicht umgebaut**: Die Tabelle `tasks` bekommt keine Zeitspalte. Die Verbindung ist
`project_time_entries.task_id`. Aufgaben, die im Projektverlauf entstehen und nicht berechnet werden, bleiben einfach
ohne Buchung; nach dem Launch bucht das Team auf dieselben Aufgaben, wenn es abrechnen will.

**Vorlagen:** Anlegen und Ändern mit Activity in einer Transaktion —
`apps/workspace/src/server/workspace/crm/command-handler/create-task.command-handler.ts` und
`update-task.command-handler.ts`. Löschen mit Sperre und Versionsvergleich —
`delete-file.command-handler.ts`. Liste über API mit Nachladen — das Zugangsdaten-Modul
(`query-handler/list-customer-credentials.query-handler.ts`, Hook `useCustomerCredentials`).

## Entscheidungen

| Bereich       | Entscheidung                                                                                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ziel          | Immer genau ein Projekt. Die Buchung ändert ihr Projekt nie; wer falsch gebucht hat, löscht und bucht neu                                                                                             |
| Projektstatus | Buchen nur auf Projekte, die nicht `cancelled` oder `archived` sind (`PROJECT_CLOSED`). Ändern und Löschen bestehender Buchungen geht immer                                                           |
| Überziehung   | Keine Prüfung gegen „Zugewiesen“. Das Formular zeigt vor dem Speichern, um wie viel die Buchung überzieht; gespeichert wird trotzdem                                                                  |
| Dauer         | 15 bis 600000 Minuten, Vielfaches von 15 (DB-CHECK und Schema). Eingabe über `duration-field` aus Task 27                                                                                             |
| Datum         | `performed_on` ≤ heute (`taskDueStateService.businessToday()`), vorbelegt mit heute                                                                                                                   |
| Aufgabe       | Optional. Zulässig ist jede Aufgabe **desselben Projekts** außer `cancelled`. Wird eine verknüpfte Aufgabe später abgebrochen, bleibt die Buchung unverändert                                         |
| Beschreibung  | Pflicht, 1–500 Zeichen, kundensichtbar. Wählt der Nutzer eine Aufgabe und das Feld ist leer, übernimmt der Client den Aufgabentitel als Vorschlag                                                     |
| Kulanz        | Haken „Nicht berechnen (Kulanz)“, Standard aus. Schreibt `billable = false`                                                                                                                           |
| Wer           | `performed_by_member_id` ist immer der buchende Actor. Es gibt kein Buchen im Namen anderer; die Spalte ändert sich beim Bearbeiten nicht                                                             |
| Sperren       | Anlegen sperrt nichts (README, „Nebenläufigkeit“). Ändern läuft über `updateVersioned`, Löschen sperrt die Zeile und vergleicht die Version                                                           |
| Activity      | `created` beim Anlegen; `field_change` je geändertem Feld (Dauer, Datum, Kulanz, Aufgabe mit Vorher/Nachher; Beschreibung nur als Feldname ohne Text); `field_change` mit Feld `deleted` beim Löschen |
| Liste         | Neueste zuerst (`performed_on DESC, created_at DESC, id DESC`), 30 je Seite, Cursor über genau diese drei Werte                                                                                       |

## CRM-72-T1 — Contracts und Server

```txt
packages/common/src/contracts/crm/hours/time-entry.dto.ts                    TimeEntryDto
packages/common/src/contracts/crm/hours/time-entry-page.dto.ts               TimeEntryPageDto { entries; nextCursor: string | null }
packages/common/src/contracts/crm/hours/create-time-entry-request.dto.ts
packages/common/src/contracts/crm/hours/update-time-entry-request.dto.ts
packages/common/src/contracts/crm/results/create-time-entry-result.ts
packages/common/src/contracts/crm/results/update-time-entry-result.ts
packages/common/src/contracts/crm/results/delete-time-entry-result.ts
packages/common/src/contracts/crm/rows/time-entry-row.ts
packages/common/src/contracts/crm/hours/time-entry-cursor.ts                TimeEntryCursor
packages/common/src/patterns/crm/hours/time-entry-cursor.ts                  encodeTimeEntryCursor, decodeTimeEntryCursor (+ Test)

apps/workspace/src/server/workspace/crm/services/hours/time-entry-access-service.ts     timeEntryAccessService
apps/workspace/src/server/workspace/crm/services/hours/hours-mapping-service.ts         + toTimeEntryDto
apps/workspace/src/server/workspace/crm/services/hours/hours-schemas.ts                 + createTimeEntry, updateTimeEntry, listQuery
apps/workspace/src/server/workspace/crm/services/hours/hours-activity-service.ts        + recordTimeEntryCreated, …Changed, …Deleted
apps/workspace/src/common/constants/crm/hours-activity-metadata.ts                      + TIME_ENTRY_ACTIVITY_ENTITY "time_entry",
                                                                                         TimeEntryActivityField { Duration, PerformedOn,
                                                                                         Billable, Task, Description, Deleted }
apps/workspace/src/server/workspace/crm/command-handler/create-time-entry.command-handler.ts
apps/workspace/src/server/workspace/crm/command-handler/update-time-entry.command-handler.ts
apps/workspace/src/server/workspace/crm/command-handler/delete-time-entry.command-handler.ts
apps/workspace/src/server/workspace/crm/query-handler/list-project-time-entries.query-handler.ts
apps/workspace/src/server/workspace/crm/query-handler/get-task-booked-minutes.query-handler.ts
```

```ts
TimeEntryDto { id; projectId; taskId: string | null; performedOn: string; durationMinutes: number;
               description: string; billable: boolean; performedByMemberId: string; version: number;
               createdAt: string; updatedAt: string }

CreateTimeEntryRequestDto { performedOn: string; durationMinutes: number; description: string;
                            billable: boolean; taskId: string | null }
UpdateTimeEntryRequestDto { version: number; performedOn: string; durationMinutes: number; description: string;
                            billable: boolean; taskId: string | null }
// Löschen nimmt VersionedWriteInput ({ version }) aus packages/common/src/contracts/concurrency/.

CreateTimeEntryResult =
  | { ok: true; timeEntry: TimeEntryDto; project: ProjectHoursBalanceDto }
  | { ok: false; code: HoursErrorCode.ValidationError; errors: unknown }
  | { ok: false; code: ProjectNotFound | ProjectClosed | TaskNotLinkable }
UpdateTimeEntryResult =
  | { ok: true; timeEntry: TimeEntryDto; project: ProjectHoursBalanceDto }
  | { ok: false; code: ConcurrencyErrorCode.VersionConflict; conflict: VersionConflictDto<TimeEntryDto> }
  | { ok: false; code: HoursErrorCode.ValidationError; errors: unknown }
  | { ok: false; code: TimeEntryNotFound | TaskNotLinkable }
DeleteTimeEntryResult =
  | { ok: true; deleted: true; project: ProjectHoursBalanceDto }
  | { ok: false; code: ConcurrencyErrorCode.VersionConflict; conflict: VersionConflictDto<TimeEntryDto> }
  | { ok: false; code: TimeEntryNotFound }
```

Jede Schreibantwort trägt die neue `ProjectHoursBalanceDto`, damit die Sektion den Rest ohne zweiten Request zeigt.

**`timeEntryAccessService`** (Muster `credential-access-service.ts`):

```ts
timeEntryAccessService.condition(actor, permission): SQL | undefined
  // crmAccessCondition.forScope(accessScope(actor, permission),
  //   { customerId: projectTimeEntries.customer_id, projectId: projectTimeEntries.project_id })
timeEntryAccessService.lock(tx, id, actor, permission): Promise<row | null>
  // SELECT … FOR UPDATE + canOn; a row outside the scope is null
timeEntryAccessService.isTaskLinkable(reader, taskId, projectId): Promise<boolean>
  // task exists, tasks.project_id = projectId, status <> TaskStatus.Cancelled
```

**`createTimeEntry(projectId, input, actor)`**:

1. `projectId` als uuid, sonst `PROJECT_NOT_FOUND`. Schema: `durationMinutes` ganzzahlig, 15…600000, `% 15 === 0`;
   `performedOn` Kalendertag ≤ `businessToday()`; `description` getrimmt 1…500; `billable` boolean;
   `taskId` uuid oder `null`. Sonst `VALIDATION_ERROR`.
2. Projekt laden (`customer_id`, `status`). Fehlt es oder `!canOn(actor, Permission.HoursWrite, { customerId, projectId })`
   → `PROJECT_NOT_FOUND`. Status `cancelled`/`archived` → `PROJECT_CLOSED`.
3. Mit `taskId`: `isTaskLinkable`, sonst `TASK_NOT_LINKABLE`.
4. Transaktion: Insert (`id: crypto.randomUUID()`, `customer_id` aus dem Projekt, `performed_by_member_id:
actor.workspaceMemberId`, `version: 1`), `hoursActivityService.recordTimeEntryCreated`.
5. Projektbalance neu lesen (`hoursBalanceService.loadProjectSums`, gefiltert auf das Projekt) und zurückgeben.

**`updateTimeEntry(id, input, actor)`**: Schema wie oben plus `version`. Zeile mit Zugriffsbedingung laden (sonst
`TIME_ENTRY_NOT_FOUND`); geänderte `taskId` über `isTaskLinkable` prüfen (eine **unveränderte** Verknüpfung zu einer
inzwischen abgebrochenen Aufgabe ist erlaubt); `updateVersioned({ table: projectTimeEntries, … })`; je geändertem
Feld eine Activity. Ändert sich nichts, wird trotzdem über `updateVersioned` geschrieben (Version steigt) — ein
veralteter Stand antwortet so immer mit dem Konflikt.

**`deleteTimeEntry(id, input, actor)`**: Transaktion, `timeEntryAccessService.lock(tx, id, actor, HoursWrite)`
(`null` → `TIME_ENTRY_NOT_FOUND`), `row.version !== input.version` → `versionConflict(row.version, dto)`, Activity
(`field: "deleted"`, `previous: { duration_minutes, performed_on, billable }`), `tx.delete`.

**`listProjectTimeEntries(projectId, query, actor): Promise<TimeEntryPageDto | null>`**: `null`, wenn das Projekt
außerhalb des Zugriffsbereichs von `hours.read` liegt. Sonst eine Abfrage mit `timeEntryAccessService.condition`,
Sortierung und Cursor wie in der Tabelle oben, `limit 31` (das 31. Element entscheidet über `nextCursor`).

**`getTaskBookedMinutes(projectIds, actor): Promise<Record<string, number>>`**: Summe der Buchungsdauer je `task_id`
(alle Buchungen, auch Kulanz) für die übergebenen Projekte in **einer** gruppierten Abfrage, gefiltert über
`timeEntryAccessService.condition(actor, HoursRead)`. Speist die Anzeige „1:30 gebucht“ an der Aufgabenzeile.

- **Akzeptanz (Integrationstests, Datei `…/tests/workspace/crm/hours/time-entries.integration.test.ts`):**
  - Rechenbeispiel Schritt 3 und 4; nach Schritt 3 ist B überzogen und bleibt es, bis freigegeben und zugewiesen wird
  - Dauer 0, 10, 20, 600015 → `VALIDATION_ERROR`; 15 und 600000 → Erfolg; Datum morgen → `VALIDATION_ERROR`
  - Aufgabe eines anderen Projekts, abgebrochene Aufgabe, unbekannte Aufgabe → `TASK_NOT_LINKABLE`
  - Kulanzbuchung: `usedMinutes` unverändert, `goodwillMinutes` steigt
  - Update mit alter Version → Konflikt mit `current`; Delete mit alter Version → Konflikt; nichts gelöscht
  - Buchung auf archiviertes Projekt → `PROJECT_CLOSED`; Löschen einer dortigen Buchung gelingt
  - Freigabe (Task 27) nach Buchungen: bei Zugewiesen 5:00 und Verbraucht 2:30 gelingen 2:30, nicht 2:45
  - Activity: genau eine `created`; Update von Dauer und Beschreibung → zwei `field_change`, keine enthält den Text
  - Negativtests: fremder Kunde, fremdes Projekt, projektgebundenes `hours.write` am Schwesterprojekt → `*_NOT_FOUND`
  - `listProjectTimeEntries`: 35 Buchungen, zwei Seiten, keine doppelt, keine fehlt — auch bei identischem Datum
  - `time-entry-cursor`: Roundtrip und Ablehnung eines verstümmelten Cursors (→ `VALIDATION_ERROR` in der Route)

## CRM-72-T2 — Routen und Client

```txt
GET    /api/workspace/crm/projects/[projectId]/time-entries?cursor=   TimeEntries      hours.read  · scope project
POST   /api/workspace/crm/projects/[projectId]/time-entries           TimeEntryCreate  hours.write · scope project
PATCH  /api/workspace/crm/time-entries/[id]                           TimeEntryUpdate  hours.write · scope project
DELETE /api/workspace/crm/time-entries/[id]                           TimeEntryDelete  hours.write · scope project

apps/workspace/src/common/constants/auth/crm-endpoint-access-rules.ts     + vier Regeln
apps/workspace/src/common/constants/crm/crm-operations.ts                 + ListTimeEntries, CreateTimeEntry, UpdateTimeEntry, DeleteTimeEntry
apps/workspace/src/common/patterns/crm/crm-api-endpoints.ts               + crmProjectTimeEntriesEndpoint(projectId), crmTimeEntryEndpoint(id)
apps/workspace/src/app/api/workspace/crm/projects/[projectId]/time-entries/route.ts
apps/workspace/src/app/api/workspace/crm/time-entries/[id]/route.ts
apps/workspace/src/lib/workspace/crm/hours-api-error.ts                   unverändert nutzbar (Codes stehen seit Task 27)
apps/workspace/src/client/crm/hours-api-service.ts                        + listTimeEntries, createTimeEntry, updateTimeEntry, deleteTimeEntry
apps/workspace/src/server/tests/workspace/crm/api/time-entry-routes.test.ts
```

PATCH und DELETE folgen `app/api/workspace/crm/credentials/[credentialId]/route.ts` (zwei Regeln in einer Datei);
ein Konflikt antwortet `Response.json(result.conflict, { status: HttpResponseCode.Conflict })`. GET antwortet 404,
wenn der Handler `null` liefert. Update und Delete im Client laufen über
`apps/workspace/src/client/shared/versioned-json-mutation-service.ts`.

## CRM-72-T3 — Projekt-Sektion „Stunden“

```txt
apps/workspace/src/common/contracts/crm/hours/hours-view-model.ts                + readableProjectIds, writableProjectIds,
                                                                                   bookedMinutesByTaskId
apps/workspace/src/lib/workspace/crm/hours-view-model.ts                         + canOn je Projekt, getTaskBookedMinutes
apps/workspace/src/hooks/workspace/crm/use-project-time-entries.ts               Laden, Nachladen, lokales Einfügen/Ersetzen/Entfernen
apps/workspace/src/components/workspace/crm/projects/customer-projects-section/customer-projects-section.tsx
                                                                                 + ProjectHoursSection nach ProjectTasksSection
apps/workspace/src/components/workspace/crm/hours/project-hours-section/         Orchestrator im Projekt-Canvas
apps/workspace/src/components/workspace/crm/hours/time-entry-list/
apps/workspace/src/components/workspace/crm/hours/time-entry-row/
apps/workspace/src/components/workspace/crm/hours/time-entry-form-dialog/        Anlegen und Ändern
apps/workspace/src/components/workspace/crm/hours/time-entry-delete-dialog/
apps/workspace/src/common/patterns/crm/hours/time-entry-form-request.ts          Formularwerte ↔ Request (+ Test)
apps/workspace/src/i18n/dictionaries/workspace/crm/hours/{de,en}.json            + Namespace project, entry, form
```

Skills: `frontend-design`, `copywriting`, `impeccable`.

- Die Sektion erscheint im Projekt-Canvas direkt nach `ProjectTasksSection` und **nur**, wenn das Projekt in
  `hours.readableProjectIds` steht (wie Aufgaben und Projektleistungen; kein Platzhalter). `key` je Projekt.
- Kopf: „Stunden“ · `2:30 übrig` bzw. „1:00 überzogen“ · „Zeit buchen“ (nur für `writableProjectIds` und nicht bei
  geschlossenem Projekt) · Toggle.
- Körper: Zeile Zugewiesen / Verbraucht / Kulanz (nur wenn > 0) / Rest. Mit `canManage` dieselben Knöpfe „Zuweisen“
  und „Freigeben“ wie in der Kundensektion (derselbe `hour-allocation-dialog`, keine Kopie).
- **Hinweis bei geschlossenem Projekt:** Ist der Status `completed`, `cancelled` oder `archived` und
  `releasableMinutes > 0`, steht über der Liste: „2:30 sind diesem Projekt noch zugewiesen und für andere Projekte
  geblockt.“ Mit `canManage` daneben „Freigeben“. Es wird nie automatisch freigegeben.
- **Hinweis ohne Zuweisung:** Hat das Projekt 0:00 zugewiesen und noch keine Buchung, erklärt der Empty-State den
  Zweck und sagt, dass Buchungen ohne zugewiesene Stunden das Projekt ins Minus führen.
- `time-entry-list`: Buchungen nach Datum gruppiert (Datumstrenner über `formatCalendarDay`), je Zeile Dauer
  (`tabular-nums`), Beschreibung, verknüpfte Aufgabe (Titel aus `TasksViewModel`, falls lesbar), Badge „Kulanz“,
  Bearbeiten und Löschen nur mit Schreibrecht. „Weitere laden“ am Ende, Ankündigung über eine Live-Region.
- `time-entry-form-dialog`: Datum, `duration-field`, Aufgabe (Select mit den nicht abgebrochenen Aufgaben des
  Projekts, erste Option „Keine Aufgabe“; ohne `tasks.read` entfällt das Feld), Beschreibung mit dem unübersehbaren
  Hinweis „Für den Kunden sichtbar“, Haken „Nicht berechnen (Kulanz)“. Unter der Dauer steht live:
  „Rest danach: 1:30“ bzw. „Überzieht das Projekt um 0:30“ (Kulanz: „Zählt nicht gegen das Kontingent“).
  Ändern läuft über `useVersionedMutation`; ein Konflikt übernimmt den aktuellen Stand und behält die Eingaben.
- Nach jedem Schreiben aktualisiert der Hook seine Liste lokal und ruft `router.refresh()`, damit Kundensektion und
  Kennzahl folgen.

- **Akzeptanz (jsdom):**
  - Projekt nicht in `readableProjectIds` → Sektion fehlt; nicht in `writableProjectIds` → keine Aktionen
  - Auswahl einer Aufgabe füllt eine leere Beschreibung, überschreibt eine getippte nicht
  - Überziehungshinweis erscheint bei Dauer > Rest und verschwindet mit dem Kulanz-Haken
  - Hinweis „noch zugewiesen“ nur bei geschlossenem Projekt mit Rest
  - Konflikt beim Ändern zeigt den neuen Stand, Eingaben bleiben

## CRM-72-T4 — Abkürzung an der Aufgabe

```txt
apps/workspace/src/components/workspace/crm/tasks/task-row/task-row.tsx                       + gebuchte Zeit, Aktion „Zeit buchen“
apps/workspace/src/components/workspace/crm/tasks/project-tasks-section/project-tasks-section.tsx
                                                                                             + Props für Stunden, Hinweis nach „Erledigt“
apps/workspace/src/components/workspace/crm/projects/customer-projects-section/customer-projects-section.tsx
                                                                                             reicht hours an die Aufgabensektion
apps/workspace/src/i18n/dictionaries/workspace/crm/tasks/{de,en}.json                         + bookTime, bookedTime, bookAfterDone
```

- Die Aufgabenzeile zeigt „1:30 gebucht“, wenn `bookedMinutesByTaskId[task.id] > 0` (nur mit `hours.read` am Projekt).
- Aktion „Zeit buchen“ an jeder nicht abgebrochenen Aufgabe eines Projekts in `hours.writableProjectIds`; sie öffnet
  `time-entry-form-dialog` mit vorgewählter Aufgabe und vorbelegter Beschreibung.
- Nach einem erfolgreichen Wechsel auf `done` (über den bestehenden Hook `useTaskStatusChange`, der unverändert
  bleibt) erscheint unter der Zeile ein nicht-modaler Hinweis „Zeit für diese Aufgabe buchen?“ mit einem Knopf. Er
  verschwindet beim nächsten Statuswechsel, beim Buchen oder beim Schließen. Kein Dialog öffnet sich von selbst,
  nichts ist Pflicht.
- Die globale Aufgabenübersicht (`tasks/overview/**`) bleibt unverändert; sie bekommt keine Stunden-Props.

- **Akzeptanz:** ohne `hours`-Props verhält sich die Aufgabensektion exakt wie vorher (bestehende Tests grün); der
  Hinweis erscheint nur nach `done`, nicht nach `in_progress`; abgebrochene Aufgaben haben keine Aktion.

## CRM-72-T5 — Seed, Smoke, Doku

```txt
packages/db/scripts/crm-fixture/seed-hours.ts          + Zeitbuchungen: mit Aufgabe, ohne Aufgabe, Kulanz, ein überzogenes Projekt
apps/workspace/src/server/workspace/crm/AGENTS.md      Abschnitt „Stunden“ um Zeitbuchungen ergänzen
apps/workspace/src/components/workspace/crm/AGENTS.md  Abschnitt „Stunden“ um Projekt-Sektion und Aufgaben-Abkürzung ergänzen
apps/workspace/e2e/hours.e2e.ts                        Cockpit-E2E (läuft nur mit E2E_*_STORAGE_STATE, sonst übersprungen)
```

Der Constraint-Smoke aus Task 27 deckt `project_time_entries` bereits ab. E2E-Ablauf: gutschreiben, zuweisen, Zeit
mit Aufgabe buchen, Rest prüfen, Buchung ändern, löschen, freigeben (Vorlage `e2e/tasks.e2e.ts`).

## Deploy-Sicherheit

1. **Live sichtbar:** Sektion „Stunden“ je Projekt, „Zeit buchen“ an Aufgaben, „Verbraucht“ und Reste mit echten
   Werten in Kundensektion und Kennzahl.
2. **Bricht nichts:** keine Migration. Die Aufgabensektion bekommt optionale Props; ohne sie bleibt sie unverändert.
3. **Offen bis 20.3:** Das Portal zeigt weiter das Mock-Widget. Buchungen sind trotzdem schon als kundensichtbar
   gekennzeichnet, weil sie es mit 20.3 rückwirkend werden.

## End-to-End-Akzeptanz

1. Auf Projekt A (5:00 zugewiesen) 1:00 mit Aufgabe „Umbau Hero-Section“ buchen: Rest 4:00, Aufgabe zeigt „1:00 gebucht“.
2. 0:15 ohne Aufgabe buchen: Rest 3:45.
3. 0:30 als Kulanz buchen: Rest bleibt 3:45, die Zeile trägt „Kulanz“.
4. Auf Projekt B (5:00 zugewiesen) 6:00 buchen: B zeigt „1:00 überzogen“; A bleibt unverändert; der Kundenrest sinkt.
5. Die 1:00-Buchung auf 1:30 ändern: Rest 3:15. Löschen: Rest 4:45.
6. Eine Aufgabe erledigen: der Hinweis bietet „Zeit buchen“ an und lässt sich ignorieren.
7. Alle Befehle aus dem Merge-Gate 20.2 der README sind grün.
