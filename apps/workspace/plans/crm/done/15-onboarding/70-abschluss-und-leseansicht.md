# Task 70 — Onboarding abschließen und dauerhafte Leseansicht

> **Vor dem Start lesen:** [`README.md`](./README.md), [`63-datenmodell-und-regeln.md`](./63-datenmodell-und-regeln.md)
> (`onboarding_form_services`, CHECK für `completed`), [`65-bogen-anlegen-und-anpassen.md`](./65-bogen-anlegen-und-anpassen.md)
> (Read-Service, Vorbefüllung), [`66-portal-formular.md`](./66-portal-formular.md) (Transition-Service,
> Lese-Renderer), [`68-pruefung-und-nachforderung.md`](./68-pruefung-und-nachforderung.md) (Sammelaufgabe,
> Call-Agenda), `../00-entscheidungen.md`, `../AGENTS.md`, scoped `AGENTS.md` am Zielcode.

> **Status:** auf `master` (direkte Commits `6425fdb4`, `ceacc151`; kein Merge-Commit) · **Teil-PR:** 15.8 · **Geplanter Branch:** `feat/crm-onboarding-8-abschluss`
> **Abhängigkeiten:** Task 69 (15.7) auf `master` · **Aufwand:** 1–2 T. · **Dateien:** 45–65
> **Migration:** keine

## Ziel

Wenn alle Pflichtangaben da sind und der Onboarding-Call stattgefunden hat, schließt das Team das Onboarding ab. Der
Bogen wird danach **dauerhaft nur lesbar mit allen Anhängen** — in Portal und CRM — und ist die Arbeitsgrundlage des
Projekts. Die vereinbarten Leistungen werden in diesem Moment eingefroren. Der abgeschlossene Bogen ist ab dann die
Quelle für die Vorbefüllung des nächsten Projekts desselben Kunden (Logik aus Task 65, hier erstmals wirksam).

## Entscheidungen

| Bereich               | Entscheidung                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Abschließen wann      | Nur aus `submitted` (Übergang aus Task 63). Nicht aus `open` oder `changes_requested`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Voraussetzungen       | (1) Keine fehlenden sichtbaren Pflichtangaben laut `getQuestionnaireCompleteness` (serverseitig) → sonst 422 `ONBOARDING_REQUIRED_MISSING` mit Liste; (2) Call-Datum gesetzt, nicht in der Zukunft → sonst 422 `ONBOARDING_CALL_DATE_REQUIRED`                                                                                                                                                                                                                                                                                                                                                                  |
| Ungeprüfte Blöcke     | Blockieren nicht. Der Abschlussdialog nennt „x Blöcke ungeprüft, y Call-Punkte“ als Hinweis (aus `summarizeOnboardingReview`, Task 68); ihr Stand bleibt als Verlauf erhalten                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Request               | `POST /api/workspace/crm/onboarding/forms/[formId]/complete` mit `{ expectedVersion, callHeldOn: "YYYY-MM-DD", advancePhase: boolean }`, `projects.write` + `canOn`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Eine Transaktion      | Bogen sperren (`FOR UPDATE`), Voraussetzungen prüfen, Leistungs-Snapshot schreiben, Status `completed` + `completed_at/_by` + `call_held_on` über `updateLockedVersioned`, Sammelaufgabe → `done` (Task 68, nur aus `open`/`in_progress`), optional Phase weiterschalten, Activity `status_change`, Chat-Systemnachricht                                                                                                                                                                                                                                                                                        |
| Leistungs-Snapshot    | Alle Projektleistungen, die der Read-Service in diesem Moment zeigt (`ONBOARDING_VISIBLE_LINE_ITEM_STATUS_VALUES`), mit Titel, Beschreibung und der Reihenfolge wie im Projekt in `onboarding_form_services`. Ab dann liest der Read-Service **nur** den Snapshot; spätere Leistungsanfragen erscheinen nicht im Bogen                                                                                                                                                                                                                                                                                          |
| Phase weiterschalten  | Checkbox im Dialog, Standard an. Nur wenn `projects.phase = onboarding`: Phase → `design`; `current_process_step` rückt auf den nächsten Schritt, wenn der aktuelle Schritt der erste Schritt des Prozessplans ist. Neuer Service `onboarding-project-step-service.ts` nach Muster `feedbackProjectStepService`; die Chat-Ankündigung des Phasenwechsels nutzt dieselbe Funktion wie `update-project.command-handler.ts` (`announcePhaseChange` ist heute eine lokale Funktion in `update-project.command-handler.ts` und wird dafür in einen geteilten Service unter `src/server/shared/services/` extrahiert) |
| Unveränderlich        | Nach `completed` lehnen alle Portal- und alle internen Schreibpfade des Bogens ab (Struktur, Antworten, Dateien, Prüfung) → 409. Kein Wiederöffnen                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Dateien               | Verknüpfte Dateien bleiben durch `FILE_ONBOARDING_BOUND` (Task 67) vor dem Löschen geschützt; Kunden-Purge (Ordner 21) ist die einzige Ausnahme                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Portal nach Abschluss | Navigation „Onboarding“ bleibt; Bogen in der Leseansicht (Lese-Renderer aus Task 66/67), Kopf „Abgeschlossen am … · Das ist die Grundlage für dein Projekt“; Hinweis, dass weitere Dateien über den Dateibereich oder den Chat kommen (Links nur mit den jeweiligen Portal-Permissions)                                                                                                                                                                                                                                                                                                                         |
| Widget nach Abschluss | Zustand „Abgeschlossen am … · Ansehen“ (Task 67 hat den Zustand vorgesehen), Terminkarte verschwindet (Task 69)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| CRM nach Abschluss    | Bogenseite: Tab „Antworten“ ist Standard; Aufbau und Prüfung lesend; Kopf zeigt Call-Datum und Abschluss; Projektbereich „Abgeschlossen am …“                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Architektur

```txt
Workspace-API
  POST /api/workspace/crm/onboarding/forms/[formId]/complete

Server
  src/server/shared/services/onboarding/
    onboarding-form-transition-service.ts   + complete
    onboarding-services-snapshot-service.ts Snapshot schreiben; Read-Service wählt Snapshot vs. live
    onboarding-project-step-service.ts      advancePastOnboarding (Muster feedbackProjectStepService)
  src/server/workspace/crm/command-handler/complete-onboarding-form.command-handler.ts
  Guards: alle Schreibpfade aus Task 64 (Bogen-Varianten), 65, 66, 67, 68 prüfen `completed` zentral über
          onboarding-form-access-service (intern) bzw. portal-onboarding-service (Portal) — kein verstreuter Check

CRM-UI  src/components/workspace/crm/onboarding/form/
  onboarding-complete-dialog/     Call-Datum (Datumsfeld), Phase-Checkbox, Hinweise (ungeprüft, Call-Punkte,
                                  fehlende Pflichtangaben mit Sprung in den Tab „Antworten“)
Portal-UI
  onboarding-form-view: Zustand „abgeschlossen“; portal-onboarding-widget: Zustand „abgeschlossen“
```

## Tickets

### CRM-70-T1 — Abschließen (Server)

- **Files:** Transition-Service, Snapshot-Service, Projekt-Schritt-Service, Handler, Route,
  `CRM_ENDPOINT_ACCESS_RULES`, Fehlercodes, zentrale `completed`-Guards, Tests
- **Skills:** `best-practices`, `test-driven-development`
- **Akzeptanz:**
  - Fehlende Pflichtangabe → 422 mit Liste; fehlendes oder zukünftiges Call-Datum → 422
  - Abschluss schreibt Snapshot, Status, Aufgabe `done`, optional Phase `design` — alles oder nichts (Rollback-Test)
  - Phase ist nicht `onboarding` → Phase bleibt unverändert, Abschluss gelingt
  - Nach Abschluss: jeder Schreibpfad (Portal und intern) → 409 (Negativtest je Endpunkt-Gruppe)
  - Neue Projektleistung nach Abschluss erscheint nicht im Bogen (Test)
  - Folgeprojekt desselben Kunden: „Onboarding starten“ übernimmt `carry_over`-Blöcke aus diesem Bogen (E2E-naher
    Integrationstest)
  - Negativtests fremder Kunde, fremdes Projekt, ohne `projects.write`

### CRM-70-T2 — Abschlussdialog und Leseansichten

- **Files:** `onboarding-complete-dialog`, Bogenseite, Projektbereich, Portal-Formularansicht, Widget, Dictionaries,
  Tests
- **Skills:** `frontend-design`, `best-practices`, `copywriting`
- **Akzeptanz:**
  - Dialog zeigt Hinweise und blockiert nur bei den zwei harten Voraussetzungen
  - Portal-Leseansicht zeigt alle Antworten und Anhänge (Download/Lightbox wie im Dateibereich)
  - Widget-Zustand „abgeschlossen“ führt in die Leseansicht; keine Schreibaktionen sichtbar
  - Tastatur, Fokus, Kontrast, Dark/Light, mobil

## Merge-Gate 15.8

- [ ] E2E des gesamten Ablaufs: Starten → Freigeben → Ausfüllen → Absenden → Nachforderung → erneut absenden →
      Prüfen → Call-Datum → Abschließen → Leseansicht in Portal und CRM → Folgeprojekt vorbefüllt.
- [ ] Abgeschlossener Bogen über keinen Pfad änderbar; Leistungsliste eingefroren.
- [ ] README dieses Ordners, `00-entscheidungen.md` (Statustabelle) und `core-features.md` auf „gemerged“ bzw.
      aktuellen Stand gebracht.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes, Workspace-Build grün.

## Umsetzungsnotizen (02.10.2026)

Abweichungen und Entscheidungen bei der Umsetzung, jeweils mit dem, was es kostet, falls sie falsch sind.

### T1 — Abschließen (Server)

- **Kein neuer `completed`-Guard.** Die Planvorgabe „zentral über `onboarding-form-access-service` bzw.
  `portal-onboarding-service`“ ist bereits erfüllt: Strukturbefehle laufen über `lockForStructure`
  (`isOnboardingStructureEditable`), Prüfung und Statuswechsel über `isOnboardingReviewOpen` bzw.
  `canTransitionOnboardingForm`, alle Portal-Schreibpfade über `findWritableField`/`listEditableBlockIds`
  (`listCustomerEditableOnboardingBlockIds`). Keine dieser Regeln lässt `completed` zu. Ein zusätzlicher Schalter
  wäre eine zweite Wahrheit gewesen. Abgesichert durch Negativtests je Endpunkt-Gruppe. Kosten, falls falsch: ein
  künftiger Schreibpfad, der an diesen Funktionen vorbeigeht, wäre nicht automatisch gesperrt.
- **Fehlercodes nach Abschluss:** Strukturbefehle antworten `ONBOARDING_NOT_EDITABLE`, Prüfung und Statuswechsel
  `ONBOARDING_INVALID_TRANSITION`, das Portal `locked` — alle 409, wie der Plan verlangt.
- **Call-Datum:** Der Request trägt `callHeldOn` als Zeichenkette; leer, kein echter Kalendertag oder in der Zukunft
  antwortet einheitlich `ONBOARDING_CALL_DATE_REQUIRED` (422), nicht `VALIDATION_ERROR`. „Nicht in der Zukunft“
  heißt: nicht nach dem heutigen Tag in der Geschäftszeitzone (`businessToday()`), wie bei Aufgaben und
  Feedbackrunden. Die Regel steht einmal in `isOnboardingCallDateAcceptable` (`@invessiv/common`) und gilt für
  Server und Dialog.
- **Reihenfolge der Prüfungen:** Übergang → Version → Call-Datum → Pflichtangaben. Der Übergang steht vor der
  Version, wie bei Freigabe und Nachforderung.
- **`ONBOARDING_REQUIRED_MISSING` trägt die Liste** als eigene Variante in `OnboardingCommandResult`
  (`missing: QuestionnaireMissingField[]`), in der Antwort unter `details.missing`.
- **Snapshot-Service hält beide Quellen** (`listLive`, `listFrozen`, `freeze`); die Live-Abfrage ist aus dem
  Read-Service dorthin umgezogen, damit der Snapshot aus exakt derselben Abfrage entsteht, die der Bogen anzeigt.
  Die Wahl der Quelle bleibt allein in `loadServices`.
- **Phasenwechsel zuletzt.** `complete` schreibt erst Bogen, Aufgabe, Activity und die Systemnachricht
  `onboardingCompleted`, dann die Phase mit ihrer eigenen Nachricht, damit der Chat in sinnvoller Reihenfolge liest.
  Alles bleibt eine Transaktion (Rollback-Test).
- **`announcePhaseChange`** liegt als benannter Helfer unter `server/shared/services/message/announce-phase-change.ts`
  (kein Service-Objekt für eine Funktion, wie `announce-system-message.ts`).
- **Neue Systemnachricht `onboardingCompleted`** (Konstante, DE/EN in Portal- und CRM-Chat). Der Plan nennt nur
  „Chat-Systemnachricht“.
- **`OnboardingFormContextDto.projectPhase`** ist neu, damit der Dialog den Phasen-Haken nur zeigt, wenn er etwas
  bewirkt.
- **Smoke:** `onboarding-complete.integration.test.ts` ist in `db:smoke:crm` eingetragen.

### T2 — Abschlussdialog und Leseansichten

- **Dialog blockiert nur bei den zwei harten Voraussetzungen.** Fehlende Pflichtangaben sperren den Knopf und
  nennen die Felder mit Link in den Tab „Antworten“; das Call-Datum wird beim Bestätigen geprüft. Ungeprüfte Blöcke
  und Call-Punkte sind Hinweise.
- **Standard-Tab:** `defaultOnboardingFormTab(status)`; der jeweilige Standard-Tab hinterlässt keinen URL-Parameter.
  Ein Link mit `?tab=answers` auf einen abgeschlossenen Bogen funktioniert weiter.
- **Portal-Kopf:** „Abgeschlossen am …“ als Überschrift, darunter „Das ist die Grundlage für dein Projekt …“ und der
  Hinweis auf Dateibereich und Chat. Die Links erscheinen nur mit `portal.files.read` bzw. `portal.messages.read`.
- **Widget und Terminkarte** brauchten keine Änderung: Der Zustand „Abgeschlossen am … · Ansehen“ war seit Task 67
  gebaut und getestet, die Terminkarte verschwindet über `isOnboardingCallBookable` (Task 69).

### Offen

- **E2E nicht gelaufen.** `e2e/portal-onboarding.e2e.ts` ist um Abschluss, CRM-Leseansicht, Portal-Leseansicht und
  zwei abgelehnte Schreibversuche erweitert, aber in dieser Umsetzung nicht ausgeführt.
- **„Folgeprojekt vorbefüllt“ steht nicht im E2E**, sondern als Integrationstest (echter Abschlussbefehl, danach
  Start im zweiten Projekt): Die E2E-Fixture hat nur ein Onboarding-Projekt, und im Bogen selbst angelegte Bausteine
  werden nie vorbefüllt.
- **Sichtprüfung im Browser** (Dialog, Kopf, Portal-Leseansicht, Dark/Light, mobil, Tastatur) steht aus.
