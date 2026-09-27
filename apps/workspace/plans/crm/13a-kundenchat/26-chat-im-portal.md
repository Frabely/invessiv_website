# Task 26 — Chat im Portal

> **Merge-Einheit:** Ordner 13a · **Branch:** `feat/crm-13a-kundenchat-intern`
> **Aufwand:** M · **Abhängigkeiten:** Task 24, Task 25 (Verlaufskomponente)
> **Migration:** keine (alles in Task 24)

Ein gemeinsamer Chat je Kunde, sichtbar für alle aktiven Firmenkontakte mit `portal.messages.read`; der Lesestand
bleibt je Portalmitgliedschaft getrennt. Nachrichten sind unveränderlich und nicht löschbar. Widerruf und
Firmenwechsel werden bei jeder Query serverseitig geprüft.

**Nicht in diesem Task (→ Ordner 20c):** Benachrichtigungslogik, Kundendigest, interne Bündelung, Mailvorlagen und
der sichtbare E-Mail-Abmeldeschalter. Ein Schalter ohne Versand wäre ein totes Bedienelement; `portal_memberships`
hat `email_notifications_enabled`, `customer_notified_at` und `last_seen_at` bereits.

## Context

Die Kundenseite der Unterhaltung. Die Verlaufskomponente aus Task 25 wird wiederverwendet — der Kunde sieht denselben
Verlauf, dieselben Datumstrenner, dasselbe Verhalten, nur mit Portal-Texten in Du-Form.

Im Portal-Dashboard existiert der dauerhafte `ChatDock`
(`components/portal/dashboard/portal-dashboard/portal-dashboard.tsx`). Er wird auf echte Daten umgestellt. Ein
Dashboard-Widget `messages` gibt es **nicht** mehr (vor Ordner 13a bewusst entfernt); der Dock ist der Einstieg.
Zusätzlich entsteht die Seite `/portal/[customerId]/messages` (`PortalSection.Messages` existiert bereits).

## Entscheidungen

| Bereich            | Entscheidung                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Einstieg           | Dashboard-Dock (Ungelesen-Zähler am Rail) + eigene Seite `/portal/[customerId]/messages` + Navigationseintrag                            |
| Komponente         | `MessageThread` aus `@invessiv/ui` — dieselbe wie im CRM, mit Portal-Texten                                                              |
| Rechte             | Lesen `portal.messages.read`, Schreiben `portal.messages.write`; ohne Write nur der Verlauf. `canWrite` kommt im `PortalConversationDto` |
| Owner-Sicht        | Liest mit (`portal.messages.read` in `PORTAL_READ_PERMISSION_VALUES`), schreibt nie, Hinweis mit CRM-Link                                |
| Missbrauchsschutz  | 30 Nachrichten je Stunde und Portalmitgliedschaft, gezählt direkt auf `messages` (Index aus Task 24); 429 + `Retry-After`                |
| Bearbeiten/Löschen | Gibt es nicht                                                                                                                            |
| Sprache            | Portal-Texte aus der Route-Locale; DE in Du-Form                                                                                         |

## Architektur

```txt
/portal/[customerId]/messages (Server Component; noindex, dynamic = "force-dynamic",
                               viewport.interactiveWidget = "resizes-content")
  ├─ requirePortalReader(locale, customerId)       Kontakt oder Owner-Sicht (nur lesend)
  ├─ getPortalConversation(reader, null)          null → notFound()
  └─ <PortalMessagesView>  → <PortalConversation> → <MessageThread> (@invessiv/ui)

Portal-Dashboard
  └─ <ChatDock unreadCount badgeLabel>{<PortalConversation active={dockOpen} />}</ChatDock>
     (ohne portal.messages.read: kein Dock)

POST /api/portal/[customerId]/conversation/messages
  → withPortalActor → portalCanOn(portal.messages.write)
  → messageService.findPortalSendRetryAfter (Zeile der Mitgliedschaft FOR UPDATE, dann Zählung)
  → messageService.appendTextMessage → Activity
```

Geteilte Logik zwischen CRM und Portal (keine Duplikate):

| Schicht | Geteilter Baustein                                                                                                          |
| ------- | --------------------------------------------------------------------------------------------------------------------------- |
| UI      | `packages/ui`: `MessageThread`, `MessageThreadStatus`, Hooks `use-thread-autoscroll`, `use-message-draft`, `use-is-browser` |
| Muster  | `packages/common`: Thread-Contracts/-Konstanten/-Patterns unter `*/ui/`, `formatMessage` unter `patterns/i18n/`             |
| Hook    | `hooks/shared/use-conversation-thread.ts`; CRM (`useCustomerConversation` + Redaction) und Portal (`usePortalConversation`) |
| Client  | `client/shared/conversation-api-service.ts`; `messagesApiService` (CRM) und `portalMessagesApiService` delegieren           |
| Pfade   | `ConversationApiPath` für CRM- und Portal-Endpunkte                                                                         |
| Server  | `messageService` (Zählung/Rate-Limit), `conversationMappingService.toPortalDto`                                             |

## Verzeichnisstruktur

```txt
packages/ui/src/components/message-thread/**                    aus components/workspace/shared verschoben
packages/ui/src/components/message-thread/message-thread-status/ Lade-/Fehlerzustand vor dem ersten Laden
packages/ui/src/hooks/{use-is-browser,use-message-draft,use-thread-autoscroll}.ts
packages/ui/src/components/chat-dock/chat-dock.tsx              + unreadCount am Rail
packages/common/src/{constants,contracts,patterns}/ui/**        Thread-Bausteine aus apps/workspace/src/common
packages/common/src/patterns/i18n/format-message.ts             App-Datei re-exportiert
packages/common/src/contracts/portal/portal-conversation.dto.ts
packages/common/src/constants/crm/{message-limits,message-error-codes}.ts   30/h, RATE_LIMITED
packages/common/src/constants/http/http-header-names.ts         + RetryAfter
apps/workspace/src/app/[locale]/(portal)/portal/[customerId]/messages/{page,loading}.tsx
apps/workspace/src/components/portal/messages/{portal-conversation,portal-messages-view}/
apps/workspace/src/components/portal/portal-owner-notice/       aus dashboard/portal-owner-task-notice umbenannt
apps/workspace/src/hooks/shared/use-conversation-thread.ts
apps/workspace/src/hooks/portal/use-portal-conversation.ts
apps/workspace/src/client/shared/conversation-api-service.ts
apps/workspace/src/client/portal/portal-messages-api-service.ts
apps/workspace/src/common/constants/crm/conversation-api-paths.ts
apps/workspace/src/common/constants/portal/portal-nav-items.ts  + Nachrichten
apps/workspace/src/i18n/dictionaries/portal/messages/{de,en}.json
```

## Umsetzungsstand (27.09.2026)

Umgesetzt auf `feat/crm-13a-kundenchat-intern`, nicht committet. Bewusste Abweichungen vom ursprünglichen Plan:

- **Kein Widget `messages`.** Es existierte nicht mehr (Test „opens the persistent chat dock without a dashboard
  widget“). Ungelesenes zeigt der `ChatDock` am eingeklappten Rail; das gilt auch im CRM-Cockpit.
- **Verlauf nach `packages/ui` statt `components/workspace/shared`.** Portal darf nicht aus `components/workspace/**`
  importieren. Der Draft-Speicher bekommt den vollständigen Key von der App (`draftStorageKey`), das Paket kennt keine
  App-Präfixe.
- **Kein eigener `portal-message-rate-limit-service.ts`.** Die Zählung liegt als `findPortalSendRetryAfter` im
  bestehenden `messageService`, der alle Queries auf `messages` bündelt. Die Mitgliedschaftszeile wird vorher
  gesperrt, damit parallele Sendungen dieselbe Zählung nicht gemeinsam passieren.
- **`PORTAL_MESSAGES_PER_HOUR` von 60 auf 30** korrigiert (Task 24 hatte 60, README und dieser Plan 30).
- **Seite nutzt `requirePortalReader`**, nicht `requirePortalActor`: Die Owner-Sicht liest mit, schreibt aber nie.
- **Kein eigener Empty-State-Baustein.** `MessageThread` zeigt den leeren Verlauf bereits; die Texte kommen aus dem
  Portal-Dictionary.
- **Drafts je Nutzer und Firma** (`userId:customerId`), analog `memberId:customerId` im CRM.
- `formatMessage` wandert nach `packages/common`; alle Importe zeigen direkt dorthin, die App-Datei ist entfernt.
- Einladungsseite nennt, dass Entwürfe und nicht gesendete Nachrichten im lokalen Browser-Speicher liegen.
- Offen zur Prüfung: Die Antwortzeit im Empty-State („werktags in der Regel innerhalb eines Tages“) ist eine
  Zusage an Kunden und muss fachlich bestätigt werden.

## Tickets

### CRM-26-T1 — Rate-Limit ✅

- **Inhalt:** Zählung der eigenen Nachrichten der letzten Stunde; bei ≥ `PORTAL_MESSAGES_PER_HOUR` Result-Code
  `RATE_LIMITED` mit Sekunden bis die älteste zählende Nachricht das Fenster verlässt.
- **Akzeptanz (Tests):** 31. Nachricht → 429 mit `Retry-After`, nichts gespeichert; andere Mitgliedschaften und
  interne Nachrichten sind nicht betroffen (`conversations.integration.test.ts`).

### CRM-26-T2 — Portal-Routen absichern ✅

- **Inhalt:** Routen aus Task 24 über `withPortalReader`/`withPortalActor`; Kundenkennung ausschließlich aus dem
  Actor. Seite antwortet ohne `portal.messages.read` mit 404.
- **Akzeptanz (Tests mit echten Sessions):** bestehende Cross-Customer-/Widerrufs-/Permission-Negativtests aus Task 24
  grün; Seite 404 ohne Leserecht (`messages/page.test.tsx`).

### CRM-26-T3 — Portal-Oberfläche ✅

- **Inhalt:**
  - Seite und Dashboard-Dock mit `PortalConversation`; Lesestand beim Öffnen
  - Ungelesen-Zähler am Dock-Rail; ohne Leserecht kein Dock
  - Navigationseintrag „Nachrichten“ in `PORTAL_NAV_ITEMS` mit `requiredPermission`
  - Empty-State: Einladung zum Schreiben und Hinweis auf die übliche Antwortzeit
  - Eingabefeld am unteren Rand; `interactive-widget=resizes-content` hält es über der Bildschirmtastatur
  - Berührungsziele ≥ 44 px bei `pointer: coarse` (Senden, Erneut senden, Ältere laden, Neue Nachrichten)
- **Offen (manuell):** Mobil auf echtem Gerät (iOS Safari, Android Chrome) prüfen, Dark/Light, Tastaturbedienung,
  Screenreader-Ansage der Live-Region.

## End-to-End-Akzeptanz

1. Der Kunde schreibt aus dem Portal; die Nachricht erscheint im CRM (Cockpit-Dock, Posteingang, Sidebar-Zähler).
2. Der Mitarbeiter antwortet; die Antwort erscheint im Portal, der Dock-Rail zeigt sie als ungelesen.
3. Beide Seiten sehen denselben Verlauf mit denselben Datumstrennern.
4. Mehr als 30 Nachrichten je Stunde werden begrenzt.
5. Es gibt keinen Bearbeiten- und keinen Löschweg.
6. Ein Portalnutzer erreicht keine fremde Unterhaltung.
7. Auf Mobil ist das Eingabefeld über der Bildschirmtastatur erreichbar.
8. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/workspace build` grün.
