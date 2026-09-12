# Task 23 — Submissions im CRM

> **Branch:** `feat/crm-einreichungen-ansicht`
> **Aufwand:** M (rund ein Tag)
> **Abhängigkeiten:** Task 22
> **Migration:** keine

## Context

Die Gegenseite zu Task 22: Was der Kunde einreicht, muss auffindbar, lesbar und beantwortbar sein.
Ohne diesen Task existieren Einreichungen zwar in der Datenbank, aber der einzige Hinweis darauf ist
die Benachrichtigungsmail — was genau die Zettelwirtschaft wäre, die das System abschaffen soll.

Der Task schließt den Kreis: Einreichung öffnen, Freitext lesen, Dateien ansehen oder gebündelt
herunterladen, Status setzen. Der gesetzte Status erscheint sofort im Portal des Kunden — damit
ersetzt das System die Rückmeldung „ist angekommen, ich schaue es mir an".

## Entscheidungen

| Bereich               | Entscheidung                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Ort                   | Eigene Sektion im Kundendetail, zusätzlich ein Sammelbereich für alle offenen Einreichungen                         |
| Warum beides          | Im Kundenkontext braucht man den Verlauf, im Alltag die Frage „was liegt insgesamt an"                              |
| Sammelbereich         | Route `/crm/eingang`, standardmäßig gefiltert auf ungelesen und abgesendet                                          |
| Ungelesen             | `read_at` wird beim ersten Öffnen gesetzt; ein Zähler erscheint am Sidebar-Eintrag                                  |
| Status setzen         | Von `submitted` auf `in_review`, `accepted` oder `changes_requested`                                                |
| Automatik             | Das Öffnen setzt **nicht** automatisch auf `in_review` — gelesen und in Bearbeitung sind zwei verschiedene Aussagen |
| Antwort an den Kunden | Ein kurzer Antworttext beim Statuswechsel, den der Kunde im Portal sieht                                            |
| Dateien               | Gebündelter Download über die Archiv-Route aus Task 16, vorausgewählt auf die Einreichung                           |
| Löschen               | Einreichungen werden nicht gelöscht — sie sind Teil der Nachvollziehbarkeit                                         |

## Architektur

```txt
GET  /crm/eingang                             Sammelbereich, Server Component
PATCH /api/workspace/crm/submissions/[id]/status
  → withPermission(CustomersWrite)
  → Status und optionaler Antworttext
  → activities
  → optional Mail an den Kunden (schaltbar im Dialog)
POST /api/workspace/crm/submissions/[id]/read → setzt read_at
```

Die Sidebar zeigt einen Zähler offener Einreichungen. Er wird im `(app)`-Layout einmal geladen — eine
zusätzliche, sehr günstige Abfrage über den partiellen Index aus Task 22.

## Verzeichnisstruktur

```txt
apps/workspace/src/app/[locale]/(app)/crm/eingang/page.tsx  + loading.tsx
apps/workspace/src/config/routes.ts                         + CRM_INBOX
apps/workspace/src/app/api/workspace/crm/submissions/[id]/status/route.ts
apps/workspace/src/app/api/workspace/crm/submissions/[id]/read/route.ts

apps/workspace/src/server/workspace/crm/
  query-handler/list-submissions.query-handler.ts
  query-handler/count-open-submissions.query-handler.ts
  command-handler/{update-submission-status,mark-submission-read}.command-handler.ts
  services/submission-reply-notification-service.ts

apps/workspace/src/components/workspace/crm/submissions/
  submissions-inbox/
  submission-card/
  submission-detail/
  submission-status-dialog/
  submission-feedback-text/
  customer-submissions-section/
apps/workspace/src/components/workspace/workspace-sidebar/   Zähler-Badge
apps/workspace/src/i18n/dictionaries/workspace/crm/submissions/{de,en}.json
```

## Tickets

### CRM-23-T1 — Abfragen

- **Files:** `list-submissions.query-handler.ts`, `count-open-submissions.query-handler.ts` + Tests
- **Skills:** `best-practices`, `performance`
- **Inhalt:**
  - Liste mit Filter nach Status, Kunde und Ungelesen; Dateianzahl je Einreichung mitgeladen
  - Zähler als schlanke Abfrage über den partiellen Index
- **Akzeptanz:**
  - Keine N+1-Abfrage für die Dateianzahl
  - Der Zähler bleibt unter einer Millisekunde Abfragezeit bei realistischer Datenmenge
  - Test: Entwürfe erscheinen im Eingang nie

### CRM-23-T2 — Status setzen und Rückmeldung

- **Files:** `update-submission-status.command-handler.ts`, `mark-submission-read.command-handler.ts`,
  `submission-reply-notification-service.ts`, beide Routen + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Erlaubte Übergänge als Const-Objekt, ungültige werden abgelehnt
  - Antworttext wird am Datensatz gespeichert und im Portal angezeigt
  - Mail an den Kunden optional und im Dialog abwählbar
- **Akzeptanz:**
  - Test: ein Wechsel von `draft` auf `accepted` ist nicht möglich
  - Test: `read_at` wird nur beim ersten Mal gesetzt
  - Test: genau eine Activity je Statuswechsel
  - Test: Mailfehler verhindert den Statuswechsel nicht

### CRM-23-T3 — Eingang

- **Files:** `(app)/crm/eingang/page.tsx`, `loading.tsx`, `submissions-inbox/**`,
  `submission-card/**`, Sidebar-Zähler
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

### CRM-23-T4 — Einreichung im Detail

- **Files:** `submission-detail/**`, `submission-feedback-text/**`, `submission-status-dialog/**`,
  `customer-submissions-section/**`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Vollständiger Freitext, mit erhaltenen Absätzen und klickbaren Links — als **Text** gerendert,
    nie als HTML (der Inhalt kommt von außen)
  - Dateien der Einreichung mit Vorschau und Sammel-Download über Task 16
  - Statusdialog mit Antworttext und Vorschau dessen, was der Kunde sieht
  - Sektion im Kundendetail mit dem Verlauf aller Einreichungen
- **Akzeptanz:**
  - Ein Freitext mit `<script>` oder Markdown erscheint als Zeichenfolge, nicht als ausgeführter oder
    formatierter Inhalt
  - Sehr langer Text ist mit Aufklappen lesbar, ohne die Seite zu sprengen
  - Links im Text öffnen in neuem Tab mit `rel="noreferrer"`
  - Sammel-Download liefert genau die Dateien dieser Einreichung

## Deploy-Sicherheit

1. **Live sichtbar:** neuer Menüpunkt „Eingang" mit Zähler, neue Sektion im Kundendetail,
   Statusdialog.
2. **Bricht nichts:** keine Migration. Der Zähler ergänzt das `(app)`-Layout um eine günstige
   Abfrage — schlägt sie fehl, wird der Zähler weggelassen statt die Seite zu brechen. Der
   Portal-Bereich bleibt unverändert; er liest lediglich einen Status, den es vorher schon gab.
3. **Offen:** nichts. Mit diesem Task ist der Einreichungs-Kreislauf vollständig: einreichen,
   benachrichtigen, lesen, antworten, im Portal sehen.

## End-to-End-Akzeptanz

1. Eine abgesendete Einreichung erscheint im Eingang mit Ungelesen-Markierung und Zähler.
2. Öffnen zeigt Freitext und Dateien; `read_at` wird gesetzt, der Zähler sinkt.
3. Öffnen ändert den Status **nicht** automatisch.
4. Statuswechsel mit Antworttext erscheint sofort im Portal des Kunden.
5. Ungültige Statusübergänge sind nicht möglich.
6. Der Freitext wird niemals als HTML ausgeführt.
7. Sammel-Download liefert genau die Dateien der Einreichung.
8. Der Verlauf im Kundendetail zeigt alle Einreichungen mit Status.
9. Ohne offene Einreichungen ist der Zähler unsichtbar und der leere Zustand freundlich.
10. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
