# Task 11a — Aufgabenübersicht über alle Kunden

> **Merge-Einheit:** Ordner 08 · **Branch:** `feat/crm-aufgaben`
> **Aufwand:** M · **Abhängigkeiten:** Task 11 (Aufgaben), Task 02a (geteilte Listen-Komponenten)
> **Migration:** keine

- Ansicht umfasst interne, direkte Kunden- und Projektaufgaben; Kontext wird explizit angezeigt.
- „Meine Aufgaben“ filtert `assignee_member_id`; Kundenpflicht filtert `action_side = customer`.
- Archivierte Kunden/Projekte sind standardmäßig ausgeblendet, nicht über `deleted_at`.
- Sidebar-Zähler zeigt nur überfällige, offene Aufgaben des aktuellen Mitglieds.
- Überfälligkeit erzeugt hier nur Darstellung; einmalige Notification folgt in Task 33.

## Context

Aufgaben existieren seit Task 11 — aber nur **innerhalb** eines Kunden. Für Einreichungen gibt es
später einen Sammelbereich (`/crm/eingang`, Task 23), für Nachrichten auch (`/crm/nachrichten`,
Task 25), und Renewals bekommen ein Dashboard-Widget (Task 28). Aufgaben hätten nichts davon.

Damit wäre nach dem gesamten Plan die häufigste Frage des Arbeitsalltags unbeantwortet: **„Was ist
diese Woche fällig?"** Man müsste jeden Kunden einzeln aufklappen — und würde stattdessen weiter ins
Notizbuch schreiben.

Der Task ist günstig, weil die Grundlage steht: `listTasks` aus Task 11 wird einfach ohne
`customerId` aufgerufen, und die Listen-Bausteine kommen aus Task 02a. Der teure Teil wäre gewesen,
das nicht einzuplanen.

## Entscheidungen

| Bereich        | Entscheidung                                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Zwei Einstiege | Vollansicht unter `/crm/aufgaben` **und** ein Block „Fällig diese Woche" im CRM-Dashboard                                  |
| Warum beides   | Das Widget fürs tägliche Drauf-Schauen, die Vollansicht zum Arbeiten mit Filtern                                           |
| Standardfilter | Offen, nach Fälligkeit aufsteigend; überfällige zuerst. Aufgaben ohne Datum am Ende                                        |
| Filter         | Verantwortung (ich / Kunde), Sichtbarkeit, Kunde, Projekt, Zeitraum (heute / diese Woche / überfällig / alle)              |
| Zustand        | Ausschließlich in der URL, wie überall im Workspace                                                                        |
| Abhaken        | Direkt aus der Liste, ohne den Kunden zu öffnen — das ist der eigentliche Nutzen                                           |
| Kundenspalte   | Jede Zeile nennt Kunde und Projekt und verlinkt in die Kundenakte                                                          |
| Sidebar-Zähler | Zahl der **überfälligen** Aufgaben, nicht aller offenen — sonst steht dauerhaft eine große Zahl da, die niemand mehr liest |
| Archivierte    | Aufgaben archivierter Kunden und Projekte erscheinen standardmäßig nicht (Filter über Status des Parents)                  |
| Kundenaufgaben | Aufgaben mit `action_side = customer` erscheinen mit, aber optisch klar als Bringschuld des Kunden markiert                |
| Warum          | Man will sehen, worauf man wartet — nicht nur, was man selbst schuldet                                                     |

## Architektur

```txt
(app)/crm/aufgaben/page.tsx
  ├─ requireWorkspacePermission(Permission.ProjectsRead)
  ├─ parseTaskListSearchParams(searchParams)
  ├─ listTasks({ scope: "internal", filters })     Task 11, ohne customerId
  └─ <TasksOverviewShell> → <TaskOverviewTable> → <TaskOverviewRow>

(app)/dashboard  → <DueThisWeekWidget>
  └─ listTasks({ scope: "internal", dueWithinDays: 7, open: true, limit: 10 })

(app)/layout.tsx → countOverdueTasks()   für den Sidebar-Zähler
```

`listTasks` wird um die optionalen Filter erweitert, aber die **Sicherheitsgrenze bleibt
unverändert**: `scope: "customer"` erzwingt weiterhin `visible_to_customer = true` in der Abfrage.
Diese Ansicht läuft immer mit `scope: "internal"`.

## Verzeichnisstruktur

```txt
apps/workspace/src/config/routes.ts                    + CRM_TASKS
apps/workspace/src/components/workspace/workspace-sidebar/workspace-sidebar-items.ts  + Eintrag

apps/workspace/src/app/[locale]/(app)/crm/aufgaben/
  page.tsx  loading.tsx  page.test.tsx

apps/workspace/src/common/constants/crm/list/task-list-query-params.ts
apps/workspace/src/server/workspace/crm/
  shared/task-list-search-params.ts
  query-handler/list-tasks.query-handler.ts            erweitert um Filter
  query-handler/count-overdue-tasks.query-handler.ts
apps/workspace/src/lib/workspace/crm/task-list-query-string.ts

apps/workspace/src/components/workspace/crm/tasks/
  overview/tasks-overview-shell/
  overview/task-overview-table/
  overview/task-overview-row/
  overview/tasks-overview-toolbar/
  overview/tasks-overview-empty-state/
apps/workspace/src/components/workspace/dashboard/due-this-week-widget/
apps/workspace/src/i18n/dictionaries/workspace/crm/tasks/{de,en}.json   + Übersichtstexte
```

## Tickets

### CRM-11a-T1 — Abfragen erweitern

- **Files:** `list-tasks.query-handler.ts`, `count-overdue-tasks.query-handler.ts`,
  `shared/task-list-search-params.ts`, `task-list-query-params.ts` + Tests
- **Skills:** `best-practices`, `performance`
- **Inhalt:**
  - `customerId` wird optional; neue Filter `responsibleSide`, `projectId`, `dueWithinDays`,
    `overdueOnly`, `open`
  - Join auf Kunde und Projekt für die Anzeigespalten, Statusfilter auf beiden Parents
  - Ungültige Filterwerte werden verworfen, nicht durchgereicht
  - `countOverdueTasks` als schlanke Aggregatabfrage
- **Akzeptanz:**
  - **Die bestehenden Tests aus Task 11 bleiben unverändert grün** — `scope: "customer"` verhält
    sich weiterhin identisch und lässt sich nicht umgehen
  - Test: Aufgaben eines gelöschten Kunden oder Projekts erscheinen nicht
  - Test: Sortierung setzt überfällige zuerst, datumslose ans Ende
  - Genau zwei Abfragen pro Seitenaufruf (Liste + Count), keine N+1 für Kunde und Projekt

### CRM-11a-T2 — Route, Tabelle, Toolbar

- **Files:** `(app)/crm/aufgaben/**`, `components/workspace/crm/tasks/overview/**`,
  `config/routes.ts`, Sidebar-Eintrag, Dictionary-Ergänzungen
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Tabelle auf den geteilten Bausteinen aus Task 02a; Spalten: Fälligkeit, Aufgabe, Kunde, Projekt,
    Verantwortung, Sichtbarkeit
  - Toolbar mit Zeitraum-Umschalter und Facettenfiltern, Zustand in der URL
  - Überfällige ohne Farbwahrnehmung erkennbar (Symbol plus Text, „seit 3 Tagen")
  - Abhaken direkt in der Zeile, optimistisch mit Rücknahme bei Fehlschlag
  - `robots: noindex`, `force-dynamic` wie alle privaten Seiten
  - Leerer Zustand als gute Nachricht formuliert, nicht als Mangel
- **Akzeptanz:**
  - Tastaturbedienung vollständig, Abhaken über eine Live-Region angekündigt
  - Filterzustand ist teilbar, neu ladbar und über die Zurück-Taste bedienbar
  - Mobil ab 360 px ohne horizontales Scrollen der Seite
  - Genau eine H1, Dark und Light korrekt

### CRM-11a-T3 — Dashboard-Block und Sidebar-Zähler

- **Files:** `components/workspace/dashboard/due-this-week-widget/**`, `(app)/layout.tsx`,
  Sidebar-Zähler
- **Skills:** `frontend-design`, `accessibility`, `performance`
- **Inhalt:**
  - Block mit den nächsten sieben Tagen, maximal zehn Einträge, Link auf die Vollansicht
  - Widget entfällt vollständig, wenn nichts ansteht — kein leerer Kasten
  - Sidebar-Zähler überfälliger Aufgaben mit `aria-label`, der die Zahl ausspricht
  - Schlägt die Zählerabfrage fehl, entfällt der Zähler statt die Seite zu brechen
- **Akzeptanz:**
  - Der Zähler verschwindet, wenn nichts überfällig ist
  - Das Widget fügt dem Dashboard genau eine günstige Abfrage hinzu
  - Ein Fehler in der Abfrage lässt Dashboard und Sidebar intakt

## Deploy-Sicherheit

1. **Live sichtbar:** neuer Sidebar-Eintrag „Aufgaben" mit Zähler, neue Route, neuer
   Dashboard-Block.
2. **Bricht nichts:** keine Migration. `listTasks` wird erweitert, nicht umgebaut — `customerId`
   wird optional, alle bestehenden Aufrufe übergeben ihn weiterhin. Die Sichtbarkeitsgrenze für
   `scope: "customer"` ist unverändert und durch die bestehenden Tests abgedeckt. Zähler und Widget
   entfallen bei einem Abfragefehler statt die Seite zu brechen.
3. **Offen:** nichts. Die Ansicht ist mit diesem Task vollständig.

## End-to-End-Akzeptanz

1. `/de/crm/aufgaben` zeigt alle offenen Aufgaben über alle Kunden, überfällige zuerst.
2. Jede Zeile nennt Kunde und Projekt und verlinkt in die Kundenakte.
3. Abhaken funktioniert direkt aus der Liste und ist im Kundendetail sichtbar.
4. Filter nach Verantwortung, Kunde, Projekt und Zeitraum wirken einzeln und kombiniert.
5. Der Filterzustand steht in der URL und ist teilbar.
6. Das Dashboard zeigt „Fällig diese Woche"; ohne fällige Aufgaben fehlt der Block.
7. Der Sidebar-Zähler nennt die überfälligen Aufgaben und verschwindet, wenn keine offen sind.
8. Aufgaben gelöschter Kunden und Projekte erscheinen nirgends.
9. Alle Texte in DE und EN; mobil, Dark und Light geprüft.
10. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
