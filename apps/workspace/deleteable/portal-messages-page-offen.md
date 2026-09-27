# Offen: Portal-Nachrichtenseite und Mobil-Tastatur (Task 26)

> **Stand:** 27.09.2026 · **Branch:** `feat/crm-13a-kundenchat-intern` · **Status:** offen, bewusst verschoben

## Ausgangslage

Der Kundenchat ist im Portal an zwei Stellen erreichbar:

- **Dashboard-Dock** (`components/portal/dashboard/portal-dashboard/portal-dashboard.tsx`). Unter 768 px sitzt er
  als volle Leiste am unteren Rand und klappt nach oben auf (`min(70dvh, 32rem)`). Mobil ist das praktisch dasselbe
  Erlebnis wie eine Vollbildseite.
- **Vollbildseite** `/portal/[customerId]/messages`, erreichbar über den Menüpunkt „Nachrichten“ (nur mit
  `portal.messages.read`) oder per direktem Link; ohne Leserecht 404.

Heute ist die Seite vor allem ein zweiter Einstieg ohne eigenen Anwendungsfall. Wirklich gebraucht wird sie erst:

- als Ziel für Links aus den Benachrichtigungs-Mails (Ordner 20c) — ein Link kann den Dock nicht öffnen;
- sobald weitere Portal-Seiten ohne Dock existieren (Projekte, Dateien …).

## Lücke 1 — Bildschirmtastatur verdeckt ggf. den Dock (sollte vor Merge behoben werden)

`viewport.interactiveWidget = "resizes-content"` ist nur auf der Nachrichtenseite gesetzt
(`app/[locale]/(portal)/portal/[customerId]/messages/page.tsx`), **nicht** auf dem Dashboard. Mobil schreibt man aber
im Dock. Je nach Browser (v. a. Android Chrome) kann die Tastatur dessen Eingabefeld überdecken.

**Fix:** `export const viewport` aus der Nachrichtenseite ins Portal-Layout
`app/[locale]/(portal)/portal/[customerId]/layout.tsx` verschieben — gilt dann für Dock und Seite. Den Viewport-Test
aus `messages/page.test.tsx` in einen Layout-Test umziehen. Danach auf echtem Gerät prüfen (iOS Safari, Android
Chrome).

## Lücke 2 — Entscheidung zur Seite

**Variante A — Seite behalten und vervollständigen**

- Link „Im Vollbild öffnen“ im Dock (`PortalConversation` bzw. Dock-Kopf), Ziel über
  `portalPathFor(locale, customerId, PortalSection.Messages)`.
- Weg zurück zur Übersicht: Portal-Navigation hat noch keinen Eintrag für das Dashboard (`PortalSection` kennt keine
  Übersicht) — Eintrag oder Rücklink auf der Seite ergänzen.

**Variante B — Seite bis Ordner 20c entfernen (Empfehlung)**

Zu löschen bzw. zurückzunehmen:

- `app/[locale]/(portal)/portal/[customerId]/messages/{page.tsx,page.test.tsx,loading.tsx,loading.module.css}`
- `components/portal/messages/portal-messages-view/**`
- Eintrag in `common/constants/portal/portal-nav-items.ts` (+ Tests `portal-nav-items.test.ts`,
  `list-permitted-portal-nav-items.test.ts`)
- Dictionary-Keys `meta` und `page` in `i18n/dictionaries/portal/messages/{de,en}.json`
- Verweise in `plans/crm/13a-kundenchat/{README.md,26-chat-im-portal.md}` und `components/portal/AGENTS.md`
  anpassen; in Ordner 20c als Aufgabe vermerken („Nachrichtenseite als Mail-Ziel“)

Nutzen: weniger Pflege, und die PR schrumpft (aktuell 232 geänderte Dateien bei 200 als harter Grenze laut
`plans/crm/AGENTS.md`). Lücke 1 (Viewport ins Layout) muss auch bei Variante B erledigt werden — wegen des Docks.
