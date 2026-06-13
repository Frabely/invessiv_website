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
  aus einer in Google Ads angelegten Conversion-Aktion), eingebunden über eine einzige Provider-Komponente, im
  **Advanced Consent Mode** (Tag lädt mit Default `denied`, sendet bei Ablehnung cookielose Pings für Conversion-
  Modeling) und ohne doppelten Script-Einbau — nur auf Landing- und Success-Route, nicht global.
- Zusätzlich wird **GA4** über die vorhandene Measurement-ID `G-5T4BC28Z0F` eingebunden (ebenfalls Advanced Consent
  Mode, gesteuert über die Analyse-Kategorie) — für Funnel-/Verhaltensanalyse der Landingpage (Absprünge, Engagement,
  Quellen). Kein GTM.
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
  entsteht. Das Speichern der **eigenen** Consent-Auswahl ist „technisch notwendig" und auch ohne Einwilligung zulässig
  — getrennt von den cookielosen Google-Pings (siehe Consent-Mode-Konzept).
- Banner erscheint nur, wenn noch keine Consent-Auswahl gespeichert ist.
- Ein Link/Button „Cookie-Einstellungen“ öffnet die Einstellungen jederzeit erneut — gerendert **nur im Footer der
  Landing-Route und der Success-Route** (dort, wo Consent-Provider und Banner existieren), nicht siteweit im globalen
  Footer. Der geteilte `FooterSection` darf den Button nur über Props/Kontext aus diesen Routen erhalten.

Styling (AGENTS-konform):

- Banner, Settings-Dialog und Cookie-Settings-Button stylen über lokales `*.module.css` oder statische Tailwind-
  Utilities im JSX — **keine** Inline-Styles und keine neuen globalen Komponentenklassen in `globals.css`.

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

### Rechtliche Pflichten (DSGVO/TDDDG) — recherchiert, verbindlich

Quellen am Ende des Dokuments. Diese Punkte sind keine Kür, sondern Voraussetzung für eine wirksame Einwilligung:

- **Opt-in:** Analyse und Marketing erst nach aktiver Zustimmung; keine vorausgewählten Häkchen.
- **Button-Gleichwertigkeit:** „Alle akzeptieren" und „Ablehnen" müssen gleich groß, gleich sichtbar und auf
  **derselben Ebene** (erste Banner-Ebene) stehen — keine farbliche Hervorhebung nur des Accept-Buttons, „Ablehnen"
  nicht als unscheinbarer Text-Link und nicht erst in den Einstellungen. (Klassischer Abmahn-/Bußgeldgrund.)
- **Ein-Klick-Ablehnung:** Ablehnen darf nicht mehr Klicks kosten als Akzeptieren.
- **Granularität:** Einwilligung getrennt pro Zweck (Analyse / Marketing), kein pauschales Sammel-Ja.
- **Kein Dark Pattern / Nudging:** keine manipulative Gestaltung, kein Cookie-Wall-Zwang (Zugang nicht von Zustimmung
  abhängig), keine Funktionseinbußen bei Ablehnung.
- **Widerruf so einfach wie Erteilung:** dauerhafter „Cookie-Einstellungen"-Link (bei uns im Landing-/Success-Footer);
  nach Ablehnung wird der Banner **nicht** erneut aufgedrängt.
- **Pflichtinhalte auf Banner-Ebene** (auf gleicher Ebene wie die Buttons erreichbar): Verantwortlicher, konkrete
  Verarbeitungszwecke (nicht vage „Surferlebnis verbessern"), verarbeitete Datenarten, Drittlandübermittlung (USA →
  Google), Link zur Datenschutzerklärung.
- **Consent Mode ersetzt die Einwilligung nicht:** Der Consent Mode ist nur die technische Schnittstelle; die
  rechtswirksame Einwilligung muss unsere eigene Consent-Schicht einholen und dokumentieren (versionierter,
  gespeicherter
  Consent-State erfüllt die Dokumentationspflicht).

### Barrierefreiheit (WCAG 2.2 AA) — verbindlich

Der Banner ist ein interaktives Overlay und muss AA erfüllen (siehe auch AGENTS.md A11y-Pflicht):

- **Semantik:** Container `role="dialog"` mit `aria-labelledby` (Banner-Titel) und `aria-describedby` (Bannertext),
  damit Screenreader ihn als Dialog ankündigen.
- **Tastatur:** Jede Aktion (Akzeptieren, Ablehnen, Einstellungen, Auswahl speichern, ggf. Schließen) ist ein natives
  `button`; vollständige Bedienung per Tastatur, sichtbarer Fokus-Ring, logische Tab-Reihenfolge, `Escape` schließt.
- **Fokus-Management:** Beim Öffnen Fokus in den Banner setzen; beim Schließen Fokus sinnvoll zurückgeben.
- **Kein harter Focus-Trap:** Bewusste Abweichung vom klassischen Modal — der Bottom-Sheet sperrt die Seite **nicht**
  aus (Anforderung „Ablehnen so leicht wie Akzeptieren" + „Haupt-CTA nicht verdecken"). Der Banner darf den aktuell
  fokussierten Seiteninhalt nicht dauerhaft verdecken.
- **WCAG 2.2 spezifisch:** Mindest-Zielgröße der Buttons 24×24 px (2.5.8), Kontrast AA, keine reine Farbcodierung.

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

Begleitparameter (verbindlich, zusammen mit dem Default-denied gesetzt):

- `ads_data_redaction: true` — solange `ad_storage = denied`, werden Ad-Identifier in den Pings redigiert.
- `url_passthrough: true` — gibt den `gclid` über URL-Parameter weiter, wenn Cookies abgelehnt sind; sonst geht die
  Klick-Zuordnung bei Ablehnung komplett verloren.
- `wait_for_update: 500` (ms) — Sicherheitsnetz, falls die Consent-Anwendung minimal verzögert ist; das Tag feuert
  nicht sofort mit dem reinen Default. Da unser `localStorage`-Read **synchron** im Inline-Stub passiert (siehe unten),
  ist die gespeicherte Auswahl in der Regel bereits vor dem ersten Ping gesetzt — `wait_for_update` ist Absicherung,
  nicht der eigentliche Mechanismus.

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

- Entscheidung: **Advanced Consent Mode** (revidiert die frühere „konservative Variante"). Begründung: Im Basic Mode
  (Skript erst nach Zustimmung laden) werden Conversions von Nutzern, die Marketing nicht aktiv akzeptieren, **gar
  nicht** gemessen — bei einer Lead-Landingpage ist das die Mehrheit und damit eine strukturelle Untererfassung des
  einzigen Seitenziels. Im Advanced Mode lädt das Tag bereits mit `consent default denied`; bei Ablehnung sendet es
  **cookielose Pings** (keine Identifier, kein Cookie-Zugriff), aus denen Google Conversions **modelliert**. Bei
  Zustimmung wird per `consent update` auf vollständiges Tracking hochgestuft.
- DSGVO-Einordnung: Das ist Googles empfohlener und üblicher Weg. Zulässig, weil ohne Zustimmung **keine** Cookies/
  Identifier gespeichert werden, sondern nur aggregierbare, cookielose Signale. Das frühere „Snippet lädt
  bedingungslos = DSGVO-Problem" galt für ein Tag **ohne** Consent-Mode-Gating; mit Default-denied + cookielosen Pings
  entfällt dieser Einwand. (Bleibt technische/inhaltliche Einordnung, keine Rechtsberatung — im Privacy-Task abdecken.)
- Inline-Starter als `next/script` mit Strategy **`beforeInteractive`** (garantiert vor dem Tag-Load): definiert
  `window.dataLayer` + `gtag`-Stub, setzt `consent default denied` inkl. Begleitparameter (`ads_data_redaction`,
  `url_passthrough`, `wait_for_update`) und liest die gespeicherte Auswahl **synchron** aus `localStorage`, um sie
  sofort per `consent update` anzuwenden. Dadurch haben Wiederkehrer schon beim ersten Ping den korrekten Consent, und
  `dataLayer.push`-Events gehen nie verloren, auch wenn das externe Skript noch lädt.
- Kein roher Google-Snippet-Code in einzelnen Pages; kein `@next/third-parties` erzwingen (Dependency nicht vorhanden,
  für einen einzelnen Tag unnötig).
- Umsetzung über eigene `GoogleTag`-Client-Komponente mit `next/script` — **eine** gtag-Bibliothek, zwei Destinationen:
  - gtag.js-Skript lädt **immer** beim Mount der Landing-/Success-Route (nicht consent-gegated), Strategy
    `afterInteractive`: `src="https://www.googletagmanager.com/gtag/js?id=G-5T4BC28Z0F"`
  - `gtag("config", "G-5T4BC28Z0F")` (GA4) und `gtag("config", "<AW-ID>")` (Ads-Destination) werden gesetzt; der
    Consent-Zustand (default denied, per Auswahl auf granted aktualisiert) steuert, ob volle Messung oder cookielose
    Pings gesendet werden — **nicht** ob das Skript lädt.
- GA4 `page_view` bei Client-Navigation: Der Form-Redirect zur Success-Route ist eine SPA-Navigation (`router.push`),
  daher sendet GA4 dort **kein** automatisches `page_view`. Lösung: `send_page_view: false` in der GA4-Config und ein
  manuelles `gtag("event", "page_view", ...)` bei jedem Routenwechsel (z. B. via `usePathname` im `GoogleTag`-Provider),
  damit der Success-Aufruf im GA4-Funnel erscheint. Das Ads-Conversion-Event bleibt davon unberührt (separat, manuell).
- Die Komponente wird gemäß `invessiv-landing`-Skill-Konvention nur auf der Landing-Route und der Landing-Success-Route
  eingebunden (nicht global im Locale-Layout); Consent-Banner ebenfalls nur auf diesen Routen. GA4 misst damit bewusst
  nur den Landing-Funnel, nicht die gesamte Site.
- Graceful Degradation: Fehlen `AW-`ID/Label oder GA4-ID in den Env-Vars (z. B. Conversion-Aktion noch nicht angelegt),
  no-op'ed die jeweilige Destination sauber — kein Build-/Runtime-Fehler.
- Keine doppelten Google-Tags; vor Umsetzung nochmals `rg "gtag|googletagmanager|dataLayer"` prüfen.

## Formular-Submit-Flow (Voraussetzung aus dem Copy-Plan)

Der Redirect wird im Copy-Plan umgesetzt (`FinalCtaSection` mit `successRedirectHref`, Redirect nur bei
`response.ok === true`, Validierungs-/API-Fehler bleiben auf der Landingpage, Honeypot redirectet identisch). Dieser
Plan ergänzt nur die Tracking-Konsequenzen:

- Button-Klick, Fokus, Scroll und Submit-Versuch zählen nicht als Google-Ads-Conversion.
- Aus dem Honeypot-Fall darf kein Google-Conversion-Event entstehen: Beim Honeypot-Redirect wird das
  `sessionStorage`-Guard-Flag (siehe Conversion Tracking) nicht gesetzt — der Bot sieht keinen Unterschied, die
  Conversion feuert trotzdem nicht.
- Vercel-Analytics-Form-Events (`form_start`, `form_submit_attempt`, `form_submit_error`, `lead_submit_success` gemäß
  `invessiv-landing`-Skill) bleiben bestehen. `lead_submit_success` feuert **auf der Landingpage unmittelbar vor dem
  Redirect** (garantiert, unabhängig vom Laden der Success-Seite), nicht erst auf der Success-Route.

UTM-Parameter:

- Nicht im Redirect erzwingen.
- Bei Bedarf später sauber in der Anfrage speichern, z. B. über erlaubte `utm_*`-Felder im DTO oder serverseitige
  Lead-Metadaten.
- `gclid`, E-Mail oder Tokens werden **nicht an Vercel Analytics** weitergegeben (der `beforeSend`-Sanitizer strippt
  sie). Das ist **kein** Widerspruch zu `url_passthrough` (siehe Consent-Mode-Konzept): `url_passthrough` ist Googles
  eigener Mechanismus, der `gclid` ausschließlich an die Google-Tags zur Ads-Attribution durchreicht — nicht an Vercel
  Analytics.

## Success-Seite (Umsetzung im Copy-Plan)

Route, gemeinsame `success-page`-Komponente, Metadata/noindex, minimaler Header/Standard-Footer und die gesamte Copy
(DE/EN) sind im Copy-Plan `google-ads-copy-revision.md` spezifiziert (Abschnitt 6b, Tasks 5a–5c) — die dortige Copy ist
kanonisch. Dieser Plan ergänzt nur die Tracking-Anforderungen an die Seite:

- Seitenaufruf ist die primäre Google-Ads-Conversion (Details im Abschnitt Conversion Tracking).
- Nicht prominent intern verlinken, nicht in die Sitemap aufnehmen.
- Die Success-Route wird vom **Consent-Provider umschlossen** (wie die Landing-Route), damit Banner, Google-Tag und der
  Cookie-Einstellungen-Button funktionieren. Der „Standard-Footer" der Success-Seite ist der provider-umschlossene
  Footer mit dem Cookie-Einstellungen-Button — nicht der globale Site-Footer ohne Consent-Kontext.

Optional später:

- Calendly-Link, nicht im ersten Umsetzungsschritt.

## Conversion Tracking für Google Ads

- Primäre Conversion: Besuch von `/de/services/landing-page/success` — gemessen **event-basiert** über
  `gtag("event", "conversion", { send_to: "<AW-ID>/<Label>", transaction_id: "<id>" })` auf der Success-Route; keine
  URL-Regel in Google Ads nötig.
- Schutz gegen Direktaufrufe: Der Redirect setzt ein kurzlebiges `sessionStorage`-Flag; die Conversion feuert nur,
  wenn das Flag vorhanden ist. Die Seite selbst wird bei Direktaufruf normal angezeigt. Beim Honeypot-Redirect wird
  das Flag nicht gesetzt.
- **Deduplizierung (kein Doppelfeuern):** Das `sessionStorage`-Flag wird **direkt nach dem Lesen gelöscht**
  (Konsum-Pattern), bevor das Event feuert. Dadurch löst weder ein Reload (F5) noch eine Zurück-/Vorwärts-Navigation
  auf der Success-Seite eine zweite Conversion aus. Zusätzlich erhält das Event eine eindeutige `transaction_id` (im
  Redirect erzeugt, z. B. `crypto.randomUUID()`, und über das Flag mitgegeben), damit Google identische Conversions
  auch serverseitig dedupliziert.
- Tests decken ab: kein erneutes Feuern bei Reload/Back nach bereits konsumiertem Flag.
- Nicht als primäre Conversion zählen:
  - Landingpage-Besuch
  - CTA-Klick
  - Button-Klick
  - Formular-Fokus
  - Scrolltiefe
  - fehlerhafter Submit
- Optional sekundär (als GA4-/Vercel-Events, **keine** Ads-Primär-Conversion):
  - CTA-Klick
  - E-Mail-Klick
  - Klick auf den FAQ-Ausstiegslink zur Leistungsübersicht (`/{locale}#services`) — der Link bleibt laut Copy-Plan
    bewusst bestehen (ehrliche Selbst-Disqualifikation); das Event misst, wer über diesen Weg von der Landingpage
    abspringt (z. B. Vercel-Event `faq_exit_services_click`)
  - später Calendly-Klick

Empfehlung in Google Ads:

- Neue Website-Conversion „Angebotsanfrage Landingpage“ anlegen — liefert `AW-`ID + Conversion-Label für die
  Env-Vars.
- Messung über das Conversion-Event auf der Success-Route (siehe oben), keine URL-Regel nötig.
- Als primäre Conversion für Gebotsoptimierung markieren.
- Landingpage-Besuch und CTA-Klicks nicht als primäre Conversion konfigurieren.
- Mit Google Tag Assistant und Google Ads Conversion Diagnostics testen.

### Enhanced Conversions for Leads (geplanter Follow-up nach V1, nicht im ersten Go)

Begründung: Standard-Conversion-Tracking verliert Zuordnung durch Cookie-Ablehnung, ITP/Safari und Cross-Device
(Klick mobil, Absenden am Desktop). Enhanced Conversions schließt diese Lücke und ist für Lead-Gen der wirksamste
Attributions-Hebel.

- Funktionsweise: Beim Submit werden die vom Nutzer **selbst eingegebenen** First-Party-Daten (E-Mail, optional Name)
  **clientseitig mit SHA-256 gehasht** und mit dem Conversion-Event gesendet. Es verlässt **nur der Hash** den Browser,
  niemals die Klar-E-Mail. Google matcht den Hash gegen eingeloggte Konten, die die Anzeige geklickt haben.
- Voraussetzungen: Marketing-Consent (`ad_user_data: granted`), Aktivierung „Enhanced Conversions" in Google Ads,
  Erwähnung in der Datenschutzerklärung.
- Technische Umsetzung: E-Mail beim Redirect über `sessionStorage` zur Success-Route mitgeben, dort vor dem
  Conversion-Event `gtag("set", "user_data", { sha256_email_address: <hash> })`; den sessionStorage-Wert direkt nach
  Verarbeitung löschen (PII-Hygiene).
- Warum erst V2: zusätzliche PII-/Hashing-Komplexität; der Nutzen skaliert mit Conversion-Volumen. Für den ersten Go
  reicht das Basis-Conversion-Event. Als eigener Task einplanen, sobald erste Kampagnen Volumen liefern.

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

- Consent Banner verlinkt Datenschutz.
- Impressum bleibt erreichbar.
- Cookie-Einstellungen über den Footer der Landing-/Success-Route erneut aufrufbar.
- Analyse und Marketing standardmäßig deaktiviert (Consent default `denied`).
- Ablehnen genauso leicht wie Akzeptieren (gleiche Ebene, gleiche Größe/Sichtbarkeit).
- Consent-Auswahl speicherbar.
- Consent-Auswahl widerrufbar und änderbar; Banner wird nach Ablehnung nicht erneut aufgedrängt.
- Google Consent Mode v2 Signale korrekt gesetzt (inkl. `ads_data_redaction`, `url_passthrough`, `wait_for_update`).
- Advanced Mode bewusst: ohne Zustimmung nur cookielose Pings, keine Cookies/Identifier — in der DSE erklärt.
- Test mit „Alle akzeptieren“.
- Test mit „Ablehnen“.
- Test mit individueller Auswahl.
- Test im Inkognito-Modus.
- Test auf Mobile.
- Google Tag Assistant Test.
- Google Ads Conversion Test.
- Success-Seite wird nur nach erfolgreichem Submit im normalen User-Flow erreicht.
- Hinweis: Das ist eine technische/inhaltliche Checkliste, keine Rechtsberatung.

### Pflichtangaben Datenschutzerklärung (recherchiert — Task 6)

Konkret zu ergänzen/prüfen (Quellen am Ende):

- Einsatz von **Google Analytics 4** (Measurement-ID), Zweck (Reichweiten-/Funnel-Analyse), verarbeitete Daten,
  Rechtsgrundlage Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
- Einsatz von **Google Ads Conversion Tracking** (`AW-`Tag), Zweck (Messung von Anfragen aus Anzeigen).
- **Google Consent Mode v2 im Advanced Mode** explizit erklären: dass auch **ohne Einwilligung cookielose Pings**
  (Einwilligungsstatus + aggregierte Conversion-/Analytics-Signale) an Google gesendet werden und Google daraus
  Conversions/Verhalten **modelliert**. Klarstellen: „cookieless ≠ consentless".
- **Vercel Analytics + Speed Insights** (cookieless, siteweit, nicht über den Banner gesteuert): Zweck, verarbeitete
  Daten, Rechtsgrundlage — in der bestehenden DSE prüfen und bei Bedarf ergänzen, damit die Erklärung vollständig ist.
- **Drittlandübermittlung in die USA** an Google (Google Ireland Ltd. / Google LLC), Hinweis auf Risiken und
  Rechtsgrundlage des Transfers (EU-US Data Privacy Framework / SCCs).
- Hinweis auf **IP-Adress-Verarbeitung** durch Google.
- Speicherdauer/Widerruf der Einwilligung und Verweis auf den Cookie-Einstellungen-Link.
- Falls Enhanced Conversions (V2) live geht: zusätzlich gehashte First-Party-Daten (E-Mail) an Google ergänzen.
- Klarstellung: Consent Mode ist nur die technische Schnittstelle und ersetzt die eigene Einwilligungseinholung nicht.
- Legal-Merge-Regel beachten: zwei Reviews für die DSE-Änderung.

## Go/No-Go-Quality-Gate

Go für Google Ads nur, wenn:

- Landingpage lädt korrekt.
- Formular funktioniert.
- Success-Seite funktioniert.
- Google Tag ist eingebunden: GA4 `G-5T4BC28Z0F` + Ads-Conversion-Destination (`AW-`ID aus Env-Vars).
- Tag läuft im Advanced Consent Mode: Default `denied`; bei Ablehnung cookielose Pings, bei Zustimmung volle Messung
  (`consent update`). GA4-Messung nur bei Analyse-, Ads-Personalisierung nur bei Marketing-Zustimmung.
- GA4 `page_view` wird auch bei SPA-Navigation auf die Success-Route gesendet.
- Consent Banner funktioniert und ist barrierefrei (Tastatur, `role="dialog"`, Fokus-Management, kein harter Trap).
- Banner erfüllt DSGVO/TDDDG: Accept/Reject gleichwertig auf erster Ebene, granular, Widerruf möglich.
- Accept / Reject / Settings funktionieren.
- Google Consent Mode v2 Werte inkl. `ads_data_redaction`/`url_passthrough`/`wait_for_update` korrekt gesetzt.
- Conversion feuert nicht doppelt bei Reload/Back (Flag-Konsum + `transaction_id`).
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

1. ✅ **Erledigt.** Consent-Domainmodell und Tests in `lib/consent/`, nach Verantwortung geschnitten (analog
   `lib/navigation/`):

- `consent-types.ts` — Consent-Typen via const-Objekt-Pattern (`ConsentCategory`, `ConsentSignalState`,
  `ConsentChoice`, `GoogleConsentSignals`) + Default-Choices.
- `consent-mode.ts` — Consent-to-Google-Signal-Mapping, `DEFAULT_GOOGLE_CONSENT_SIGNALS`, `CONSENT_DEFAULT_PARAMS`;
  Tests `consent-mode.test.ts` (node-Env, rein).
- `consent-storage.ts` — `localStorage`-Storage mit Versionierung + Re-Consent-Hook über `version`, window-/try-catch-
  Guard; Tests `consent-storage.test.ts` (jsdom-Env).
- 15 Tests grün; `npm run typecheck` + ESLint (`src/lib/consent`) Exit 0. Kein Barrel — Konsumenten importieren
  direkt.

2. ✅ **Erledigt.** Consent UI + Provider-Schicht:

- `lib/consent/consent-store.ts` — `useSyncExternalStore`-Quelle für `localStorage` (SSR-sicher, Cross-Tab-Sync,
  kein Mount-`setState`); `lib/consent/google-consent.ts` — `emitConsentUpdate` (gtag `consent update`, no-op ohne
  `window.gtag`).
- `components/providers/consent-provider/` — `consent-context.ts` + `consent-provider.tsx`;
  `hooks/consent/use-consent.ts`.
- `components/consent/consent-banner/` (Bottom-Sheet, `role="dialog"`, `aria-labelledby`/`-describedby`, Fokus setzen
  - zurückgeben, `Escape`, kein harter Trap, Accept/Reject als **gleichwertige** Buttons auf erster Ebene),
    `consent-settings/` + `consent-settings/consent-toggle-item/` (granulare Toggles, Save),
    `cookie-settings-button/`.
- Je eigenes `*.module.css` (keine Inline-Styles); Mobile-States (Full-width-Buttons < 30rem);
  `prefers-reduced-motion`.
- DE/EN-Copy in `i18n/dictionaries/shared/consent/{de,en}.json` (identische Keys, Loader `index.ts`).
- Einbindung: `ConsentProvider` umschließt Landing- **und** Success-Route; `CookieSettingsButton` nur via neuer
  `FooterSection`-Prop `cookieSettings` (kein siteweiter Footer-Button).
- Tests `consent-provider.test.tsx` (7 jsdom-Tests: Banner-Sichtbarkeit, Accept/Reject/Save → Storage + `consent
update`, Escape-Dismiss, EN-Copy). Verifikation: `npm run typecheck`, ESLint (0 Disables), 379 Vitest-Tests und
  `npm run build` grün.
- Offener Feinschliff (nicht blockierend): explizites Tab-Order-/Sichtbarkeitsverhalten der einzelnen Toggles auf sehr
  kleinen Viewports nur visuell, nicht E2E geprüft — deckt Task 8 (E2E) ab.

3. ✅ **Erledigt.** GoogleTag Provider (Advanced Consent Mode):

- `lib/analytics/google-tag/google-tag-config.ts` — liest `NEXT_PUBLIC_GA4_MEASUREMENT_ID`,
  `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID`, `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL`; `isGoogleTagEnabled` +
  `getGtagLoaderId` (GA4 bevorzugt, sonst Ads-ID). Graceful no-op, wenn keine ID gesetzt ist.
- `lib/analytics/google-tag/google-tag-script.ts` — pure Builder: `buildConsentBootstrapScript` (dataLayer + gtag-Stub,
  `consent default denied` inkl. `wait_for_update`, `ads_data_redaction`/`url_passthrough` als `set`, synchroner
  versionierter `localStorage`-Read → `consent update`), `buildGtagConfigScript` (GA4 `send_page_view:false`,
  Ads-Config),
  `buildGtagSrc`. Storage-Key/Version + Default-Signale aus `lib/consent/` wiederverwendet (Single Source).
- `components/providers/google-tag/google-tag.tsx` — `"use client"`; ein synchroner Inline-Block (Bootstrap + Config) +
  gtag.js-Loader, beide `afterInteractive`; manuelles GA4 `page_view` bei jedem `usePathname`-Wechsel.
- **Strategie-Abweichung (vom User freigegeben):** statt `beforeInteractive` wird `afterInteractive` genutzt, weil
  `beforeInteractive` im App Router nur im Root-Layout wirkt und das Tag sonst siteweit laden würde. Die Route-Scoping-
  Anforderung (nur Landing + Success) hat Vorrang; der synchrone Inline-Block erfüllt den Ordering-Intent
  (Consent-Default vor erstem Ping). Begründung als Kommentar in der Komponente.
- Eingebunden via `<GoogleTag />` innerhalb des `ConsentProvider` auf Landing- (`landing-page.tsx`) und Success-Route
  (`success/page.tsx`); `consent update` bei neuer Auswahl läuft weiter über das bestehende `emitConsentUpdate`.
- `.env.example` um die drei `NEXT_PUBLIC_*`-Vars ergänzt (GA4-ID als Beispielwert vorbelegt, Ads leer).
- 21 neue Tests (config/script/component) grün; bestehende Landing-/Success-Tests um `usePathname`-Mock ergänzt.
  Verifikation: `npm run typecheck`, ESLint, 400 Vitest-Tests und `npm run build` grün.
- Offen (operativ, nicht Code): Conversion-Aktion in Google Ads anlegen → `AW-`ID + Label für die Env-Vars; das
  Conversion-Event selbst kommt in Task 4.

4. ✅ **Erledigt.** Conversion auf der Success-Route:

- `lib/analytics/google-ads-conversion/conversion-guard.ts` — `sessionStorage`-Guard (`LANDING_CONVERSION_GUARD_KEY`)
  - `createConversionTransactionId` (`crypto.randomUUID` mit Fallback); `markLandingConversionPending` (window-/
    try-catch-Guard) und `consumeLandingConversionGuard` (liest + löscht im selben Schritt → kein Doppelfeuern).
- `lib/analytics/google-ads-conversion/conversion-event.ts` — `buildConversionSendTo` (`<AW-ID>/<Label>`) +
  `fireLandingConversion` (gtag `event conversion` mit `send_to`/`transaction_id`, no-op ohne Ads-Config oder `gtag`).
- `hooks/analytics/use-landing-conversion.ts` + `components/analytics/landing-conversion/` — konsumiert das Flag beim
  Mount und feuert einmalig; eingebunden nur auf der Landing-Success-Route (`success/page.tsx`), nicht im geteilten
  `SuccessPage` (LinkedIn-Success bleibt unberührt).
- `FinalCtaSection` markiert das Guard-Flag nur bei echtem Submit-Erfolg und nur über die opt-in-Prop
  `trackAdsConversion` (Landing-Page setzt sie; Honeypot-Redirect und LinkedIn setzen das Flag nicht).
- Tests (15 neue + erweiterte Final-CTA-/Success-Tests): Conversion nach echtem Submit, kein Feuern bei Direktaufruf,
  fehlender Ads-Config, Honeypot, LinkedIn oder Reload/Back (konsumiertes Flag). Verifikation: `npm run typecheck`,
  ESLint (0 Fehler), 412 Vitest-Tests und `npm run build` grün.
- Offen (operativ, nicht Code): `AW-`ID + Label in den Env-Vars hinterlegen, sobald die Conversion-Aktion in Google Ads
  angelegt ist — ohne diese Werte no-op't die Conversion sauber.

5. ✅ **Erledigt.** FAQ-Ausstiegslink-Event:

- `faq_exit_services_click` als neuer Eintrag in `CLICK_TRACKED_EVENT_NAMES` (`lib/analytics/conversion-events.ts`) —
  damit automatisch in `ALLOWED_CONVERSION_EVENT_NAMES` und über den bestehenden, delegierten `ConversionClickTracker`
  (im Locale-Layout via `VercelAnalytics`) getrackt; kein neuer Tracker nötig. Reines Vercel-Analytics-Event, **keine**
  Ads-Conversion.
- Content-getrieben (analog CTA): `LandingFaqLink` um optionale `analyticsEvent`/`analyticsLocation`/`analyticsTarget`
  erweitert; der Antwortlink in `faq-section.tsx` rendert die `data-analytics-*`-Attribute nur, wenn gesetzt. Andere
  Antwortlinks bleiben ohne Tracking, bis sie es im Content opt-in setzen.
- DE/EN parallel gepflegt: der `/{locale}#services`-Exit-Link in `faq/{de,en}.json` trägt
  `analyticsEvent: "faq_exit_services_click"`, `analyticsLocation: "faq"`, `analyticsTarget: "services"`.
- Tests: erweiterte `conversion-events.test.ts` (Allowlists), zwei neue `faq-section.test.tsx`-Fälle (Attribute am
  Exit-Link gesetzt / kein Tracking ohne Analytics-Content). Verifikation: `npm run typecheck`, ESLint (0 Fehler),
  414 Vitest-Tests und `npm run build` grün.

6. Datenschutztexte: Privacy-Dictionaries in DE/EN ergänzen — Pflichtangaben siehe „Pflichtangaben
   Datenschutzerklärung" (GA4, Ads, Consent Mode Advanced/cookielose Pings, Vercel Analytics, USA-Transfer, IP,
   Widerruf). Legal-Merge-Regel: zwei Reviews.
7. QA-Gate: Mobile Banner, Inkognito, Tag Assistant, Google Ads Diagnostics, Build/Lint/Typecheck.
8. **E2E (zuletzt):** Playwright-Smoke für den Kernablauf — Consent Accept/Reject sichtbar & per Tastatur bedienbar,
   Default-denied vor Auswahl, erfolgreicher Submit → Redirect auf Success → Conversion-Event feuert genau einmal,
   Direktaufruf/Reload feuert nicht, Honeypot feuert nicht. Wird als letzter Task umgesetzt, wenn 1–7 stehen.

### Geplanter Follow-up (nach V1, nicht im ersten Go)

- Enhanced Conversions for Leads (gehashte E-Mail an das Conversion-Event) — Details siehe Abschnitt
  „Enhanced Conversions for Leads".

## Entschieden

- Google Tag und Consent-Banner werden zunächst nur auf Landingpage plus Success-Seite eingebunden, nicht global.
- Der „Cookie-Einstellungen“-Button wird nur im Footer der Landing- und Success-Route gerendert (beide vom
  Consent-Provider umschlossen) — nicht im siteweiten Footer, da dort kein Consent-Provider existiert.
- Ads-Conversion-Tracking läuft über ein direktes Google-Ads-Conversion-Tag (`AW-`ID + Label aus einer
  Conversion-Aktion in Google Ads, via `NEXT_PUBLIC_*`-Env-Vars) — nicht über GA4-Import.
- Zusätzlich ist GA4 (`G-5T4BC28Z0F`) aktiv: gesteuert über die Analyse-Kategorie, nur auf Landing-/Success-Route.
  Der frühere „kein GA4"-Grundsatz aus dem ursprünglichen Copy-Plan (Begründung: 100-€-Testbudget) wurde bewusst
  revidiert — volles, übliches Landing-Tracking ist gewünscht. Kein GTM (für zwei Destinationen unnötig).
- **Advanced Consent Mode** (revidiert die frühere „konservative Variante"): Tag lädt mit Default `denied` und sendet
  bei Ablehnung cookielose Pings für Conversion-Modeling, statt erst nach Zustimmung zu laden. Begründung: Im Basic
  Mode würde die Mehrheit der Leads (kein aktiver Marketing-Consent) gar nicht gemessen — Untererfassung des einzigen
  Seitenziels.
- **Enhanced Conversions for Leads** ist als V2-Follow-up eingeplant, **nicht** im ersten Go (zusätzliche PII-/Hashing-
  Komplexität; Nutzen skaliert mit Volumen).
- Die Success-Seite wird bei Direktaufruf normal angezeigt, zählt aber nur nach echtem Submit als Conversion
  (`sessionStorage`-Flag; im Honeypot-Fall nicht gesetzt).
- **Kein automatisches Consent-Re-Prompt** in V1: Der Consent-State wird versioniert (`version`/`updatedAt`)
  gespeichert; eine zeitbasierte Re-Einholung (z. B. nach 6–12 Monaten) ist bewusst nicht Teil von V1, lässt sich über
  das `version`-Feld aber ohne Umbau nachrüsten.
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

## Quellen (Recherche Banner-/Datenschutz-Pflichten, Stand Juni 2026)

- Google Consent Mode v2 & DSGVO, inkl. Advanced-Mode-Pings und DSE-Hinweise — eRecht24:
  <https://www.e-recht24.de/datenschutz/13274-google-consent-mode-dsgvo.html>
- Cookie-Banner Design-/Funktionsregeln (Button-Gleichwertigkeit, Dark Patterns, Pflichtinhalte) — Cortina Consult:
  <https://cortina-consult.com/web-compliance/wissen/cookie-banner-design-regeln/>
- Cookie-Banner-Pflicht DSGVO/TDDDG — externer-datenschutzbeauftragter-dresden.de:
  <https://externer-datenschutzbeauftragter-dresden.de/datenschutz/cookie-banner-pflicht/>
- WCAG-2.2-konforme Cookie-Banner (role="dialog", Fokus, Tastatur) — consentmanager:
  <https://www.consentmanager.net/en/knowledge/wcag-cookie-banners/>
- WCAG 2.2 Cookie-Banner-Anforderungen — secureprivacy.ai:
  <https://secureprivacy.ai/blog/wcag-cookie-banner-requirements>

Hinweis: Quellen sind Fachartikel, keine Rechtsberatung. Vor Go-Live durch die rechtlich verantwortliche Person prüfen
lassen (Legal-Task 6, zwei Reviews).
