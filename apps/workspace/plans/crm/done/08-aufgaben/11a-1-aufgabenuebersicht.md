# Task 11a-1 — Aufgabenübersicht über alle Projekte

> **Merge-Einheit:** Ordner 08 · **Branch:** `feat/crm-aufgaben`
> **Aufwand:** M · **Abhängigkeiten:** Task 11-3
> **Migration:** keine · **Skills:** `frontend-design`, `copywriting`

## Ziel

Eine Tabelle unter `/crm/tasks` zeigt alle lesbaren Aufgaben über alle Kunden und Projekte. Sie beantwortet „was ist
überfällig“, „was ist diese Woche fällig“ und „worauf warten wir beim Kunden“, ohne jeden Kunden einzeln zu öffnen.

> **Nacharbeit:** Der Filterkopf der Übersicht (Badge-Facetten, Filterpanel, Zurücksetzen) ist bewusst parallel zum
> Leads-Kopf gebaut, damit Leads unangetastet blieb. Die Zusammenführung steht in
> [
> `30a-listenkopf-und-filterpanel-abstrahieren.md`](../22a-kundenorganisation-und-uebergabe/30a-listenkopf-und-filterpanel-abstrahieren.md).

## Entscheidungen

| Bereich         | Entscheidung                                                                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Einstieg        | Link „Aufgaben“ auf der CRM-Seite neben dem Link zum Leistungskatalog; kein neuer Sidebar-Bereich (Sidebar ist bereichsbasiert)         |
| Route           | `SITE_ROUTES.CRM_TASKS = "/crm/tasks"`, Pfad-Helfer in `lib/auth/routes.ts`; Gate `tasks.read`, `noindex`, `force-dynamic`              |
| Standardansicht | Offen (`open`, `in_progress`), alle Bearbeiter, überfällige zuerst, dann Fälligkeit aufsteigend, ohne Datum zuletzt                     |
| Filter          | Status, wer dran (wir/Kunde), Bearbeiter (inkl. „Meine“), Kunde, Projekt, Zeitraum (überfällig / heute / 7 Tage / alle), Suche im Titel |
| Zustand         | Ausschließlich in der URL; teilbar, neu ladbar, Zurück-Taste funktioniert                                                               |
| Spalten         | Fälligkeit, Aufgabe, Status, Wer dran, Bearbeiter, Kunde, Projekt, Sichtbarkeit                                                         |
| Aktion          | Statuswechsel direkt in der Zeile (derselbe `task-status-select` wie im Cockpit); Kunde verlinkt ins Kunden-Cockpit                     |
| Archiv          | Aufgaben archivierter/abgebrochener/abgeschlossener Projekte standardmäßig ausgeblendet; Filter „auch abgeschlossene Projekte“          |
| Menge           | Pagination wie in der Kundenliste; Count und Liste aus denselben Filterbedingungen                                                      |

## Dateien

```txt
apps/workspace/src/config/routes.ts                               CRM_TASKS
apps/workspace/src/lib/auth/routes.ts                             crmTasksPathFor
apps/workspace/src/app/[locale]/(app)/crm/tasks/{page,loading}.tsx (+ page.test.tsx)
apps/workspace/src/app/[locale]/(app)/crm/page.tsx                Link „Aufgaben“ (nur mit tasks.read)
apps/workspace/src/common/constants/crm/list/task-list-query-params.ts (+ Test)
apps/workspace/src/common/patterns/crm/task-list-search-params.ts (+ Test)   parse + build, ungültige Werte verwerfen
apps/workspace/src/server/workspace/crm/query-handler/list-tasks.query-handler.ts
apps/workspace/src/components/workspace/crm/tasks/overview/
  tasks-overview-toolbar/  tasks-overview-table/  task-overview-row/
apps/workspace/src/i18n/dictionaries/workspace/crm/tasks/{de,en}.json          Übersichtstexte, meta
```

Wiederverwenden: `components/workspace/shared/toolbar/facet-filter` und `list-search-field`,
`components/workspace/shared/table/{list-pagination,list-empty-state,sortable-header}`, `packages/ui` `data-table`;
URL-Parsing nach dem Muster der Kundenliste (`common/constants/crm/list/`).

## Query

- `listTasks(filters, actor)`: ein Select mit Join auf `projects`, `customers`, `workspace_members`; Sichtbarkeit über
  `crmAccessCondition.forScope(accessScope(actor, Permission.TasksRead), …)` mit `projects.customer_id` und
  `projects.id`. Ein Count mit denselben Bedingungen. Keine N+1.
- Zeitraumfilter spiegeln `task-due-state-service.ts` (Europe/Berlin „heute“ serverseitig einmal bestimmt).

## Tickets

### CRM-11a-1-T1 — Query und URL-Parameter

- **Akzeptanz:** Tests für jeden Filter einzeln und kombiniert; Sortierung überfällig/ohne Datum; fremde Projekte
  nie enthalten; Aufgaben archivierter Projekte nur mit Filter; Liste und Count stimmen überein; genau zwei Abfragen.

### CRM-11a-1-T2 — Seite, Toolbar, Tabelle

- **Akzeptanz:** genau eine H1; Filter per Tastatur; Statuswechsel in der Zeile mit Live-Region; zwei unterscheidbare
  leere Zustände: „noch keine Aufgaben angelegt“ (erklärt, wofür die Übersicht da ist) und „keine Treffer“ (mit
  Filter zurücksetzen), bei überfällig-Filter als gute Nachricht formuliert („Nichts überfällig“); mobil ab 360 px
  ohne horizontales Scrollen der Seite (Tabelle scrollt in sich oder bricht in Karten um); Dark/Light.

## Deploy-Sicherheit

1. **Live sichtbar:** Link „Aufgaben“ auf der CRM-Seite und die neue Route.
2. **Bricht nichts:** keine Migration, bestehende Handler unverändert.
3. **Offen:** Dashboard-Block (11a-2).

## End-to-End-Akzeptanz

1. `/de/crm/tasks` zeigt offene Aufgaben aller erreichbaren Projekte, überfällige zuerst.
2. „Meine“ + „Kunde dran“ + „7 Tage“ kombiniert funktioniert und steht in der URL.
3. Statuswechsel in der Tabelle ist im Kunden-Cockpit sofort sichtbar.
4. Mitglied mit Projektbindung sieht nur Aufgaben dieses Projekts.
5. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/workspace build` grün.
