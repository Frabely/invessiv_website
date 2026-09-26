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
Verlauf, dieselben Datumstrenner, dasselbe Verhalten, nur mit Portal-Texten in Du-Form und ruhigerer Gestaltung.

Im Portal-Dashboard existieren bereits der `ChatDock`
(`components/portal/dashboard/portal-dashboard/portal-dashboard.tsx`)
und das Widget `messages` (`openMode: dock`, `mock: true` in `common/constants/portal/portal-widget-layout.ts`). Beide
werden auf echte Daten umgestellt. Zusätzlich entsteht die Seite `/portal/[customerId]/messages`
(`PortalSection.Messages` existiert bereits).

## Entscheidungen

| Bereich            | Entscheidung                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Einstieg           | Dashboard-Dock + Widget `messages` (Ungelesen-Stand) + eigene Seite `/portal/[customerId]/messages`                       |
| Komponente         | Dieselbe `message-thread` wie im CRM, mit Portal-Texten                                                                   |
| Rechte             | Lesen `portal.messages.read`, Schreiben `portal.messages.write`; ohne Write ist nur der Verlauf sichtbar                  |
| Missbrauchsschutz  | 30 Nachrichten je Stunde und Portalmitgliedschaft, gezählt direkt auf `messages` (Index aus Task 24); 429 + `Retry-After` |
| Bearbeiten/Löschen | Gibt es nicht                                                                                                             |
| Sprache            | Portal-Texte aus `people.preferred_locale`; DE in Du-Form                                                                 |

## Architektur

```txt
/portal/[customerId]/messages (Server Component; noindex, dynamic = "force-dynamic")
  ├─ requirePortalActor(locale, customerId)
  ├─ getPortalConversation(actor, { limit: 50 })
  └─ <PortalConversation … />   → <MessageThread … />

Portal-Dashboard
  ├─ Widget messages: mock: false, requiredPermission: portal.messages.read, zeigt Ungelesen-Stand
  └─ <ChatDock>{<PortalConversation …/>}</ChatDock>

POST /api/portal/[customerId]/conversation/messages
  → withPortalActor → portalCanOn(portal.messages.write)
  → Rate-Limit (COUNT messages WHERE sender_portal_membership_id = … AND created_at > now() - 1h)
  → send-customer-message.command-handler (Task 24) → Activity
```

## Verzeichnisstruktur

```txt
apps/workspace/src/app/[locale]/(portal)/portal/[customerId]/messages/page.tsx + loading.tsx
apps/workspace/src/server/portal/services/portal-message-rate-limit-service.ts
apps/workspace/src/components/portal/messages/
  portal-conversation/
  portal-conversation-empty/
apps/workspace/src/components/portal/dashboard/portal-dashboard/portal-dashboard.tsx   Dock befüllen
apps/workspace/src/common/constants/portal/{portal-widget-layout,portal-nav-items}.ts
apps/workspace/src/client/portal/portal-messages-service.ts
apps/workspace/src/i18n/dictionaries/portal/messages/{de,en}.json
```

Vor dem Anlegen `components/portal/AGENTS.md` und `app/[locale]/(portal)/AGENTS.md` lesen.

## Tickets

### CRM-26-T1 — Rate-Limit

- **Inhalt:** Service zählt die eigenen Nachrichten der letzten Stunde; bei ≥ `PORTAL_MESSAGES_PER_HOUR` Result-Code
  `rate_limited` mit Sekunden bis zur ältesten zählenden Nachricht + 1 h.
- **Akzeptanz (Tests):** 31. Nachricht → 429 mit `Retry-After`; Nachrichten anderer Mitglieder zählen nicht.

### CRM-26-T2 — Portal-Routen absichern

- **Inhalt:** Routen aus Task 24 über `withPortalActor`; Kundenkennung ausschließlich aus dem Actor.
- **Akzeptanz (Tests mit echten Sessions):** Kunde A erreicht unter keinem Sitzungszustand die Unterhaltung von
  Kunde B (404 für Lesen, Senden, Lesestand); widerrufenes Mitglied → sofort 404; fehlende `portal.messages.*` →
  abgelehnt; Firmenwechsel liefert den Verlauf der neuen Firma, nie Daten der vorherigen.

### CRM-26-T3 — Portal-Oberfläche

- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Seite und Dashboard-Dock mit `PortalConversation`; Lesestand beim Öffnen
  - Widget `messages` auf `mock: false` + `requiredPermission`; zeigt Ungelesen-Stand und öffnet den Dock
  - Navigationseintrag „Nachrichten“ in `PORTAL_NAV_ITEMS` mit `requiredPermission`
  - Empty-State: Einladung zum Schreiben und Hinweis auf die übliche Antwortzeit
  - Eingabefeld am unteren Rand, auf Mobil über der Bildschirmtastatur sichtbar
- **Akzeptanz:** Bildschirmtastatur verdeckt das Eingabefeld nicht; Tastaturbedienung vollständig; Live-Region
  kündigt neue Nachrichten an; Berührungsziele ≥ 44×44 px; alle Texte DE (Du-Form) und EN.

## End-to-End-Akzeptanz

1. Der Kunde schreibt aus dem Portal; die Nachricht erscheint im CRM (Cockpit-Dock, Posteingang, Sidebar-Zähler).
2. Der Mitarbeiter antwortet; die Antwort erscheint im Portal, das Widget zeigt sie als ungelesen.
3. Beide Seiten sehen denselben Verlauf mit denselben Datumstrennern.
4. Mehr als 30 Nachrichten je Stunde werden begrenzt.
5. Es gibt keinen Bearbeiten- und keinen Löschweg.
6. Ein Portalnutzer erreicht keine fremde Unterhaltung.
7. Auf Mobil ist das Eingabefeld über der Bildschirmtastatur erreichbar.
8. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/workspace build` grün.
