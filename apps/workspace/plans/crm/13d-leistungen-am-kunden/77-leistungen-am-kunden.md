# Task 77 — Leistungen am Kunden (ohne Projekt)

> **Merge-Einheit:** Ordner 13d, zwei Teil-PRs · **Aufwand:** L · **Abhängigkeiten:** Task 74 (13c.1) gemergt
> **Migrationen:** je PR eine; Nummer im Repository ermitteln (höchste bestehende plus eins)
> **Zuerst lesen:** [README](./README.md), `../13c-portal-leistungsanfragen/74-leistungsarten-und-zuweisung.md`,
> `apps/workspace/src/server/workspace/crm/AGENTS.md` (Abschnitte „Verbindliche Invarianten“, „Leistungsarten“,
> „Zugangsdaten“), `apps/workspace/src/components/workspace/crm/AGENTS.md`, `packages/db/AGENTS.md`,
> `packages/db/src/record-configuration/crm/AGENTS.md`
> **Stand des Plans:** umsetzbar. Die Dateilisten beruhen auf dem Code nach Task 74; vor Beginn jede Liste per Grep
> gegen den aktuellen Stand prüfen (insbesondere, ob 13c.2 und 13c.3 inzwischen gemergt sind).

## Context

Wartung über mehrere Websites, frei verfügbare Stunden und Workshops gehören dem Kunden, nicht einem Projekt. Heute
müssen sie an ein beliebiges Projekt gehängt werden; läuft dieses Projekt aus oder wird es archiviert, steht eine
laufende Leistung an der falschen Stelle. Dieser Task macht den Projektbezug einer Leistung optional.

**Vorbild im Code:** `customer_credentials` und sein Zugriffsdienst
(`apps/workspace/src/server/workspace/crm/services/credentials/credential-access-service.ts`): Kunde Pflicht, Projekt
optional, `crmAccessCondition.forScope` mit Kunden- **und** Projektspalte, sodass eine Projektbindung keine
kundenweiten Einträge erreicht.

**Einzige Einfügestelle** für Leistungen ist seit Task 74
`apps/workspace/src/server/workspace/crm/services/project-line-item-assignment-service.ts`. Jede Änderung am
Schreiben geschieht dort.

## Zielmodell

```txt
project_line_items
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE          (neu; 13d.1 nullable, 13d.2 Pflicht)
  project_id  uuid NULL                                                (bisher NOT NULL)
  FK (project_id, customer_id) → projects (id, customer_id) ON DELETE CASCADE   Ziel: projects_id_customer_uidx
  CHECK kind IS DISTINCT FROM 'feedback_round' OR project_id IS NOT NULL
  INDEX (customer_id, created_at DESC)

line_item_templates
  CHECK project_mode IS NULL OR project_mode IN ('existing_project', 'new_project', 'customer')
  CHECK kind = 'hours'          → project_mode IS DISTINCT FROM 'new_project'       (customer ist erlaubt)
  CHECK kind = 'feedback_round' → project_mode IS NOT DISTINCT FROM 'existing_project' OR project_mode IS NULL
```

Der bestehende Fremdschlüssel `project_line_items_project_id_fkey` bleibt bis 13d.2 und wird dort durch den
zusammengesetzten ersetzt (`DROP CONSTRAINT IF EXISTS` + `ADD`), damit eine Leistung nie an einem Projekt eines
fremden Kunden hängen kann.

---

## PR 13d.1 — Fundament (unsichtbar)

> **Branch:** `feat/crm-kundenleistungen-1-fundament` · **Dateien:** ≈ 25

Nach dem Merge trägt jede Leistung ihren Kunden. Sichtbar ändert sich nichts.

### CRM-77-T1 — Spalte, Backfill, Schreibpfad

```txt
packages/db/migrations/<nr>_add_line_item_customer.sql
packages/db/src/record-configuration/crm/project-line-items.ts                    + customer_id (nullable), Index, zusammengesetzter FK
packages/db/src/constraint-names/crm/project-line-items-constraint-names.ts       + CustomerForeignKey, ProjectCustomerForeignKey,
                                                                                    CustomerCreatedAtIndex
packages/db/src/constraint-names/constraint-names.test.ts                         angepasst (falls die Tabelle dort geführt wird)
packages/db/scripts/crm-smoke/line-item-checks.ts                                 + Fälle: fremdes Projekt abgewiesen
packages/db/scripts/smoke-crm-constraints.ts                                      bestehende Inserts setzen customer_id
packages/db/scripts/seed-crm-fixture.ts                                           Inserts setzen customer_id
packages/common/src/contracts/crm/rows/project-line-item-row.ts                   + customer_id: string | null
apps/workspace/src/server/workspace/crm/services/project-line-item-assignment-service.ts   insertLineItem setzt customer_id
apps/workspace/src/server/tests/workspace/crm/project-line-item-kinds.integration.test.ts  + Erwartung customer_id
apps/workspace/src/server/tests/workspace/crm/project-line-items.integration.test.ts       + Erwartung customer_id
apps/workspace/src/server/tests/workspace/crm/services/project-line-items-mapper-service.test.ts   Fixture
packages/db/src/record-configuration/crm/AGENTS.md                                Abschnitt „Leistungen am Kunden (Ordner 13d)“
```

Migration (idempotent, `--> statement-breakpoint` zwischen den Anweisungen):

1. `ALTER TABLE project_line_items ADD COLUMN IF NOT EXISTS customer_id UUID;`
2. Backfill: `UPDATE project_line_items AS i SET customer_id = p.customer_id FROM projects AS p
WHERE p.id = i.project_id AND i.customer_id IS NULL;`
3. `ADD CONSTRAINT project_line_items_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers (id)
ON DELETE CASCADE` (vorher `DROP CONSTRAINT IF EXISTS`).
4. `ADD CONSTRAINT project_line_items_project_customer_fkey FOREIGN KEY (project_id, customer_id)
REFERENCES projects (id, customer_id) ON DELETE CASCADE` (vorher `DROP CONSTRAINT IF EXISTS`). Ein
   zusammengesetzter Schlüssel mit `NULL` in `customer_id` wird von Postgres nicht geprüft; das ist für die
   Übergangszeit gewollt.
5. `CREATE INDEX IF NOT EXISTS project_line_items_customer_created_at_idx ON project_line_items (customer_id,
created_at DESC);`

`customer_id` bleibt in diesem PR nullable: Die vorherige App-Version legt Leistungen ohne die Spalte an. Der neue
Schreibpfad setzt sie immer (aus `input.project.customerId`). Der Mapper und das DTO bleiben unverändert.

- **Akzeptanz:** Smoke: Leistung mit `customer_id` eines anderen Kunden als dem des Projekts wird abgewiesen.
  Integration: jede über `createProjectLineItem` angelegte Leistung trägt die `customer_id` ihres Projekts.
  Nach der Migration: `SELECT count(*) FROM project_line_items WHERE customer_id IS NULL` ist 0 (im PR-Testplan
  für Dev, Preview und Produktion festhalten). Zweiter Migrationslauf ist folgenlos.

---

## PR 13d.2 — Leistungen am Kunden

> **Branch:** `feat/crm-kundenleistungen-2-cockpit` · **Basis:** 13d.1 gemergt **und überall deployt** ·
> **Dateien:** ≈ 70–85

Nach dem Merge lassen sich Leistungen ohne Projekt zuweisen, bearbeiten und im Cockpit lesen.

### CRM-77-T2 — Schema und Contracts

```txt
packages/db/migrations/<nr>_allow_customer_level_line_items.sql
packages/db/src/record-configuration/crm/project-line-items.ts            customer_id notNull, project_id nullable, CHECK Runde
packages/db/src/record-configuration/crm/line-item-templates.ts           CHECKs für project_mode
packages/db/src/constraint-names/crm/*.ts                                 + KindProjectCheck; ProjectForeignKey entfällt
packages/db/scripts/crm-smoke/line-item-checks.ts                         + Fälle unten
packages/db/scripts/seed-crm-fixture.ts                                   Wartung am Kunden, Stunden am Kunden

packages/common/src/constants/crm/line-item-project-modes.ts (+ Test)     + Customer: "customer"
packages/common/src/contracts/crm/project-line-item.dto.ts                + customerId; projectId: string | null
packages/common/src/contracts/crm/rows/project-line-item-row.ts           customer_id: string; project_id: string | null
packages/common/src/contracts/crm/create-customer-line-item-request.dto.ts    neu (wie Create-DTO, ohne allocateHoursToProject)
packages/common/src/contracts/crm/results/create-project-line-item-result.ts  + CustomerNotFound
packages/common/src/constants/crm/errors/project-line-item-error-codes.ts     + CustomerNotFound, ProjectRequired
packages/common/src/contracts/crm/project-line-item-value.ts              unverändert; neuer Wert im View-Model (T5)
```

Migration:

1. **Preflight:** bricht ab, wenn noch eine Zeile ohne `customer_id` existiert (`DO $$ … RAISE EXCEPTION`), damit
   `NOT NULL` nie auf unvollständige Daten trifft. Muster: Leerheits-Preflight in `0024`.
2. `ALTER TABLE project_line_items ALTER COLUMN customer_id SET NOT NULL;`
3. `ALTER TABLE project_line_items ALTER COLUMN project_id DROP NOT NULL;`
4. `DROP CONSTRAINT IF EXISTS project_line_items_project_id_fkey` (der zusammengesetzte Schlüssel aus 13d.1 ersetzt ihn).
5. `ADD CONSTRAINT project_line_items_kind_project_check CHECK (kind IS DISTINCT FROM 'feedback_round' OR
project_id IS NOT NULL)`.
6. `line_item_templates_project_mode_check` und `line_item_templates_kind_project_mode_check` droppen und mit den
   Regeln aus dem Zielmodell neu anlegen (nur erweitert, nie verengt).

`SET NOT NULL` auf einer bestehenden Spalte ist laut `packages/db/AGENTS.md` nur zulässig, wenn kein Schreiber mehr
`NULL` liefern kann. Das stellt die Reihenfolge sicher: 13d.1 ist überall deployt, bevor 13d.2 migriert. Im PR
ausdrücklich benennen.

- **Akzeptanz (Smoke):** Leistung ohne Projekt mit Kunde angenommen; ohne Kunde abgewiesen; `feedback_round` ohne
  Projekt abgewiesen; `hours` ohne Projekt mit Menge angenommen; Vorlage `hours` + `customer` angenommen;
  Vorlage `feedback_round` + `customer` abgewiesen; unbekannter Projektbezug abgewiesen.

### CRM-77-T3 — Server: Zugriff, Zuweisung, Lesen

```txt
apps/workspace/src/server/workspace/crm/services/project-line-item-access-service.ts     neu: condition, targetExists
apps/workspace/src/server/workspace/crm/services/project-line-item-assignment-service.ts project optional
apps/workspace/src/server/workspace/crm/services/project-line-item-assignment-types.ts   project: AssignmentProject | null,
                                                                                         customerId immer gesetzt
apps/workspace/src/server/workspace/crm/services/project-line-item-schemas.ts            + createForCustomer
apps/workspace/src/server/workspace/crm/services/line-item-template-schemas.ts           refineKind: neue Regeln
apps/workspace/src/server/workspace/crm/services/project-line-items-mapper-service.ts    customerId, projectId nullable
apps/workspace/src/server/workspace/crm/command-handler/create-customer-line-item.command-handler.ts   neu
apps/workspace/src/server/workspace/crm/command-handler/create-project-line-item.command-handler.ts    unverändert bis auf Typen
apps/workspace/src/server/workspace/crm/command-handler/update-project-line-item.command-handler.ts    Zugriff über access-service
apps/workspace/src/server/workspace/crm/query-handler/list-project-line-items-by-customer.query-handler.ts   LEFT JOIN, neue Bedingung
apps/workspace/src/server/workspace/crm/query-handler/list-project-line-items.query-handler.ts         unverändert (nur Projekt)
apps/workspace/src/app/api/workspace/crm/customers/[id]/line-items/route.ts              neu: POST
apps/workspace/src/common/constants/api-endpoints.ts bzw. common/patterns/crm/crm-api-endpoints.ts (+ Test)
apps/workspace/src/common/constants/auth/crm-endpoint-access-rules.ts                    + CustomerLineItemCreate
                                                                                         (ProjectLineItemsWrite, scope "customer")
apps/workspace/src/lib/workspace/crm/project-line-item-api-error.ts                      + zwei Codes (404, 422)
apps/workspace/src/server/shared/services/onboarding/onboarding-services-snapshot-service.ts   prüfen: filtert bereits auf project_id
apps/workspace/src/server/tests/workspace/crm/customer-line-items.integration.test.ts    neu
apps/workspace/package.json                                                              db:smoke:crm + die neue Testdatei
apps/workspace/src/server/workspace/crm/AGENTS.md                                        Invarianten ersetzen, Abschnitt ergänzen
```

**`projectLineItemAccessService.condition(actor, permission)`** — einzige Definition, wer welche Leistung erreicht:
`crmAccessCondition.forScope(accessScope(actor, permission), { customerId: projectLineItems.customer_id,
projectId: projectLineItems.project_id })`. Eine Projektbindung erreicht damit nur Zeilen ihres Projekts; Zeilen
mit `project_id IS NULL` verlangen die Bindung am Kunden. `listProjectLineItemsByCustomer` und
`updateProjectLineItem` nutzen diese Bedingung in der `WHERE`-Klausel statt des bisherigen Inner Join auf `projects`.

**`projectLineItemAssignmentService.assign`** mit `project: null`:

1. `feedback_round` → `ProjectRequired` (422).
2. `hours` → Menge Pflicht, `hours.manage` am Kunden, Kundensperre, Leistung + Kaufbuchung, **keine** Zuweisung.
   `allocateHoursToProject` wird ignoriert; die Prüfung auf ein geschlossenes Projekt entfällt.
3. `standard` → Insert mit `project_id = NULL`.

**`createCustomerLineItem(customerId, input, actor)`**: ID prüfen, Schema `createForCustomer`,
`canOn(actor, ProjectLineItemsWrite, { customerId })` sonst `CustomerNotFound`, Kunde existiert und ist nicht
archiviert, Vorlage aktiv, dann `assign` in einer Transaktion. Der Projektbezug der Vorlage ist nur Vorauswahl:
Eine Vorlage mit `existing_project` darf am Kunden zugewiesen werden und umgekehrt (außer `feedback_round`).

**Invarianten in `server/workspace/crm/AGENTS.md` neu fassen:** „Eine Leistung gehört zu genau einem Kunden und
höchstens einem Projekt. Der Kunde einer Projektleistung wird aus dem Projekt gelesen, nie aus der Anfrage; nur der
Kundenpfad nimmt eine `customerId` entgegen.“ Der Satz „keine kundenweiten Positionen“ entfällt.

- **Akzeptanz (Integration):**
  - Standard-Leistung am Kunden: eine Zeile mit `project_id IS NULL`, im Kundenwert enthalten, in keinem Projektwert
  - Stunden am Kunden, 5:00: eine Leistung, eine Kaufbuchung, **keine** Zuweisung; freie Stunden 5:00
  - `feedback_round` am Kunden → `ProjectRequired`, nichts geschrieben
  - Mitglied mit Projektbindung: Liste enthält keine Leistung am Kunden; Bearbeiten einer solchen → 404;
    Anlegen am Kunden → `CustomerNotFound`
  - Mitglied mit Rolle an Kunde B → Anlegen und Bearbeiten bei Kunde A → 404
  - archivierter Kunde → abgewiesen wie bei `createProject`
  - Bestandsfälle aus `project-line-items.integration.test.ts` und `project-line-item-kinds.integration.test.ts`
    bleiben unverändert grün
  - Onboarding: Leistung am Kunden erscheint weder in `listLive` noch nach `freeze` (Test in
    `onboarding-complete.integration.test.ts` ergänzen)

### CRM-77-T4 — Anschluss an Leistungsanfragen (nur wenn 13c.2 gemergt ist)

```txt
packages/db/migrations/<nr>_allow_customer_level_service_request.sql     CHECK an service_requests lockern
packages/db/src/record-configuration/crm/service-requests.ts
packages/common/src/contracts/crm/service-requests/accept-service-request-project-target.dto.ts   + { mode: "customer" }
packages/common/src/constants/crm/service-request-project-wishes.ts      + Customer
apps/workspace/src/server/workspace/crm/command-handler/accept-service-request.command-handler.ts
apps/workspace/src/components/workspace/crm/service-requests/service-request-accept-dialog/
apps/workspace/src/server/portal/…/portal-service-request-service.ts     nur wenn 13c.3 gemergt: Projektfrage je Bezug
```

- Der CHECK `status <> 'accepted' OR project_id IS NOT NULL …` verliert die Projektbedingung; angenommen heißt
  dann: `decided_at`, `decided_by_member_id` und `project_line_item_id` sind gesetzt.
- Annahme-Dialog: dritte Wahl „Am Kunden, ohne Projekt“; Vorauswahl bei Vorlagenbezug `customer`.
- Portal (nach 13c.3): Bei Vorlagenbezug `customer` entfällt die Projektfrage; der Hinweis lautet sinngemäß
  „Gilt für dein Unternehmen, nicht für ein einzelnes Projekt.“

Ist 13c.2 noch nicht gemergt, entfällt T4 hier; Task 75 übernimmt die Punkte dann direkt.

### CRM-77-T5 — UI

Skills: `frontend-design`, `impeccable`, `copywriting`.

```txt
apps/workspace/src/lib/workspace/crm/project-line-items-view-model.ts (+ Test)   customerLevel: { services, canWrite, value }
apps/workspace/src/common/contracts/crm/project-line-items-view-model.ts
apps/workspace/src/lib/workspace/crm/load-customer-cockpit.ts
apps/workspace/src/components/workspace/crm/projects/customer-line-items-section/         neu (Kundenspalte)
apps/workspace/src/components/workspace/crm/projects/project-line-items-section/         Zeilen-Rendering nach
                                                                                         projects/line-item-ledger/ extrahieren
apps/workspace/src/components/workspace/crm/projects/line-item-ledger/                    neu: geteilte Liste beider Sektionen
apps/workspace/src/components/workspace/crm/projects/project-line-item-form-dialog/       Ziel als Prop: Projekt oder Kunde
apps/workspace/src/components/workspace/crm/projects/project-line-item-effect-fields/     ohne Projekt: kein Zuweisen-Haken
apps/workspace/src/components/workspace/crm/detail/customer-cockpit-view/customer-cockpit-view.tsx   Sektion einhängen
apps/workspace/src/components/workspace/crm/line-item-templates/line-item-template-form-dialog/     dritter Projektbezug
apps/workspace/src/client/crm/project-line-items-api-service.ts (+ Test)                  createCustomerLineItem
apps/workspace/src/common/patterns/crm/project-line-item-form.ts (+ Test)                 Request je Ziel
apps/workspace/src/common/patterns/crm/line-item-template-form.ts (+ Test)                Zwangswerte je Art
apps/workspace/src/i18n/dictionaries/workspace/crm/project-line-items/{de,en}.json
apps/workspace/src/i18n/dictionaries/workspace/crm/line-item-templates/{de,en}.json
apps/workspace/src/components/workspace/crm/AGENTS.md
```

- **Sektion „Leistungen am Kunden“** in der Kundenspalte des Cockpits, direkt vor „Dateien“ (bzw. vor
  „Leistungsanfragen“, falls 13c.2 gemergt ist). Kopf nach dem Abschnittsmuster: Titel · Anzahl · „Leistung
  zuweisen“ · Toggle über `shared/section-collapse-toggle`. Sie existiert nur mit Leserecht **am Kunden**; ohne
  Recht fehlt sie vollständig. Zusammenfassung wie bei Projektleistungen: Einmalzahlung und laufend pro Monat.
- **Geteilte Liste:** Die Zeilendarstellung (Titel, Status, Betrag, Rhythmus, Stunden-Zeile) existiert heute in
  `project-line-items-section`. Sie wird als `line-item-ledger` extrahiert und von beiden Sektionen benutzt —
  keine Kopie (Regel „Keine Logik-Duplikate“).
- **Dialog:** derselbe `project-line-item-form-dialog`; das Ziel kommt als Prop (`{ kind: "project", projectId }`
  bzw. `{ kind: "customer", customerId }`). Am Kunden: Zusatzrunden-Vorlagen werden mit dem Grund als Text
  abgewiesen, bei Stunden fehlt der Haken „Stunden diesem Projekt zuweisen“ und der Hinweis lautet sinngemäß
  „Schreibt 5:00 gut. Die Stunden sind frei für alle Projekte des Kunden.“
- **Katalog:** dritter Projektbezug „Gilt für den Kunden, ohne Projekt“. Bei Art „Stunden“ wählbar, bei
  „Zusatzrunde“ gesperrt.
- **Kennzahl:** Der Kundenwert im Kopf bleibt die Summe aller bestätigten Leistungen; er ändert sich für
  Bestandsdaten nicht.
- **Empty-State:** „Hier stehen Leistungen, die für den ganzen Kunden gelten — zum Beispiel Wartung über mehrere
  Websites, frei verfügbare Stunden oder ein Workshop.“ Mit Schreibrecht zusätzlich die Aktion, ohne nur der Text.

- **Akzeptanz (jsdom):** Sektion fehlt ohne Leserecht am Kunden; Request am Kunden trägt keine `projectId` und
  kein `allocateHoursToProject`; Zusatzrunden-Vorlage sendet am Kunden nicht und nennt den Grund; beide
  Empty-States unterscheidbar; DE und EN vollständig.

## Deploy-Sicherheit

1. **13d.1** ist rein additiv und in jeder Reihenfolge mit der Vorversion verträglich.
2. **13d.2 erst migrieren, wenn 13d.1 überall läuft** (Dev, Preview, Produktion). Der Preflight der Migration
   bricht sonst ab, statt halbe Daten zu erzeugen.
3. **Rollback 13d.2:** siehe README — nur sicher ohne Leistungen ohne Projekt.

## End-to-End-Abnahme (von Hand)

1. Im Katalog „Wartung“ auf „Gilt für den Kunden, ohne Projekt“ stellen.
2. Im Cockpit eines Kunden mit zwei Projekten unter „Leistungen am Kunden“ die Wartung zuweisen → sie steht dort,
   in keinem der beiden Projekte, und zählt in „Laufende Einnahmen / Monat“ des Kunden.
3. Eines der beiden Projekte archivieren → die Wartung bleibt unverändert sichtbar.
4. Stunden-Vorlage am Kunden mit 5:00 zuweisen → Abschnitt „Stunden“ zeigt 5:00 frei, kein Projekt hat sie.
5. Als Mitglied mit Rolle nur an einem Projekt: Die Sektion fehlt, die Projektleistungen des eigenen Projekts sind da.
6. Onboarding-Bogen eines Projekts öffnen → die Wartung am Kunden steht nicht unter den Projektleistungen.
7. (Nach 13c.2/13c.3) Eine Anfrage „Wartung“ aus dem Portal als „Am Kunden, ohne Projekt“ annehmen.
