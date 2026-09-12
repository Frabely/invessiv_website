# Task 09 — Projekte Datenmodell

> **Branch:** `feat/crm-projekte-datenmodell`
> **Aufwand:** S (rund ein halber Tag)
> **Abhängigkeiten:** Task 01
> **Migration:** `0025_create_projects.sql` (Planwert)

## Context

Ein Kunde kann mehrere Aufträge haben: Website 2024, Relaunch 2026, laufende Betreuung. Projekte sind
die Ebene, an der Phase, Zieltermin, Preview-Link, Aufgaben, Dateien und Feedbackrunden hängen.

Wie bei Task 01: nur Schema, Konstanten, DTOs und Mapper. Kein UI, keine Route — das folgt in Task 10.

Die Phasenliste bestimmt später direkt die Fortschrittsanzeige im Kundendashboard. Sie wird deshalb
**als Array** modelliert und nicht als nummerierte Werte: Der Fortschritt ergibt sich aus dem Index,
ein Zwischenschritt ist eine eingefügte Zeile — ohne Umnummerierung bestehender Daten.

## Entscheidungen

| Bereich                 | Entscheidung                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Phasen                  | `onboarding, design, development, feedback, launch, maintenance`                                                                      |
| Modellierung            | `PROJECT_PHASE_SEQUENCE` als `readonly` Array; Reihenfolge im Array ist die Anzeigereihenfolge                                        |
| Fortschritt             | `PROJECT_PHASE_SEQUENCE.indexOf(phase) / (länge - 1)` — nichts wird gespeichert, was sich ableiten lässt                              |
| Abgeschlossene Projekte | Eigenes Feld `archived_at`, nicht als Phase — „abgeschlossen" ist orthogonal zur Phase                                                |
| Preview-Link            | Eine URL am Projekt; das Kundendashboard verlinkt sie                                                                                 |
| Zieltermin              | `next_step_label` plus `next_step_due_on` — genau das „Nächster Schritt: Erste Website-Version, 16.10.2026" aus dem Dashboard-Entwurf |
| Löschen                 | `ON DELETE CASCADE` vom Kunden; Projekte selbst löschen ist möglich und nimmt Aufgaben und Dateien mit                                |

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
  title: string;
  phase: ProjectPhase;
  previewUrl: string | null;
  nextStepLabel: string | null;
  nextStepDueOn: string | null; // ISO-Datum ohne Zeit
  startedOn: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## Tabelle

```txt
projects
  id uuid PK
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  title text NOT NULL
  phase text NOT NULL DEFAULT 'onboarding'   CHECK in PROJECT_PHASE_SEQUENCE
  preview_url text NULL
  next_step_label text NULL
  next_step_due_on date NULL
  started_on date NULL
  archived_at timestamptz NULL
  created_at / updated_at timestamptz NOT NULL DEFAULT now()
  INDEX (customer_id, created_at desc)
  INDEX (phase) WHERE archived_at IS NULL
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

- **Files:** `packages/db/migrations/0025_create_projects.sql`,
  `packages/db/src/record-configuration/crm/projects.ts`, Barrel
- **Skills:** `best-practices`
- **Inhalt:** Tabelle wie oben, CHECK über `sqlCheckIn` mit `PROJECT_PHASE_SEQUENCE`
- **Akzeptanz:** Migration idempotent; unbekannte Phase wird abgelehnt; Löschen eines Kunden entfernt
  seine Projekte

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
4. Ein Kunde mit Projekten lässt sich löschen, ohne verwaiste Zeilen zu hinterlassen.
5. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
