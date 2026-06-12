# Google Ads Tracking, Consent und Success-Seite für `/services/landing-page`

## Bestandsaufnahme

- Das Projekt nutzt **Next.js App Router**. Das globale Locale-Layout liegt in `apps/web/src/app/[locale]/layout.tsx`.
- Die Landingpage liegt unter `apps/web/src/app/[locale]/(marketing)/services/landing-page/page.tsx` und ist kanonisch
  `/[locale]/services/landing-page`, also z. B. `/de/services/landing-page`.
- Locales laufen über `[locale]`, `SUPPORTED_LOCALES`, `isSupportedLocale` und zentrale Pfadhelfer wie
  `createLocalePathname`.
- Eine Success-Seite unter `/[locale]/services/landing-page/success` existiert aktuell nicht; Route, gemeinsame
  Komponente und Formular-Redirect werden im Copy-Plan (`google-ads-copy-revision.md`, Tasks 5a–5c) gebaut.
- Die Landingpage rendert `LandingPage`, darin `FinalCtaSection` als Formularbereich mit `id="contact"`.
- Das Formular validiert Name, E-Mail, Anliegen und Consent als Pflichtfelder; Website ist optional. Es nutzt
  `submitQuickContact`, wartet auf die API-Antwort und zeigt aktuell ein Inline-Erfolgspanel statt Redirect.
- Der API-Endpunkt ist `apps/web/src/app/api/public/contact/route.ts`; nur `ok: true` gilt als erfolgreicher Submit.
- Vercel Analytics ist bereits zentral über `VercelAnalytics` im Locale-Layout eingebunden. Speed Insights läuft über
  `Insights`.
- Es gibt aktuell keinen Google Tag, kein `gtag`, kein `dataLayer` und keinen Cookie-/Consent-Banner.
- Footer, Datenschutz, Impressum und Terms existieren. Der Footer wird über `FooterSection` und Dictionary-Inhalte
  gerendert.
- Es gibt bereits einen älteren Plan `apps/web/plans/landing-page/google-ads-copy-revision.md` (Copy, CTA, Preis-Logik,
  Danke-Seiten-Copy). Tracking und Consent wurden dort entfernt und werden ausschließlich in diesem Plan umgesetzt.

## Zielarchitektur

- Conversion-Messung für Google Ads läuft direkt über ein **Google-Ads-Conversion-Tag** (`AW-`ID + Conversion-Label
  aus einer in Google Ads angelegten Conversion-Aktion), eingebunden über eine einzige Provider-Komponente,
  consent-aware und ohne doppelten Script-Einbau — nur auf Landing- und Success-Route, nicht global.
- Zusätzlich wird **GA4** über die vorhandene Measurement-ID `G-5T4BC28Z0F` eingebunden (consent-gated über die
  Analyse-Kategorie) — für Funnel-/Verhaltensanalyse der Landingpage (Absprünge, Engagement, Quellen). Kein GTM.
- Consent wird in einer eigenen kleinen Client-Schicht verwaltet: keine Consent-Dependency, kein GTM, kein unnötiges
  CMP-Paket.
- Die Success-Seite `/[locale]/services/landing-page/success` (Umsetzung im Copy-Plan) wird als primäres
  Google-Ads-Conversion-Ziel genutzt.
- Dieser Plan setzt den Formular-Redirect aus dem Copy-Plan voraus (Redirect ausschließlich nach erfolgreicher
  API-Antwort).
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
- Ein Link/Button „Cookie-Einstellungen“ öffnet die Einstellungen jederzeit erneut — gerendert **nur im Footer der
  Landing-Route und ggf. der Success-Route** (dort, wo Consent-Provider und Banner existieren), nicht siteweit im
  globalen Footer. Der geteilte `FooterSection` darf den Button nur über Props/Kontext aus diesen Routen erhalten.

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
- Kategorie Analyse: „Hilft uns über Google Analytics zu verstehen, welche Seiten und Inhalte genutzt werden.
  Aktivieren wir nur mit deiner Zustimmung.“
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

## Google Tag Einbindung (GA4 `G-5T4BC28Z0F` + Google-Ads-Conversion, kein GTM)

Voraussetzung (operativ, vor Task 3): In Google Ads die Conversion-Aktion „Angebotsanfrage Landingpage" anlegen —
daraus ergeben sich `AW-`Conversion-ID und Conversion-Label. GA4-Measurement-ID, `AW-`ID und Label werden über
`NEXT_PUBLIC_*`-Env-Vars konfiguriert, nicht hartkodiert. Empfohlen: GA4-Property und Ads-Konto im jeweiligen Admin
verknüpfen (bessere Attribution, Zielgruppen später nutzbar).

- Entscheidung: **konservative Variante**. Google-Skripte werden erst nach Zustimmung geladen.
- Zusätzlich wird ein kleiner Inline-Starter für `window.dataLayer`, `gtag` und `consent default denied` früh im Client
  bereitgestellt, bevor ein Tag geladen oder konfiguriert wird.
- Kein roher Script-Code in einzelnen Pages (das von Google angezeigte Snippet wird **nicht** roh eingeklebt — es
  lädt bedingungslos und wäre ohne Consent-Gate ein DSGVO-Problem).
- Kein `@next/third-parties` erzwingen, da die Dependency aktuell nicht vorhanden ist und für einen einzelnen Tag nicht
  nötig ist.
- Umsetzung über eigene `GoogleTag`-Client-Komponente mit `next/script` — **eine** gtag-Bibliothek, zwei
  Destinationen:
  - Script lädt, sobald **Analyse oder Marketing** zugestimmt wurde:
    `src="https://www.googletagmanager.com/gtag/js?id=G-5T4BC28Z0F"`
  - `gtag("config", "G-5T4BC28Z0F")` nur bei **Analyse**-Zustimmung (GA4-Messung)
  - `gtag("config", "<AW-ID>")` nur bei **Marketing**-Zustimmung (Ads-Conversion-Destination)
- Die Komponente wird gemäß `invessiv-landing`-Skill-Konvention nur auf der Landing-Route und der
  Landing-Success-Route eingebunden (nicht global im Locale-Layout); Consent-Banner ebenfalls nur auf diesen Routen.
  GA4 misst damit bewusst nur den Landing-Funnel, nicht die gesamte Site.
- Keine doppelten Google-Tags; vor Umsetzung nochmals `rg "gtag|googletagmanager|dataLayer"` prüfen.
- Tag ist auf Landingpage und Success-Seite verfügbar, aber nur nach Consent aktiv.

## Formular-Submit-Flow (Voraussetzung aus dem Copy-Plan)

Der Redirect wird im Copy-Plan umgesetzt (`FinalCtaSection` mit `successRedirectHref`, Redirect nur bei
`response.ok === true`, Validierungs-/API-Fehler bleiben auf der Landingpage, Honeypot redirectet identisch). Dieser
Plan ergänzt nur die Tracking-Konsequenzen:

- Button-Klick, Fokus, Scroll und Submit-Versuch zählen nicht als Google-Ads-Conversion.
- Aus dem Honeypot-Fall darf kein Google-Conversion-Event entstehen: Beim Honeypot-Redirect wird das
  `sessionStorage`-Guard-Flag (siehe Conversion Tracking) nicht gesetzt — der Bot sieht keinen Unterschied, die
  Conversion feuert trotzdem nicht.

UTM-Parameter:

- Nicht im Redirect erzwingen.
- Bei Bedarf später sauber in der Anfrage speichern, z. B. über erlaubte `utm_*`-Felder im DTO oder serverseitige
  Lead-Metadaten.
- Keine sensiblen Parameter wie `gclid`, E-Mail oder Tokens an Analytics weitergeben.

## Success-Seite (Umsetzung im Copy-Plan)

Route, gemeinsame `success-page`-Komponente, Metadata/noindex, minimaler Header/Standard-Footer und die gesamte Copy
(DE/EN) sind im Copy-Plan `google-ads-copy-revision.md` spezifiziert (Abschnitt 6b, Tasks 5a–5c) — die dortige Copy ist
kanonisch. Dieser Plan ergänzt nur die Tracking-Anforderungen an die Seite:

- Seitenaufruf ist die primäre Google-Ads-Conversion (Details im Abschnitt Conversion Tracking).
- Nicht prominent intern verlinken, nicht in die Sitemap aufnehmen.
- Cookie-Einstellungen müssen über den Standard-Footer erreichbar bleiben.

Optional später:

- Calendly-Link, nicht im ersten Umsetzungsschritt.

## Conversion Tracking für Google Ads

- Primäre Conversion: Besuch von `/de/services/landing-page/success` — gemessen **event-basiert** über
  `gtag("event", "conversion", { send_to: "<AW-ID>/<Label>" })` auf der Success-Route; keine URL-Regel in Google Ads
  nötig.
- Schutz gegen Direktaufrufe: Der Redirect setzt ein kurzlebiges `sessionStorage`-Flag; die Conversion feuert nur,
  wenn das Flag vorhanden ist. Die Seite selbst wird bei Direktaufruf normal angezeigt. Beim Honeypot-Redirect wird
  das Flag nicht gesetzt.
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
  - Klick auf den FAQ-Ausstiegslink zur Leistungsübersicht (`/{locale}#services`) — der Link bleibt laut Copy-Plan
    bewusst bestehen (ehrliche Selbst-Disqualifikation); das Event misst, wer über diesen Weg von der Landingpage
    abspringt (z. B. Vercel-Event `faq_exit_services_click`, keine Ads-Conversion)
  - später Calendly-Klick

Empfehlung in Google Ads:

- Neue Website-Conversion „Angebotsanfrage Landingpage“ anlegen — liefert `AW-`ID + Conversion-Label für die
  Env-Vars.
- Messung über das Conversion-Event auf der Success-Route (siehe oben), keine URL-Regel nötig.
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
- Cookie-Einstellungen über den Footer der Landing-/Success-Route erneut aufrufbar.
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
- Google Tag ist eingebunden: GA4 `G-5T4BC28Z0F` + Ads-Conversion-Destination (`AW-`ID aus Env-Vars).
- Tag ist consent-aware: Script lädt erst nach Zustimmung; GA4-Config nur bei Analyse-, Ads-Config nur bei
  Marketing-Zustimmung.
- Consent Banner funktioniert.
- Accept / Reject / Settings funktionieren.
- Google Consent Mode v2 Werte werden korrekt gesetzt.
- Formular-Submit leitet nur bei Erfolg auf Success-Seite.
- Conversion-Event feuert auf `/de/services/landing-page/success` und kommt in Google Ads an.
- Landingpage-Besuche zählen nicht als Conversion.
- Direktaufruf der Success-Seite zählt nicht als Conversion (Guard-Flag).
- CTA-Klicks zählen nicht als primäre Conversion.
- Mobile Ansicht des Banners verdeckt den Haupt-CTA nicht dauerhaft.
- Datenschutz und Impressum sind erreichbar.
- `npm run lint`, `npm run typecheck`, relevante Vitest-Tests und `npm run build` sind grün.

## Kleine reviewbare Tasks

Voraussetzung: Success-Seite und Formular-Redirect aus dem Copy-Plan (`google-ads-copy-revision.md`, Tasks 5a–5c)
sind umgesetzt.

1. Consent-Domainmodell und Tests: `lib/consent`, Consent-Typen, Storage-Versionierung, Consent-to-Google-Mapping.
2. Consent UI: Banner, Settings-Dialog, Footer-Button (nur Landing-/Success-Route), DE/EN Dictionary-Copy, Mobile-
   und Fokuszustände.
3. GoogleTag Provider: `next/script` mit GA4-ID + `AW-`ID aus `NEXT_PUBLIC_*`-Env-Vars, Default-denied Stub, Script
   lädt erst nach Analyse- oder Marketing-Zustimmung, `config` pro Destination nur bei passender Kategorie,
   Consent-Updates, keine doppelte Einbindung. Voraussetzung: Conversion-Aktion in Google Ads angelegt, `AW-`ID +
   Label liegen vor.
4. Conversion auf der Success-Route: `sessionStorage`-Guard beim Redirect setzen (nicht im Honeypot-Fall),
   Conversion-Event (`send_to: "<AW-ID>/<Label>"`) nur bei vorhandenem Flag feuern; Tests: Conversion nach echtem
   Submit, kein Feuern bei Fehlern, Direktaufrufen oder CTA-Klicks.
5. FAQ-Ausstiegslink-Event: sekundäres Vercel-Analytics-Event (z. B. `faq_exit_services_click`) für den bewusst
   bestehenden Link `/{locale}#services` in der FAQ-Sektion; keine Ads-Conversion.
6. Datenschutztexte: Privacy-Dictionaries in DE/EN ergänzen.
7. QA-Gate: Mobile Banner, Inkognito, Tag Assistant, Google Ads Diagnostics, Build/Lint/Typecheck.

## Entschieden

- Google Tag und Consent-Banner werden zunächst nur auf Landingpage plus Success-Seite eingebunden, nicht global.
- Der „Cookie-Einstellungen“-Button wird nur im Footer der Landing-Route und ggf. der Success-Route gerendert — nicht
  im siteweiten Footer, da dort kein Consent-Provider existiert.
- Ads-Conversion-Tracking läuft über ein direktes Google-Ads-Conversion-Tag (`AW-`ID + Label aus einer
  Conversion-Aktion in Google Ads, via `NEXT_PUBLIC_*`-Env-Vars) — nicht über GA4-Import.
- Zusätzlich ist GA4 (`G-5T4BC28Z0F`) aktiv: consent-gated über die Analyse-Kategorie, nur auf Landing-/Success-Route.
  Der frühere „kein GA4"-Grundsatz aus dem ursprünglichen Copy-Plan (Begründung: 100-€-Testbudget) wurde bewusst
  revidiert — volles, übliches Landing-Tracking ist gewünscht. Kein GTM (für zwei Destinationen unnötig).
- Die Success-Seite wird bei Direktaufruf normal angezeigt, zählt aber nur nach echtem Submit als Conversion
  (`sessionStorage`-Flag; im Honeypot-Fall nicht gesetzt).
- UTM-Parameter werden **vorerst nicht** in Leads gespeichert; Kampagnen-Auswertung läuft über Google Ads/GA4.
  Möglicher Follow-up, sobald mehrere Kampagnen laufen und Lead-genaue Herkunft gebraucht wird.
- Die UTM-Whitelist im Vercel-Analytics-Sanitizer bleibt **vorerst weg** (optionaler Follow-up); Quellen-/
  Kampagnen-Auswertung übernimmt GA4.
- Die Datenschutzerklärung wird **im selben Branch** angepasst, aber als eigener, abgegrenzter Task (Task 6) —
  Merge-Regel für Legal-Änderungen (zwei Reviews) beachten.

## Offene Fragen vor Umsetzung

Keine — alle Punkte sind entschieden (siehe oben). Offen sind nur noch die operativen Voraussetzungen:
Conversion-Aktion in Google Ads anlegen (`AW-`ID + Label für die Env-Vars) und GA4-Property mit dem Ads-Konto
verknüpfen.
