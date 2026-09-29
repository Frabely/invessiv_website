# Task 57 — Feedbackblock in der Prozessleiste und pflegbares Kontingent

> **Vor dem Start lesen:** [`README.md`](./README.md) dieses Ordners (Fachmodell, Status, Limits, Rechte, Merge-Gates),
> `../00-entscheidungen.md`, `../AGENTS.md` und die scoped `AGENTS.md` am Zielcode. Diese Task-Datei plus README sind
> vollständig; frühere Chat- oder Planstände (Task 22/23) gelten nicht.

> **Status:** offen · **Teil-PR:** 16.1 · **Branch:** `feat/crm-feedback-1-prozessblock`
> **Abhängigkeiten:** Ordner 07 (Projekte), 13 (Portal-Dashboard) gemerged · **Aufwand:** 1,5–2 T. · **Dateien:** 40–55
> **Migration:** ja, eine (Nummer im Repo ermitteln: höchste bestehende in `packages/db/migrations/` plus eins)

## Ziel

Die Prozessleiste eines Projekts bleibt Freitext wie heute. Der Mitarbeiter kann aber zusätzlich einen
**vordefinierten Schritt „Feedbackblock“** einfügen. Nur dieser Block trägt Logik: Er rendert sich als
„Feedbackrunde 1 … N“ (N = Kontingent) und wird ab Task 60 automatisch aktiv, sobald Runden existieren. Ein
Freitext-Schritt, der zufällig „Feedback“ heißt, bleibt ein normaler Schritt ohne Logik — es gibt keine
Label-Erkennung.

Außerdem wird das Feedbackrunden-Kontingent (`projects.included_feedback_rounds`) erstmals pflegbar, und ein
bestehender Bug im Projekt-Editor wird behoben.

Nach dem Merge sichtbar: Feedbackblock im Projekt-Editor, in der CRM-Projektübersicht und in der Portal-Leiste;
Kontingent editierbar. Runden gibt es noch nicht; der Blockzustand ergibt sich allein aus dem aktuellen Schritt.

## Ausgangslage im Code (geprüft am 29.09.2026)

- `packages/db/src/record-configuration/crm/projects.ts`: `process_steps TEXT[]`, `current_process_step TEXT`,
  `included_feedback_rounds INTEGER` (CHECK 1–20), `phase`. Constraint-Namen in
  `packages/db/src/constraint-names/crm/projects-constraint-names.ts`; Migration `0030_create_projects.sql`.
- `create-project.command-handler.ts` schreibt `included_feedback_rounds: 2` **fest**; das Feld fehlt in
  `CreateProjectRequestDto` (`packages/common/src/contracts/crm/create-project-request.dto.ts`), in
  `apps/workspace/src/server/workspace/crm/services/project-schemas.ts` und im Editor.
- Editor: `apps/workspace/src/components/workspace/crm/projects/customer-projects-section/customer-projects-section.tsx`
  (434 Zeilen). Schritte sind Text-Inputs mit „Entfernen“, darunter ein Eingabefeld + „Schritt hinzufügen“ (hängt an),
  darunter ein Select „Aktueller Schritt“. Kein Verschieben. Default-Schritte = `PROJECT_PHASE_SEQUENCE` →
  `content.projects.phases[value]`.
- **Bug:** Der Editor sendet beim Speichern immer `phase: ProjectPhase.Onboarding` (Zeile ~137), auch beim Bearbeiten.
  `update-project.command-handler.ts` meldet dann per `announcePhaseChange` einen Phasenwechsel als Systemnachricht an
  den Kunden.
- Anzeige: `projects/project-overview/project-overview.tsx` (CRM) und
  `components/portal/dashboard/widgets/portal-project-widget/portal-project-widget.tsx` (Portal) nutzen `ProcessTrack`
  aus `packages/ui/src/components/process-track/`. Portal-DTO: `packages/common/src/contracts/portal/portal-project.dto.ts`,
  befüllt in `server/portal/query-handler/get-portal-dashboard.query-handler.ts` +
  `server/portal/services/portal-dashboard-mapping-service.ts`.
- Es gibt keine Produktivdaten: kein Backfill.

## Entscheidungen

| Frage                                  | Entscheidung                                                                                                                                             |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Speicherung                            | `projects.feedback_block_position INTEGER NULL`. Der Block steht vor `process_steps[p]`; `p = cardinality(process_steps)` = am Ende; `NULL` = kein Block |
| Warum keine Typisierung aller Schritte | Nur ein Schritt trägt Logik. `process_steps`/`current_process_step` bleiben unverändert; alle fertigen Stellen lesen weiter Freitext                     |
| Anzahl Blöcke                          | Höchstens einer je Projekt                                                                                                                               |
| Freitext „Feedback“                    | Normaler Schritt ohne Logik. Keine Erkennung über Labels, nirgends                                                                                       |
| Block-Beschriftung                     | Nicht editierbar, lokalisiert aus dem Dictionary („Feedbackrunde {n}“) — der Block hat damit automatisch jede Sprache                                    |
| Anzahl Runden im Block                 | = `included_feedback_rounds`; der Block speichert keine eigene Zahl                                                                                      |
| Kontingent pflegbar                    | Zahlenfeld 1–20 **in der Blockzeile** des Editors (dort, wo es wirkt). Ohne Block bleibt der gespeicherte Wert unverändert                               |
| Aktueller Schritt                      | Weiterhin Freitext-Label über das Select; der Block ist dort **nicht** wählbar. Ab Task 60 wird er automatisch aktiv, sobald Runde 1 übergeben ist       |
| Block ohne Runden (dieser PR)          | Gilt als erledigt, wenn der aktuelle Schritt an Index ≥ p steht, sonst als offen                                                                         |
| Neue Projekte                          | Vorbelegt aus `PROJECT_PHASE_SEQUENCE` **ohne** `feedback`; der Block steht an dessen Stelle (vor „Launch“, also `p = 3`)                                |
| Phase beim Bearbeiten                  | Bleibt unverändert (`editing?.phase ?? ProjectPhase.Onboarding`)                                                                                         |

## Datenmodell

Migration `<nr>_add_project_feedback_block.sql`, additiv und idempotent (`--> statement-breakpoint` zwischen
Statements, Constraint über `DO $$ … IF NOT EXISTS`):

```txt
projects
  + feedback_block_position integer NULL
  + CONSTRAINT projects_feedback_block_position_check
      CHECK (feedback_block_position IS NULL
             OR feedback_block_position BETWEEN 0 AND cardinality(process_steps))
```

- Drizzle-Modell deckungsgleich; Constraint-Name als `ProjectsConstraintName.FeedbackBlockPositionCheck`.
- `packages/db/scripts/smoke-crm-constraints.ts`: Position `-1` abgelehnt; `cardinality + 1` abgelehnt; Schritte so
  kürzen, dass `p > cardinality` entstünde, abgelehnt; `NULL` und `p = cardinality` erlaubt. Den neuen Constraint in
  `packages/db/scripts/constraint-catalog.ts` ergänzen.
- **Deploy-Fenster:** Die alte App-Version kann den CHECK nur verletzen, wenn sie an einem Projekt, an dem die neue
  Version bereits einen Block gesetzt hat, Schritte entfernt. Das schlägt geschlossen fehl (Schreibfehler, keine
  Datenkorruption). Im PR dokumentieren.

## Contracts und Server

- `packages/common/src/contracts/crm/project.dto.ts`: `+ feedbackBlockPosition: number | null`.
- `create-project-request.dto.ts`: `+ includedFeedbackRounds: number`, `+ feedbackBlockPosition: number | null`.
- `project-schemas.ts`: `includedFeedbackRounds` int 1–20; `feedbackBlockPosition` int `0 … processSteps.length` oder
  `null` (in `superRefine`, Fehler `VALIDATION_ERROR`).
- `create-project.command-handler.ts`/`update-project.command-handler.ts`: beide Felder schreiben;
  `project-mapping-service.ts` mappt sie.
- Portal: neues DTO `packages/common/src/contracts/portal/portal-project-feedback-block.dto.ts`
  (`{ position: number; includedRounds: number }`), in `PortalProjectDto` als `feedbackBlock: … | null`. Kein Budget,
  keine internen Felder. Task 60 ergänzt `latestRoundNumber` und `approvedRoundNumber`.

## Pattern

- `packages/common/src/patterns/crm/project-process-track.ts`: `buildProjectProcessTrack(input)` → `{ items, currentIndex }`.
  - Eingabe: `processSteps`, `currentProcessStep`, `feedbackBlock: { position, includedRounds } | null`,
    `roundProgress?: { latestRoundNumber: number | null; approvedRoundNumber: number | null }` (ab Task 60 gefüllt),
    `roundLabel: (n: number) => string`.
  - Ausgabe: `items: Array<{ key: string; label: string; kind: "custom" | "feedback_round"; roundNumber?: number }>`
    (Freitext-Schritte + an Position p die Rundenschritte 1 … N) und `currentIndex`.
  - Konstante `ProcessTrackItemKind` in `packages/common/src/constants/crm/process-track-item-kinds.ts`.
  - Regeln: ohne Block = heutiges Verhalten. Mit Block, ohne Runden: `currentIndex` über `currentProcessStep`
    (Rundenschritte vor ihm gelten als erledigt, sonst offen). Mit Runden: Runde k aktiv. Mit Abnahme in Runde k:
    nur Runden 1 … k, Block erledigt, `currentIndex` über `currentProcessStep`.
- `apps/workspace/src/common/patterns/crm/project-process-plan.ts` (Editor-Operationen, seiteneffektfrei):
  `insertFeedbackBlock`, `moveFeedbackBlock(up|down)`, `removeFeedbackBlock`, `addCustomStep`, `removeCustomStep`,
  `renameCustomStep` — jeweils mit Positionskorrektur (Entfernen eines Schritts vor dem Block verringert p; Anfügen
  hängt **nach** dem Block an, wenn der Block am Ende steht, damit die sichtbare Reihenfolge der Eingabe entspricht).
- Tests: Block am Anfang/in der Mitte/am Ende; ohne Block; aktueller Schritt vor/nach dem Block; Entfernen/Anfügen
  korrigiert p; Rundenzahl 1 und 20; Abnahme-Fall (vorbereitet, obwohl Daten erst ab Task 60).

## UI

**Skills:** `frontend-design`, `copywriting`.

### Projekt-Editor

Der Editor wird aus `customer-projects-section.tsx` in eine eigene Komponente
`components/workspace/crm/projects/project-editor-dialog/` ausgelagert (Datei ist bereits > 400 Zeilen); die
Schrittliste wird eine eigene Komponente `projects/process-step-editor/` mit co-located `*.module.css`.

```
Prozessschritte
┌──────────────────────────────────────────────────────────────┐
│ ⋮ 1  [Onboarding                     ]           ↑ ↓  ✕      │  Freitext-Schritt
│ ⋮ 2  [Design                         ]           ↑ ↓  ✕      │
│ ⋮ 3  [Entwicklung                    ]           ↑ ↓  ✕      │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ ◆ Feedbackblock   Enthaltene Runden [ 2 ]      ↑ ↓  ✕    ┃ │  vordefinierter Block
│ ┃   Zeigt „Feedbackrunde 1–2“ und steuert die Runden.      ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│ ⋮ 5  [Launch                         ]           ↑ ↓  ✕      │
│ ⋮ 6  [Wartung                        ]           ↑ ↓  ✕      │
└──────────────────────────────────────────────────────────────┘
[ Neuer Schritt …                ] [+ Schritt hinzufügen]  [◆ Feedbackblock einfügen]
Hinweis: Freitext-Schritte sind reine Beschriftungen. Nur der Feedbackblock steuert Feedbackrunden.

Aktueller Schritt  [ Entwicklung ▾ ]   (nur Freitext-Schritte)
```

- **Zwei klar getrennte Wege zum Hinzufügen:** Eingabefeld + „Schritt hinzufügen“ (Freitext, wie heute) und ein
  eigener Button „Feedbackblock einfügen“. Existiert bereits ein Block, ist der Button nicht aktiv und nennt den Grund
  („Das Projekt hat bereits einen Feedbackblock“) als sichtbaren Text, nicht nur als Tooltip.
- **Blockzeile unverwechselbar:** Symbol, Akzentrahmen über ein bestehendes Theme-Token (`data-kind="feedback"`), feste
  Beschriftung „Feedbackblock“, kein Texteingabefeld, Zahlenfeld „Enthaltene Runden“ (1–20), Kurzbeschreibung darunter
  mit Vorschau „Feedbackrunde 1–N“.
- **Verschieben:** „↑/↓“ für alle Zeilen (neu, damit der Block an jede Stelle kann — z. B. für frühes Feedback vor
  „Design“). Tastaturbedienbar, eindeutige `aria-label`s („Feedbackblock nach oben“), Fokus bleibt auf der bewegten
  Zeile, Ansage über Live-Region („Feedbackblock steht jetzt an Position 2“).
- **Entfernen des Blocks:** mit kurzer Bestätigung. (Ab Task 58 serverseitig gesperrt, sobald Runden existieren.)
- **Aktueller Schritt:** Select listet nur Freitext-Schritte. Hinweistext: „Der Feedbackblock wird automatisch aktiv,
  sobald du Feedbackrunde 1 übergibst.“
- **Neues Projekt:** Liste vorbelegt mit Onboarding, Design, Entwicklung, **Feedbackblock (2 Runden)**, Launch,
  Wartung.
- Mobil ab 360 px: Zeilen umbrechen, Aktionsbuttons ≥ 44 px, keine horizontale Scrollbar. Dark/Light.

### Anzeige der Leiste

- `ProcessTrack` (`packages/ui`) bekommt optional `items` mit `kind`; Rundenschritte erhalten `data-kind="feedback"`
  (eigene, dezente Kennzeichnung über bestehende Tokens) — app-neutral, kein Domänenwissen im Paket. Test ergänzen.
- CRM-Projektübersicht und Portal-Projekt-Widget rendern die Leiste über `buildProjectProcessTrack`.
- Dictionaries DE/EN: Workspace (`dictionaries/workspace/crm/cockpit/*` bzw. das Projekt-Dictionary, in dem
  `projects.processSteps` liegt) und Portal (`dictionaries/portal/dashboard/*`): „Feedbackblock“, „Enthaltene Runden“,
  „Feedbackrunde {n}“, Hinweise, Fehlertexte. Portal in Du-Form.

## Bugfix

- Editor sendet beim Bearbeiten die gespeicherte Phase (`editing?.phase ?? ProjectPhase.Onboarding`).
- Regressionstest: Bearbeiten eines Projekts in Phase `development` ohne Phasenänderung erzeugt **keine**
  Systemnachricht und lässt `phase` unverändert.

## Tickets

### CRM-57-T1 — Schema

- **Files:** Migration, `record-configuration/crm/projects.ts`, `constraint-names/crm/projects-constraint-names.ts`,
  `scripts/smoke-crm-constraints.ts`
- **Akzeptanz:** Negativfälle oben; zweiter Migrationslauf folgenlos; Modell deckungsgleich

### CRM-57-T2 — Contracts und Server

- **Files:** DTOs (Projekt, Create, Portal-Block), `project-schemas.ts`, Create-/Update-Handler,
  `project-mapping-service.ts`, Portal-Dashboard-Handler + Mapping + Tests
- **Akzeptanz:** Kontingent 0 und 21 → 400; Position außerhalb → 400; veraltete `version` → 409 mit `VersionConflictDto`;
  Portal-DTO enthält Block, aber keine internen Felder

### CRM-57-T3 — Patterns

- **Files:** `project-process-track.ts`, `process-track-item-kinds.ts`, `project-process-plan.ts` + Tests
- **Akzeptanz:** alle Fälle aus „Pattern“ als Unit-Tests

### CRM-57-T4 — UI

- **Files:** `project-editor-dialog/**`, `process-step-editor/**`, `customer-projects-section.tsx` (verschlankt),
  `project-overview.tsx`, `portal-project-widget.tsx`, `packages/ui/src/components/process-track/**`, Dictionaries
- **Akzeptanz:** Block einfügen/verschieben/entfernen; zweiter Block nicht möglich (sichtbarer Grund); Kontingent
  änderbar; Leiste zeigt N Rundenschritte an Position p; Freitext „Feedback“ ohne Sonderbehandlung; Bugfix mit Test;
  Tastatur, Fokus, Live-Region, 360 px, Dark/Light

### CRM-57-T5 — Fixtures und E2E

- **Files:** `apps/workspace/src/server/tests/workspace/crm/support/crm-fixtures.ts`,
  `packages/db/scripts/crm-fixture/seed-portal-dashboard.ts` (ein Projekt mit Block), `apps/workspace/e2e/portal-dashboard.e2e.ts`
- **Akzeptanz:** Seed erzeugt ein Projekt mit Block vor „Launch“; E2E sieht „Feedbackrunde 1“ und „Feedbackrunde 2“ in
  der Portal-Leiste

## Deploy-Sicherheit

1. **Live sichtbar:** Blockzeile und „Feedbackblock einfügen“ im Editor, Kontingentfeld, Rundenschritte in beiden
   Leisten.
2. **Bricht nichts:** eine additive, nullable Spalte; bestehende Projekte ohne Block verhalten sich exakt wie vorher.
3. **Offen:** Runden selbst (ab Task 58–60). Bis dahin ist der Block eine reine Anzeige mit Kontingent.

## End-to-End-Akzeptanz

1. Ein neues Projekt hat den Feedbackblock (2 Runden) vor „Launch“; die Portal-Leiste zeigt „Feedbackrunde 1“ und
   „Feedbackrunde 2“.
2. Kontingent auf 3 → die Leisten zeigen drei Rundenschritte.
3. Block an den Anfang verschieben, speichern, neu laden → Position bleibt.
4. Ein Freitext-Schritt „Feedback“ wird wie jeder andere Schritt angezeigt.
5. Bearbeiten ändert die Phase nicht mehr; keine falsche Systemnachricht.
6. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm db:smoke:crm`,
   `pnpm --filter @invessiv/workspace build` grün.
