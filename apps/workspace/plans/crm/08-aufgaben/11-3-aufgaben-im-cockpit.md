# Task 11-3 — Aufgaben im Kunden-Cockpit

> **Merge-Einheit:** Ordner 08 · **Branch:** `feat/crm-aufgaben`
> **Aufwand:** M · **Abhängigkeiten:** Task 11-2
> **Migration:** keine · **Skills:** `frontend-design`, `copywriting`

## Ziel

Im Kunden-Cockpit hat jedes Projekt eine Sektion „Aufgaben“. Dort werden Aufgaben angelegt, bearbeitet und im Status
geändert. Man sieht auf einen Blick, wer dran ist, was überfällig ist und was der Kunde später sehen wird.

## Einbettung

- Neue Sektion `components/workspace/crm/tasks/project-tasks-section/` in
  `components/workspace/crm/projects/customer-projects-section/`, neben der bestehenden
  `project-line-items-section` (gleiche Einbettung und Rechte-Props).
- Daten kommen serverseitig über `listCustomerTasks` in den Cockpit-Read und werden je Projekt verteilt — kein
  Nachladen pro Projekt (keine N+1).
- Sektion nur mit `tasks.read`; Anlegen, Bearbeiten, Statuswechsel nur mit `tasks.write` (Aktionen fehlen sonst
  ganz, nicht deaktiviert).

## Bedienung

| Element        | Verhalten                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| Zeile          | Status-Auswahl, Titel, Fälligkeit, Badge „Wir dran“/„Kunde dran“, Bearbeiter, Sichtbarkeitssymbol                  |
| Überfällig     | Symbol plus Text („seit 3 Tagen überfällig“), nicht nur Farbe; Ableitung über `task-due-state.ts`                  |
| Sichtbarkeit   | Beschriftetes Symbol „Für Kunde sichtbar“; unsichtbare Aufgaben ohne Symbol. Tooltip allein reicht nicht           |
| Schnellanlage  | Titel eintippen, Enter legt an: Seite `internal`, unsichtbar, Bearbeiter = Projekt-Owner, ohne Datum               |
| Dialog         | Alle Felder; Wechsel auf „Kunde dran“ setzt „Für Kunde sichtbar“ automatisch und sperrt den Schalter mit Erklärung |
| Statuswechsel  | Direkt in der Zeile; optimistisch, bei Fehler zurück und Meldung; Versionskonflikt zeigt den aktuellen Stand       |
| Abgeschlossene | `done` und `cancelled` standardmäßig eingeklappt („12 abgeschlossen anzeigen“)                                     |
| Leer           | Kurzer Hinweis mit Schnellanlage, kein Platzhalterbild                                                             |

## Dateien

```txt
apps/workspace/src/client/crm/tasks-api-service.ts (+ Test)               Muster: project-line-items-api-service.ts
apps/workspace/src/common/contracts/crm/task-form-values.ts
apps/workspace/src/common/contracts/crm/task-client-results.ts
apps/workspace/src/common/constants/crm/forms/task-form-validation-codes.ts
apps/workspace/src/common/patterns/crm/task-form.ts (+ Test)               Formwerte ↔ Request-DTOs
apps/workspace/src/lib/workspace/crm/task-api-error.ts
apps/workspace/src/components/workspace/crm/tasks/
  project-tasks-section/  task-row/  task-quick-create/  task-form-dialog/
  task-status-select/  task-action-side-badge/  task-due-label/
apps/workspace/src/i18n/dictionaries/workspace/crm/tasks/{de,en}.json (+ index.ts)
apps/workspace/src/server/workspace/crm/query-handler/get-customer-cockpit-by-id.query-handler.ts   Aufgaben ergänzen
```

Status-Badge und Select auf `packages/ui` (`badge`, `custom-select`, `dialog`, `form`) aufbauen; keine neuen
globalen Klassen, Styles als co-located `*.module.css`.

## Tickets

### CRM-11-3-T1 — Client-Service und Form-Pattern

- **Akzeptanz:** Service-Tests für Erfolg, 404, 409, 422; Form-Pattern-Tests (Kundenseite erzwingt Sichtbarkeit,
  leeres Datum → `null`).

### CRM-11-3-T2 — Sektion, Zeile, Schnellanlage

- **Akzeptanz:** Komponenten-Tests für Rechte (ohne `tasks.write` keine Aktionen), Überfällig-Text, Sichtbarkeitssymbol,
  Enter-Anlage; Statuswechsel per Tastatur, Wechsel über Live-Region angekündigt.

### CRM-11-3-T3 — Formulardialog

- **Akzeptanz:** Pflicht-, Format- und Submit-Fehler sichtbar; Fokus bleibt im Dialog und kehrt beim Schließen zum
  Auslöser zurück; Versionskonflikt-Zustand DE/EN.

## Deploy-Sicherheit

1. **Live sichtbar:** Sektion „Aufgaben“ je Projekt im Kunden-Cockpit.
2. **Bricht nichts:** Cockpit-Read wird um ein Feld erweitert; ohne `tasks.read` bleibt das Cockpit unverändert.
3. **Offen:** globale Übersicht (11a-1), Dashboard (11a-2).

## End-to-End-Akzeptanz

1. Aufgabe per Enter anlegen, im Dialog auf „Kunde dran“ stellen (Sichtbarkeit wird gesetzt), Status auf „In Arbeit“,
   dann „Erledigt“ und wieder „Offen“; jede Änderung erscheint in der Aktivitäten-Timeline des Kunden.
2. Mitglied mit Rolle nur für Projekt 2 sieht die Aufgaben von Projekt 2, nichts von Projekt 1.
3. Überfällige Aufgaben sind ohne Farbwahrnehmung erkennbar.
4. DE/EN, Dark/Light, mobil ab 360 px.
5. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/workspace build` grün.
