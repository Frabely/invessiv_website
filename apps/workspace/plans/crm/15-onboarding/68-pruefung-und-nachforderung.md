# Task 68 — Prüfung je Block, Nachforderung und Call-Agenda

> **Vor dem Start lesen:** [`README.md`](./README.md), [`63-datenmodell-und-regeln.md`](./63-datenmodell-und-regeln.md)
> (Review-Spalten an `onboarding_form_blocks`, Übergänge), [`66-portal-formular.md`](./66-portal-formular.md)
> (Portal-Guard für `changes_requested`, Transition-Service, Lese-Renderer),
> [`67-portal-gruppen-dateien-leistungen.md`](./67-portal-gruppen-dateien-leistungen.md), `../00-entscheidungen.md`,
> `../AGENTS.md`, `plans/crm/16-feedbackrunden/README.md` (Muster Sammelaufgabe), scoped `AGENTS.md` am Zielcode.

> **Status:** offen · **Teil-PR:** 15.6 · **Branch:** `feat/crm-onboarding-6-pruefung`
> **Abhängigkeiten:** Task 67 (15.5) gemerged · **Aufwand:** 2–3 T. · **Dateien:** 60–80
> **Migration:** ja, eine (`tasks.onboarding_form_id`; Nummer im Repo ermitteln)

## Ziel

Nach dem Absenden prüft das Team **jeden Block**: „vollständig“ oder „Rückfrage“. Eine Rückfrage geht entweder
**als Nachforderung zurück ans Portal** (nur diese Blöcke werden wieder editierbar, der Kunde sendet erneut ab) oder
bleibt als **Punkt für den Onboarding-Call** stehen. Beim Absenden entsteht intern eine Sammelaufgabe „Onboarding
prüfen“, damit ein abgesendeter Bogen nicht übersehen wird.

## Entscheidungen

| Bereich               | Entscheidung                                                                                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Prüfen wann           | Nur im Status `submitted`. In `changes_requested` ist die Prüfung gesperrt (der Kunde arbeitet), in `completed` endgültig                                                                                                                                                                        |
| Prüfen was            | Je Block `review_status` (`pending`, `complete`, `clarification`); bei `clarification` Pflicht: `clarification_mode` (`customer` = Nachforderung, `call` = Call-Agenda) und Notiz (max. 2 000)                                                                                                   |
| Schreibweg            | `PATCH /api/workspace/crm/onboarding/forms/[formId]/blocks/[blockId]/review` mit `expectedVersion` der Blockzeile → `updateVersioned` auf `onboarding_form_blocks` (Spalte `version` aus Task 63)                                                                                                |
| Nachforderung senden  | `POST …/forms/[formId]/request-changes` mit `expectedVersion` des Bogens. Voraussetzung: mindestens ein Block mit `clarification` + `customer`. Übergang `submitted → changes_requested`, Activity `status_change`, Chat-Systemnachricht mit den Blocktiteln („Wir brauchen noch etwas zu: …“)   |
| Im Portal             | In `changes_requested` sind nur die nachgeforderten Blöcke editierbar (Guard aus Task 66). Der Bogen startet auf dem ersten davon; jeder zeigt oben die Notiz des Teams. Übrige Blöcke lesend                                                                                                    |
| Erneutes Absenden     | `changes_requested → submitted` über denselben Submit-Endpunkt (Task 66). Pflichtprüfung wie immer über den ganzen Bogen. Die nachgeforderten Blöcke fallen auf `pending` zurück (Notiz bleibt als Verlauf in der Activity), alle anderen behalten ihr Ergebnis                                  |
| Call-Agenda           | Tab „Prüfung“ zeigt oben eine Agenda: alle Blöcke mit `clarification` + `call` samt Notiz, dazu Hinweise „Leistungen seit Bestätigung geändert“ und „Anmerkung des Kunden zu den Leistungen“. Kopierschaltfläche „Agenda kopieren“ (reiner Text)                                                 |
| Sammelaufgabe         | Erstes Absenden legt eine interne Aufgabe an (`action_side = internal`, nicht kundensichtbar, Titel aus `workspace/crm/tasks`-Dictionary in `DEFAULT_LOCALE`, Zuständig: Projekt-Owner, sonst Kunden-Owner, sonst niemand). Genau eine je Bogen                                                  |
| Aufgabe weiterführen  | Nachforderung: unverändert offen. Erneutes Absenden: keine zweite Aufgabe. Abschluss (Task 70): `open`/`in_progress` → `done`. Eine von Hand geänderte Aufgabe wird nie überschrieben (Muster `feedback-round-task-service.moveTask`)                                                            |
| Zuständigen ermitteln | Die private Funktion `findActiveAssignee` aus `feedback-round-task-service.ts` wird in einen geteilten Service `src/server/shared/services/project-responsible-member-service.ts` extrahiert (Projekt-Owner → Kunden-Owner, nur aktive Mitglieder). Feedback, dieser Task und Task 69 nutzen ihn |
| Übersicht intern      | Projektbereich und Bogenkopf zeigen „x von y Blöcken geprüft“ und „z Rückfragen“ (reine Ableitung aus den Review-Spalten, Funktion `summarizeOnboardingReview` in `packages/common/src/patterns/crm/onboarding/`)                                                                                |
| Kein eigener Eingang  | Kein zusätzlicher Eingangsbildschirm wie bei den Feedbackrunden: Die Sammelaufgabe erscheint in den bestehenden Aufgabenlisten und im Dashboard „fällige Aufgaben“ — das reicht für wenige Bögen gleichzeitig                                                                                    |

## Migration

`<nr>_add_task_onboarding_form.sql` (Muster der Feedback-Erweiterung von `tasks`):

```txt
tasks
+ onboarding_form_id uuid NULL
+ FK tasks_onboarding_form_project_fk (onboarding_form_id, project_id) → onboarding_forms (id, project_id)
+ UNIQUE tasks_onboarding_form_uidx (onboarding_form_id) WHERE onboarding_form_id IS NOT NULL
+ CHECK tasks_onboarding_form_side_check (onboarding_form_id IS NULL OR action_side = 'internal')
+ CHECK tasks_single_origin_check (num_nonnulls(feedback_round_id, onboarding_form_id) <= 1)
```

Drizzle (`tasks.ts`), Constraint-Namen (`tasks-constraint-names.ts`), `TaskDto` `+ onboardingFormId: string | null`,
Smoke-Negativfälle. Der FK hat kein `ON DELETE CASCADE` (Bögen werden nur per Kunden-Purge gelöscht; der Purge in
Ordner 21 berücksichtigt die Reihenfolge).

## Architektur

```txt
Workspace-API
  PATCH /api/workspace/crm/onboarding/forms/[formId]/blocks/[blockId]/review   projects.write + canOn
  POST  /api/workspace/crm/onboarding/forms/[formId]/request-changes           projects.write + canOn

Server
  src/server/shared/services/project-responsible-member-service.ts   (extrahiert, s. o.)
  src/server/shared/services/onboarding/
    onboarding-review-service.ts          Block prüfen (Status-Guard, Invarianten), Nachforderung
    onboarding-task-service.ts            Sammelaufgabe anlegen/weiterführen (Muster feedback-round-task-service)
    onboarding-form-transition-service.ts submit: + Aufgabe anlegen + nachgeforderte Blöcke auf pending;
                                          request-changes: Übergang + Systemnachricht
  command-handler/ review-onboarding-block, request-onboarding-changes

CRM-UI  src/components/workspace/crm/onboarding/review/
  onboarding-review-tab/          ?tab=review; Agenda oben, darunter Blockkarten in Bogenreihenfolge
  onboarding-review-block-card/   Antworten des Blocks (Lese-Renderer aus Task 66/67) + Prüfleiste
  onboarding-review-controls/     Status-Segmente, Klärungsart, Notiz (FormField textarea), Speichern
  onboarding-call-agenda/         Liste + „Agenda kopieren“
  onboarding-request-changes-dialog/  ConfirmDialog mit Liste der nachgeforderten Blöcke und ihren Notizen

Portal-UI (Ergänzung)
  onboarding-form-view: Modus „Nachforderung“ (Start auf erstem editierbaren Block, Notiz-Hinweis je Block)
  portal-onboarding-widget: Zustand „Wir haben Rückfragen · Jetzt ergänzen“
```

## Tickets

### CRM-68-T1 — Migration, Zuständigen-Service, Sammelaufgabe

- **Files:** Migration, `tasks.ts`, Constraint-Namen + Test, `TaskDto`/Mapper, `project-responsible-member-service`
  (+ Umstellung `feedback-round-task-service`), `onboarding-task-service`, Transition-Service, Tests
- **Skills:** `best-practices`, `test-driven-development`
- **Akzeptanz:**
  - Erstes Absenden legt genau eine interne Aufgabe an; erneutes Absenden keine zweite (Test)
  - Zuständig: Projekt-Owner, inaktiv → Kunden-Owner, beide inaktiv → ohne Zuständigen (Tests)
  - Feedback-Sammelaufgaben verhalten sich nach dem Extrahieren unverändert (bestehende Tests grün)
  - Kundensichtbare Aufgabe mit `onboarding_form_id` → CHECK lehnt ab (Smoke)

### CRM-68-T2 — Prüfen und Nachfordern (Server)

- **Files:** Review-Service, Handler, Routen, `CRM_ENDPOINT_ACCESS_RULES`, `CrmOperation`, Fehlercodes,
  `summarizeOnboardingReview` + Test, Tests
- **Skills:** `best-practices`
- **Akzeptanz:**
  - Prüfen außerhalb von `submitted` → 409 `ONBOARDING_INVALID_TRANSITION`
  - `clarification` ohne Klärungsart oder Notiz → 422
  - Nachforderung ohne Block `clarification` + `customer` → 422 `ONBOARDING_REVIEW_INCOMPLETE`
  - Nach Nachforderung kann der Kunde nur die nachgeforderten Blöcke ändern (Portal-Negativtest mit echter Session)
  - Erneutes Absenden setzt genau die nachgeforderten Blöcke auf `pending`
  - Negativtests fremder Kunde, fremdes Projekt, ohne `projects.write`; Versionskonflikt → 409 mit `VersionConflictDto`

### CRM-68-T3 — Prüf-Tab, Agenda, Portal-Nachforderung

- **Files:** `review/*`, Bogenseite (Tab), Projektbereich (Prüfstand), Portal-Anpassungen, Dictionaries, Tests
- **Skills:** `frontend-design`, `best-practices`, `copywriting`
- **Akzeptanz:**
  - Prüfstand „x von y geprüft“ und Rückfragenzahl stimmen mit `summarizeOnboardingReview` überein
  - Agenda enthält nur Call-Rückfragen und die Leistungshinweise; Kopieren liefert reinen Text
  - Portal zeigt die Teamnotiz am nachgeforderten Block; andere Blöcke sind sichtbar, aber nicht editierbar
  - Tastatur, Fokus, Kontrast, Dark/Light, mobil

## Merge-Gate 15.6

- [ ] Prüfen, Nachfordern, erneutes Absenden und Call-Agenda vollständig; E2E „Absenden → Rückfrage an Kunden →
      Ergänzen → erneut absenden → alles vollständig“.
- [ ] Sammelaufgabe entsteht genau einmal; Feedback-Aufgaben unverändert.
- [ ] Alle neuen Endpunkte in `CRM_ENDPOINT_ACCESS_RULES` mit Negativtests.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes, Workspace-Build grün.
