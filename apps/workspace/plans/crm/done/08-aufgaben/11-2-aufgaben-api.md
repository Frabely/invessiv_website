# Task 11-2 — Aufgaben-API

> **Merge-Einheit:** Ordner 08 · **Branch:** `feat/crm-aufgaben`
> **Aufwand:** M · **Abhängigkeiten:** Task 11-1
> **Migration:** keine

## Ziel

Aufgaben lassen sich serverseitig anlegen, bearbeiten, im Status ändern und je Projekt bzw. je Kunde lesen — mit
Zugriffsbereichen, Versionierung und Activities. Noch keine UI; der Task ist einzeln mergebar.

## Contracts (`packages/common/src/contracts/crm/`)

```ts
// task.dto.ts — jedes Feld mit Docstring (packages/common/AGENTS.md)
export type TaskDto = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  actionSide: TaskActionSide;
  visibleToCustomer: boolean;
  assigneeMemberId: string;
  dueOn: string | null; // ISO-Datum YYYY-MM-DD
  completedAt: string | null;
  completedByMemberId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

// create-task-request.dto.ts
{
  title;
  description;
  actionSide;
  visibleToCustomer;
  assigneeMemberId | null;
  dueOn | null;
}
//   assigneeMemberId null → Handler setzt den Projekt-Owner

// update-task-request.dto.ts
{
  title;
  description;
  actionSide;
  visibleToCustomer;
  assigneeMemberId;
  dueOn | null;
  version;
}

// change-task-status-request.dto.ts
{
  status;
  version;
}
```

Außerdem `results/{create,update,change-status}-task-result.ts`, `rows/task-row.ts`,
`constants/crm/errors/task-error-codes.ts` (`TaskNotFound`, `ProjectNotFound`, `AssigneeNotActive`,
`ValidationError`) und `constants/crm/forms/task-field-limits.ts` (Titel-/Beschreibungslänge).

## Regeln im Handler

- `action_side = customer` ⇒ `visible_to_customer = true`. Ein Request mit Kundenseite und `false` ist ein
  Validierungsfehler, keine stille Korrektur.
- Bearbeiter muss ein **aktives** Mitglied sein, sonst `AssigneeNotActive`.
- Statuswechsel auf `done` setzt `completed_at = now()` und `completed_by_member_id = actor`; jeder Wechsel weg von
  `done` setzt beide auf `null`. Gleicher Status → kein Write, keine Activity.
- Erlaubt sind alle Übergänge zwischen den vier Status (auch `cancelled` → `open`); jeder wird protokolliert.
- Activities (über `activity-service.ts`, mit `customer_id` aus dem Projekt und `project_id`):
  `Created` bei Anlage, `StatusChange` bei Statuswechsel, `FieldChange` bei Bearbeiter-, Seiten- oder
  Sichtbarkeitswechsel (Metadaten: Feld, alt, neu; keine Titel-/Beschreibungstexte). Neue `ActivityType`-Werte nur,
  wenn die bestehenden nicht passen.
- Write und Activity in derselben Transaktion; versionierte Writes ausschließlich über `updateVersioned`.

## Handler und Routen

```txt
apps/workspace/src/server/workspace/crm/
  command-handler/create-task.command-handler.ts
  command-handler/update-task.command-handler.ts
  command-handler/change-task-status.command-handler.ts
  query-handler/list-project-tasks.query-handler.ts        Projekt-Lookup mit accessScope, dann Aufgaben
  query-handler/list-customer-tasks.query-handler.ts       alle lesbaren Projekte des Kunden (Cockpit)
  services/task-schemas.ts
  services/tasks-mapper-service.ts

apps/workspace/src/app/api/workspace/crm/
  projects/[projectId]/tasks/route.ts      GET tasks.read · POST tasks.write
  tasks/[id]/route.ts                      PATCH tasks.write
  tasks/[id]/status/route.ts               PATCH tasks.write
```

Muster 1:1 von den Projektleistungen übernehmen:

- Lesen: `list-project-line-items.query-handler.ts` — Sichtbarkeit über
  `crmAccessCondition.forScope(accessScope(actor, Permission.TasksRead), …)` im `WHERE` des Projekt-Lookups;
  `null` = Projekt nicht erreichbar, `[]` = lesbar, aber leer. `list-project-line-items-by-customer.query-handler.ts`
  für die Kundenvariante.
- Schreiben: `update-project-line-item.command-handler.ts` — Zielzeile mit Projekt-Join laden, `canOn(actor,
Permission.TasksWrite, { customerId, projectId })`, sonst `TaskNotFound`; dann `updateVersioned`.
- Routen: `project-line-items/[id]/route.ts` samt nicht exportierter Message-Map
  (`lib/workspace/crm/task-api-error.ts`).

Sortierung (Projekt und Kunde gleich): offene (`open`, `in_progress`) vor abgeschlossenen; darin überfällige zuerst,
dann `due_on` aufsteigend, ohne Datum zuletzt, dann `created_at`. Abgeschlossene nach `updated_at` absteigend.

## Weitere Dateien

```txt
apps/workspace/src/common/constants/api-endpoints.ts (+ Test)      CrmTasks
apps/workspace/src/common/patterns/crm/crm-api-endpoints.ts        crmProjectTasksEndpoint, crmTaskEndpoint, crmTaskStatusEndpoint
apps/workspace/src/common/constants/auth/crm-endpoint-access-rules.ts
apps/workspace/src/common/constants/crm/crm-operations.ts (+ Test)
apps/workspace/src/app/api/workspace/crm/README.md                 Abschnitt „Aufgaben“
apps/workspace/src/lib/workspace/crm/task-due-state-service.ts (+ Test)  overdue | due_soon | none aus dueOn, status, heute (Europe/Berlin)
```

`task-due-state-service.ts` ist die einzige Definition von „überfällig“/„bald fällig“ und wird von Cockpit, Tabelle und
Dashboard genutzt; die SQL-Filter in Task 11a-1 spiegeln sie und werden gegen dieselben Fälle getestet.

## Tickets

### CRM-11-2-T1 — Contracts, Schemas, Mapper

- **Akzeptanz:** Mapper-Test (alle Felder, `null`-Felder, Datum als `YYYY-MM-DD`); Schema-Tests für
  Kundenseite + unsichtbar, leeren Titel, zu lange Felder, ungültiges Datum.

### CRM-11-2-T2 — Command- und Query-Handler

- **Akzeptanz (Unit + Integration gegen DB):**
  - Anlage ohne Bearbeiter setzt den Projekt-Owner; mit inaktivem Mitglied → `AssigneeNotActive`.
  - `done` setzt Abschlussdaten, Wiederöffnen löscht sie; beide erzeugen eine Activity.
  - Veraltete `version` → `VersionConflict` mit aktuellem Stand.
  - Kundenbindung sieht Aufgaben aller Projekte des Kunden; Projektbindung nur die des Projekts; fremdes Projekt und
    fremder Kunde liefern `null` bzw. `TaskNotFound`.
  - Sortierung wie festgelegt.

### CRM-11-2-T3 — Routen und Endpunkt-Regeln

- **Akzeptanz:** Routentests für 401/403/404/409/422/200/201; jeder Endpunkt in `CRM_ENDPOINT_ACCESS_RULES` (der
  bestehende Vollständigkeitstest schlägt sonst fehl); README beschreibt Bodies und Fehlercodes.

## Deploy-Sicherheit

1. **Live sichtbar:** nichts.
2. **Bricht nichts:** neue Endpunkte ohne Aufrufer; bestehende Handler unverändert.
3. **Offen:** UI ab Task 11-3.

## Akzeptanz

`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/workspace build` und `db:smoke:crm` grün
(neuer Integrationstest `tasks.integration.test.ts` in das Script `db:smoke:crm` aufgenommen).
