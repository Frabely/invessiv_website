# Task 62 — Feedback-Eingang und Sidebar-Zähler

> **Vor dem Start lesen:** [`README.md`](./README.md) dieses Ordners (Fachmodell, Status, Limits, Rechte, Merge-Gates),
> `../00-entscheidungen.md`, `../AGENTS.md` und die scoped `AGENTS.md` am Zielcode. Diese Task-Datei plus README sind
> vollständig; frühere Chat- oder Planstände (Task 22/23) gelten nicht.

> **Status:** offen · **Teil-PR:** 16.6 · **Branch:** `feat/crm-feedback-6-eingang`
> **Abhängigkeiten:** Task 61 (16.5) gemerged · **Aufwand:** 1–1,5 T. · **Dateien:** 30–45
> **Migration:** keine (Indizes entstehen in Task 58)
> **Skills:** `frontend-design`, `copywriting`

## Ziel

Im Alltag zählt die Frage „Was liegt insgesamt an?“. Ein Sammel-Eingang zeigt alle Runden, bei denen das Team am Zug
ist, über alle Kunden und Projekte, auf die der Mitarbeiter Zugriff hat. Ein Zähler in der Sidebar zeigt neu
eingereichte, noch ungeöffnete Runden. Bis zu diesem PR übernehmen Sammelaufgabe (Cockpit, Aufgabenübersicht) und
Chat-Systemnachricht diese Rolle.

## Getroffene Entscheidungen

| Frage             | Entscheidung                                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Route             | `/[locale]/crm/feedback`, `SITE_ROUTES.CRM_FEEDBACK` in `apps/workspace/src/config/routes.ts`; noindex, `force-dynamic`                       |
| Inhalt            | Runden in `submitted`, `in_discussion`, `in_progress` (Standard); Filter Status, ungelesen, Kunde — als URL-State                             |
| Ungelesen         | `read_at` wird beim ersten Öffnen der Runde (Eingang oder Projektansicht) gesetzt, nur einmal                                                 |
| Öffnen ≠ Status   | Öffnen ändert den Status **nie** — gelesen und in Bearbeitung sind verschiedene Aussagen                                                      |
| Zähler            | Anzahl `submitted` + ungelesen im Zugriffsbereich; im `(app)`-Layout geladen wie `unreadConversationCount`; Fehler → Zähler entfällt          |
| Karte             | Kunde, Projekt, Runde n, Status, eingereicht am, Frist, Anzahl Punkte/Dateien, erste Zeilen des ersten Punkts (als Text)                      |
| Ziel eines Klicks | Kunden-Cockpit mit gewähltem Projekt und geöffneter Runde über `buildCustomerCockpitHref` aus Task 60 (`cockpit`, `project`, `feedbackRound`) |
| Recht             | `projects.read`; Liste und Zähler über `crmAccessCondition` — kein Mitarbeiter sieht Runden außerhalb seines Zugriffsbereichs                 |

## Server

- `apps/workspace/src/server/workspace/crm/query-handler/list-feedback-inbox.query-handler.ts` — eine Abfrage mit
  Zählungen (Punkte, Dateien) ohne N+1, über den Index `feedback_rounds_queue_idx`.
- `query-handler/count-unread-feedback-rounds.query-handler.ts` — über `feedback_rounds_unread_idx`; Muster
  `count-unread-conversations.query-handler.ts`.
- `command-handler/mark-feedback-round-read.command-handler.ts` — `UPDATE … SET read_at = now() WHERE id = $1 AND
read_at IS NULL`; keine Version, keine Activity. **Dieser Task** ergänzt im Runden-Detail aus Task 60
  (`components/workspace/crm/feedback-rounds/feedback-round-detail/`) den Aufruf beim Öffnen (clientseitig nach dem
  Rendern; ein Fehler bleibt still und blockiert die Ansicht nicht).
- Routen: `GET /api/workspace/crm/feedback-rounds` (Eingang, Filter), `POST /api/workspace/crm/feedback-rounds/[roundId]/read`;
  Zugriffsregeln in `CRM_ENDPOINT_ACCESS_RULES`.
- DTO `packages/common/src/contracts/crm/feedback-inbox-item.dto.ts`.

## UI

- `apps/workspace/src/app/[locale]/(app)/crm/feedback/page.tsx` + `loading.tsx` (Area-Gate wie die übrigen
  CRM-Seiten, `projects.read`).
- `components/workspace/crm/feedback-rounds/feedback-inbox/` und `feedback-inbox-card/`; Listenkopf/Filter über die
  bestehenden geteilten Listenbausteine.
- Ungelesene Karten deutlich markiert: Symbol **und** Text („Neu“), nicht nur Farbe.
- Sidebar: Eintrag „Feedback“ mit Zähler in `components/workspace/workspace-sidebar/workspace-sidebar.tsx`, geladen in
  `app/[locale]/(app)/layout.tsx` und durchgereicht über `workspace-shell.tsx` (wie der Chat-Zähler); `aria-label`
  spricht die Zahl aus; bei 0 kein Badge.
- Empty-States: „Alles erledigt – gerade wartet kein Feedback auf euch“ vs. „Keine Treffer für diesen Filter“.
- Dictionary `dictionaries/workspace/crm/feedback-rounds/{de,en}.json` erweitern; Sidebar-Text im Shell-Dictionary.

## Tickets

### CRM-62-T1 — Abfragen und Lesen

- **Files:** drei Handler, zwei Routen, DTO, Zugriffsregeln + Tests
- **Akzeptanz:** keine Runde außerhalb des Zugriffsbereichs (gebundene Rolle → nur eigene Projekte); `open`- und
  `completed`-Runden nicht im Standardfilter; `read_at` nur beim ersten Mal; Öffnen ändert den Status nicht; Zähler
  sinkt nach dem Öffnen

### CRM-62-T2 — Eingang und Sidebar

- **Files:** Seite, Komponenten, Sidebar, Layout, Shell, Routen-Konstante, Dictionaries
- **Akzeptanz:** Filter als URL-State; Zähler verschwindet bei 0; fehlschlagende Zählabfrage bricht das Layout nicht;
  Tastatur vollständig; 360 px; Dark/Light; beide Empty-States unterscheidbar

## Deploy-Sicherheit

1. **Live sichtbar:** Sidebar-Eintrag „Feedback“ mit Zähler, Eingang.
2. **Bricht nichts:** keine Migration; eine günstige Zusatzabfrage im Layout, fehlertolerant.
3. **Offen:** nichts in diesem Ordner. Mail/Glocke folgen in 20c, Zusatzrunden in 13c.

## End-to-End-Akzeptanz

1. Eine eingereichte Runde erscheint im Eingang als „Neu“, der Zähler steht auf 1.
2. Öffnen führt in die Projektansicht mit geöffneter Runde; Zähler 0; Status unverändert `submitted`.
3. Ein Mitarbeiter mit auf ein anderes Projekt gebundener Rolle sieht die Runde weder im Eingang noch im Zähler.
4. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm db:smoke:crm`,
   `pnpm --filter @invessiv/workspace build` grün.
