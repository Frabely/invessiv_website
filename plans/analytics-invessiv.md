# Analytics-Setup für Invessiv

## Ausgangslage

Der aktuelle Invessiv-Stand ist bereits bewusst schlank und datenschutzarm aufgebaut:

- `@vercel/analytics` ist installiert.
- `@vercel/speed-insights` ist installiert.
- `VercelAnalytics` und `Insights` sind im Locale-Layout eingebunden.
- Die Events `cta_click`, `contact_click` und `lead_submit_success` existieren bereits.
- URL-Sanitizing entfernt Query-Parameter und Hashes vor Vercel Analytics.
- Die Datenschutzerklärung erwähnt Vercel Web Analytics und Vercel Speed Insights bereits.

## Ziel

Invessiv soll klare KPIs für Website- und Landingpage-Performance erhalten. Das Setup soll nicht unnötig komplex werden, aber als belastbare Referenz für spätere Kundenprojekte dienen.

Die erste Version priorisiert:

- messbare Nachfrage über CTA-, Kontakt- und Lead-Events
- reale Performance pro Route
- SEO-Sichtbarkeit über Search Console
- datenschutzarme Analytics ohne unnötige Tracking-Tools
- später erweiterbare Consent-Architektur

## Empfohlener Invessiv-v1-Stack

### Beibehalten

- Vercel Web Analytics weiterverwenden.
- Vercel Speed Insights weiterverwenden.
- Bestehende Events für CTA, Kontakt und erfolgreiche Leads beibehalten.
- URL-Sanitizing für Vercel Analytics beibehalten.

### Ergänzen oder prüfen

- Google Search Console prüfen oder einrichten.
- Sitemap- und Indexierungsstatus in Search Console regelmäßig kontrollieren.
- Reporting-Vorlage aus dem wiederverwendbaren Kundenplan ableiten.

### Nicht als Default einplanen

- kein GA4 als Standard
- kein Clarity als Standard
- kein Hotjar als Standard
- kein PostHog als Standard
- keine Session-Replay-Funktion als Standard

GA4, Clarity, Hotjar oder PostHog sollten nur bei einem konkreten Bedarf ergänzt werden, z. B. bezahlte Kampagnen, UX-Diagnose oder produktnahe Funnel-Analyse.

## Consent-Architektur

Im aktuellen Vercel-only-Stand wird kein zusätzlicher Cookiebanner nur wegen Vercel Web Analytics und Speed Insights eingeplant.

Die Architektur sollte aber so vorbereitet bleiben, dass spätere Tools sauber ergänzt werden können:

- zentrale Analytics-Lib mit kontrollierten Event-Namen
- klar typisierte Payloads
- keine PII in Events
- technische Trennung zwischen datenschutzarmen Basis-Events und consent-pflichtigen Tools
- spätere Erweiterbarkeit für CMP, Consent Mode und Cookie-Einstellungen

Bei späterer Einbindung von GA4, Clarity, Hotjar oder PostHog-Replay sind erforderlich:

- CMP oder Cookiebanner
- Consent Mode bei Google-Setups
- Footer-Link zu Cookie-Einstellungen
- Datenschutz-Update in Deutsch und Englisch
- klare Dokumentation der eingesetzten Tools und Zwecke

## Invessiv-KPIs

### Traffic

- Besucher pro Locale und Route
- Pageviews pro Locale und Route
- Referrer
- Kampagnen, sofern bewusst genutzt
- Top-Einstiegsseiten

### Conversion

- CTA-Klickrate
- Kontaktklickrate
- Formularstart-Rate
- Formular-Submit-Erfolgsrate
- Formularfehler-Rate
- Conversion Rate von Pageview zu Lead
- Conversion Rate von CTA-Klick zu Lead

### Performance

- Core Web Vitals pro Route
- LCP
- INP
- CLS
- TTFB, soweit verfügbar
- Auffälligkeiten nach Releases

### SEO

- Search Console Impressionen
- Search Console Klicks
- CTR
- durchschnittliche Positionen
- indexierte Seiten
- Suchanfragen mit Nachfragepotenzial
- Zielseiten mit hoher Impression, aber niedriger CTR

## Geplante Event-Erweiterung

Die vorhandenen Events bleiben erhalten:

- `cta_click`
- `contact_click`
- `lead_submit_success`

Ergänzende Events für eine bessere Funnel-Auswertung:

- `form_start`
- `form_submit_attempt`
- `form_submit_error`
- `calendar_click`
- `language_switch`
- `theme_switch`

Payloads bleiben kontrolliert und enthalten nur Felder ohne Personenbezug:

- `location`
- `variant`
- `target`
- `form_id`
- `step`
- `error_type`

Nicht erlaubt:

- Namen
- E-Mail-Adressen
- Telefonnummern
- Freitext aus Formularen
- vollständige URLs mit Query-Parametern
- sonstige personenbezogene oder identifizierende Inhalte

## Datenschutz

Der aktuelle Vercel-only-Stand bleibt datenschutzarm. Es wird kein zusätzliches Consent- oder Cookiebanner nur für den aktuellen Basis-Stack eingeplant.

Vor jeder Tool-Erweiterung muss geprüft werden:

- Welche Daten werden verarbeitet?
- Werden Cookies, Local Storage oder ähnliche Technologien genutzt?
- Ist Consent erforderlich?
- Müssen Datenschutztexte in Deutsch und Englisch angepasst werden?
- Muss ein Footer-Link zu Cookie-Einstellungen ergänzt werden?
- Gibt es Masking-, Sampling- oder Retention-Einstellungen?

Für Analytics-Events gilt dauerhaft:

- keine PII
- keine Freitextwerte
- keine unkontrollierten URLs
- identische Event-Definitionen für alle Locales
- dokumentierte Event-Namen und Payload-Felder

## Umsetzungsreihenfolge

1. KPI-Matrix finalisieren.
2. Event-Typen in der Analytics-Lib erweitern.
3. Formular-Events ergänzen.
4. Search-Console-Status prüfen.
5. Datenschutztext nur bei Tool-Erweiterung anpassen.
6. Reporting-Vorlage aus dem Kundenplan ableiten.

## Tests und Prüfung

### Automatisierte Tests

- Unit-Test für erlaubte Event-Namen und Payloads
- Test für URL-Sanitizing
- Component- oder E2E-Smoke für CTA-Tracking
- Component- oder E2E-Smoke für Formulartracking

### Manuelle Prüfung

- Vercel Web Analytics Dashboard prüfen.
- Vercel Speed Insights pro relevanter Route prüfen.
- Search Console Property und Indexierungsstatus prüfen.
- Test-Lead ausführen und Event-Erfassung kontrollieren.
- Prüfen, dass keine PII in Event-Payloads landet.

## Reporting-Vorlage

Der monatliche Invessiv-Report sollte knapp bleiben und sich auf Entscheidungen konzentrieren:

- Was hat Traffic gebracht?
- Welche Routen erzeugen CTA- oder Kontaktinteresse?
- Wo brechen Nutzer im Formular ab?
- Welche Seiten haben SEO-Potenzial?
- Welche Core-Web-Vitals-Auffälligkeiten müssen priorisiert werden?
- Welche konkrete Änderung wird als nächstes umgesetzt?
