# Task 25 — Chat im CRM

> **Merge-Einheit:** Ordner 13a · **Branch:** `feat/crm-13a-kundenchat-intern`
> **Aufwand:** M · **Abhängigkeiten:** Task 24
> **Migration:** keine

- Der bestehende Mock-`ChatDock` im Kunden-Cockpit zeigt den echten Verlauf; Mitarbeiter lesen und schreiben dort.
- Posteingang `/crm/nachrichten` über alle Kunden plus Sidebar-Zähler für ungelesene Kundennachrichten.
- Nachrichten sind unveränderlich; kein Bearbeiten, kein Löschen. Redaction bleibt Workspace-Owner-only.
- Versand erzeugt eine Activity. Notification/Mail folgen in Ordner 20c; kein Mailfehler kann den Chatwrite
  rückgängig machen.
- Keine Echtzeitverbindung; Laden beim Öffnen, Refresh nach Senden und bei `visibilitychange`.

## Context

Die Mitarbeitersicht auf die Unterhaltung. Hier entsteht die gemeinsame Verlaufskomponente, die das Portal in Task 26
wiederverwendet. Sie bekommt alle Texte als Props und kennt kein Dictionary, damit Portal und CRM garantiert dasselbe
Verhalten zeigen: gleiche Datumstrenner, gleiche Sendezustände, gleiche Tastaturbedienung.

Der `ChatDock` aus `@invessiv/ui` (`packages/ui/src/components/chat-dock/chat-dock.tsx`) existiert bereits als Mock
und rendert ohne `children` Skelett-Blasen und ein deaktiviertes Eingabefeld. Dieser Task übergibt die echte
Verlaufskomponente als `children`; der Dock selbst bleibt die Hülle (Toggle, Titel, Badge, Hinweis „liest mit"). Der
Mock-Kommentar im Dock wird angepasst.

## Was Posteingang und Sidebar-Zähler leisten

- **Sidebar-Zähler:** Badge am Menüpunkt „Nachrichten“ der Workspace-Navigation. Zahl der Unterhaltungen, in denen
  eine Kundennachricht neuer ist als der **eigene** Lesestand. Eigene und Systemnachrichten zählen nicht. Klick →
  Posteingang. Einziger Hinweis auf neue Nachrichten, bis Ordner 20c Benachrichtigungen aktiviert.
- **Posteingang `/crm/nachrichten`:** links Liste aller Unterhaltungen, auf die der Nutzer `chat.read` hat (Firma,
  Vorschau der letzten Nachricht, Zeit, Ungelesen-Markierung, sortiert nach letzter Nachricht; Filter „Nur meine“ =
  Verantwortlicher ist der Nutzer); rechts der ausgewählte Verlauf mit Antwortfeld und änderbarem Verantwortlichen.
  Auswahl und Filter über URL-Parameter. Mobil: Liste und Verlauf als zwei Ansichten.

## Entscheidungen

| Bereich               | Entscheidung                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Ort                   | `ChatDock` im Kunden-Cockpit + Posteingang `/crm/nachrichten` + Sidebar-Zähler                                              |
| Gemeinsame Komponente | `components/workspace/shared/message-thread/**` — app-intern geteilt, nicht in `packages/ui` (hängt an Workspace-Contracts) |
| Aktualisierung        | Beim Öffnen laden, nach dem Senden neu laden, zusätzlich bei `visibilitychange`                                             |
| Senden                | Enter sendet, Shift+Enter macht einen Zeilenumbruch; auf Touchgeräten sendet nur die Schaltfläche                           |
| Sendezustand          | Optimistische Anzeige „wird gesendet“; bei Fehler bleibt die Nachricht mit „Erneut senden“ sichtbar                         |
| Entwurf               | Ungesendeter Text bleibt je Kunde im `localStorage` (Key-Konstante in `common`), Zugriffe in `try/catch`                    |
| Datumstrenner         | „Heute“, „Gestern“, danach Datum — über die Locale formatiert (`Intl`, keine Locale-Branches)                               |
| Gruppierung           | Aufeinanderfolgende Nachrichten derselben Seite innerhalb von fünf Minuten teilen einen Kopf                                |
| Links                 | Erkannt und klickbar (`rel="noopener noreferrer"`), sonst **nur Text**. Kein HTML, kein Markdown                            |
| Systemnachrichten     | Mittig, zurückhaltend, ohne Sprechblase; Text aus Dictionary-Key + Parametern                                               |
| Redaction             | Platzhalter „Nachricht vom Owner ausgeblendet“ statt Inhalt                                                                 |
| Lesestand             | Wird gesetzt, sobald der Verlauf sichtbar ist (Dock geöffnet bzw. Posteingangsauswahl)                                      |
| Verantwortung         | Anzeige + Änderung im Posteingang über versionierten PATCH (Task 24 T3)                                                     |

## Architektur

```txt
Kunden-Cockpit (Server Component lädt getCustomerConversation, limit 50)
  └─ customer-cockpit-view.tsx
       └─ <ChatDock badgeLabel={unread} …>
            └─ <CustomerConversation …>        Client, nutzt messages-service
                 └─ <MessageThread messages onSend onLoadOlder labels />

/crm/nachrichten (page.tsx orchestriert nur; noindex, dynamic = "force-dynamic")
  └─ listConversations()   eine Query: Kunde, letzte Nachricht, Ungelesen je Nutzer, Owner
       └─ <ConversationInbox> Liste links, <CustomerConversation> rechts

Sidebar-Zähler: countUnreadConversations() im (app)-Layout, fehlertolerant (Fehler → kein Badge)
```

Systemnachrichten: Ein Phasenwechsel in `update-project.command-handler.ts` ruft `messageService.appendSystemMessage`
auf —
fehlertolerant, die eigentliche Aktion scheitert nie daran. Die Einreichung aus Task 22 existiert noch nicht; ihre
Verdrahtung gehört in Ordner 16 (dort als Aufgabe vermerken).

## Verzeichnisstruktur

```txt
apps/workspace/src/components/workspace/shared/message-thread/
  message-thread/            .tsx + .module.css + .test.tsx
  message-bubble/
  message-group/
  message-date-divider/
  message-composer/
  message-system-entry/
apps/workspace/src/common/contracts/ui/message-thread-labels.ts
apps/workspace/src/common/constants/crm/message-draft-storage.ts
apps/workspace/src/hooks/workspace/shared/use-message-draft.ts
apps/workspace/src/hooks/workspace/shared/use-thread-autoscroll.ts
apps/workspace/src/lib/…/group-messages.ts          reine Gruppierung/Datumstrenner, getestet (ggf. common/patterns)

apps/workspace/src/app/[locale]/(app)/crm/nachrichten/page.tsx + loading.tsx
apps/workspace/src/config/routes.ts                            + CRM_MESSAGES
apps/workspace/src/server/workspace/crm/query-handler/
  list-conversations.query-handler.ts
  count-unread-conversations.query-handler.ts
apps/workspace/src/components/workspace/crm/messages/
  customer-conversation/
  conversation-inbox/
  conversation-list-item/
  conversation-owner-select/
apps/workspace/src/components/workspace/crm/detail/customer-cockpit-view/customer-cockpit-view.tsx   Dock befüllen
apps/workspace/src/client/crm/messages-service.ts
apps/workspace/src/i18n/dictionaries/workspace/crm/messages/{de,en}.json
packages/ui/src/components/chat-dock/chat-dock.tsx             Mock-Kommentar anpassen, sonst unverändert
```

Vor dem Anlegen die scoped `AGENTS.md` in `components/workspace/shared/`, `components/workspace/crm/`,
`app/[locale]/(app)/crm/` und `hooks/` lesen.

## Tickets

### CRM-25-T1 — Verlaufskomponente

- **Skills:** `frontend-design`, `accessibility`
- **Inhalt:**
  - Sprechblasen: eigene Seite rechts, andere links, auch ohne Farbe unterscheidbar (Ausrichtung + Label)
  - Gruppierung, Datumstrenner, Zeit je Gruppe
  - Auto-Scroll ans Ende beim Öffnen und nach dem Senden — **nicht**, wenn man weiter oben liest (dann
    Schaltfläche „Neue Nachrichten“)
  - „Ältere laden“ oben ohne Sprung der Scrollposition
  - Alle Texte als Props (`MessageThreadLabels`), kein Dictionary-Import
  - Verlauf als `role="log"`-Live-Region
  - Theme-Tokens, Dark und Light, Zustände über `data-*`
- **Akzeptanz:** Komponententests für Gruppierung, Datumstrenner, redigierte Nachricht, Systemeintrag; kein Sprung
  beim Nachladen; vollständig per Tastatur nutzbar; `<img onerror=…>` im Text erscheint als Zeichenfolge.

### CRM-25-T2 — Eingabefeld

- **Skills:** `frontend-design`, `accessibility`
- **Inhalt:** wachsendes Textfeld bis Maximalhöhe; Enter/Shift+Enter; Zeichenzähler ab 80 % des Limits; Entwurf im
  `localStorage` je Kunde; Feld sofort leeren, optimistisch anzeigen.
- **Akzeptanz:** fehlgeschlagenes Senden verliert den Text nicht und bietet erneutes Senden; Entwurf überlebt
  Neuladen und wird nach Erfolg entfernt; blockierter `localStorage` wirft nicht.

### CRM-25-T3 — Chat im Cockpit-Dock

- **Skills:** `frontend-design`, `copywriting`, `accessibility`
- **Inhalt:**
  - `ChatDock` in `customer-cockpit-view.tsx` bekommt `<CustomerConversation>` als `children` und `badgeLabel` mit
    der Ungelesen-Zahl; Lesestand beim Öffnen des Docks
  - Ohne `chat.read` bleibt der Dock ausgeblendet; ohne `chat.write` ist der Verlauf lesbar, das Eingabefeld fehlt
  - Hinweis „Der Kunde liest im Portal mit“ unübersehbar (bestehender `readAlong`-Text im Dock prüfen/anpassen)
  - Empty-State erklärt den Zweck: gemeinsamer Verlauf mit dem Kunden, sichtbar im Portal
  - Owner sieht an jeder Kunden-/Mitarbeiternachricht „Ausblenden“ mit Bestätigungsdialog
- **Akzeptanz:** kein Bearbeiten-/Löschweg; Redaction im Verlauf gekennzeichnet; Ungelesene werden beim Öffnen
  gelesen; bestehende Cockpit-Tests bleiben grün, neue Tests für Rechtevarianten.

### CRM-25-T4 — Posteingang und Sidebar-Zähler

- **Skills:** `frontend-design`, `accessibility`, `performance`
- **Inhalt:** wie Abschnitt „Was Posteingang und Sidebar-Zähler leisten“; Menüpunkt „Nachrichten“ in der
  Workspace-Navigation nur mit `chat.read`; Empty-States „noch keine Unterhaltung“ vs. „keine Treffer für Filter“.
- **Akzeptanz:** keine N+1-Abfrage für Vorschau und Zähler (eine Query mit Lateral-Join/Window); Zählerfehler lässt
  die Seite intakt; mobil ab 360 px bedienbar; inaktive oder am Kunden unberechtigte Mitglieder nicht als
  Verantwortliche speicherbar; Liste zeigt nur Kunden im eigenen `accessScope`.

### CRM-25-T5 — Systemnachricht Phasenwechsel

- **Skills:** `best-practices`, `copywriting`
- **Inhalt:** Phasenwechsel in `update-project.command-handler.ts` erzeugt eine Systemnachricht (Key + Parameter,
  Texte in `workspace/crm/messages` **und** `portal/messages` Dictionaries); fehlertolerant.
- **Akzeptanz (Tests):** genau eine Systemnachricht mit korrekten Parametern; Fehler beim Anhängen bricht den
  Phasenwechsel nicht ab; kein Zähleranstieg.

### CRM-25-T6 — Seed

- `db:seed:crm` um Unterhaltungen mit gemischten Nachrichten (intern, Kunde, System, eine redigierte) erweitern.

## End-to-End-Akzeptanz

1. Eine Nachricht lässt sich im Cockpit-Dock schreiben und erscheint sofort im Verlauf.
2. Enter sendet, Shift+Enter macht eine neue Zeile; ein Entwurf überlebt das Neuladen.
3. Nachrichten sind unveränderlich; eine Owner-Redaction bleibt als Activity nachvollziehbar.
4. Datumstrenner und Gruppierung stimmen; Inhalte werden nie als HTML ausgeführt.
5. Ein Phasenwechsel erscheint als Systemeintrag.
6. Posteingang zeigt alle berechtigten Unterhaltungen mit Vorschau und Ungelesen-Zahl; Zähler verschwindet, wenn
   alles gelesen ist.
7. Mobil, Dark und Light geprüft; Tastaturbedienung vollständig.
