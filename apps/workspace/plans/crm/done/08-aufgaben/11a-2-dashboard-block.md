# Task 11a-2 — Dashboard-Block „Überfällig & bald fällig“

> **Merge-Einheit:** Ordner 08 · **Branch:** `feat/crm-aufgaben`
> **Aufwand:** S · **Abhängigkeiten:** Task 11a-1
> **Migration:** keine · **Skills:** `frontend-design`, `copywriting`

## Ziel

Das Workspace-Dashboard zeigt die eigenen überfälligen und in den nächsten 7 Tagen fälligen Aufgaben. Das ist bis zur
Glocke aus Ordner 20c der tägliche Einstieg.

## Entscheidungen

| Bereich | Entscheidung                                                                                                         |
| ------- | -------------------------------------------------------------------------------------------------------------------- |
| Umfang  | Nur Aufgaben mit `assignee_member_id = aktuelles Mitglied`, Status `open`/`in_progress`, überfällig oder bald fällig |
| Menge   | Max. 10 Einträge, überfällige zuerst; Link „Alle anzeigen“ auf `/crm/tasks` mit passenden Filtern                    |
| Zeile   | Titel, Kunde · Projekt, Fälligkeitstext aus `task-due-state-service.ts`, Badge „Kunde dran“ falls zutreffend         |
| Leer    | Block entfällt vollständig, kein leerer Kasten                                                                       |
| Fehler  | Schlägt die Abfrage fehl, entfällt der Block; das Dashboard bleibt intakt (Fehler wird geloggt, ohne PII)            |
| Rechte  | Nur mit `tasks.read`; Sichtbarkeit zusätzlich über `accessScope`                                                     |

## Dateien

```txt
apps/workspace/src/server/workspace/crm/query-handler/list-my-due-tasks.query-handler.ts (+ Test)
  → nutzt die Filterbausteine aus list-tasks.query-handler.ts, keine zweite Definition
apps/workspace/src/components/workspace/dashboard/due-tasks-module/ (+ Test, module.css)
apps/workspace/src/app/[locale]/(app)/dashboard/page.tsx           Block einhängen
apps/workspace/src/i18n/dictionaries/workspace/…/dashboard          Texte DE/EN
```

Einbettung in das bestehende Dashboard-Grid (`components/workspace/dashboard/dashboard-grid`) wie die vorhandenen
Module; nutzt den Link-Builder aus `task-list-search-params.ts`.

## Akzeptanz

1. Überfällige erscheinen vor bald fälligen; Aufgaben anderer Bearbeiter nie.
2. Ohne Einträge und bei Abfragefehler fehlt der Block, der Rest des Dashboards lädt normal (Test).
3. Der Link öffnet `/crm/tasks` mit „Meine“ und passendem Zeitraum vorausgewählt.
4. Genau eine zusätzliche Abfrage pro Dashboard-Aufruf.
5. DE/EN, Dark/Light, mobil; `pnpm -r lint`, `typecheck`, `test`, Workspace-Build grün.
