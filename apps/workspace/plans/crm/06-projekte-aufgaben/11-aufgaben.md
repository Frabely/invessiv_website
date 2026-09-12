# Task 11 — Aufgaben

> **Branch:** `feat/crm-aufgaben`
> **Aufwand:** M (rund ein Tag)
> **Abhängigkeiten:** Task 10 (Projekte), Task 05 (Slot)
> **Migration:** `0027_create_tasks.sql` (Planwert)

## Context

Aufgaben sind die Grundlage für zwei Dinge gleichzeitig: die eigene To-do-Liste je Kunde und die
Checkliste „Von dir benötigt" im Kundendashboard. Beides ist **eine** Tabelle mit zwei Flags — so
landet ein Haken des Kunden direkt in der eigenen Liste, statt in einem zweiten System.

Die Sichtbarkeitsprüfung ist sicherheitsrelevant: interne Notizen dürfen nie im Portal auftauchen.
Deshalb filtert nicht die Oberfläche, sondern der Query-Handler — die Portal-Abfrage kann gar keine
internen Aufgaben zurückgeben.

## Entscheidungen

| Bereich              | Entscheidung                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eine Tabelle         | Interne To-dos und Kunden-Bringschuld sind dieselbe Entität mit zwei Flags                                                                                                |
| Verantwortlich       | `responsible_side`: `internal` oder `customer`                                                                                                                            |
| Sichtbarkeit         | `visible_to_customer` boolean, **unabhängig** von der Verantwortung — eine interne Aufgabe kann sichtbar sein („Wir bauen die Startseite"), eine Kundenaufgabe unsichtbar |
| Voreinstellung       | `responsible_side = customer` setzt `visible_to_customer` automatisch auf true (im UI vorbelegt, im Handler nicht erzwungen)                                              |
| Zuordnung            | Entweder an einen Kunden oder an ein Projekt. `project_id` nullable, `customer_id` immer gesetzt                                                                          |
| Sicherheitsregel     | Portal-Query filtert in der `WHERE`-Klausel, nicht im Rendering                                                                                                           |
| Erledigt             | `done_at` als Zeitstempel, nicht als Boolean — so ist erkennbar, wann abgehakt wurde                                                                                      |
| Wer hakt ab          | `done_by_side` (`internal`/`customer`) wird mitgeschrieben                                                                                                                |
| Sortierung           | Offene zuerst nach Fälligkeit, dann Erledigte nach Abhakzeitpunkt absteigend                                                                                              |
| Keine Handsortierung | **Kein** `sort_order`. Es gäbe dafür weder Endpunkt noch Bedienung — eine Spalte, die nichts tut, ist teurer zu entfernen als später additiv zu ergänzen                  |
| Übersetzbarer Titel  | `title_key` bleibt `NULL` bei handgetippten Aufgaben und wird nur von Vorlagen gesetzt (Task 12)                                                                          |

## Contract

```ts
// packages/common/src/constants/crm/responsible-sides.ts
export const ResponsibleSide = {
  Internal: "internal",
  Customer: "customer",
} as const;
```

```ts
// packages/common/src/contracts/crm/task.dto.ts
export interface CrmTaskDto {
  id: string;
  customerId: string;
  projectId: string | null;
  title: string;
  description: string | null;
  responsibleSide: ResponsibleSide;
  visibleToCustomer: boolean;
  dueOn: string | null;
  doneAt: string | null;
  doneBySide: ResponsibleSide | null;
  /** gesetzt, wenn die Aufgabe aus einer Vorlage stammt (Task 12) — dann übersetzbar */
  titleKey: string | null;
}
```

## Tabelle

```txt
tasks
  id uuid PK
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  project_id  uuid NULL     → projects.id  ON DELETE CASCADE
  title text NOT NULL
  title_key text NULL                                 nur bei Vorlagen-Aufgaben (Task 12)
  description text NULL
  responsible_side text NOT NULL DEFAULT 'internal'  CHECK in RESPONSIBLE_SIDE_VALUES
  visible_to_customer boolean NOT NULL DEFAULT false
  due_on date NULL
  done_at timestamptz NULL
  done_by_side text NULL                              CHECK in RESPONSIBLE_SIDE_VALUES
  created_at / updated_at
  INDEX (customer_id, done_at, due_on)
  INDEX (project_id) WHERE project_id IS NOT NULL
  INDEX (customer_id) WHERE visible_to_customer AND done_at IS NULL
```

Der letzte Index bedient genau die Dashboard-Abfrage „offene Bringschuld dieses Kunden".

## Verzeichnisstruktur

```txt
packages/db/migrations/0027_create_tasks.sql
packages/db/src/record-configuration/crm/tasks.ts
packages/common/src/constants/crm/responsible-sides.ts
packages/common/src/contracts/crm/task.dto.ts

apps/workspace/src/app/api/workspace/crm/customers/[id]/tasks/route.ts
apps/workspace/src/app/api/workspace/crm/tasks/[taskId]/route.ts
apps/workspace/src/app/api/workspace/crm/tasks/[taskId]/done/route.ts

apps/workspace/src/server/workspace/crm/
  query-handler/list-tasks.query-handler.ts
  command-handler/{create,update,delete,toggle}-task.command-handler.ts
  services/task.schema.ts

apps/workspace/src/components/workspace/crm/tasks/
  customer-tasks-section/
  task-list/
  task-row/
  task-form-dialog/
apps/workspace/src/i18n/dictionaries/workspace/crm/tasks/{de,en}.json
```

## Tickets

### CRM-11-T1 — Migration, Modell, Konstanten

- **Files:** `0027_create_tasks.sql`, `record-configuration/crm/tasks.ts`,
  `constants/crm/responsible-sides.ts` + Test, `contracts/crm/task.dto.ts`
- **Skills:** `best-practices`
- **Inhalt:** Tabelle wie oben inklusive der drei Indizes
- **Akzeptanz:** Migration idempotent; der partielle Index existiert und wird vom Abfrageplan der
  Dashboard-Abfrage genutzt (mit `EXPLAIN` nachgewiesen)

### CRM-11-T2 — Handler mit Sichtbarkeitsgrenze

- **Files:** `query-handler/list-tasks.query-handler.ts`, vier Command-Handler,
  `services/task.schema.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - `listTasks({ customerId, projectId?, scope: "internal" | "customer" })`
  - Bei `scope: "customer"` erzwingt der Handler `visible_to_customer = true` **in der Abfrage**;
    der Parameter ist nicht überschreibbar
  - `toggleTask` setzt `done_at` und `done_by_side`; erneutes Umschalten setzt beides zurück
- **Akzeptanz:**
  - Test: eine unsichtbare Aufgabe taucht bei `scope: "customer"` unter keinen Umständen auf
  - Test: Abhaken und Rückgängigmachen hinterlässt konsistente Werte
  - Sortierung wie festgelegt

### CRM-11-T3 — Routen

- **Files:** drei Routen + Tests, `api-endpoints.ts`, README
- **Skills:** `best-practices`
- **Inhalt:** `withPermission(Permission.TasksWrite)`; Zugehörigkeit der Aufgabe zum Kunden wird
  serverseitig geprüft
- **Akzeptanz:** Tests für 401/404/403/201/204/422

### CRM-11-T4 — Sektion und Bedienung

- **Files:** `components/workspace/crm/tasks/**`, `dictionaries/workspace/crm/tasks/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Aufgabenliste mit Checkbox, Titel, Fälligkeit, Verantwortungs-Badge und Sichtbarkeits-Symbol
  - Umschalter „Erledigte anzeigen"; überfällige Aufgaben hervorgehoben (Symbol plus Text)
  - Schnelleingabe: Titel eintippen und mit Enter anlegen, Details optional im Dialog
  - Im Projektkontext gefiltert auf das Projekt, im Kundenkontext alle
  - Sichtbarkeits-Symbol mit klarer Beschriftung „Für den Kunden sichtbar"
- **Akzeptanz:**
  - Checkbox per Tastatur bedienbar, Zustandswechsel über Live-Region angekündigt
  - Abhaken aktualisiert die Liste ohne vollständiges Neuladen der Seite (`router.refresh()`)
  - Kein Zweifel, welche Aufgabe der Kunde sieht — das Symbol ist beschriftet, nicht nur ein Icon

## Deploy-Sicherheit

1. **Live sichtbar:** neue Sektion „Aufgaben" im Kundendetail und in der Projektkarte.
2. **Bricht nichts:** eine neue Tabelle, sonst nichts angefasst. Das Flag `visible_to_customer`
   hat noch keine Wirkung nach außen — das Portal existiert erst ab Task 20.
3. **Offen:** Die Kundensicht auf diese Aufgaben (Task 21). Weil die Filterung im Query-Handler
   sitzt und dort getestet ist, kann das Portal sie später nicht versehentlich umgehen.

## End-to-End-Akzeptanz

1. Aufgaben lassen sich am Kunden und am Projekt anlegen, bearbeiten, abhaken und löschen.
2. Verantwortung und Sichtbarkeit sind getrennt einstellbar und klar beschriftet.
3. `scope: "customer"` liefert nachweislich nur sichtbare Aufgaben.
4. Überfällige Aufgaben sind ohne Farbwahrnehmung erkennbar.
5. Schnelleingabe per Enter funktioniert.
6. Alle Texte in DE und EN.
7. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
