# Task 09 — Projekte Datenmodell

> **Merge-Einheit:** Ordner 07 · **Branch:** `feat/crm-projekte`
> **Aufwand:** S · **Abhängigkeiten:** Task 01
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)

- Projektstatus `planned | active | paused | completed | cancelled | archived`, getrennt von Phase.
- Phase folgt `workflow_key = standard_web_v1` mit `onboarding`, `design`, `development`, `feedback`,
  `launch`, `maintenance`.
- `owner_member_id` ist Pflicht und initial der Kunden-Owner. Ein späterer Kunden-Owner-Wechsel ändert bestehende
  Projekte nicht.
- `billing_model` ist Pflicht: `fixed_price | hourly | retainer | internal`; Währung nur EUR.
- Budget/Stundensatz bleiben intern und fehlen aus jedem Portalcontract.
- Kein `archived_at` oder `deleted_at`; Archivierung ausschließlich über Status. Kein Purge in
  dieser Merge-Einheit.
- `version` ist Pflicht und alle Updates verwenden optimistic concurrency.

## Context

Ein Kunde kann mehrere Aufträge haben: Website 2024, Relaunch 2026, laufende Betreuung. Projekte sind
die Ebene, an der Phase, Zieltermin, Preview-Link, Aufgaben, Dateien und Feedbackrunden hängen.

Wie bei Task 01: nur Schema, Konstanten, DTOs und Mapper. Kein UI, keine Route — das folgt in Task 10.

Die Phasenliste bestimmt später direkt die Fortschrittsanzeige im Kundendashboard. Sie wird deshalb **als Array**
modelliert und nicht als nummerierte Werte: Der Fortschritt ergibt sich aus dem Index,
ein Zwischenschritt ist eine eingefügte Zeile — ohne Umnummerierung bestehender Daten.

## Entscheidungen

| Bereich                 | Entscheidung                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Phasen                  | `onboarding, design, development, feedback, launch, maintenance`                                                                      |
| Modellierung            | `PROJECT_PHASE_SEQUENCE` als `readonly` Array; Reihenfolge im Array ist die Anzeigereihenfolge                                        |
| Fortschritt             | `PROJECT_PHASE_SEQUENCE.indexOf(phase) / (länge - 1)` — nichts wird gespeichert, was sich ableiten lässt                              |
| Abgeschlossene Projekte | Über `status` (`completed`, `cancelled`, `archived`), nicht über die Phase — Status und Phase sind orthogonal                         |
| Preview-Link            | Eine URL am Projekt; das Kundendashboard verlinkt sie                                                                                 |
| Zieltermin              | `next_step_label` plus `next_step_due_on` — genau das „Nächster Schritt: Erste Website-Version, 16.10.2026" aus dem Dashboard-Entwurf |
| Beträge                 | `budget_cents` und `hourly_rate_cents`; ohne eigenen Satz gilt `customers.default_hourly_rate_cents`                                  |
| Warum am Projekt        | Die Rechnung läuft perspektivisch über Lexware — die Vorschau („offene Projekte: 12.400 €") lebt aber nur hier                        |
| Löschen                 | Kein Delete/Purge in v1; Archivierung ausschließlich über Status                                                                      |
| Hartes Löschen          | Entfällt in v1; Aufräum- und Datenschutzlogik gehört in die separate Rollout-Einheit                                                  |
| Warum dieser Hinweis    | Postgres kann keine Storage-Objekte löschen. Ein Cascade allein hinterließe Blobs ohne Zuordnung                                      |

## Contract

```ts
// packages/common/src/constants/crm/project-phases.ts
export const ProjectPhase = {
  Onboarding: "onboarding",
  Design: "design",
  Development: "development",
  Feedback: "feedback",
  Launch: "launch",
  Maintenance: "maintenance",
} as const;

export type ProjectPhase = (typeof ProjectPhase)[keyof typeof ProjectPhase];

/** Reihenfolge = Anzeigereihenfolge. Zwischenschritt einfügen = eine Zeile hier + CHECK-Migration. */
export const PROJECT_PHASE_SEQUENCE = [
  ProjectPhase.Onboarding,
  ProjectPhase.Design,
  ProjectPhase.Development,
  ProjectPhase.Feedback,
  ProjectPhase.Launch,
  ProjectPhase.Maintenance,
] as const;
```

```ts
// packages/common/src/patterns/crm/project-phase-progress.ts
export function getProjectPhaseProgress(phase: ProjectPhase): {
  index: number;
  total: number;
  ratio: number;
};
```

```ts
// packages/common/src/contracts/crm/project.dto.ts
export interface ProjectDto {
  id: string;
  customerId: string;
  ownerMemberId: string;
  title: string;
  status: ProjectStatus;
  phase: ProjectPhase;
  workflowKey: WorkflowKey;
  billingModel: BillingModel;
  includedFeedbackRounds: number;
  previewUrl: string | null;
  nextStepLabel: string | null;
  nextStepDueOn: string | null; // ISO-Datum ohne Zeit
  startedOn: string | null;
  budgetCents: number | null;
  hourlyRateCents: number | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}
```

## Tabelle

```txt
projects
  id uuid PK
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  owner_member_id uuid NOT NULL → workspace_members.id ON DELETE RESTRICT
  title text NOT NULL
  status text NOT NULL DEFAULT 'planned'     CHECK in PROJECT_STATUS_VALUES
  phase text NOT NULL DEFAULT 'onboarding'   CHECK in PROJECT_PHASE_SEQUENCE
  workflow_key text NOT NULL DEFAULT 'standard_web_v1'  CHECK in WORKFLOW_KEY_VALUES
  billing_model text NOT NULL DEFAULT 'fixed_price'     CHECK in BILLING_MODEL_VALUES
  included_feedback_rounds integer NOT NULL DEFAULT 2
                                  CHECK (included_feedback_rounds BETWEEN 1 AND 20)
  preview_url text NULL
  next_step_label text NULL
  next_step_due_on date NULL
  started_on date NULL
  budget_cents integer NULL       CHECK (budget_cents >= 0)
  hourly_rate_cents integer NULL  CHECK (hourly_rate_cents >= 0)
  version integer NOT NULL DEFAULT 1
  created_at / updated_at timestamptz NOT NULL DEFAULT now()
  UNIQUE INDEX projects_id_customer_uidx ON (id, customer_id)
  INDEX (customer_id, created_at desc)
  INDEX (owner_member_id) WHERE status NOT IN ('completed','cancelled','archived')
  INDEX (phase)           WHERE status NOT IN ('completed','cancelled','archived')
```

Kein `archived_at` und kein `deleted_at`: Archivierung ist ausschließlich `status = 'archived'` und
damit reversibel. Beträge sind immer EUR-Cent; eine Währungsspalte gibt es bewusst nicht.

`projects_id_customer_uidx` ist redundant zum Primärschlüssel, aber notwendig: er ist das Ziel der
zusammengesetzten Fremdschlüssel, mit denen `tasks` (Task 11), `feedback_rounds` (Task 22),
`customer_packages` (Task 40) und `onboarding_submissions` (Task 44) ihre denormalisierte
`customer_id` gegen das Projekt absichern.

`budget_cents` bleibt der **Planwert** des Projekts. Der tatsächlich gebuchte Projektwert entsteht in
Ordner 07d aus den Positionen mit `project_id` und wird in Task 42 daneben angezeigt — beide Zahlen
sind beschriftet und werden nie vermischt.

`included_feedback_rounds` ist das Rundenkontingent aus `00-entscheidungen.md`. Es entsteht hier,
weil es zum Projekt gehört; ausgewertet wird es erst in Ordner 16.

Zusätzlich wird hier der Fremdschlüssel für `activities.project_id` nachgezogen (die Spalte entstand
in Task 01a, als `projects` noch nicht existierte):

```sql
ALTER TABLE activities ADD CONSTRAINT activities_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
```

## Tickets

### CRM-09-T1 — Phasen-Konstanten und Fortschritt

- **Files:** `packages/common/src/constants/crm/project-phases.ts` + Test,
  `packages/common/src/patterns/crm/project-phase-progress.ts` + Test
- **Skills:** `best-practices`
- **Inhalt:** Const-Objekt und Sequenz-Array wie oben; reine Funktion ohne Seiteneffekte für den
  Fortschritt
- **Akzeptanz:**
  - Test prüft: erste Phase ergibt Anteil 0, letzte 1, Reihenfolge entspricht dem Array
  - Test dokumentiert ausdrücklich, dass eine eingefügte Phase den Fortschritt automatisch neu
    verteilt (Nachweis der Erweiterbarkeit)

### CRM-09-T2 — Migration und Modell

- **Files:** `packages/db/migrations/<nr>_create_projects.sql`,
  `packages/db/src/record-configuration/crm/projects.ts`, Barrel
- **Skills:** `best-practices`
- **Inhalt:** Tabelle wie oben, CHECK über `sqlCheckIn` mit `PROJECT_PHASE_SEQUENCE`, plus der
  nachgezogene Fremdschlüssel auf `activities.project_id`
- **Akzeptanz:** Migration idempotent; unbekannte Phase und negative Beträge werden abgelehnt;
  Archivieren ist der reversible Endzustand; Projekte bleiben für Historie/Abrechnung erhalten

### CRM-09-T3 — DTOs und Mapper

- **Files:** `packages/common/src/contracts/crm/project.dto.ts`, Row-Shape,
  `apps/workspace/src/server/workspace/crm/services/projects-mapper-service.ts` + Test
- **Skills:** `best-practices`
- **Inhalt:** Mapper snake_case auf camelCase; Datumsfelder als ISO-Datum ohne Zeitanteil, Zeitstempel
  als voller ISO-String
- **Akzeptanz:** Test deckt `null`-Felder und die Datumsformatierung ab; kein `Date` im DTO

## Deploy-Sicherheit

1. **Live sichtbar:** nichts. Kein UI, keine Route, keine Verlinkung.
2. **Bricht nichts:** eine neue Tabelle, sonst keine Änderung. Kein produktiver Codepfad liest sie.
3. **Offen:** die gesamte Projekt-Oberfläche (Task 10). Da es keinen Einstiegspunkt gibt, entsteht
   kein halbfertiger Zustand.

## End-to-End-Akzeptanz

1. Migration läuft und ist wiederholbar.
2. Ein manuell eingefügtes Projekt lässt sich über den Mapper zu einem `ProjectDto` machen.
3. Der Fortschritt einer Phase berechnet sich korrekt aus der Sequenz.
4. Ein Kunde mit Projekten lässt sich archivieren, ohne verwaiste Zeilen zu hinterlassen.
5. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
