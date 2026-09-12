# Task 25 — Chat im CRM

> **Branch:** `feat/crm-chat-intern`
> **Aufwand:** M (rund ein Tag)
> **Abhängigkeiten:** Task 24
> **Migration:** keine

## Context

Die Bearbeitersicht auf die Unterhaltung: lesen, schreiben, Ungelesen-Zähler in der Seitenleiste.
Diese Seite kommt **vor** der Portalseite, weil sie die Verlaufskomponente enthält, die das Portal
danach wiederverwendet — und weil eingehende Nachrichten sonst zuerst unsichtbar wären.

Hier entsteht auch die gemeinsame Verlaufskomponente. Sie bekommt alle Texte als Eigenschaften und
kennt kein Dictionary, damit Portal und CRM garantiert dasselbe Verhalten zeigen: gleiche
Datumstrenner, gleiche Sendezustände, gleiche Tastaturbedienung.

## Entscheidungen

| Bereich               | Entscheidung                                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ort                   | Sektion im Kundendetail-Panel plus ein Sammelbereich `/crm/nachrichten` über alle Kunden                                                                             |
| Gemeinsame Komponente | `components/workspace/shared/message-thread/**` — app-intern geteilt, nicht in `packages/ui` (sie hängt an den Nachrichten-Verträgen, die workspace-spezifisch sind) |
| Aktualisierung        | Beim Öffnen laden, nach dem Senden neu laden. Zusätzlich beim Zurückkehren in den Tab (`visibilitychange`) — günstig und deckt den Alltagsfall ab                    |
| Senden                | Eingabetaste sendet, Umschalt und Eingabetaste macht einen Zeilenumbruch                                                                                             |
| Sendezustand          | Optimistische Anzeige mit Zustand „wird gesendet"; bei Fehler bleibt die Nachricht sichtbar mit Schaltfläche „Erneut senden"                                         |
| Entwurf               | Ungesendeter Text bleibt je Kunde im `localStorage`                                                                                                                  |
| Datumstrenner         | „Heute", „Gestern", danach das Datum — über die Locale formatiert                                                                                                    |
| Gruppierung           | Aufeinanderfolgende Nachrichten derselben Seite innerhalb von fünf Minuten werden zusammengefasst (ein Kopf statt fünf)                                              |
| Links                 | Erkannt und klickbar, aber **als Text gerendert**. Kein HTML, kein Markdown — der Inhalt kommt von außen                                                             |
| Systemnachrichten     | Mittig, zurückhaltend, ohne Sprechblase                                                                                                                              |
| Lesestand             | Wird gesetzt, sobald die Unterhaltung sichtbar ist                                                                                                                   |

## Architektur

```txt
Kundendetail (Server Component)
  └─ getConversation(customerId, { limit: 50 })
       └─ <MessageThread messages=… onSend=… onLoadOlder=… labels=… />

/crm/nachrichten
  └─ listConversations()  alle Kunden mit letzter Nachricht und Ungelesen-Zahl
       └─ Auswahl links, Verlauf rechts (auf Mobil zwei Ansichten)

Sidebar-Zähler: countUnreadConversations() im (app)-Layout
```

Zusätzlich werden hier die ersten **Systemnachrichten** verdrahtet: Ein Phasenwechsel (Task 10) und
eine eingegangene Einreichung (Task 22) rufen jetzt `appendSystemMessage` auf. Erst ab diesem Task
kann sie jemand sehen, deshalb wird die Verdrahtung hier und nicht früher gemacht.

## Verzeichnisstruktur

```txt
apps/workspace/src/components/workspace/shared/message-thread/
  message-thread.tsx            .module.css
  message-bubble.tsx
  message-group.tsx
  message-date-divider.tsx
  message-composer.tsx
  message-system-entry.tsx
  message-thread.test.tsx
apps/workspace/src/common/contracts/ui/message-thread-labels.ts
apps/workspace/src/hooks/workspace/crm/use-message-draft.ts
apps/workspace/src/hooks/workspace/crm/use-thread-autoscroll.ts

apps/workspace/src/app/[locale]/(app)/crm/nachrichten/page.tsx + loading.tsx
apps/workspace/src/config/routes.ts                            + CRM_MESSAGES
apps/workspace/src/app/api/workspace/crm/conversations/**      Routen aus Task 24
apps/workspace/src/server/workspace/crm/query-handler/
  list-conversations.query-handler.ts
  count-unread-conversations.query-handler.ts
apps/workspace/src/components/workspace/crm/messages/
  customer-conversation-section/
  conversation-list/
  conversation-list-item/
apps/workspace/src/client/crm/messages-service.ts
apps/workspace/src/i18n/dictionaries/workspace/crm/messages/{de,en}.json
```

## Tickets

### CRM-25-T1 — Verlaufskomponente

- **Files:** `components/workspace/shared/message-thread/**`,
  `common/contracts/ui/message-thread-labels.ts`, `hooks/.../use-thread-autoscroll.ts`
- **Skills:** `frontend-design`, `accessibility`
- **Inhalt:**
  - Sprechblasen, eigene Seite rechts, andere links, deutlich unterscheidbar auch ohne Farbe
  - Gruppierung nach Absender und Zeitfenster, Datumstrenner, Zeitangabe je Gruppe
  - Automatisches Scrollen ans Ende beim Öffnen und nach dem Senden — **nicht**, wenn man gerade
    weiter oben liest (dann erscheint eine Schaltfläche „Neue Nachrichten")
  - „Ältere laden" oben, ohne die Scrollposition springen zu lassen
  - Alle Texte als Eigenschaften, kein Dictionary-Import
  - Der Verlauf ist eine `log`-Live-Region, damit neue Nachrichten angekündigt werden
- **Akzeptanz:**
  - Komponententests für Gruppierung, Datumstrenner, gelöschte Nachricht, Systemeintrag
  - Kein Sprung der Scrollposition beim Nachladen
  - Vollständig per Tastatur nutzbar, Fokusreihenfolge sinnvoll
  - Ein Nachrichtentext mit `<img onerror=…>` erscheint als Zeichenfolge

### CRM-25-T2 — Eingabefeld

- **Files:** `message-composer.tsx`, `hooks/.../use-message-draft.ts`
- **Skills:** `frontend-design`, `accessibility`
- **Inhalt:**
  - Automatisch wachsendes Textfeld bis zu einer Maximalhöhe, dann eigenes Scrollen
  - Eingabetaste sendet, Umschalt und Eingabetaste fügt eine Zeile ein; auf Touchgeräten sendet nur
    die Schaltfläche
  - Zeichenzähler ab 80 Prozent des Limits
  - Entwurf im `localStorage` je Kunde, in `try/catch`
  - Beim Senden wird das Feld sofort geleert und die Nachricht optimistisch angezeigt
- **Akzeptanz:**
  - Fehlgeschlagenes Senden verliert den Text nicht und bietet erneutes Senden
  - Entwurf überlebt das Neuladen und wird nach erfolgreichem Senden entfernt
  - Blockierter `localStorage` führt nicht zu einem Fehler

### CRM-25-T3 — Sektion im Kundendetail

- **Files:** `customer-conversation-section/**`, `client/crm/messages-service.ts`,
  `dictionaries/workspace/crm/messages/{de,en}.json`
- **Skills:** `frontend-design`, `copywriting`, `accessibility`
- **Inhalt:**
  - Verlauf im Detail-Panel, Lesestand wird beim Sichtbarwerden gesetzt
  - Eigene Nachricht bearbeiten und zurückziehen über ein Kontextmenü, Bearbeiten nur binnen
    15 Minuten sichtbar
  - Neuladen beim Zurückkehren in den Tab
  - Leerer Zustand mit Hinweis, dass der Kunde diese Nachrichten im Portal sieht
- **Akzeptanz:**
  - Der Hinweis, dass der Kunde mitliest, ist unübersehbar — das ist kein internes Notizfeld
  - Bearbeiten und Zurückziehen funktionieren und sind im Verlauf gekennzeichnet
  - Ungelesene werden beim Öffnen als gelesen markiert

### CRM-25-T4 — Sammelbereich und Zähler

- **Files:** `(app)/crm/nachrichten/page.tsx`, `conversation-list/**`, `conversation-list-item/**`,
  `list-conversations.query-handler.ts`, `count-unread-conversations.query-handler.ts`,
  Sidebar-Zähler
- **Skills:** `frontend-design`, `accessibility`, `performance`
- **Inhalt:**
  - Zweispaltig ab Tablet, auf Mobil Liste und Verlauf als zwei Ansichten
  - Liste mit Firma, Vorschau der letzten Nachricht, Zeit und Ungelesen-Kennzeichnung
  - Auswahl über URL-Parameter
  - Sidebar-Zähler im `(app)`-Layout
- **Akzeptanz:**
  - Keine N+1-Abfrage für Vorschau und Zähler
  - Schlägt die Zählerabfrage fehl, entfällt der Zähler, die Seite bleibt intakt
  - Mobil ab 360 px bedienbar

### CRM-25-T5 — Systemnachrichten verdrahten

- **Files:** `update-project-phase.command-handler.ts` (Task 10),
  `submit-submission.command-handler.ts` (Task 22), Dictionary-Keys
- **Skills:** `best-practices`, `copywriting`
- **Inhalt:**
  - Phasenwechsel und eingegangene Einreichung erzeugen je eine Systemnachricht
  - Texte über Dictionary-Keys mit Parametern, nicht als gespeicherte Sätze
  - Schlägt das Schreiben der Systemnachricht fehl, scheitert die eigentliche Aktion **nicht**
- **Akzeptanz:**
  - Test: Phasenwechsel erzeugt genau eine Systemnachricht mit korrekten Parametern
  - Test: ein Fehler beim Anhängen bricht den Phasenwechsel nicht ab
  - Systemnachrichten erhöhen keinen Ungelesen-Zähler

## Deploy-Sicherheit

1. **Live sichtbar:** neue Sektion „Nachrichten" im Kundendetail, neuer Menüpunkt mit Zähler,
   Systemnachrichten bei Phasenwechseln.
2. **Bricht nichts:** keine Migration. Zwei bestehende Handler bekommen einen zusätzlichen,
   fehlertoleranten Aufruf — schlägt er fehl, läuft die eigentliche Aktion unverändert durch. Der
   Sidebar-Zähler entfällt bei einem Abfragefehler, statt die Seite zu brechen.
3. **Offen:** die Portalseite (Task 26). **Wichtig für den Betrieb:** In diesem Zustand kann der
   Kunde die Nachrichten noch nicht sehen. Der leere Zustand und der Hinweis in der Sektion nennen
   das ausdrücklich, damit hier nicht ins Leere geschrieben wird.

## End-to-End-Akzeptanz

1. Eine Nachricht lässt sich im Kundendetail schreiben und erscheint sofort im Verlauf.
2. Eingabetaste sendet, Umschalt und Eingabetaste macht eine neue Zeile.
3. Ein ungesendeter Entwurf überlebt das Neuladen.
4. Eigene Nachrichten sind binnen 15 Minuten bearbeitbar und jederzeit zurückziehbar.
5. Der Verlauf zeigt Datumstrenner und fasst zusammenhängende Nachrichten zusammen.
6. Nachrichteninhalte werden nie als HTML ausgeführt.
7. Ein Phasenwechsel erscheint als Systemeintrag im Verlauf.
8. Der Sammelbereich zeigt alle Unterhaltungen mit Vorschau und Ungelesen-Zahl.
9. Der Sidebar-Zähler stimmt und verschwindet, wenn alles gelesen ist.
10. Mobil, Dark und Light geprüft; Tastaturbedienung vollständig.
11. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
