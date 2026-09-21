# Task 11-1 — Datenmodell und Rechte

> **Merge-Einheit:** Ordner 08 · **Branch:** `feat/crm-aufgaben`
> **Aufwand:** S · **Abhängigkeiten:** Ordner 07 (Projekte), 07a–07c (Zugriffsbereiche)
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)

## Ziel

Die Tabelle `tasks`, ihre Konstanten und die Permissions `tasks.read`/`tasks.write` existieren. Kein Handler und keine
UI nutzt sie; der Task ist ein unsichtbares Fundament und einzeln mergebar.

## Konstanten

```ts
// packages/common/src/constants/crm/task-statuses.ts
export const TaskStatus = {
  Open: "open",
  InProgress: "in_progress",
  Done: "done",
  Cancelled: "cancelled",
} as const;
export const TASK_STATUS_VALUES = [...] as const;
/** Statuses that still demand action; the only ones that can be overdue. */
export const OPEN_TASK_STATUS_VALUES = [TaskStatus.Open, TaskStatus.InProgress] as const;

// packages/common/src/constants/crm/task-action-sides.ts
export const TaskActionSide = {
  Internal: "internal",
  Customer: "customer",
} as const;
export const TASK_ACTION_SIDE_VALUES = [...] as const;
```

Const-Objekt plus abgeleiteter Type, kein `enum`; je Datei ein Test, der die `_VALUES` gegen das Objekt prüft.

## Tabelle

```txt
tasks
  id uuid PK
  project_id uuid NOT NULL → projects.id ON DELETE CASCADE
  title text NOT NULL                              CHECK (btrim(title) <> '')
  description text NOT NULL                        leerer String statt NULL
  status text NOT NULL                             CHECK in TASK_STATUS_VALUES
  action_side text NOT NULL                        CHECK in TASK_ACTION_SIDE_VALUES
  visible_to_customer boolean NOT NULL
  assignee_member_id uuid NOT NULL → workspace_members.id
  due_on date NULL
  completed_at timestamptz NULL
  completed_by_member_id uuid NULL → workspace_members.id
  version integer NOT NULL                         CHECK (version > 0)
  created_at / updated_at timestamptz NOT NULL DEFAULT now()

  CHECK (action_side <> 'customer' OR visible_to_customer)
  CHECK ((status = 'done') = (completed_at IS NOT NULL AND completed_by_member_id IS NOT NULL))
  INDEX (project_id, status, due_on)                             Cockpit je Projekt
  INDEX (assignee_member_id, due_on) WHERE status IN ('open', 'in_progress')   „meine“, Dashboard, Übergabe
```

- Keine DB-Defaults außer den Timestamps (`packages/db/AGENTS.md`, „DB-Defaults“); Handler setzen jedes Feld.
- Keine Kundenspalte: Zugriff und Anzeige laufen über den Join auf `projects` (Regel wie
  `apps/workspace/src/server/workspace/crm/AGENTS.md`, „Eine Projektleistung gehört zu genau einem Projekt“).
- Kein `ON DELETE` auf den Mitglieder-FKs: Mitglieder werden deaktiviert, nicht gelöscht.
- Der Abschluss-CHECK verlangt heute ein Mitglied. Ordner 13 (Kunde hakt im Portal ab) ergänzt additiv eine
  Portal-Herkunft und **erweitert** den CHECK auf „Mitglied oder Portal-Nutzer“ — erlaubt, weil CHECKs nur erweitert
  werden. Deshalb hier kein vorgezogenes Portal-Feld.
- CHECKs für String-Unions über `sqlCheckIn` mit den `_VALUES` (Modell), in der SQL-Migration als Literal.

## Permissions

| Key           | Realm       | Bindbar | Beschreibung (Katalog, Englisch)             |
| ------------- | ----------- | ------- | -------------------------------------------- |
| `tasks.read`  | `workspace` | ja      | View the tasks of a project.                 |
| `tasks.write` | `workspace` | ja      | Create, edit and change the status of tasks. |

Die Migration legt beide an und vergibt sie an die beiden Systemrollen — Muster: letzter Block von
`packages/db/migrations/0035_create_project_line_items.sql`.

## Dateien

```txt
packages/common/src/constants/crm/task-statuses.ts (+ .test.ts)
packages/common/src/constants/crm/task-action-sides.ts (+ .test.ts)
packages/common/src/constants/auth/permissions.ts                 TasksRead, TasksWrite (+ Test)
packages/common/src/constants/auth/permission-definitions.ts      beide Einträge, scopeAssignable
packages/common/src/constants/auth/system-role-definitions.ts     Systemrollen erhalten beide
packages/db/migrations/<nr>_create_tasks.sql
packages/db/src/record-configuration/crm/tasks.ts (+ Barrel index.ts)
packages/db/src/constraint-names/crm/tasks-constraint-names.ts (+ constraint-names.test.ts)
packages/db/scripts/smoke-crm-constraints.ts                       neuer Abschnitt tasks
apps/workspace/src/common/constants/access/permission-groups.ts    Gruppe „Aufgaben“
apps/workspace/src/i18n/dictionaries/workspace/settings/permissions/{de,en}.json
```

## Tickets

### CRM-11-1-T1 — Konstanten und Permissions

- **Inhalt:** beide Const-Objekte mit Tests; `Permission.TasksRead/TasksWrite`, Definitionen, Systemrollen,
  Permission-Gruppe, Labels DE/EN („Aufgaben ansehen“, „Aufgaben bearbeiten“).
- **Akzeptanz:** `permissions.test.ts` und die Tests zu Gruppen/Definitionen decken die neuen Keys ab; kein
  String-Literal außerhalb der Const-Objekte.

### CRM-11-1-T2 — Migration, Modell, Constraint-Namen

- **Inhalt:** Tabelle, CHECKs, Indizes und Permission-Inserts wie oben; Modell 1:1 deckungsgleich mit der Migration.
- **Akzeptanz:**
  - Migration idempotent (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `--> statement-breakpoint`), zweiter Lauf
    folgenlos.
  - Jeder Constraint- und Indexname steht genau einmal im Const-Objekt; `db:smoke` findet alle in der DB.
  - `db:smoke` (RBAC-Katalogvergleich) ist grün mit den neuen Permissions.

### CRM-11-1-T3 — Constraint-Smoke

- **Inhalt:** Abschnitt in `smoke-crm-constraints.ts` nach Muster `runMissingDefaultChecks`.
- **Akzeptanz:** abgewiesen werden: fehlender Titel/Status/Seite/Sichtbarkeit/Bearbeiter, leerer Titel, unbekannter
  Status, Kundenaufgabe mit `visible_to_customer = false`, `done` ohne `completed_at`, `completed_at` bei `open`;
  angenommen: gültige offene, gültige erledigte Aufgabe. Fixture-Zeilen werden in `finally` aufgeräumt.

### CRM-11-1-T4 — Seed

- **Inhalt:** `db:seed:crm` (`packages/db/scripts/seed-crm-fixture.ts`) legt je Beispielprojekt realistische
  Aufgaben an: alle vier Status, beide Seiten, sichtbar/unsichtbar, überfällig, bald fällig, ohne Datum.
- **Akzeptanz:** Seed ist wiederholbar und bleibt optional; ohne Seed sind die Empty-States prüfbar.

## Deploy-Sicherheit

1. **Live sichtbar:** nur zwei neue Permissions in der Rollenverwaltung (Gruppe „Aufgaben“).
2. **Bricht nichts:** eine neue Tabelle, keine Leser, keine Schreiber.
3. **Offen:** alles Weitere ab Task 11-2.

## Akzeptanz

1. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/workspace build` grün.
2. `db:migrate:development`, `db:smoke`, `db:smoke:crm` grün.
