# Task 27 — Kontingent und Zuweisung

> **Merge-Einheit:** Ordner 20, PR 20.1 · **Branch:** `feat/crm-stunden-1-kontingent`
> **Aufwand:** L · **Abhängigkeiten:** keine offenen (Kunden, Projekte, Aufgaben, Zugriffsbereiche sind im Code)
> **Migration:** eine; Nummer im Repository ermitteln (höchste bestehende plus eins, am 08.10.2026 wäre das `0056`)
> **Zuerst lesen:** [README](./README.md), `packages/db/AGENTS.md`, `packages/common/AGENTS.md`,
> `apps/workspace/src/server/workspace/crm/AGENTS.md`, `apps/workspace/src/components/workspace/crm/AGENTS.md`

- Ein Mitarbeiter mit `hours.manage` schreibt dem Kunden Stunden gut und korrigiert sie.
- Er weist freie Stunden einem Projekt zu und gibt nicht verbrauchte wieder frei.
- Das Cockpit zeigt Gekauft, Zugewiesen, Frei, Verbraucht und Rest — je Kunde und je Projekt.
- Zeitbuchungen selbst kommen erst mit Task 72; ihre Tabelle entsteht hier schon.

## Context

Der frühere Plan führte ein Kontingent mit Zeitraum am Kunden (`retainers`). Der Owner will stattdessen einen
Stundenbestand am Kunden, der sich auf Projekte verteilen lässt: Zugewiesene Stunden sind geblockt, und ein Projekt,
das mehr verbraucht als zugewiesen, darf sich nie still aus einem anderen bedienen. Begriffe, Rechenbeispiel und
Datenmodell stehen in der [README](./README.md) und werden hier nicht wiederholt.

**Vorlage ist das Modul Projektleistungen** (kleinster vollständiger Schnitt von Migration bis UI):
`packages/db/migrations/0035_create_project_line_items.sql`,
`apps/workspace/src/server/workspace/crm/command-handler/create-project-line-item.command-handler.ts`,
`apps/workspace/src/app/api/workspace/crm/projects/[projectId]/line-items/route.ts`,
`apps/workspace/src/lib/workspace/crm/project-line-item-api-error.ts`,
`apps/workspace/src/client/crm/project-line-items-api-service.ts`,
`apps/workspace/src/lib/workspace/crm/project-line-items-view-model.ts`,
`apps/workspace/src/components/workspace/crm/projects/project-line-items-section/`.
Für die Sperre und den Kunden-Scope zusätzlich das Zugangsdaten-Modul
(`apps/workspace/src/server/workspace/crm/services/credentials/credential-access-service.ts`).

## Entscheidungen

| Bereich       | Entscheidung                                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Eingabe       | Stunden werden als `h:mm` oder Dezimalstunden getippt (`1:30`, `1,5`, `1.5`) und im Client zu Minuten geparst. Über die API gehen ausschließlich ganze Minuten           |
| Vorzeichen    | Die API nimmt das Vorzeichen in `minutes`: Kauf positiv, Korrektur negativ; Zuweisen positiv, Freigeben negativ. Der Dialog wählt die Richtung, nie der Nutzer per Minus |
| Kaufdatum     | Pflicht, vorbelegt mit heute (`taskDueStateService.businessToday()`), nicht in der Zukunft                                                                               |
| Notiz am Kauf | Kundensichtbar (z. B. „Betreuungspaket 10 h“). Das Formular kennzeichnet das Feld so. Die Notiz an einer Zuweisung ist intern                                            |
| Projektstatus | Zuweisen nur an Projekte, die nicht `cancelled` oder `archived` sind (`PROJECT_CLOSED`). Freigeben geht immer                                                            |
| Lesen         | Die Sektion bekommt ihre Daten als View-Model von der Page (wie Projektleistungen), nicht über einen eigenen GET-Endpunkt. Nach jedem Schreiben `router.refresh()`       |
| Historie      | Die Sektion zeigt die letzten 20 Kaufbuchungen und die letzten 20 Zuweisungen. Ältere Zeilen zählen weiter in die Summen; eine Paginierung kommt bei Bedarf              |
| Activity      | Jede Kaufbuchung und jede Zuweisung schreibt in derselben Transaktion eine `created`-Activity mit Ids und Minuten, nie mit der Notiz                                     |
| Kennzahl      | Der Mock-Chip „Stunden übrig“ im Cockpit-Kopf wird echt und zeigt den Kundenrest                                                                                         |

## CRM-27-T1 — Migration, Modelle, Konstanten, Patterns

```txt
packages/common/src/constants/crm/hour-purchase-kinds.ts        HourPurchaseKind { Purchase: "purchase", Correction: "correction" }
                                                                + HOUR_PURCHASE_KIND_VALUES
packages/common/src/constants/crm/hour-purchase-sources.ts      HourPurchaseSource { Manual: "manual" } + HOUR_PURCHASE_SOURCE_VALUES
packages/common/src/constants/crm/hours-limits.ts               HoursLimits { StepMinutes: 15, MaxEntryMinutes: 600000,
                                                                  MaxLedgerMinutes: 600000, NoteMaxLength: 200,
                                                                  DescriptionMaxLength: 500, HistoryPreviewSize: 20 }
packages/common/src/constants/crm/errors/hours-error-codes.ts   HoursErrorCode (siehe T3) + HOURS_ERROR_CODE_VALUES
packages/common/src/constants/crm/hours-constants.test.ts       toEqual + Duplikat-Check je Gruppe

packages/common/src/patterns/time/format-duration.ts            formatDuration(minutes: number): string
packages/common/src/patterns/crm/hours/parse-duration.ts        parseDuration(input: string): number | null
packages/common/src/patterns/crm/hours/hours-balance.ts         computeCustomerHoursBalance, computeProjectHoursBalance
packages/common/src/patterns/crm/hours/*.test.ts                je Pattern ein Test

packages/db/migrations/<nr>_create_hours.sql
packages/db/src/constraint-names/crm/customer-hour-purchases-constraint-names.ts   (+ .test.ts)
packages/db/src/constraint-names/crm/project-hour-allocations-constraint-names.ts  (+ .test.ts)
packages/db/src/constraint-names/crm/project-time-entries-constraint-names.ts      (+ .test.ts)
packages/db/src/constraint-names/crm/tasks-constraint-names.ts                     + IdProjectUnique "tasks_id_project_uidx"
packages/db/src/record-configuration/crm/customer-hour-purchases.ts                export customerHourPurchases
packages/db/src/record-configuration/crm/project-hour-allocations.ts               export projectHourAllocations
packages/db/src/record-configuration/crm/project-time-entries.ts                   export projectTimeEntries
packages/db/src/record-configuration/crm/tasks.ts                                  + unique(N.IdProjectUnique).on(t.id, t.project_id)
packages/db/src/record-configuration/crm/index.ts                                  + drei Re-Exports
packages/db/src/record-configuration/crm/AGENTS.md                                 + Abschnitt „Stunden (Ordner 20)“
```

**Patterns (rein, ohne Seiteneffekte):**

```ts
/** 90 → "1:30", 0 → "0:00", -60 → "−1:00" (U+2212), 600 → "10:00". Rejects non-integers with RangeError. */
formatDuration(minutes: number): string

/**
 * Accepts "1:30", "1,5", "1.5", "2", "0:15", surrounding whitespace. Returns whole minutes, or null when the
 * text is not a duration, is negative, or is not a multiple of HoursLimits.StepMinutes. Never rounds.
 */
parseDuration(input: string): number | null

computeCustomerHoursBalance(sums: { purchasedMinutes: number; allocatedMinutes: number; usedMinutes: number;
  goodwillMinutes: number }): CustomerHoursBalanceDto
  // freeMinutes = purchased − allocated; remainingMinutes = purchased − used

computeProjectHoursBalance(sums: { projectId: string; allocatedMinutes: number; usedMinutes: number;
  goodwillMinutes: number }): ProjectHoursBalanceDto
  // remainingMinutes = allocated − used; releasableMinutes = max(0, remaining)
```

**Migration** (Aufbau und Formatierung wie `0035_create_project_line_items.sql`; `CREATE … IF NOT EXISTS`,
`--> statement-breakpoint` zwischen den Statements):

1. `CREATE UNIQUE INDEX IF NOT EXISTS tasks_id_project_uidx ON tasks (id, project_id);`
2. `CREATE TABLE IF NOT EXISTS customer_hour_purchases (…)` exakt nach README.
3. `CREATE TABLE IF NOT EXISTS project_hour_allocations (…)`.
4. `CREATE TABLE IF NOT EXISTS project_time_entries (…)`.
5. Die Indizes aus der README.
6. Permissions (Spaltenliste wie in `0035`):

```sql
INSERT INTO permissions (key, realm, delegable, scope_assignable, description)
VALUES ('hours.read', 'workspace', TRUE, TRUE, 'View hour balances, purchases, allocations and time entries.'),
       ('hours.write', 'workspace', TRUE, TRUE, 'Book, change and delete time entries.'),
       ('hours.manage', 'workspace', TRUE, TRUE, 'Record purchased hours and allocate them to projects.')
ON CONFLICT (key) DO NOTHING;
```

7. Rollen: `hours.read`, `hours.write`, `hours.manage` an den Owner (`7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a01`),
   `hours.read` und `hours.write` an das Mitglied (`…7a02`) — zwei `INSERT INTO role_permissions … SELECT`-Blöcke
   nach dem Muster in `0035`, je mit `ON CONFLICT (role_id, permission_key) DO NOTHING`.

Constraint-Namen: `<tabelle>_<zweck>_check|_fkey|_idx|_key`, je Tabelle ein Const-Objekt (Vorlage
`packages/db/src/constraint-names/crm/files-constraint-names.ts`). CHECKs über String-Unions mit `sqlCheckIn`.

- **Akzeptanz:**
  - `formatDuration`: 0, 15, 59 (wirft nicht, ergibt `0:59`), 60, 90, 600, −60, 1.5 (RangeError)
  - `parseDuration`: `1:30`, `1,5`, `1.5` → 90; `0:15` → 15; `2` → 120; `0:10`, `0,1`, `abc`, `-1`, leer → `null`
  - `computeProjectHoursBalance`: Rest negativ → `releasableMinutes` 0
  - Rechenbeispiel der README als Unit-Test über beide Balance-Funktionen
  - Migration läuft zweimal folgenlos; `pnpm --filter @invessiv/db db:smoke` kennt die drei Tabellen

## CRM-27-T2 — Permission-Katalog

```txt
packages/common/src/constants/auth/permissions.ts               + HoursRead "hours.read", HoursWrite "hours.write",
                                                                  HoursManage "hours.manage" (Objekt und PERMISSION_VALUES,
                                                                  hinter den Credentials-Einträgen)
packages/common/src/constants/auth/permission-definitions.ts    + drei Einträge: realm Workspace, delegable true;
                                                                  read/write CUSTOMER_AND_PROJECT, manage CUSTOMER_ONLY;
                                                                  description wortgleich zur Migration
packages/common/src/constants/auth/system-role-definitions.ts   WorkspaceMember + HoursRead, HoursWrite (Owner ist abgeleitet)
packages/common/src/constants/auth/permissions.test.ts          angepasst
packages/common/src/constants/auth/system-role-definitions.test.ts   Member hat read + write, nicht manage
apps/workspace/src/common/constants/access/permission-groups.ts + die drei Permissions in PermissionGroup.Projects
apps/workspace/src/i18n/dictionaries/workspace/settings/permissions/{de,en}.json
                                                                + permissions["hours.read"|"hours.write"|"hours.manage"].{label,description}
```

- **Akzeptanz:** `pnpm --filter @invessiv/db db:smoke:rbac` grün; die drei Rechte erscheinen im Rolleneditor in der
  Gruppe „Projekte“ und sind an Kunde bzw. Kunde/Projekt bindbar (`hours.manage` nur an Kunde).

## CRM-27-T3 — Contracts und Server

```txt
packages/common/src/contracts/crm/hours/hour-purchase.dto.ts               HourPurchaseDto
packages/common/src/contracts/crm/hours/hour-allocation.dto.ts             HourAllocationDto
packages/common/src/contracts/crm/hours/customer-hours-balance.dto.ts      CustomerHoursBalanceDto
packages/common/src/contracts/crm/hours/project-hours-balance.dto.ts       ProjectHoursBalanceDto
packages/common/src/contracts/crm/hours/customer-hours.dto.ts              CustomerHoursDto
packages/common/src/contracts/crm/hours/create-hour-purchase-request.dto.ts
packages/common/src/contracts/crm/hours/create-hour-allocation-request.dto.ts
packages/common/src/contracts/crm/results/create-hour-purchase-result.ts
packages/common/src/contracts/crm/results/create-hour-allocation-result.ts
packages/common/src/contracts/crm/rows/hours-sums-row.ts                   HoursSumsRow (snake_case)

apps/workspace/src/server/shared/services/hours/hours-balance-service.ts   hoursBalanceService
apps/workspace/src/server/workspace/crm/services/hours/hours-ledger-service.ts      hoursLedgerService
apps/workspace/src/server/workspace/crm/services/hours/hours-mapping-service.ts     hoursMappingService
apps/workspace/src/server/workspace/crm/services/hours/hours-schemas.ts             hoursSchemas
apps/workspace/src/server/workspace/crm/services/hours/hours-activity-service.ts    hoursActivityService
apps/workspace/src/common/constants/crm/hours-activity-metadata.ts                  HOUR_PURCHASE_ACTIVITY_ENTITY "hour_purchase",
                                                                                    HOUR_ALLOCATION_ACTIVITY_ENTITY "hour_allocation"
apps/workspace/src/server/workspace/crm/command-handler/create-hour-purchase.command-handler.ts
apps/workspace/src/server/workspace/crm/command-handler/create-hour-allocation.command-handler.ts
apps/workspace/src/server/workspace/crm/query-handler/get-customer-hours.query-handler.ts
apps/workspace/src/server/workspace/crm/AGENTS.md                                   + Abschnitt „Stunden (ab Task 27)“
apps/workspace/src/server/shared/AGENTS.md                                          + Abschnitt „Stunden (ab Task 27)“
```

**DTOs** (jedes Feld mit Docstring, Regel aus `packages/common/AGENTS.md`):

```ts
HourPurchaseDto   { id; kind: HourPurchaseKind; source: HourPurchaseSource; minutes: number; purchasedOn: string;
                    note: string; createdByMemberId: string; createdAt: string }
HourAllocationDto { id; projectId: string; minutes: number; note: string; createdByMemberId: string; createdAt: string }

CustomerHoursBalanceDto { purchasedMinutes; allocatedMinutes; freeMinutes; usedMinutes; goodwillMinutes; remainingMinutes }
ProjectHoursBalanceDto  { projectId; allocatedMinutes; usedMinutes; goodwillMinutes; remainingMinutes; releasableMinutes }

CustomerHoursDto {
  /** Null when the actor may read hours only in single projects: the customer-wide stock is then not shown. */
  balance: CustomerHoursBalanceDto | null;
  /** One entry per project the actor may read hours in, including projects without any allocation. */
  projects: ProjectHoursBalanceDto[];
  /** Newest first, capped at HoursLimits.HistoryPreviewSize. Empty without customer-wide read access. */
  purchases: HourPurchaseDto[];
  /** Newest first, capped; only allocations of readable projects. */
  allocations: HourAllocationDto[];
}

CreateHourPurchaseRequestDto   { idempotencyKey: string; kind: HourPurchaseKind; minutes: number; purchasedOn: string; note: string }
CreateHourAllocationRequestDto { idempotencyKey: string; projectId: string; minutes: number; note: string }

CreateHourPurchaseResult =
  | { ok: true; purchase: HourPurchaseDto; balance: CustomerHoursBalanceDto }
  | { ok: false; code: HoursErrorCode.ValidationError; errors: unknown }
  | { ok: false; code: HoursErrorCode.BelowAllocatedHours; balance: CustomerHoursBalanceDto }
  | { ok: false; code: HoursErrorCode.CustomerNotFound }

CreateHourAllocationResult =
  | { ok: true; allocation: HourAllocationDto; balance: CustomerHoursBalanceDto; project: ProjectHoursBalanceDto }
  | { ok: false; code: HoursErrorCode.ValidationError; errors: unknown }
  | { ok: false; code: InsufficientFreeHours | InsufficientReleasableHours;
      balance: CustomerHoursBalanceDto; project: ProjectHoursBalanceDto }
  | { ok: false; code: CustomerNotFound | ProjectNotFound | ProjectClosed }
```

**Fehlercodes** (`HoursErrorCode`, vollständig schon hier, damit Task 72 nichts umbenennt):

| Code                            | HTTP | Wann                                                                |
| ------------------------------- | ---- | ------------------------------------------------------------------- |
| `CUSTOMER_NOT_FOUND`            | 404  | Kunde unbekannt oder außerhalb des Zugriffsbereichs                 |
| `PROJECT_NOT_FOUND`             | 404  | Projekt unbekannt, fremd oder gehört nicht zu diesem Kunden         |
| `TIME_ENTRY_NOT_FOUND`          | 404  | Task 72                                                             |
| `PROJECT_CLOSED`                | 409  | Zuweisen (Task 72: Buchen) an ein `cancelled`/`archived` Projekt    |
| `INSUFFICIENT_FREE_HOURS`       | 409  | Zuweisung größer als „Frei“                                         |
| `INSUFFICIENT_RELEASABLE_HOURS` | 409  | Freigabe größer als „Freigebbar“                                    |
| `BELOW_ALLOCATED_HOURS`         | 409  | Korrektur würde Gekauft unter Zugewiesen drücken                    |
| `TASK_NOT_LINKABLE`             | 422  | Task 72                                                             |
| `VALIDATION_ERROR`              | 422  | Schemafehler, Datum in der Zukunft, Schlüssel gehört anderem Kunden |
| `INTERNAL`                      | 500  |                                                                     |

Die drei 409-Antworten tragen unter `details` die aktuellen Balances, damit der Dialog den wahren Stand zeigt.

**Services:**

```ts
// server/shared/services/hours/hours-balance-service.ts — reads only, takes ContactDatabaseReader.
// Lives under shared/ from the start because the portal (Task 73) reads the same sums.
hoursBalanceService.loadCustomerSums(reader, customerId): Promise<HoursSums>
  // three aggregate sub-selects in ONE statement: Σ purchases, Σ allocations,
  // Σ time entries split by billable (FILTER (WHERE billable) / FILTER (WHERE NOT billable))
hoursBalanceService.loadProjectSums(reader, customerId): Promise<ProjectHoursSums[]>
  // one row per project of the customer (LEFT JOIN on two grouped sub-selects), also projects with zero rows

// server/workspace/crm/services/hours/hours-ledger-service.ts — writes, always inside the caller's transaction.
hoursLedgerService.lockCustomer(tx, customerId): Promise<boolean>          // SELECT … FOR UPDATE, false when missing
hoursLedgerService.findPurchaseByKey(tx, idempotencyKey)                   // row or undefined
hoursLedgerService.findAllocationByKey(tx, idempotencyKey)
hoursLedgerService.insertPurchase(tx, input: { customerId; kind; source; minutes; purchasedOn; note;
                                               idempotencyKey; createdByMemberId }): Promise<row>
hoursLedgerService.insertAllocation(tx, input: { customerId; projectId; minutes; note;
                                                 idempotencyKey; createdByMemberId }): Promise<row>
```

`insertPurchase` nimmt `source` als Argument: Ordner 13c und 20c rufen später dieselbe Methode mit ihrem Wert auf.

**`createHourPurchase(customerId, input, actor)`** — Reihenfolge verbindlich:

1. `hoursSchemas.entityId` für `customerId`, sonst `CUSTOMER_NOT_FOUND`.
2. `hoursSchemas.createPurchase.safeParse(input)`: `minutes` ganzzahlig, ≠ 0, `% 15 === 0`, `|minutes| ≤ MaxLedgerMinutes`,
   Vorzeichen passt zu `kind`, `purchasedOn` ist ein Kalendertag ≤ `businessToday()`, `note` getrimmt ≤ 200,
   `idempotencyKey` uuid. Sonst `VALIDATION_ERROR`.
3. `canOn(actor, Permission.HoursManage, { customerId })`, sonst `CUSTOMER_NOT_FOUND`.
4. Transaktion: `lockCustomer` (false → `CUSTOMER_NOT_FOUND`).
5. `findPurchaseByKey`: gefunden und `customer_id` gleich → Erfolg mit der bestehenden Zeile und aktueller Balance,
   **ohne** zweite Activity; gefunden mit anderem Kunden → `VALIDATION_ERROR`.
6. Summen laden. Bei `minutes < 0`: `purchased + minutes < allocated` → `BELOW_ALLOCATED_HOURS` mit Balance.
7. `insertPurchase` mit `source: HourPurchaseSource.Manual`, `hoursActivityService.recordPurchase(tx, …)`.
8. Balance aus den Summen plus der neuen Zeile berechnen und zurückgeben.

**`createHourAllocation(customerId, input, actor)`**:

1. IDs und Schema prüfen wie oben (`minutes` ≠ 0, `% 15`, Grenze; `note` ≤ 200).
2. `canOn(actor, Permission.HoursManage, { customerId })`, sonst `CUSTOMER_NOT_FOUND`.
3. Transaktion: `lockCustomer`. Projekt laden mit `id = projectId AND customer_id = customerId`; fehlt es →
   `PROJECT_NOT_FOUND`.
4. `findAllocationByKey` wie bei der Kaufbuchung (gleicher Kunde **und** gleiches Projekt → Erfolg; sonst
   `VALIDATION_ERROR`).
5. `minutes > 0`: Projektstatus `cancelled`/`archived` → `PROJECT_CLOSED`; `minutes > freeMinutes` →
   `INSUFFICIENT_FREE_HOURS`.
6. `minutes < 0`: `-minutes > releasableMinutes` des Projekts → `INSUFFICIENT_RELEASABLE_HOURS`.
7. `insertAllocation`, `hoursActivityService.recordAllocation(tx, …)` (mit `projectId` an der Activity).
8. Beide Balances zurückgeben.

**`getCustomerHours(customerId, actor): Promise<CustomerHoursDto | null>`**:

- `null`, wenn der Actor `hours.read` weder am Kunden noch an einem seiner Projekte hat
  (`canAnywhere` reicht nicht; geprüft wird über `crmAccessCondition.forScope(accessScope(actor, Permission.HoursRead), …)`
  gegen die Projekte dieses Kunden, Muster `list-project-line-items-by-customer.query-handler.ts`).
- Mit Kundenrecht (`canOn(actor, HoursRead, { customerId })`): `balance`, alle Projekte, Kaufbuchungen, Zuweisungen.
- Nur mit Projektrechten: `balance: null`, `purchases: []`, nur die lesbaren Projekte und ihre Zuweisungen.
- Höchstens vier Statements (Summen Kunde, Summen Projekte, Kaufbuchungen, Zuweisungen); keine Abfrage je Projekt.

**Activity** (`hoursActivityService`, Muster `apps/workspace/src/server/shared/services/task-activity-service.ts`):
`ActivityType.Created`, `metadata: { entity, hour_purchase_id | hour_allocation_id, minutes, kind? }`. Kein neuer
Activity-Typ, keine Migration am Activity-CHECK. Die Notiz steht nie in der Activity.

- **Akzeptanz (Integrationstests, `describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")`,
  Datei `apps/workspace/src/server/tests/workspace/crm/hours/hours-ledger.integration.test.ts`):**
  - Rechenbeispiel Schritt 1, 2, 5
  - zwei parallele `createHourAllocation` über je 6:00 bei Frei 10:00: genau ein Erfolg, einmal `INSUFFICIENT_FREE_HOURS`
  - gleicher `idempotencyKey` zweimal → eine Zeile, eine Activity, zweimal `ok: true`
  - Freigabe von 3:00 bei Zugewiesen 5:00 ohne Buchungen gelingt; Freigabe von 6:00 → `INSUFFICIENT_RELEASABLE_HOURS`
  - Zuweisung an ein archiviertes Projekt → `PROJECT_CLOSED`; Freigabe dort gelingt
  - Projekt eines anderen Kunden im Request → `PROJECT_NOT_FOUND`
  - Actor ohne `hours.manage` → `CUSTOMER_NOT_FOUND`; Actor mit Projektbindung von `hours.read` bekommt
    `balance: null` und nur sein Projekt
  - `getCustomerHours` erzeugt bei 20 Projekten höchstens vier Statements
  - Mapping-Service-Test unter `…/tests/workspace/crm/services/hours-mapping-service.test.ts`

## CRM-27-T4 — Routen und Client

```txt
POST /api/workspace/crm/customers/[id]/hour-purchases      HourPurchaseCreate    hours.manage · scope customer
POST /api/workspace/crm/customers/[id]/hour-allocations    HourAllocationCreate  hours.manage · scope customer

apps/workspace/src/common/constants/auth/crm-endpoint-access-rules.ts        + zwei Regeln
apps/workspace/src/common/constants/crm/crm-operations.ts                    + CreateHourPurchase, CreateHourAllocation
apps/workspace/src/common/patterns/crm/crm-api-endpoints.ts                  + crmCustomerHourPurchasesEndpoint(customerId),
                                                                               crmCustomerHourAllocationsEndpoint(customerId)
apps/workspace/src/app/api/workspace/crm/customers/[id]/hour-purchases/route.ts
apps/workspace/src/app/api/workspace/crm/customers/[id]/hour-allocations/route.ts
apps/workspace/src/lib/workspace/crm/hours-api-error.ts                      hoursApiError(code, { details?, status? })
apps/workspace/src/client/crm/hours-api-service.ts                           hoursApiService.createPurchase, .createAllocation
apps/workspace/src/common/contracts/crm/hours/hours-client-results.ts        Client-Ergebnistypen (Muster project-line-item-client-results.ts)
apps/workspace/src/server/tests/workspace/crm/api/hours-routes.test.ts
```

Beide Routen folgen exakt `projects/[projectId]/line-items/route.ts` (POST-Zweig): `withCrmPermission`, Body über
`readJsonBody`, `try/catch` mit `logCrmFailure(CrmOperation.X, error)`, Erfolg `HttpResponseCode.Created` mit dem
Ergebnis ohne `ok`, Fehler über `hoursApiError`. Die drei 409-Codes reichen ihre Balances als `details` durch.
Die Zuweisung liegt bewusst unter dem **Kunden**-Pfad und trägt `projectId` im Body: `hours.manage` ist nur an Kunden
bindbar, und der Handler prüft `canOn` am Kunden.

- **Akzeptanz:** Routentest für 201, 403 (ohne Recht irgendwo), 404, 409 mit `details`, 422; der bestehende Test
  `crm-endpoint-access-rules.test.ts` bleibt grün (jede Route nutzt `withCrmPermission`, jede Regel einmal).

## CRM-27-T5 — Cockpit-Sektion „Stunden“

```txt
apps/workspace/src/common/contracts/crm/hours/hours-view-model.ts            HoursViewModel
apps/workspace/src/lib/workspace/crm/hours-view-model.ts                     buildHoursViewModel
apps/workspace/src/app/[locale]/(app)/crm/page.tsx                           + hours-View-Model und Dictionary durchreichen
apps/workspace/src/components/workspace/crm/detail/customer-cockpit-dialog/customer-cockpit-dialog.tsx   Props durchreichen
apps/workspace/src/components/workspace/crm/detail/customer-cockpit-view/customer-cockpit-view.tsx       Sektion + Kennzahl
apps/workspace/src/components/workspace/crm/hours/customer-hours-section/    Orchestrator
apps/workspace/src/components/workspace/crm/hours/hours-balance-summary/     Zahlenreihe + Balken
apps/workspace/src/components/workspace/crm/hours/hours-project-list/        Zeile je Projekt mit Aktionen
apps/workspace/src/components/workspace/crm/hours/hour-purchase-dialog/      Gutschreiben / Korrigieren
apps/workspace/src/components/workspace/crm/hours/hour-allocation-dialog/    Zuweisen / Freigeben
apps/workspace/src/components/workspace/crm/hours/hours-history-list/        Kaufbuchungen und Zuweisungen
apps/workspace/src/components/workspace/crm/hours/duration-field/            Adapter für DurationInput aus packages/ui
apps/workspace/src/common/patterns/crm/hours/hours-error-text.ts             hoursErrorText(code, content, balances)
apps/workspace/src/i18n/dictionaries/workspace/crm/hours/{de,en}.json
apps/workspace/src/i18n/dictionaries/workspace/crm/index.ts                  + getCrmHoursDictionary, CrmHoursDictionary
apps/workspace/src/i18n/dictionaries/workspace/crm/cockpit/{de,en}.json      futureSections.hours entfernen, kpis.hoursLeft bleibt
apps/workspace/src/components/workspace/crm/AGENTS.md                        + Abschnitt „Stunden (ab Task 27)“
```

Skills: `frontend-design` und `copywriting` (Pflicht laut Root-`AGENTS.md`), dazu `impeccable` für die Zahlenreihe.

```ts
HoursViewModel {
  hours: CustomerHoursDto;
  /** True only with hours.manage on the customer; drives every ledger action. */
  canManage: boolean;
  /** Titles for the project rows; only readable projects. */
  projects: { id: string; title: string; status: ProjectStatus }[];
  /** Business day (Europe/Berlin) for the date field default and its max. */
  today: string;
}
```

`buildHoursViewModel` liefert `undefined`, wenn `getCustomerHours` `null` liefert; die Sektion existiert dann nicht
(kein Platzhalter). Aufruf in `crm/page.tsx` neben den anderen `build…ViewModel`-Aufrufen im selben `Promise.all`.

**Einbau in `customer-cockpit-view.tsx`:**

- Neue Props `hours?: HoursViewModel` und `hoursContent?: CrmHoursDictionary`.
- Zeile 364 `{renderMock("hours")}` wird ersetzt durch
  `{hours && hoursContent ? <CustomerHoursSection … /> : null}` an derselben Stelle (Gruppe „Zusammenarbeit“,
  nach den Zugangsdaten). `renderMock`, `FutureCustomerSection` und `MockSectionCard`-Import entfallen, falls danach
  kein Aufrufer mehr bleibt (`futureSections` hat dann keinen Eintrag mehr — prüfen, ob das Dictionary-Feld ganz
  entfallen kann).
- Kennzahlen (Zeile 295): `content.kpis.hoursLeft` verlässt die Mock-Liste. Mit `hours?.hours.balance` erscheint ein
  echter Chip: Wert `formatDuration(balance.remainingMinutes)`, Notiz `hoursContent.kpi.free` mit
  `formatDuration(freeMinutes)`, bei negativem Rest `data-tone="attention"`. Ohne Kundenstand entfällt der Chip.
  `openFeedback` bleibt Mock.

**Sektion** (Kopf nach Cockpit-Regel: Titel · Rest · Primäraktion · Toggle über `shared/collapsible-section`):

- Kopf: „Stunden“ · `1:30 übrig` · „Stunden gutschreiben“ (nur `canManage` und mit Kundenstand).
- `hours-balance-summary`: fünf beschriftete Werte in `tabular-nums` — Gekauft, Zugewiesen, Frei, Verbraucht, Rest —
  und ein Balken (Verbraucht / Zugewiesen-unverbraucht / Frei). Der Balken ist dekorativ (`aria-hidden`); alle
  Aussagen stehen als Text daneben. Negativer Rest heißt „0:30 über dem Kontingent“, nie nur rot.
- `hours-project-list`: je lesbarem Projekt Titel, Zugewiesen, Verbraucht, Rest; überzogen als Text-Badge
  „überzogen um 1:00“. Mit `canManage`: „Zuweisen“ (nicht bei geschlossenen Projekten) und „Freigeben“ (nur wenn
  `releasableMinutes > 0`). Fehlende Rechte blenden aus, deaktivieren nicht.
- `hours-history-list`: zwei kurze Listen („Gutschriften“, „Zuweisungen“) mit Datum, Minuten mit Vorzeichen, Notiz.
- Empty-State mit Kundenstand und ohne Zeile: erklärt den Zweck („Hier steht, wie viele Stunden der Kunde gekauft
  hat und wie sie auf Projekte verteilt sind.“) und nennt mit `canManage` den ersten Schritt, ohne das Recht, wer
  Stunden gutschreiben kann.
- Unterdialoge liegen außerhalb des einklappbaren Körpers.

**Dialoge:**

- `hour-purchase-dialog`: Umschalter „Gutschrift“ / „Korrektur“ (Korrektur nur, wenn Gekauft > Zugewiesen), Dauer
  (`duration-field`), Datum (`max = today`), Notiz mit Hinweis „Für den Kunden sichtbar“. Bei Korrektur zeigt der
  Dialog die Obergrenze (`purchased − allocated`). `idempotencyKey` entsteht einmal beim Öffnen
  (`crypto.randomUUID()` in `useState`-Initialisierer) und bleibt über Wiederholungen gleich.
- `hour-allocation-dialog`: Projekt steht fest (aus der Zeile), Richtung steht fest (aus dem Knopf), Dauer, interne
  Notiz. Zeigt „Frei: 3:00“ bzw. „Freigebbar: 2:30“ und bietet „Alles“ als Abkürzung. Ein 409 übernimmt die Balances
  aus `details`, zeigt den Text aus `hoursErrorText` und behält die Eingabe.
- `duration-field`: App-spezifischer Adapter über `FormField` für das allgemeine `DurationInput` aus `packages/ui`.
  Stunden und Minuten werden getrennt per Tastatur, Buttons, Mausrad oder Touch bedient. Labels kommen aus dem
  Dictionary; `minuteStep` und `maxMinutes` sind Props. Die Dialoge validieren über `readDurationInput`; es gibt
  keine 24-Stunden-Grenze, sondern nur die technische Grenze aus `HoursLimits`.
- Beide Dialoge schreiben über `hoursApiService` und nach Erfolg `router.refresh()`. Vorlage für Aufbau und
  Fehleranzeige: `projects/project-line-item-form-dialog/` (Anlegen-Zweig). Es gibt keine Version und deshalb keinen
  Konfliktzweig.

- **Akzeptanz (jsdom-Tests je Komponente):**
  - ohne `hours`-Prop rendert das Cockpit weder Sektion noch Kennzahl noch Mock-Karte
  - ohne `canManage` fehlen alle drei Aktionen; mit Projektbindung fehlen Kundenstand und Gutschriften
  - `DurationInput`: unabhängige Stunden-/Minutenschritte und technische Grenze; `readDurationInput`: `1,5` → 90, `0:10` → Fehlertext
  - Dialog sendet bei „Freigeben“ negative Minuten und bei zwei Klicks denselben `idempotencyKey`
  - ein 409 zeigt die neuen Zahlen und lässt die Eingabe stehen
  - Texte DE und EN vollständig; keine Inline-Strings

## CRM-27-T6 — Seed und Smoke

```txt
packages/db/scripts/crm-fixture/seed-hours.ts          seedHours(tx, { memberId, projectsByCustomer })
packages/db/scripts/seed-crm-fixture.ts                Aufruf in run(); resetFixtureRows braucht keine Ergänzung
                                                       (alle drei Tabellen kaskadieren über Kunde bzw. Projekt)
packages/db/scripts/crm-smoke/hours-checks.ts          runHoursChecks(context), cleanupHoursFixtures(sql, pattern)
packages/db/scripts/smoke-crm-constraints.ts           Aufruf in runChecks, cleanup, runMissingDefaultChecks ergänzen
apps/workspace/package.json                            db:smoke:crm + src/server/tests/workspace/crm/hours
```

Seed (Vorlage `crm-fixture/seed-files.ts`, jedes Feld explizit): ein Kunde mit 10:00 Gutschrift, 5:00 + 3:00
zugewiesen, 2:00 frei; ein Kunde mit Gutschrift und Korrektur; ein Kunde ohne Stunden (Empty-State bleibt prüfbar).

Smoke (Vorlage `crm-smoke/credential-checks.ts`) prüft mindestens: `minutes` 0 und 20 abgelehnt; Kauf mit negativen
und Korrektur mit positiven Minuten abgelehnt; unbekannter `kind`/`source` abgelehnt; doppelter `idempotency_key`
abgelehnt; Zuweisung an ein Projekt eines anderen Kunden abgelehnt (zusammengesetzter FK); Zeitbuchung mit Aufgabe
eines anderen Projekts abgelehnt; `duration_minutes` 0, 20, 600015 abgelehnt; leere Beschreibung abgelehnt; fehlendes
`billable`, fehlende `version`, fehlende `note` abgelehnt (kein Default).

## Deploy-Sicherheit

1. **Live sichtbar:** Sektion „Stunden“ im Kundencockpit statt der Mock-Karte; Kennzahl „Stunden übrig“ echt.
2. **Bricht nichts:** drei neue Tabellen, ein zusätzlicher Unique-Index auf `tasks (id, project_id)` (`id` ist
   bereits eindeutig, der Index kann nie verletzt werden). Kein bestehender Handler ändert sich.
3. **Offen bis 20.2:** „Verbraucht“ ist überall 0:00, weil noch niemand Zeit buchen kann. Das ist ein wahrer Wert,
   kein Platzhalter.

## End-to-End-Akzeptanz

1. Owner schreibt einem Kunden 10:00 gut; Kopf und Kennzahl zeigen 10:00 übrig, 10:00 frei.
2. Er weist Projekt A 5:00 und Projekt B 5:00 zu; „Frei“ zeigt 0:00, „Zuweisen“ meldet bei einem weiteren Versuch,
   dass nichts frei ist.
3. Er gibt 2:00 von A frei; „Frei“ zeigt 2:00.
4. Eine Korrektur um −3:00 wird abgelehnt (nur 2:00 möglich), eine um −2:00 gelingt.
5. Ein Mitglied ohne `hours.manage` sieht alles, kann aber nichts ändern.
6. Ein Mitglied mit Projektbindung sieht nur sein Projekt.
7. Alle Befehle aus dem Merge-Gate 20.1 der README sind grün.
