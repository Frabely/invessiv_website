# Task 01a — Gemeinsame Aktivitäten-Tabelle

> **Merge-Einheit:** Ordner 02 · **Branch:** `feat/crm-activity-migration`
> **Aufwand:** M · **Abhängigkeiten:** Task 01 (`customers` muss existieren)
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)

- Direkter Umzug: Die Migration legt `activities` an und übernimmt den Bestand mit derselben ID.
- Die Übernahme ist über `ON CONFLICT (id) DO NOTHING` wiederholbar und bricht bei fehlender oder
  abweichender Zeile ab.
- Ab dem Deploy lesen und schreiben alle Pfade nur noch `activities`; kein Dual-Write, kein Backfill-Job.
- Die alte Tabelle bleibt ungenutzt stehen; Cleanup/Drop ist nicht Teil dieses Tasks.
- Rollback ist ein Revert des App-Deploys (siehe README).

## Context

Aus einem Lead wird ein Kunde. Die Historie soll deshalb **durchlaufen** und nicht an der
Konvertierung abreißen: „seit wann kennen wir die, was lief in der Akquise, was läuft jetzt" ist eine
Frage, keine zwei.

Der ursprüngliche Plan sah eine eigene `customer_activities`-Tabelle vor — schemagleich zur
bestehenden `lead_activities`, plus eine kopierte Timeline-Komponente in Task 29. Das wären zwei
Tabellen, zwei Services und zwei UIs für dieselbe Sache gewesen.

Stattdessen entsteht hier **eine** `activities`-Tabelle für beide Welten, die bestehenden
Lead-Aktivitäten ziehen um, und alle Leser und Schreiber werden umgestellt. Der Activity-Service
entsteht ebenfalls hier — **vor** dem ersten Handler, der Aktivitäten schreibt (Task 04). Damit gibt
es nie verstreute Direkteinfügungen, die Task 29 später wieder einsammeln müsste.

Dieser Task ist der einzige im Plan, der bestehenden Leads-Code in der Tiefe anfasst. Entsprechend
vorsichtig geschnitten: kein neues Verhalten, keine neue Spalte mit Bedeutung, nur ein Umzug.

## Entscheidungen

| Bereich               | Entscheidung                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Zuordnung             | Zwei nullbare Spalten mit **echtem Fremdschlüssel**: `lead_id` und `customer_id`, CHECK erzwingt mindestens eine                                 |
| Warum nicht polymorph | `subject_type` + `subject_id` ohne Fremdschlüssel lässt verwaiste Zeilen zu. Dieselbe Begründung wie bei den Dateien in Task 14                  |
| Durchgehende Timeline | Task 08 trägt bei der Konvertierung `customer_id` auf **allen** Aktivitäten des Leads nach                                                       |
| Folge daraus          | Die Kunden-Timeline ist `WHERE customer_id = $1` — eine indizierte Abfrage ohne Unterabfrage, inklusive der kompletten Akquise-Historie          |
| Projektbezug          | `project_id` als eigene Spalte, nicht im `metadata`-jsonb — „nur die Historie dieses Projekts" soll indiziert bleiben. Fremdschlüssel ab Task 09 |
| Typen                 | Ein gemeinsames Const-Objekt, das die sechs bestehenden Lead-Typen **wortgleich** enthält, damit migrierte Zeilen die CHECK-Constraint bestehen  |
| Akteur                | `actor_type` um `customer` erweitert (Portalnutzer ab Task 21)                                                                                   |
| Service               | `activityService` mit `appendActivity` und `createActivity(tx, …)`, Vorlage `lead-activity-service.ts`. Ab hier schreibt niemand mehr direkt     |
| Kein Dual-Write       | Bewusste Abweichung vom Standardablauf: geringer Wert der Bestandsdaten, keine Activity-Writes zwischen Migration und Deploy zugesichert         |
| Alte Tabelle          | `lead_activities` bleibt nach diesem Task **stehen**, wird aber weder gelesen noch beschrieben. Entfernt wird sie in Ordner 22                   |
| Warum                 | Die Migration läuft vor dem Deploy; die noch laufende alte App-Version liest die Tabelle bis dahin. Ein `DROP` im selben Task wäre nicht additiv |
| Timeline-Typen        | Der Lead-Mapper reicht nur Typen durch, die die Lead-Timeline darstellen kann (`LEGACY_LEAD_*_VALUES`). Task 02a hebt den Filter auf             |
| Timeline-UI           | Nicht hier. Sie wandert in Task 02a nach `components/workspace/shared/` und wird in Task 29 mit Kundendaten befüllt                              |

## Contract

```ts
// packages/common/src/constants/activity/activity-types.ts
export const ActivityType = {
  // bestehend, Werte unverändert
  Note: "note",
  StatusChange: "status_change",
  InboundSubmission: "inbound_submission",
  Import: "import",
  BulkEdit: "bulk_edit",
  MessageDrafted: "message_drafted",
  // neu für Kunden
  Created: "created",
  FieldChange: "field_change",
  ConvertedFromLead: "converted_from_lead",
  CredentialRevealed: "credential_revealed",
  FileUploaded: "file_uploaded",
  SubmissionReceived: "submission_received",
  PhaseChange: "phase_change",
  RenewalRenewed: "renewal_renewed",
  MailSent: "mail_sent", // Task 31
} as const;
```

```ts
// packages/common/src/constants/activity/actor-types.ts
export const ActorType = {
  System: "system",
  User: "user",
  Customer: "customer",
} as const;
```

```ts
// packages/common/src/contracts/activity/activity.dto.ts
export interface ActivityDto {
  id: string;
  leadId: string | null;
  customerId: string | null;
  projectId: string | null;
  type: ActivityType;
  title: string | null;
  body: string | null;
  metadata: Record<string, unknown> | null;
  occurredAt: string; // ISO
  actorType: ActorType;
  actorId: string | null;
  actorLabel: string | null;
}
```

## Tabelle

```txt
activities
  id uuid PK
  lead_id     uuid NULL → leads.id     ON DELETE CASCADE
  customer_id uuid NULL → customers.id ON DELETE CASCADE
  project_id  uuid NULL                 Fremdschlüssel wird in Task 09 ergänzt
  type text NOT NULL                    CHECK in ACTIVITY_TYPE_VALUES
  title text NULL
  body text NULL
  metadata jsonb NULL
  occurred_at timestamptz NOT NULL      kein Default, der Schreibpfad setzt den Zeitpunkt
  actor_type text NOT NULL              CHECK in ACTOR_TYPE_VALUES
  actor_id text NULL
  actor_label text NULL
  created_at timestamptz NOT NULL DEFAULT now()
  CHECK (lead_id IS NOT NULL OR customer_id IS NOT NULL)
  INDEX (customer_id, occurred_at desc) WHERE customer_id IS NOT NULL
  INDEX (lead_id, occurred_at desc)     WHERE lead_id IS NOT NULL
  INDEX (project_id, occurred_at desc)  WHERE project_id IS NOT NULL
  INDEX (type, occurred_at)             für die Dashboard-Kennzahl
```

`customer_id ON DELETE CASCADE` bedeutet: Beim **harten** Löschen eines Kunden setzt der Handler
zuerst `customer_id = NULL` auf allen Zeilen, die zusätzlich ein `lead_id` tragen — die
Akquise-Historie des Leads überlebt. Erst danach greift der Cascade für die rein kundenbezogenen
Zeilen. Das ist derselbe explizite Aufräumschritt, in dem auch die Storage-Objekte entfernt werden (Task 05).

## Migration

```sql
-- 1. Tabelle anlegen
-- 2. Bestand übernehmen (idempotent über die bestehende id)
INSERT INTO activities (id, lead_id, type, title, body, metadata,
                        occurred_at, actor_type, actor_id, actor_label, created_at)
SELECT id, lead_id, type, title, body, metadata,
       occurred_at, actor_type, actor_id, actor_label, created_at
FROM lead_activities
ON CONFLICT (id) DO NOTHING;
```

Rein additiv: neue Tabelle, `lead_activities` bleibt bestehen. Der Kopierschritt ist durch
`ON CONFLICT DO NOTHING` beliebig oft wiederholbar. Ein anschließender `DO`-Block bricht die
Migration ab, wenn eine Bestandszeile fehlt oder in `lead_id`, Typ oder Zeitstempel abweicht. Vor dem
zugehörigen App-Deploy werden keine Activity-Writes zugelassen.

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_create_activities.sql
packages/db/src/record-configuration/activities.ts
packages/common/src/constants/activity/
  activity-types.ts   (+ .test.ts)
  actor-types.ts      (+ .test.ts)
packages/common/src/contracts/activity/activity.dto.ts
packages/common/src/contracts/activity/create-activity-input.ts
packages/common/src/contracts/activity/rows/activity-row.ts
packages/common/src/patterns/activity/legacy-lead-activity.ts       (+ Test)

packages/db/scripts/smoke-activity-migration.ts

apps/workspace/src/server/workspace/shared/services/activity-service.ts       (+ Test)

umzustellen:
apps/workspace/src/server/workspace/leads/services/lead-activity-service.ts       entfällt
apps/workspace/src/server/workspace/leads/shared/create-lead-core.ts
apps/workspace/src/server/workspace/leads/command-handler/update-lead.command-handler.ts
apps/workspace/src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts
apps/workspace/src/server/workspace/leads/command-handler/bulk-archive-leads.command-handler.ts
apps/workspace/src/server/workspace/outreach/command-handler/generate-outreach-message.command-handler.ts
apps/workspace/src/server/workspace/leads/query-handler/get-lead-by-id.query-handler.ts
apps/workspace/src/server/workspace/dashboard/query-handler/get-messaging-conversion.query-handler.ts
```

## Tickets

### CRM-01a-T1 — Konstanten und DTO

- **Files:** `packages/common/src/constants/activity/{activity-types,actor-types}.ts` + Tests,
  `packages/common/src/contracts/activity/activity.dto.ts`
- **Skills:** `best-practices`
- **Inhalt:**
  - Gemeinsame Const-Objekte; die sechs bestehenden Lead-Typen behalten **exakt** ihre Strings
  - Die bisherigen Dateien unter `constants/leads/activity/` werden entfernt, ihre Importe umgestellt
- **Akzeptanz:**
  - Test belegt, dass jeder Wert aus `LEGACY_LEAD_ACTIVITY_TYPE_VALUES` im neuen Array enthalten
    ist — sonst würde die Migration an der CHECK-Constraint scheitern
  - Keine Duplikate, `_VALUES` deckungsgleich zu `Object.values()`
  - Der Activity-Smoke vergleicht die CHECK-Werte der Datenbank mit den Const-Objekten

### CRM-01a-T2 — Migration 0022 und Modell

- **Files:** `packages/db/migrations/<nr>_create_activities.sql`,
  `packages/db/src/record-configuration/activities.ts`, Barrel
- **Skills:** `best-practices`
- **Inhalt:** Tabelle und Kopierschritt wie oben, CHECKs über `sqlCheckIn`
- **Akzeptanz:**
  - Migration idempotent; zweiter Lauf kopiert keine Zeile doppelt
  - Jede Zeile aus `lead_activities` existiert in `activities` mit gleicher ID, `lead_id`, Typ und
    Zeitstempel
  - Eine Zeile ohne `lead_id` und ohne `customer_id` wird abgewiesen
  - Fehlende Fachwerte (`id`, `type`, `occurred_at`, `actor_type`) werden abgewiesen

### CRM-01a-T3 — Activity-Service

- **Files:** `apps/workspace/src/server/workspace/shared/services/activity-service.ts` + Test
- **Skills:** `best-practices`
- **Inhalt:**
  - `appendActivity(input)` und `createActivity(tx, input)`, Struktur 1:1 wie
    `lead-activity-service.ts`
  - Eingabe akzeptiert `leadId` und/oder `customerId` und optional `projectId`
  - Ein Aufruf ohne beide Kennungen ist ein Typfehler, nicht erst ein Datenbankfehler
- **Akzeptanz:**
  - Tests für beide Varianten, für die Transaktions-Variante und für gesetztes `projectId`
  - Der Service protokolliert selbst nichts und wirft keine Domänenfehler

### CRM-01a-T4 — Leser und Schreiber umstellen

- **Files:** die acht Dateien aus der Verzeichnisstruktur, plus deren Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Fünf Schreiber auf `activityService` umstellen (`leadId` gesetzt, `customerId` null)
  - `get-lead-by-id` liest `activities` über `lead_id`
  - `get-messaging-conversion` liest `activities` statt `lead_activities`; Bedingungen unverändert,
    zusätzlich nur Zeilen mit `lead_id`
  - Der Lead-Mapper filtert Typen, die die Lead-Timeline nicht darstellen kann
  - `lead-activity-service.ts` wird entfernt
- **Akzeptanz:**
  - Die bestehenden Dashboard- und Lead-Tests bleiben grün. Nur die zuvor falsche Bulk-Status-Erwartung wird bewusst
    auf `status_change` korrigiert; das ist der Regressionsnachweis für die Funnel-Kennzahlen
  - Kein Code liest oder schreibt `leadActivities` außer dem Drizzle-Modell und der
    Übernahmeprüfung im Activity-Smoke
  - Die Lead-Detailansicht zeigt dieselbe Timeline wie vorher

## Deploy-Sicherheit

1. **Live sichtbar:** nichts. Die Lead-Timeline und die Dashboard-Kennzahlen sehen identisch aus —
   sie kommen nur aus einer anderen Tabelle.
2. **Bricht nichts:** Migration additiv, `lead_activities` bleibt unangetastet stehen. Das größte
   Risiko sind die Funnel-Kennzahlen im Dashboard; abgesichert dadurch, dass deren Tests
   unverändert bleiben müssen. Geht doch etwas schief, ist der Rückweg ein Revert des Codes — die
   alte Tabelle ist noch vollständig da. Einträge aus der Zeit zwischen Deploy und Revert sieht die
   alte Version nicht; das ist bewusst akzeptiert.
3. **Offen:** Das Entfernen von `lead_activities`. Eigener Aufräum-Task, sobald ein Deploy-Zyklus
   ohne Auffälligkeiten gelaufen ist.

## End-to-End-Akzeptanz

1. Migration läuft und ist wiederholbar; alle bestehenden Lead-Aktivitäten sind übernommen.
2. Die Lead-Detailansicht zeigt unveränderte Einträge in unveränderter Reihenfolge.
3. Die Dashboard-Kennzahlen bleiben bis auf den bewusst korrigierten Fall stabil: Bulk-Statusänderungen erscheinen
   jetzt im Zeitraum ihrer Statusänderung.
4. Ein neuer Lead erzeugt seine Aktivität ausschließlich in `activities`.
5. Eine Aktivität lässt sich mit `customerId` und `projectId` anlegen und ist darüber abfragbar.
6. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
