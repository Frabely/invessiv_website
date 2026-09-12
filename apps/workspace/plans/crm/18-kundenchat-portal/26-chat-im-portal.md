# Task 26 — Chat im Portal

> **Merge-Einheit:** Ordner 18 · **Branch:** `feat/crm-kundenchat-portal`
> **Aufwand:** M · **Abhängigkeiten:** Task 25 (Verlaufskomponente), Task 33 (Outbox)
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)

Ein gemeinsamer Chat je Kunde, sichtbar für alle aktiven Firmenkontakte; der Lesestand bleibt je
Portalmitglied getrennt. Nachrichten sind unveränderlich und nicht selbst löschbar. Anhänge
referenzieren nur bereits freigegebene Dateien. Reply-To ist Invessiv; Antworten werden nicht
importiert. Widerruf und Firmenwechsel werden bei jedem Query serverseitig geprüft.

## Context

Die Kundenseite der Unterhaltung. Die Verlaufskomponente steht seit Task 25 und wird hier
wiederverwendet — der Kunde sieht denselben Verlauf, dieselben Datumstrenner, dasselbe Verhalten,
nur in der ruhigeren Portal-Gestaltung.

Dieser Task schließt den Kreis: Ab jetzt kann der Kunde schreiben, und beide Seiten werden per Mail
benachrichtigt, wenn eine Nachricht ankommt, die sie noch nicht gelesen haben. Ohne Benachrichtigung
wäre ein Chat ohne Echtzeit-Aktualisierung wertlos — man müsste zufällig hineinschauen.

## Entscheidungen

| Bereich                          | Entscheidung                                                                                                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Einstieg                         | Eigener Portalbereich `/portal/nachrichten` plus Ungelesen-Kennzeichnung im Dashboard                                                                                               |
| Komponente                       | Dieselbe `message-thread` wie im CRM, mit Portal-Texten und Portal-Gestaltung                                                                                                       |
| Benachrichtigung an den Betreuer | Notification sofort, Mail gebündelt: höchstens eine je **15 Minuten** je Kunde                                                                                                      |
| Warum gebündelt                  | Wer drei Sätze in drei Nachrichten schreibt, soll nicht drei Mails auslösen                                                                                                         |
| Benachrichtigung an den Kunden   | Mail gebündelt: höchstens eine je **12 Stunden** je Mitgliedschaft, Anker `customer_notified_at`                                                                                    |
| Warum so lang                    | Der Kunde soll nicht getaktet werden. Zwölf Stunden bündeln einen Arbeitstag zu einer Mail                                                                                          |
| Fenster als Konstante            | `PORTAL_DIGEST_WINDOW_HOURS` in `packages/common`; Umstellung auf 24 Stunden ist eine Zeile                                                                                         |
| Nur wenn nicht im Portal         | Kein Mailhinweis, wenn die Mitgliedschaft in den letzten 30 Minuten aktiv war (`last_seen_at`)                                                                                      |
| Abmelden                         | `portal_memberships.email_notifications_enabled` — beim Einladen gesetzt (Task 20), danach vom Portalmitglied und intern änderbar. Der Job filtert in der Abfrage, nicht im Versand |
| Umsetzung der Bündelung          | Outbox-Job aus Ordner 10 mit Dedupe-Key je Empfänger und Fenster; keine Entscheidung im Request-Pfad                                                                                |
| Missbrauchsschutz                | Datenbankgestütztes Limit: 30 Nachrichten je Stunde und Portalnutzer                                                                                                                |
| Bearbeiten und Löschen           | Gibt es nicht. Nachrichten sind nach dem Senden unveränderlich — im Portal wie im CRM                                                                                               |

## Architektur

```txt
/portal/nachrichten (Server Component)
  ├─ requirePortalAccess()
  ├─ getPortalConversation(customerId, { limit: 50 })
  └─ <MessageThread … />   dieselbe Komponente wie im CRM

POST /api/portal/conversation/messages
  → withPortalApiAuth
  → Limit prüfen
  → Nachricht anlegen (Task 24)
  → Outbox-Eintrag in derselben Transaktion:
       Notification an den Betreuer (sofort)
       Maildigest mit Dedupe-Key je Empfänger und Zeitfenster
```

Die Entscheidung über die Mail passiert im selben Vorgang wie das Anlegen, aber **nach** dem
Commit — schlägt der Versand fehl, ist die Nachricht trotzdem gespeichert.

## Additive Ergänzung

`internal_notified_at` an der Conversation ist die einzige Spalte, die hier neu entsteht — additiv,
mit Vorgabewert. `customer_notified_at` und `email_notifications_enabled` liegen bereits an
`portal_memberships` aus Task 20; die Bündelung ist damit pro Mitgliedschaft steuerbar und nicht pro
Unterhaltung.

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_add_conversation_notification_columns.sql
packages/db/src/record-configuration/crm/conversations.ts   erweitert

apps/workspace/src/app/[locale]/(portal)/portal/nachrichten/page.tsx + loading.tsx
apps/workspace/src/app/api/portal/conversation/**                    Routen aus Task 24
apps/workspace/src/server/portal/services/
  portal-message-rate-limit-service.ts
  message-notification-service.ts          Bündelungslogik, beide Richtungen
apps/workspace/src/components/portal/messages/
  portal-conversation/
  portal-conversation-empty/
  portal-notification-toggle/
apps/workspace/src/i18n/dictionaries/portal/messages/{de,en}.json
apps/workspace/src/i18n/dictionaries/portal/emails/{de,en}.json
```

## Tickets

### CRM-26-T1 — Migration und Benachrichtigungslogik

- **Files:** Migration, erweitertes `conversations`-Modell,
  `server/portal/services/message-notification-service.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - `conversations.internal_notified_at` additiv mit Vorgabewert
  - Interne Bündelung: Mail nur, wenn die letzte interne Benachrichtigung älter als 15 Minuten ist
  - Kundenbündelung: Mail nur, wenn `customer_notified_at` älter als `PORTAL_DIGEST_WINDOW_HOURS`
    (12 Stunden) ist
  - Kundenbenachrichtigung zusätzlich nur, wenn `last_seen_at` älter als 30 Minuten ist
  - `email_notifications_enabled = false` schließt die Mitgliedschaft in der **Abfrage** aus, nicht
    erst beim Versand
- **Akzeptanz:**
  - Test: drei Kundennachrichten binnen fünf Minuten lösen genau eine interne Mail aus
  - Test: nach 16 Minuten löst die nächste interne Nachricht wieder eine aus
  - Test: zwei interne Nachrichten binnen zwölf Stunden lösen genau eine Kundenmail aus
  - Test: nach Ablauf des Fensters löst die nächste wieder eine aus
  - Test: ein gerade aktiver Kunde bekommt keine Mail
  - Test: abgeschaltete Benachrichtigung verhindert den Versand
  - Test: Mailfehler verhindert das Speichern der Nachricht nicht

### CRM-26-T2 — Portal-Routen und Limit

- **Files:** `api/portal/conversation/**`, `portal-message-rate-limit-service.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Routen über `withPortalApiAuth`, Kundenkennung ausschließlich aus der Sitzung
  - Datenbankgestütztes Limit nach bestehendem Muster, 30 Nachrichten je Stunde
- **Akzeptanz:**
  - Test: 31. Nachricht ergibt 429 mit `Retry-After`
  - Test: kein Endpunkt nimmt eine Kunden- oder Unterhaltungskennung aus der Anfrage entgegen, die
    nicht gegen die Sitzung geprüft wird
  - Test: fremde Nachricht bearbeiten ergibt 404

### CRM-26-T3 — Portal-Oberfläche

- **Files:** `(portal)/portal/nachrichten/page.tsx`, `components/portal/messages/**`,
  `dictionaries/portal/messages/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Verlaufskomponente aus Task 25 mit Portal-Texten und ruhigerer Gestaltung
  - Lesestand wird beim Öffnen gesetzt
  - Leerer Zustand mit Einladung zum Schreiben und einem Hinweis auf die übliche Antwortzeit
  - Ungelesen-Kennzeichnung im Portal-Dashboard mit Link hierher
  - Eingabefeld am unteren Rand fixiert, auf Mobil über der Bildschirmtastatur sichtbar
  - Abmeldeschalter für Benachrichtigungen, gut auffindbar
- **Akzeptanz:**
  - Auf Mobil verdeckt die Bildschirmtastatur das Eingabefeld nicht
  - Tastaturbedienung vollständig, neue Nachrichten werden über die Live-Region angekündigt
  - Berührungsziele mindestens 44 mal 44 Pixel
  - Alle Texte in DE und EN, Tonfall freundlich und ohne Fachjargon

### CRM-26-T4 — Benachrichtigungsmails

- **Files:** `dictionaries/portal/emails/{de,en}.json`, Mailvorlagen im Benachrichtigungsdienst
- **Skills:** `copywriting`, `best-practices`
- **Inhalt:**
  - Text- und HTML-Fassung, Betreff mit Kundenname beziehungsweise Projektbezug
  - Vorschau der Nachricht auf wenige Zeilen gekürzt, mit direktem Link zur Unterhaltung
  - Hinweis zum Abschalten der Benachrichtigungen
  - Keine personenbezogenen Daten über das Nötige hinaus, nichts Vertrauliches im Betreff
- **Akzeptanz:**
  - Mails in DE und EN, passend zur Sprache des Empfängers
  - Der Link führt für den Kunden ins Portal, für den Betreuer ins CRM
  - Test: der Nachrichtentext wird in der Mail nicht als HTML ausgeführt

## Deploy-Sicherheit

1. **Live sichtbar:** neuer Portalbereich „Nachrichten", Ungelesen-Kennzeichnung im Dashboard,
   Benachrichtigungsmails in beide Richtungen.
2. **Bricht nichts:** Migration additiv (drei Spalten mit Vorgabewerten). Die CRM-Seite aus Task 25
   bleibt unverändert und funktioniert weiter — sie bekommt lediglich Nachrichten von der Gegenseite.
   Mailversand ist fehlertolerant: Ohne Konfiguration degradiert er still, ohne Nachrichten zu
   verlieren.
3. **Offen:** nichts. Der Chat ist mit diesem Task auf beiden Seiten vollständig. Der Hinweis aus
   Task 25, dass der Kunde noch nicht mitlesen kann, wird hier entfernt.

## End-to-End-Akzeptanz

1. Der Kunde schreibt aus dem Portal; die Nachricht erscheint im CRM.
2. Der Betreuer antwortet; die Antwort erscheint im Portal.
3. Beide Seiten sehen denselben Verlauf mit denselben Datumstrennern.
4. Der Betreuer erhält eine Mail — bei drei schnell aufeinanderfolgenden Nachrichten nur eine.
5. Ein Kunde, der gerade im Portal ist, bekommt keine Mail.
6. Benachrichtigungen lassen sich im Portal abschalten und werden dann nicht mehr versendet.
7. Mehr als 30 Nachrichten je Stunde werden begrenzt.
8. Nachrichten sind nach dem Senden unveränderlich; es gibt keinen Bearbeiten- und keinen Löschweg.
9. Ein Portalnutzer erreicht keine fremde Unterhaltung.
10. Auf Mobil ist das Eingabefeld über der Bildschirmtastatur erreichbar.
11. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
