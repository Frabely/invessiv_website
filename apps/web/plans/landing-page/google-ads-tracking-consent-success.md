# Google Ads Tracking, Consent und Success-Seite für `/services/landing-page`

## Bestandsaufnahme

- Das Projekt nutzt **Next.js App Router**. Das globale Locale-Layout liegt in `apps/web/src/app/[locale]/layout.tsx`.
- Die Landingpage liegt unter `apps/web/src/app/[locale]/(marketing)/services/landing-page/page.tsx` und ist kanonisch
  `/[locale]/services/landing-page`, also z. B. `/de/services/landing-page`.
- Locales laufen über `[locale]`, `SUPPORTED_LOCALES`, `isSupportedLocale` und zentrale Pfadhelfer wie
  `createLocalePathname`.
- Eine Success-Seite unter `/[locale]/services/landing-page/success` existiert aktuell nicht.
- Die Landingpage rendert `LandingPage`, darin `FinalCtaSection` als Formularbereich mit `id="contact"`.
- Das Formular validiert Name, E-Mail, Anliegen und Consent als Pflichtfelder; Website ist optional. Es nutzt
  `submitQuickContact`, wartet auf die API-Antwort und zeigt aktuell ein Inline-Erfolgspanel statt Redirect.
- Der API-Endpunkt ist `apps/web/src/app/api/public/contact/route.ts`; nur `ok: true` gilt als erfolgreicher Submit.
- Vercel Analytics ist bereits zentral über `VercelAnalytics` im Locale-Layout eingebunden. Speed Insights läuft über
  `Insights`.
- Es gibt aktuell keinen Google Tag, kein `gtag`, kein `dataLayer` und keinen Cookie-/Consent-Banner.
- Footer, Datenschutz, Impressum und Terms existieren. Der Footer wird über `FooterSection` und Dictionary-Inhalte
  gerendert.
- Es gibt bereits einen älteren Plan `apps/web/plans/landing-page/google-ads-copy-revision.md`, der Success-Seite,
  Consent Mode v2 und direkten `gtag` ohne GTM grundsätzlich vorbereitet.

## Zielarchitektur

- Google Tag `G-5T4BC28Z0F` wird zentral, consent-aware und ohne doppelten Script-Einbau integriert.
- Consent wird in einer eigenen kleinen Client-Schicht verwaltet: keine Consent-Dependency, kein GTM, kein unnötiges
  CMP-Paket.
- Success-Seite `/[locale]/services/landing-page/success` wird als primäres Google-Ads-Conversion-Ziel vorbereitet.
- Formular-Redirect erfolgt ausschließlich nach erfolgreicher API-Antwort.
- Vercel Analytics bleibt bestehen und wird nicht als Ersatz für Google Ads Conversion Tracking oder Consent Mode
  behandelt.
- Alle sichtbaren Texte für Banner und Success-Seite werden in DE und EN Dictionaries gepflegt, nicht inline in
  Komponenten.
- Routen werden über `SITE_ROUTES` bzw. zentrale Helper erweitert, keine verstreuten URL-String-Konstruktionen.

## Consent-Banner-Konzept

Neue Komponenten/Module, angepasst an die bestehende Struktur:

- `apps/web/src/components/providers/consent-provider/consent-provider.tsx`
- `apps/web/src/components/consent/consent-banner/consent-banner.tsx`
- `apps/web/src/components/consent/cookie-settings-button/cookie-settings-button.tsx`
- `apps/web/src/lib/consent/consent.ts`
- `apps/web/src/hooks/consent/use-consent.ts`
- Dictionary: z. B. `apps/web/src/i18n/dictionaries/shared/consent/{de,en}.json`

Speicherung:

- Bevorzugt `localStorage`, weil keine Serverentscheidung nötig ist und keine zusätzliche First-Party-Cookie-Oberfläche
  entsteht.
- Banner erscheint nur, wenn noch keine Consent-Auswahl gespeichert ist.
- Footer erhält einen Link/Button „Cookie-Einstellungen“, der die Einstellungen jederzeit erneut öffnet.

Kategorien:

- Notwendig: immer aktiv, nicht deaktivierbar.
- Analyse: standardmäßig deaktiviert.
- Marketing: standardmäßig deaktiviert.

Buttons:

- „Alle akzeptieren“
- „Ablehnen“
- „Einstellungen“
- In den Einstellungen zusätzlich „Auswahl speichern“

UX-Regeln:

- Ablehnen ist gleich sichtbar und gleich einfach erreichbar wie Akzeptieren.
- Keine optionalen Kategorien vorauswählen.
- Kein „Durch Nutzung akzeptierst du Cookies“.
- Datenschutzlink im Banner und in den Einstellungen.
- Mobile Banner darf den Haupt-CTA nicht dauerhaft verdecken; bevorzugt kompakter Bottom-Sheet-Stil mit klarer Max-Höhe.

### Vorgeschlagene DE-Copy

- Bannertext: „Wir nutzen notwendige Funktionen für diese Website. Analyse und Marketing setzen wir nur ein, wenn du
  zustimmst. Du kannst deine Auswahl jederzeit ändern.“
- Button „Alle akzeptieren“: „Alle akzeptieren“
- Button „Ablehnen“: „Ablehnen“
- Button „Einstellungen“: „Einstellungen“
- Button „Auswahl speichern“: „Auswahl speichern“
- Kategorie Notwendig: „Erforderlich, damit die Website sicher lädt und grundlegende Funktionen funktionieren. Diese
  Kategorie kann nicht deaktiviert werden.“
- Kategorie Analyse: „Hilft uns zu verstehen, welche Seiten und Inhalte genutzt werden. Aktivieren wir nur mit deiner
  Zustimmung.“
- Kategorie Marketing: „Erlaubt Google Ads Conversion Tracking, damit wir Angebotsanfragen aus Anzeigen korrekt messen
  können. Aktivieren wir nur mit deiner Zustimmung.“
- Datenschutzlink: „Datenschutzerklärung“
- Footer-Link: „Cookie-Einstellungen“

## Google Consent Mode v2-Konzept

Default Consent wird vor jeder Google-Tag-Konfiguration auf `denied` gesetzt:

- `analytics_storage: "denied"`
- `ad_storage: "denied"`
- `ad_user_data: "denied"`
- `ad_personalization: "denied"`

Mapping:

- Bei „Ablehnen“ bleiben alle optionalen Werte `denied`.
- Bei Analyse-Zustimmung: `analytics_storage: "granted"`.
- Bei Marketing-Zustimmung: `ad_storage: "granted"`, `ad_user_data: "granted"`, `ad_personalization: "granted"`.
- Bei „Alle akzeptieren“ werden Analyse und Marketing gewährt.
- Bei jeder Änderung wird `gtag("consent", "update", ...)` ausgeführt, falls `gtag` verfügbar ist.
- Der Consent-State wird versioniert gespeichert, z. B.
  `{ version: 1, analytics: boolean, marketing: boolean, updatedAt: string }`.
- Tests prüfen Mapping von gespeicherter Auswahl zu Google-Consent-Werten.

## Google Tag Einbindung mit `G-5T4BC28Z0F`

- Entscheidung: **konservative Variante**. Google-Skripte werden erst nach Zustimmung geladen.
- Zusätzlich wird ein kleiner Inline-Starter für `window.dataLayer`, `gtag` und `consent default denied` früh im Client
  bereitgestellt, bevor ein Tag geladen oder konfiguriert wird.
- Kein roher Script-Code in einzelnen Pages.
- Kein `@next/third-parties` erzwingen, da die Dependency aktuell nicht vorhanden ist und für einen einzelnen Tag nicht
  nötig ist.
- Umsetzung über eigene `GoogleTag`-Client-Komponente mit `next/script`:
  - `src="https://www.googletagmanager.com/gtag/js?id=G-5T4BC28Z0F"`
  - nur laden, wenn Analyse oder Marketing zugestimmt wurde.
  - danach `gtag("config", "G-5T4BC28Z0F", ...)`.
- Die Komponente wird zentral im Locale-Layout oder in einem Provider unterhalb von `AppProviders` eingebunden.
- Keine doppelten Google-Tags; vor Umsetzung nochmals `rg "gtag|googletagmanager|dataLayer"` prüfen.
- Tag ist auf Landingpage und Success-Seite verfügbar, aber nur nach Consent aktiv.

## Formular-Submit-Flow

- `FinalCtaSection` erhält ein optionales `successRedirectHref`.
- Landingpage übergibt `/[locale]/services/landing-page/success`.
- Nur bei `response.ok === true` erfolgt `router.push(successRedirectHref)`.
- Validierungsfehler und API-Fehler bleiben auf der Landingpage und zeigen bestehende Fehlermeldungen.
- Button-Klick, Fokus, Scroll und Submit-Versuch zählen nicht als Google-Ads-Conversion.
- Honeypot-Fall wird wie bisher bot-schonend behandelt; für Conversion-Messung sollte kein Google-Conversion-Event
  daraus entstehen.

UTM-Parameter:

- Nicht im Redirect erzwingen.
- Bei Bedarf später sauber in der Anfrage speichern, z. B. über erlaubte `utm_*`-Felder im DTO oder serverseitige
  Lead-Metadaten.
- Keine sensiblen Parameter wie `gclid`, E-Mail oder Tokens an Analytics weitergeben.

## Success-Seite `/de/services/landing-page/success`

- Neue Route: `apps/web/src/app/[locale]/(marketing)/services/landing-page/success/page.tsx`.
- Route erhält eigene Metadata und `robots: { index: false, follow: false }`.
- Nicht prominent intern verlinken, nicht in Sitemap aufnehmen.
- Minimaler Header: Logo/Home-Link, keine volle Navigation und kein starker CTA.
- Footer bleibt minimal bzw. Standard-Footer, damit Impressum, Datenschutz und Cookie-Einstellungen erreichbar bleiben.
- Content über Dictionaries, DE und EN parallel.

DE-Copy:

- Headline: „Danke — deine Anfrage ist angekommen.“
- Intro: „Ich schaue mir dein Anliegen an und melde mich in der Regel innerhalb von 24 Stunden mit einer kurzen
  Einschätzung.“
- Nächste Schritte:
  - „Ich prüfe dein Anliegen und dein Angebot.“
  - „Du bekommst eine ehrliche Ersteinschätzung.“
  - „Wenn es passt, klären wir Umfang, Preis und nächsten Schritt.“
- Optionaler Link: „Zurück zur Landingpage“ oder „Zur Startseite“.

Optional später:

- Calendly-Link, nicht im ersten Umsetzungsschritt.

## Conversion Tracking für Google Ads

- Primäre Conversion: Besuch von `/de/services/landing-page/success`.
- Nicht als primäre Conversion zählen:
  - Landingpage-Besuch
  - CTA-Klick
  - Button-Klick
  - Formular-Fokus
  - Scrolltiefe
  - fehlerhafter Submit
- Optional sekundär:
  - CTA-Klick
  - E-Mail-Klick
  - später Calendly-Klick

Empfehlung in Google Ads:

- Neue Website-Conversion „Angebotsanfrage Landingpage“ anlegen.
- Ziel/URL-Regel auf `/de/services/landing-page/success` setzen.
- Als primäre Conversion für Gebotsoptimierung markieren.
- Landingpage-Besuch und CTA-Klicks nicht als primäre Conversion konfigurieren.
- Mit Google Tag Assistant und Google Ads Conversion Diagnostics testen.

## Vercel Analytics Einordnung

- Vercel Analytics bleibt bestehen.
- Vercel Analytics ersetzt kein Google Ads Conversion Tracking.
- Vercel Analytics ersetzt keinen Google Consent Mode v2.
- Aktuell ist Vercel Analytics über `@vercel/analytics/react` mit `beforeSend`-Sanitizer eingebunden; keine
  Cookie-/Consent-Steuerung im Code gefunden.
- Keine unnötigen Änderungen an Vercel Analytics.
- Separater Follow-up möglich: UTM-Whitelist im Vercel-Analytics-Sanitizer, falls Kampagnenauswertung in Vercel
  Analytics gebraucht wird.

## Datenschutz-/Consent-Checkliste

- Datenschutzerklärung um Google Analytics / Google Ads / Google Tag / Conversion Tracking prüfen und ergänzen.
- Consent Banner verlinkt Datenschutz.
- Impressum bleibt erreichbar.
- Cookie-Einstellungen über Footer erneut aufrufbar.
- Analyse und Marketing standardmäßig deaktiviert.
- Ablehnen genauso leicht wie Akzeptieren.
- Consent-Auswahl speicherbar.
- Consent-Auswahl widerrufbar und änderbar.
- Google Consent Mode v2 Signale korrekt gesetzt.
- Keine optionalen Google-Skripte ohne Zustimmung.
- Test mit „Alle akzeptieren“.
- Test mit „Ablehnen“.
- Test mit individueller Auswahl.
- Test im Inkognito-Modus.
- Test auf Mobile.
- Google Tag Assistant Test.
- Google Ads Conversion Test.
- Success-Seite wird nur nach erfolgreichem Submit im normalen User-Flow erreicht.
- Hinweis: Das ist eine technische/inhaltliche Checkliste, keine Rechtsberatung.

## Go/No-Go-Quality-Gate

Go für Google Ads nur, wenn:

- Landingpage lädt korrekt.
- Formular funktioniert.
- Success-Seite funktioniert.
- Google Tag `G-5T4BC28Z0F` ist eingebunden.
- Google Tag ist consent-aware.
- Consent Banner funktioniert.
- Accept / Reject / Settings funktionieren.
- Google Consent Mode v2 Werte werden korrekt gesetzt.
- Formular-Submit leitet nur bei Erfolg auf Success-Seite.
- Google Ads Conversion-Ziel zeigt auf `/de/services/landing-page/success`.
- Landingpage-Besuche zählen nicht als Conversion.
- CTA-Klicks zählen nicht als primäre Conversion.
- Mobile Ansicht des Banners verdeckt den Haupt-CTA nicht dauerhaft.
- Datenschutz und Impressum sind erreichbar.
- `npm run lint`, `npm run typecheck`, relevante Vitest-Tests und `npm run build` sind grün.

## Kleine reviewbare Tasks

1. Consent-Domainmodell und Tests: `lib/consent`, Consent-Typen, Storage-Versionierung, Consent-to-Google-Mapping.
2. Consent UI: Banner, Settings-Dialog, Footer-Button, DE/EN Dictionary-Copy, Mobile- und Fokuszustände.
3. GoogleTag Provider: `next/script`, Default-denied Stub, Consent-Updates, keine doppelte Einbindung.
4. Success-Seite: Route, Metadata/noindex, Dictionary-Copy, minimaler Header/Footer.
5. Formular-Redirect: `FinalCtaSection` um `successRedirectHref` erweitern und Landingpage damit verbinden.
6. Conversion-Konzept testen: Success-Page-Aufruf nach echtem Submit, kein Conversion-Feuern bei Fehlern oder
   CTA-Klicks.
7. Datenschutztexte: Privacy-Dictionaries in DE/EN ergänzen.
8. QA-Gate: Mobile Banner, Inkognito, Tag Assistant, Google Ads Diagnostics, Build/Lint/Typecheck.

## Offene Fragen vor Umsetzung

- Soll Google Tag auf allen öffentlichen Seiten consent-aware verfügbar sein oder zunächst nur auf Landingpage plus
  Success-Seite?
- Soll die Success-Seite bei Direktaufruf normal angezeigt werden oder per `sessionStorage`-Flag nur nach echtem Submit
  als Conversion-fähig gelten?
- Sollen UTM-Parameter in Leads gespeichert werden, oder reicht zunächst die Google-Ads-Conversion auf der
  Success-Seite?
- Gibt es bereits eine Google-Ads-Conversion-ID/-Label-Kombination zusätzlich zur GA4-/Google-Tag-ID `G-5T4BC28Z0F`?
- Soll die Datenschutzerklärung im gleichen PR aktualisiert werden oder als separater Legal-/Content-PR?
