# Task 61 — Interne Bearbeitung, Ergebnisse und Abnahme

> **Vor dem Start lesen:** [`README.md`](./README.md) dieses Ordners (Fachmodell, Status, Limits, Rechte, Merge-Gates),
> `../00-entscheidungen.md`, `../AGENTS.md` und die scoped `AGENTS.md` am Zielcode. Diese Task-Datei plus README sind
> vollständig; frühere Chat- oder Planstände (Task 22/23) gelten nicht.

> **Modelländerung aus Task 57 (29.09.2026, mit dem Owner abgestimmt, verbindlich):** Es gibt **keinen Feedbackblock**
> mit Rundenzahl mehr. Jede Runde ist ein eigener Rundenschritt in der Prozessleiste (`projects.feedback_round_positions`,
> Rundennummer = Reihenfolge). Wo diese Datei noch „Block“ sagt, gilt: „Block vorhanden“ → „Rundenschritt n vorhanden“;
> „am Feedbackschritt“ → aktueller Schritt ist der letzte Freitext-Schritt vor Rundenschritt n; „Projektschritt nach dem
> Block“ → Schritt direkt nach der abgenommenen Runde; „Block entfernen“ → übergebene Rundenschritte entfernen oder
> verschieben; Kontingent = Anzahl der Rundenschritte. Details: README, Abschnitt „Feedbackrunden in der Prozessleiste“.

> **Status:** gemerged · **Teil-PR:** 16.5 · **Branch:** `feat/crm-feedback-5-bearbeitung`
> **Abhängigkeiten:** Task 60 (16.4) gemerged · **Aufwand:** 3 T. · **Dateien:** 70–90
> **Migration:** keine
> **Skills:** `frontend-design`, `copywriting`

## Ziel

Der Kreislauf schließt sich: Das Team fordert ein Gespräch an oder startet direkt die Umsetzung, gibt eine Runde bei
Bedarf an den Kunden zurück, vergibt je Punkt ein Ergebnis, schließt die Runde ab und übergibt direkt die nächste. Der
Kunde sieht die Ergebnisse und nimmt nach der letzten Runde ab.

## Getroffene Entscheidungen

| Frage                | Entscheidung                                                                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gespräch             | „Gespräch anfordern“ setzt `in_discussion` mit optionalem Hinweis an den Kunden. Der Termin selbst läuft über Chat bzw. später den Buchungslink (Task 69) |
| Überspringen         | „Umsetzung starten“ ist aus `submitted` und `in_discussion` möglich                                                                                       |
| Zurück an Kunden     | Aus `submitted`/`in_discussion`, Hinweis Pflicht; Punkte bleiben; Sammelaufgabe → `cancelled`; erneutes Einreichen öffnet dieselbe Aufgabe                |
| Ergebnisse           | Setzbar in `submitted`, `in_discussion`, `in_progress`; je Punkt versioniert; „nicht umgesetzt“/„Zusatzleistung“ verlangen eine Antwort                   |
| Abschluss            | Nur aus `in_progress`, nur wenn alle Punkte ein Ergebnis haben; Sammelaufgabe → `done` in derselben Transaktion                                           |
| Nächste Runde        | Nach dem Abschluss bietet der Dialog „Runde n+1 jetzt übergeben“ an (vorbelegter Übergabe-Dialog aus Task 60), nur mit Restkontingent                     |
| Abnahme              | Kunde, nur an der höchsten Runde im Status `completed`, keine aktive Runde, mit Bestätigungsdialog und `confirmFinal`                                     |
| Kontingent erschöpft | Portal zeigt nach der letzten Runde „Abnehmen“ und den Hinweis „Du brauchst eine weitere Runde? Schreib uns im Chat“ (später 13c)                         |
| Phase                | Keine Aktion ändert `projects.phase`                                                                                                                      |
| Nicht enthalten      | Abnahme zurücknehmen, Ergebnisse nach Abschluss ändern, Kommentare je Punkt                                                                               |

## Endpunkte

Intern (`/api/workspace/crm/…`, `projects.write`, `canOn` auf das Projekt, in `CRM_ENDPOINT_ACCESS_RULES`):

| Methode + Pfad                               | Zweck                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| `POST feedback-rounds/[roundId]/status`      | `{ version, to: in_discussion \| in_progress \| open \| completed, customerNotice? }` |
| `PATCH feedback-round-items/[itemId]/result` | `{ version, result, resultNote? }`                                                    |

Portal: `POST feedback-rounds/[roundId]/approve` (aus Task 59) wird um `completed → approved` erweitert.

## Handler

- `apps/workspace/src/server/workspace/crm/command-handler/change-feedback-round-status.command-handler.ts`
  - Request `change-feedback-round-status-request.dto.ts`. Runde `FOR UPDATE`, `canTransition(from, to, internal)`,
    `updateVersioned` (409 mit `VersionConflictDto`).
  - `in_discussion`: optional `customer_notice`; Systemnachricht `feedbackRoundDiscussionRequested`.
  - `in_progress`: `started_at`; `feedbackRoundTaskService.markInProgress`.
  - `open` (zurück): `customer_notice` Pflicht (`VALIDATION_ERROR`); `submitted_*` leeren;
    `cancelForReturn`; Systemnachricht `feedbackRoundReturned`.
  - `completed`: alle Punkte mit Ergebnis (`RESULTS_INCOMPLETE`, 422); `completed_*`; `completeForRound`;
    Systemnachricht `feedbackRoundCompleted`.
  - Jeder Übergang genau eine Activity.
- `command-handler/set-feedback-item-result.command-handler.ts`
  - Request `set-feedback-item-result-request.dto.ts`. Runde `FOR SHARE`, Status in `submitted`/`in_discussion`/
    `in_progress` (sonst `ROUND_LOCKED`); `updateVersioned` am Punkt; `result_set_*`.
- `apps/workspace/src/server/portal/command-handler/approve-portal-feedback.command-handler.ts` erweitern:
  `completed → approved` nur für die höchste Rundennummer (`NOT_LATEST_ROUND`) und ohne aktive Runde; wie gehabt
  `confirmFinal`, `advancePastFeedbackRound`, Activity, Systemnachricht `feedbackApproved`.
- Portal-Query: Ergebnisse und Antworten erst ab `completed` im DTO (Test sichert, dass sie vorher fehlen).

## UI

Intern (`components/workspace/crm/feedback-rounds/`):

- `feedback-item-result-select/`: Muster `crm/tasks/task-status-select` (`CustomSelect` mit Symbolen): „Umgesetzt“
  (Häkchen), „Nicht umgesetzt“, „Zusatzleistung“. Die beiden letzten öffnen einen kleinen Dialog für die Antwort an
  den Kunden (Pflicht, ≤ 2.000 Zeichen, Vorschau, wie der Kunde sie sieht). Zeile über `StatusRow` (Task 60).
- `feedback-round-status-actions/`: Buttons nur für erlaubte Übergänge (`canTransition`): „Gespräch anfordern“,
  „Umsetzung starten“, „Zurück an den Kunden“ (Hinweis Pflicht), „Runde abschließen“.
- `feedback-complete-dialog/`: Prüfliste (alle Punkte bewertet, Anzahl je Ergebnis); danach Angebot „Runde n+1 jetzt
  übergeben“ bei Restkontingent, sonst Hinweis „Der Kunde kann jetzt abnehmen“.
- Fortschritt „4 von 7 Punkten bewertet“ im Rundenkopf. Konflikte über `useVersionedMutation`
  (`hooks/workspace/use-versioned-mutation.ts`).

Portal (`components/portal/feedback/`):

- Status-Texte für `in_discussion` (inkl. Hinweis), `in_progress`, `completed`, zurückgegebene Runde (Hinweis oben im
  Bogen, Punkte wieder bearbeitbar).
- `feedback-item-result/`: Badge je Punkt und Antwort als Text.
- Abnahme-CTA an der zuletzt abgeschlossenen Runde, Bestätigungsdialog aus Task 60.
- Widget: „Wir sind dran“ während `submitted`/`in_discussion`/`in_progress`; „Bitte abnehmen“ nach der letzten
  abgeschlossenen Runde; „Abgenommen am …“.
- Dictionaries DE/EN, Du-Form.

## Tickets

### CRM-61-T1 — Status und Ergebnisse (Server)

- **Files:** zwei Command-Handler, Request-DTOs, Routen, Zugriffsregeln, Endpunkt-Konstanten + Tests
- **Akzeptanz:** `submitted → completed` direkt → `INVALID_TRANSITION`; `completed` ohne alle Ergebnisse →
  `RESULTS_INCOMPLETE`; Zurück ohne Hinweis → 400; Zurück lässt Punkte stehen, Aufgabe `cancelled`, erneutes
  Einreichen öffnet dieselbe Aufgabe (genau eine Aufgabe je Runde); Abschluss setzt Aufgabe atomar `done`, eine manuell
  erledigte Aufgabe bleibt unberührt; Ergebnis in abgeschlossener Runde → `ROUND_LOCKED`; veraltete Version → 409;
  fremdes Projekt und gebundene Rolle ohne Projektrecht → 404; genau eine Activity je Übergang; Phase unverändert

### CRM-61-T2 — Abnahme nach Abschluss (Server)

- **Files:** Approve-Handler, Portal-Query + Tests
- **Akzeptanz:** Abnahme an einer älteren Runde → `NOT_LATEST_ROUND`; bei aktiver Runde → `INVALID_TRANSITION`; ohne
  `confirmFinal` → `CONFIRMATION_REQUIRED`; zweite Abnahme unmöglich (partieller Unique-Index); Leiste springt hinter
  den Block; ein parallel geöffneter Projekt-Editor bekommt danach 409; Ergebnisse vor `completed` nicht im Portal-DTO

### CRM-61-T3 — Interne UI

- **Files:** `feedback-item-result-select/**`, `feedback-round-status-actions/**`, `feedback-complete-dialog/**`,
  Detail-Erweiterung, Dictionaries
- **Akzeptanz:** nur erlaubte Buttons sichtbar; Pflichtantworten erzwungen; Angebot Runde n+1 nur bei Restkontingent
  und öffnet den vorbelegten Übergabe-Dialog; Tastatur, Fokus, 360 px, Dark/Light

### CRM-61-T4 — Portal-UI

- **Files:** `components/portal/feedback/**`, Widget, Dictionaries
- **Akzeptanz:** jeder Status mit eigener, erklärender Kundensicht; Ergebnisse je Punkt nach Abschluss; Abnahme nur mit
  Haken; zurückgegebene Runde zeigt den Hinweis und ist wieder bearbeitbar; E2E `portal-feedback.e2e.ts` um den ganzen
  Kreislauf erweitert (Runde 1 → Ergebnisse → Abschluss → Runde 2 → Abnahme)

## Deploy-Sicherheit

1. **Live sichtbar:** Statusaktionen, Ergebnisse, Abschluss, n+1-Übergabe intern; Ergebnisse und Abnahme im Portal.
2. **Bricht nichts:** keine Migration; nur neue Routen und erweiterte Komponenten.
3. **Offen:** Sammel-Eingang und Sidebar-Zähler (Task 62); Mail/Glocke (Ordner 20c); Zusatzrunden buchen (Ordner 13c).

## End-to-End-Akzeptanz

1. Eingereichte Runde → „Gespräch anfordern“ → Kunde sieht den Hinweis → „Umsetzung starten“ → Aufgabe in Arbeit.
2. Alle Punkte bewertet, einer als Zusatzleistung mit Antwort → Abschluss → Aufgabe erledigt → Kunde sieht Ergebnisse.
3. Direkt Runde 2 übergeben; nach deren Abschluss erscheint beim Kunden „Abnehmen“; Abnahme mit Haken → Leiste steht
   auf „Launch“, Widget zeigt „Abgenommen am …“.
4. Eine Runde zurück an den Kunden → Hinweis sichtbar, Punkte erhalten, erneutes Einreichen → dieselbe Aufgabe offen.
5. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm db:smoke:crm`,
   `pnpm --filter @invessiv/workspace build` grün; E2E grün.
