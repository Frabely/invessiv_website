# AGENTS.md — apps/web/src/lib/analytics

Vercel-Web-Analytics der Marketing-Seite. Ergänzt `apps/web/src/lib/AGENTS.md`. Plan, Stichtag und Auswertung:
`apps/web/plans/analytics/`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Eventmodell (verbindlich)

- Eventnamen ausschließlich aus `AnalyticsEventName` (`common/constants/analytics/analytics-event-name.ts`), Payloads
  ausschließlich über `AnalyticsEventPayloadMap` (`common/contracts/analytics/analytics-event-payloads.ts`). Keine
  freien Event-Strings in Komponenten.
- **Höchstens 2 Eigenschaften pro Event** (Vercel Pro). Seite, Gerät, Land, Referrer und UTM liefert Vercel selbst —
  nicht zusätzlich als Eigenschaft senden. `sanitizeAnalyticsProperties` kappt hart auf 2.
- Werte sind stabile, sprachunabhängige Keys (`AnalyticsCtaId`, Section-IDs, `imageKey` …). Keine Texte, keine
  Formular- oder Generator-Inhalte, keine E-Mail/Namen/IDs (keine PII).
- Neue CTA-IDs nach Schema `<page>_<section>_<slot>` in `AnalyticsCtaId` ergänzen; der Konstanten-Test prüft Format und
  Eindeutigkeit.
- Alte und neue Eventnamen nie parallel senden. Umbenennungen nur mit neuem Stichtag in `plans/analytics/`.

## Auslösen

- Klicks deklarativ: `{...analyticsAttributes(AnalyticsEventName.X, payload)}` am Element; der einzige globale Listener
  ist `AnalyticsClickTracker` im Provider. Keine eigenen `onClick`-Tracker für reine Klicks.
- Zustandsabhängige Events (Formular, Generator, Header-Einstellungen) über `trackAnalyticsEvent` aus
  `track-analytics-event.ts` — die einzige Stelle mit `track()` im Client.
- Abschnitte über `SectionReachTracker` (1 s Mindestsichtdauer, Anteil des Viewports) inkl. `page_engaged`.
- **Keine Server-Events.** Analytics läuft ausschließlich im Browser. Die tatsächliche Lead-Zahl kommt aus der
  Datenbank (Workspace/CRM, mit Herkunft); `form_completed` ist nur die segmentierbare Näherung im Dashboard.
  Hintergrund: `@vercel/analytics/server` sendet die URL seines Request-Kontexts ungefiltert und am `beforeSend`-Schutz
  vorbei — ein Server-Event bräuchte eigene URL-Prüfung und Header-Weitergabe (IP, User-Agent). Wird es doch nötig,
  vorher neu planen und die Datenschutzerklärung anpassen.

## URL-Schutz & Opt-out

- `beforeSend` lässt nur `utm_*`-Parameter mit Wertmuster `ANALYTICS_UTM_VALUE_PATTERN` durch; Hash und alle anderen
  Parameter fallen weg, sensible Routen/Keys verwerfen das Event.
- Eigene Besuche: `?analytics=off` setzt den Opt-out-Key im `localStorage`, `?analytics=on` entfernt ihn.
- Änderungen am Tracking-Umfang erfordern ein Update der Datenschutzerklärung (DE/EN) im selben PR.
