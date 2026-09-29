# Task 57 — Einzelne Feedbackrunden in der Prozessleiste

> **Vor dem Start lesen:** [`README.md`](./README.md) dieses Ordners (Fachmodell, Status, Limits, Rechte, Merge-Gates),
> `../00-entscheidungen.md`, `../AGENTS.md` und die scoped `AGENTS.md` am Zielcode. Diese Task-Datei plus README sind
> vollständig; frühere Chat- oder Planstände (Task 22/23) gelten nicht.

> **Status:** im Review · **Teil-PR:** 16.1 · **Branch:** `feat/crm-feedback-1-prozessblock`
> **Abhängigkeiten:** Ordner 07 (Projekte), 13 (Portal-Dashboard) gemerged · **Aufwand:** 1,5–2 T. · **Dateien:** 60–75
> **Migration:** ja, eine (`0044_add_project_feedback_rounds.sql`)

> **Neuzuschnitt 29.09.2026 (mit dem Owner abgestimmt):** Der erste Entwurf (ein Feedbackblock mit Rundenzahl) ist
> verworfen. Runden werden **einzeln** an beliebiger Stelle eingefügt: zwei Runden zwischen „Entwicklung“ und „Launch“
> sind zwei Klicks auf „+ Runde“, eine weitere zwischen „Design“ und „Entwicklung“ ein dritter.

## Ziel

Die Prozessleiste eines Projekts bleibt Freitext wie heute. Zusätzlich fügt der Mitarbeiter **einzelne
Feedbackrunden-Schritte** ein — je Klick genau eine Runde, hinter jeder beliebigen Zeile. Nur Rundenschritte tragen
Logik: Sie erscheinen als „Feedbackrunde n“ (n = Reihenfolge in der Leiste) und werden ab Task 60 automatisch aktiv,
sobald eine Runde läuft. Ein Freitext-Schritt, der zufällig „Feedback“ heißt, bleibt ein normaler Schritt ohne Logik —
es gibt keine Label-Erkennung.

Das Kontingent ist die Anzahl der Rundenschritte; es gibt kein separates Zahlenfeld. Außerdem wird ein bestehender Bug
im Projekt-Editor behoben.

Nach dem Merge sichtbar: Rundenschritte im Projekt-Editor, in der CRM-Projektübersicht und in der Portal-Leiste.
Runden selbst gibt es noch nicht; ob ein Rundenschritt erledigt ist, ergibt sich allein aus dem aktuellen Schritt.

## Entscheidungen

| Frage                            | Entscheidung                                                                                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Speicherung                      | `projects.feedback_round_positions INTEGER[]`: je Runde ein Eintrag, aufsteigend; die Runde steht vor `process_steps[p]`, `p = cardinality` = am Ende |
| Altzeilen                        | Spalte nullable, `NULL` = keine Runden (alte App-Version schreibt die Spalte nicht). Mapper liefert `[]`; neue Schreibpfade schreiben immer ein Array |
| Anzahl                           | 0–20; mehrere Runden an derselben Stelle erlaubt                                                                                                      |
| Nummerierung                     | Aus der Reihenfolge. Der Server sortiert die Positionen beim Speichern                                                                                |
| Kontingent                       | `included_feedback_rounds = cardinality(feedback_round_positions)`, vom Server geschrieben; CHECK `projects_feedback_rounds_match_check` erzwingt es  |
| Kontingent-CHECK                 | `projects_feedback_rounds_check` von 1–20 auf 0–20 erweitert (additiv erlaubt), weil ein Projekt keine Runde haben darf                               |
| Freitext „Feedback“              | Normaler Schritt ohne Logik. Keine Erkennung über Labels, nirgends                                                                                    |
| Beschriftung                     | Nicht editierbar, lokalisiert aus dem Dictionary („Feedbackrunde {number}“)                                                                           |
| Aktueller Schritt                | Weiterhin Freitext-Label über das Select; Rundenschritte sind dort **nicht** wählbar                                                                  |
| Rundenschritt ohne Runden (16.1) | Gilt als erledigt, wenn der aktuelle Schritt dahinter steht, sonst als offen                                                                          |
| Neue Projekte                    | Vorbelegt aus `PROJECT_PHASE_SEQUENCE` **ohne** `feedback`; an dessen Stelle (vor „Launch“) zwei einzelne Rundenschritte (`[3, 3]`)                   |
| Phase beim Bearbeiten            | Bleibt unverändert (gespeicherte Phase wird mitgesendet)                                                                                              |

## Datenmodell

Migration `0044_add_project_feedback_rounds.sql`, additiv und idempotent:

```txt
projects
  + feedback_round_positions integer[] NULL
  + CONSTRAINT projects_feedback_round_positions_check
      CHECK (feedback_round_positions IS NULL OR (
             cardinality(feedback_round_positions) <= 20
         AND array_position(feedback_round_positions, NULL) IS NULL
         AND 0 <= ALL (feedback_round_positions)
         AND cardinality(process_steps) >= ALL (feedback_round_positions)))
  ~ CONSTRAINT projects_feedback_rounds_check  CHECK (included_feedback_rounds BETWEEN 0 AND 20)   -- erweitert
  + CONSTRAINT projects_feedback_rounds_match_check
      CHECK (feedback_round_positions IS NULL OR cardinality(feedback_round_positions) = included_feedback_rounds)
```

- Drizzle-Modell deckungsgleich; Namen in `ProjectsConstraintName`.
- Smoke (`smoke-crm-constraints.ts`): `NULL`, `[]`, mehrere Lücken und doppelte Position erlaubt; `-1`, Position hinter
  dem Ende, 21 Runden, abweichende Rundenzahl und Kürzen der Schritte unter eine Runde abgelehnt.
- **Deploy-Fenster:** Die alte App-Version schreibt die Spalte nicht (bleibt `NULL` bzw. unverändert). Sie kann den
  CHECK nur verletzen, wenn sie an einem Projekt mit Rundenschritten Schritte entfernt; das schlägt geschlossen fehl.

## Contracts und Server

- `ProjectDto`: `+ feedbackRoundPositions: number[]`.
- `CreateProjectRequestDto`: `+ feedbackRoundPositions: number[]` (kein `includedFeedbackRounds` im Request).
- `project-schemas.ts`: Array aus Ganzzahlen ≥ 0, höchstens 20, jede ≤ `processSteps.length` (`superRefine`),
  sortiert per `transform`.
- Create-/Update-Handler schreiben beide Spalten; `project-mapping-service.ts` mappt `NULL` → `[]` (mit Test).
- Portal: `PortalProjectDto.feedbackRoundPositions: number[]`; keine internen Felder. Task 60 ergänzt den
  Rundenfortschritt.

## Pattern

- `packages/common/src/patterns/crm/project-process-track.ts`:
  - `buildProjectProcessTrack({ processSteps, currentProcessStep, feedbackRoundPositions, roundProgress?, roundLabel })`
    → `{ items, currentIndex }`. `roundProgress = { activeRoundNumber, completedRoundNumber, approvedRoundNumber }`
    (Contract `ProjectFeedbackRoundProgress`, ab Task 60 gefüllt).
  - Regeln: laufende Runde ist aktuell; sonst gilt `currentProcessStep`, aber nie vor der zuletzt abgeschlossenen bzw.
    abgenommenen Runde; nach Abnahme in Runde k verschwinden Runden > k.
  - `toProcessTrackSteps(items)` für `ProcessTrack` (Runden mit `variant: accent`).
- `apps/workspace/src/common/patterns/crm/project-process-plan.ts` (Editor, seiteneffektfrei): `createDefaultProcessPlan`,
  `toProcessPlanRows`, `insertFeedbackRoundAfter(rowIndex)`, `removeFeedbackRound(roundNumber)`,
  `moveProcessPlanRow(rowIndex, up|down)`, `addCustomStep`, `removeCustomStep`, `renameCustomStep`. Intern als
  Zeilenliste, aus der die Positionen neu abgeleitet werden (Position = Anzahl Freitext-Schritte darüber).
- `project-form.ts`: Formularwerte ↔ Request; sendet die gespeicherte Phase mit.

## UI

**Skills:** `frontend-design`, `copywriting`.

```
Prozessschritte
💬 3 Feedbackrunden eingeplant.
 1 [Onboarding          ]   ↑ ↓ [+ Runde] ✕
 2 [Design              ]   ↑ ↓ [+ Runde] ✕
┃💬 Feedbackrunde 1         ↑ ↓ [+ Runde] ✕     ← einzelner Rundenschritt (Akzentrahmen)
 4 [Entwicklung         ]   ↑ ↓ [+ Runde] ✕
┃💬 Feedbackrunde 2         ↑ ↓ [+ Runde] ✕
┃💬 Feedbackrunde 3         ↑ ↓ [+ Runde] ✕
 7 [Launch              ]   ↑ ↓ [+ Runde] ✕
[ Neuer Schritt …         ] [+ Schritt hinzufügen]
Freitext-Schritte sind reine Beschriftungen. Mit „Runde“ fügst du nach einem Schritt genau eine Feedbackrunde ein …

Aktueller Prozessschritt [ Entwicklung ▾ ]   (nur Freitext-Schritte)
```

- Editor aus `customer-projects-section.tsx` in `projects/project-editor-dialog/` ausgelagert; Liste in
  `projects/process-step-editor/` mit co-located `*.module.css`.
- **„+ Runde“ je Zeile** fügt genau eine Runde direkt darunter ein; zugänglicher Name „Feedbackrunde nach {Schritt}
  einfügen“. Bei 20 Runden deaktiviert, Grund sichtbar über der Liste.
- **Rundenzeilen unverwechselbar:** Akzentrahmen (`--color-accent-warm`), Symbol, feste Beschriftung, kein
  Eingabefeld, `data-kind="feedback"`. Entfernen ohne Rückfrage (vor dem Speichern reversibel; übergebene Runden
  sperrt ab Task 58 der Server).
- **Verschieben:** ↑/↓ für alle Zeilen; Fokus folgt der Zeile, Ansage über Live-Region.
- **Anzahl** der Runden steht über der Liste („3 Feedbackrunden eingeplant.“).
- **Aktueller Schritt:** Select listet nur Freitext-Schritte; der Hinweis liegt außerhalb des Labels und hängt über
  `aria-describedby`.
- Mobil (< 36rem): Aktionen rutschen unter die Beschriftung; Buttons ≥ 44 px; keine horizontale Scrollbar.
- `ProcessTrack` (`packages/ui`) nimmt neben Strings Schrittobjekte `{ key, label, variant }`; `variant: accent` →
  `data-variant="accent"`, warmer Akzent — app-neutral.
- CRM-Übersicht und Portal-Widget rendern die Leiste über `buildProjectProcessTrack`; Klick auf einen Rundenschritt in
  der CRM-Leiste öffnet den Editor ohne Schrittvorauswahl.

## Bugfix

- Editor sendet beim Bearbeiten die gespeicherte Phase statt immer `onboarding`; Regressionstests in `project-form`
  und `project-editor-dialog`.

## Tickets

- **CRM-57-T1 Schema:** Migration, Modell, Constraint-Namen, Smoke.
- **CRM-57-T2 Contracts und Server:** DTOs, Schema, Handler, Mapper (+ Test), Portal-Dashboard-Query und -Mapping
  (+ Tests).
- **CRM-57-T3 Patterns:** Track, Editor-Plan, Formular (+ Tests), Konstanten (+ Tests).
- **CRM-57-T4 UI:** Editor-Dialog, Schritt-Editor, Übersicht, Portal-Widget, `ProcessTrack`, Dictionaries DE/EN
  (+ Tests).
- **CRM-57-T5 Fixtures und E2E:** `db:seed:crm` (Website-Relaunch: eine Runde nach „Design“, zwei vor „Launch“),
  Portal-E2E-Fixture und Test für die Portal-Leiste.

## End-to-End-Akzeptanz

1. Ein neues Projekt hat zwei Rundenschritte vor „Launch“; die Portal-Leiste zeigt „Feedbackrunde 1“ und „2“.
2. „+ Runde“ hinter „Design“ → die Leisten zeigen dort „Feedbackrunde 1“, die beiden anderen werden 2 und 3.
3. Eine Runde verschieben, speichern, neu laden → Position bleibt.
4. Ein Freitext-Schritt „Feedback“ wird wie jeder andere Schritt angezeigt.
5. Bearbeiten ändert die Phase nicht mehr; keine falsche Systemnachricht.
6. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm db:smoke:crm`,
   `pnpm --filter @invessiv/workspace build` grün.
