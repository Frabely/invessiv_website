# Task 23 — Feedbackrunden im CRM

> **Merge-Einheit:** Ordner 16 · **Branch:** `feat/crm-feedbackrunden`
> **Aufwand:** M · **Abhängigkeiten:** Task 22
> **Migration:** keine

Interne Statusaktionen sind ausschließlich `in_progress` und `completed`. Es gibt keine
Kundenfreigabeaktion und kein Zurücksetzen einer abgeschlossenen Runde. Die Freigabe einer
Zusatzrunden-Anfrage erhöht das Kontingent um genau 1 — die Runde selbst reicht danach der Kunde
ein. Der Antworttext ist ein eigener Eintrag und überschreibt den Kundentext nie.

## Context

Die Gegenseite zu Task 22: Was der Kunde einreicht, muss auffindbar, lesbar und beantwortbar sein.
Ohne diesen Task existieren Feedbackrunden zwar in der Datenbank, aber der einzige Hinweis darauf ist
die Benachrichtigungsmail — was genau die Zettelwirtschaft wäre, die das System abschaffen soll.

Der Task schließt den Kreis: Feedbackrunde öffnen, Freitext lesen, Dateien ansehen oder gebündelt
herunterladen, Status setzen. Der gesetzte Status erscheint sofort im Portal des Kunden — damit
ersetzt das System die Rückmeldung „ist angekommen, ich schaue es mir an".

## Entscheidungen

| Bereich               | Entscheidung                                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Ort                   | Eigene Sektion im Kundendetail, zusätzlich ein Sammelbereich für alle offenen Feedbackrunden                          |
| Warum beides          | Im Kundenkontext braucht man den Verlauf, im Alltag die Frage „was liegt insgesamt an"                                |
| Sammelbereich         | Route `/crm/eingang`, standardmäßig gefiltert auf ungelesen und abgesendet                                            |
| Ungelesen             | `read_at` wird beim ersten Öffnen gesetzt; ein Zähler erscheint am Sidebar-Eintrag                                    |
| Status setzen         | Nur vorwärts: `submitted` → `in_progress` → `completed`. Kein Zurücksetzen, auch nicht durch den Owner                |
| Was `completed` heißt | Vollständig umgesetzt und erneut durch den Kunden prüfbar — nicht „gelesen" und nicht „abgelehnt"                     |
| Automatik             | Das Öffnen setzt **nicht** automatisch auf `in_progress` — gelesen und in Bearbeitung sind zwei verschiedene Aussagen |
| Projektphase          | Bleibt bei jedem Übergang unverändert; es gibt keine Automatik zwischen Feedback und Phase                            |
| Antwort an den Kunden | Ein kurzer Antworttext beim Statuswechsel, den der Kunde im Portal sieht — als eigener Eintrag, nie im Kundentext     |
| Zusatzrunden-Anfrage  | Freigabe und Ablehnung liegen in diesem Bereich; die Freigabe nutzt den Command aus Task 22                           |
| Interne Begründung    | Wird am Request gespeichert und ist nie portalöffentlich                                                              |
| Dateien               | Gebündelter Download über die Archiv-Route aus Task 16, vorausgewählt auf die Feedbackrunde                           |
| Löschen               | Feedbackrunden werden nicht gelöscht — sie sind Teil der Nachvollziehbarkeit                                          |

## Architektur

```txt
GET  /crm/eingang                             Sammelbereich, Server Component
PATCH /api/workspace/crm/feedback-rounds/[id]/status
  → withPermission(CustomersWrite)
  → Status und optionaler Antworttext
  → activities
  → optional Mail an den Kunden (schaltbar im Dialog)
POST /api/workspace/crm/feedback-rounds/[id]/read → setzt read_at
```

Die Sidebar zeigt einen Zähler offener Feedbackrunden. Er wird im `(app)`-Layout einmal geladen — eine
zusätzliche, sehr günstige Abfrage über den partiellen Index aus Task 22.

## Verzeichnisstruktur

```txt
apps/workspace/src/app/[locale]/(app)/crm/eingang/page.tsx  + loading.tsx
apps/workspace/src/config/routes.ts                         + CRM_INBOX
apps/workspace/src/app/api/workspace/crm/feedback-rounds/[id]/status/route.ts
apps/workspace/src/app/api/workspace/crm/feedback-rounds/[id]/read/route.ts

apps/workspace/src/server/workspace/crm/
  query-handler/list-feedback-rounds.query-handler.ts
  query-handler/count-open-feedback-rounds.query-handler.ts
  command-handler/{update-feedback-round-status,mark-feedback-round-read}.command-handler.ts
  services/feedback-round-notification-service.ts          wird erst in Ordner 20c ergänzt

apps/workspace/src/components/workspace/crm/feedback-rounds/
  feedback-rounds-inbox/
  feedback-round-card/
  feedback-round-detail/
  feedback-round-status-dialog/
  feedback-round-text/
  customer-feedback-rounds-section/
apps/workspace/src/components/workspace/workspace-sidebar/   Zähler-Badge
apps/workspace/src/i18n/dictionaries/workspace/crm/feedback-rounds/{de,en}.json
```

## Tickets

### CRM-23-T1 — Abfragen

- **Files:** `list-feedback-rounds.query-handler.ts`, `count-open-feedback-rounds.query-handler.ts` + Tests
- **Skills:** `best-practices`, `performance`
- **Inhalt:**
  - Liste mit Filter nach Status, Kunde und Ungelesen; Dateianzahl je Feedbackrunde mitgeladen
  - Zähler als schlanke Abfrage über den partiellen Index
- **Akzeptanz:**
  - Keine N+1-Abfrage für die Dateianzahl
  - Der Zähler bleibt unter einer Millisekunde Abfragezeit bei realistischer Datenmenge
  - Test: Entwürfe erscheinen im Eingang nie

### CRM-23-T2 — Status setzen und Rückmeldung

- **Files:** `update-feedback-round-status.command-handler.ts`, `mark-feedback-round-read.command-handler.ts`,
  beide Routen + Tests; `feedback-round-notification-service.ts` folgt in Ordner 20c
- **Skills:** `best-practices`
- **Inhalt:**
  - Erlaubte Übergänge als Const-Objekt, ungültige werden abgelehnt
  - Antworttext wird am Datensatz gespeichert und im Portal angezeigt
  - Mail an den Kunden optional und im Dialog abwählbar
- **Akzeptanz:**
  - Test: ein Wechsel von `submitted` direkt auf `completed` ist nicht möglich
  - Test: ein Rückwärtsübergang von `completed` ist nicht möglich
  - Test: veraltete `version` ergibt 409 mit aktuellem Stand statt eines Überschreibens
  - Test: `read_at` wird nur beim ersten Mal gesetzt
  - Test: genau eine Activity je Statuswechsel
  - Test: Fachwrite und Activity werden atomar geschrieben; Outbox-Benachrichtigung folgt in Ordner 20c
  - Test: Fehler beim Zustellen verhindert den Statuswechsel nicht
  - Test: Abschluss verändert die Projektphase nicht

### CRM-23-T3 — Eingang

- **Files:** `(app)/crm/eingang/page.tsx`, `loading.tsx`, `feedback-rounds-inbox/**`,
  `feedback-round-card/**`, Sidebar-Zähler
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Karten mit Kunde, Projekt, Zeitpunkt, Dateianzahl und den ersten Zeilen des Feedbacks
  - Ungelesene deutlich hervorgehoben (Symbol und Text, nicht nur Farbe)
  - Filter über URL-Parameter, wie überall
  - Sidebar-Zähler mit `aria-label`, der die Zahl ausspricht
  - Leerer Zustand als gute Nachricht formuliert, nicht als Mangel
- **Akzeptanz:**
  - Zähler verschwindet, wenn nichts offen ist
  - Tastaturbedienung vollständig
  - Mobil ab 360 px lesbar

### CRM-23-T4 — Feedbackrunde im Detail

- **Files:** `feedback-round-detail/**`, `feedback-round-text/**`, `feedback-round-status-dialog/**`,
  `customer-feedback-rounds-section/**`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Vollständiger Freitext, mit erhaltenen Absätzen und klickbaren Links — als **Text** gerendert,
    nie als HTML (der Inhalt kommt von außen)
  - Dateien der Feedbackrunde mit Vorschau und Sammel-Download über Task 16
  - Statusdialog mit Antworttext und Vorschau dessen, was der Kunde sieht
  - Sektion im Kundendetail mit dem Verlauf aller Feedbackrunden
- **Akzeptanz:**
  - Ein Freitext mit `<script>` oder Markdown erscheint als Zeichenfolge, nicht als ausgeführter oder
    formatierter Inhalt
  - Sehr langer Text ist mit Aufklappen lesbar, ohne die Seite zu sprengen
  - Links im Text öffnen in neuem Tab mit `rel="noreferrer"`
  - Sammel-Download liefert genau die Dateien dieser Feedbackrunde

## Deploy-Sicherheit

1. **Live sichtbar:** neuer Menüpunkt „Eingang" mit Zähler, neue Sektion im Kundendetail,
   Statusdialog.
2. **Bricht nichts:** keine Migration. Der Zähler ergänzt das `(app)`-Layout um eine günstige
   Abfrage — schlägt sie fehl, wird der Zähler weggelassen statt die Seite zu brechen. Der
   Portal-Bereich bleibt unverändert; er liest lediglich einen Status, den es vorher schon gab.
3. **Offen:** nichts. Mit diesem Task ist der Feedbackrundes-Kreislauf vollständig: einreichen,
   benachrichtigen, lesen, antworten, im Portal sehen.

## End-to-End-Akzeptanz

1. Eine abgesendete Feedbackrunde erscheint im Eingang mit Ungelesen-Markierung und Zähler.
2. Öffnen zeigt Freitext und Dateien; `read_at` wird gesetzt, der Zähler sinkt.
3. Öffnen ändert den Status **nicht** automatisch.
4. Statuswechsel mit Antworttext erscheint sofort im Portal des Kunden.
5. Ungültige Statusübergänge sind nicht möglich.
6. Der Freitext wird niemals als HTML ausgeführt.
7. Sammel-Download liefert genau die Dateien der Feedbackrunde.
8. Der Verlauf im Kundendetail zeigt alle Feedbackrunden mit Status.
9. Ohne offene Feedbackrunden ist der Zähler unsichtbar und der leere Zustand freundlich.
10. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
