# Wiederverwendbares Analytics-Setup für Kundenprojekte

## Ziel

Dieses Dokument beschreibt ein standardisiertes Analytics-Framework für Landingpages, Websites und spätere Kundenprojekte. Es dient als wiederverwendbare Arbeitsgrundlage für Projektplanung, Tool-Auswahl, Datenschutz, Consent-Architektur und Reporting.

Der Fokus liegt auf einem schlanken, belastbaren Setup:

- klare KPIs vor Tool-Auswahl
- datenschutzarme Defaults
- saubere Consent-Entscheidungen je Kundenkontext
- nachvollziehbares Reporting mit konkreten Handlungsempfehlungen

## KPI-Grundmodell

### Traffic

- Besucher
- Seitenaufrufe
- Einstiegsseiten
- Referrer und Traffic-Quellen
- Kampagnenparameter, sofern bewusst eingesetzt
- Verteilung nach Gerätetyp und Route

### Conversion

- CTA-Klicks
- Kontaktklicks, z. B. E-Mail, Telefon oder Kalender
- Formularstarts
- Formular-Submit-Versuche
- erfolgreiche Leads
- Formularfehler
- Conversion Rate von Pageview zu Lead
- Conversion Rate von CTA-Klick zu Lead

### Performance

- LCP
- INP
- CLS
- TTFB
- Performance je Route und Gerätetyp
- auffällige Verschlechterungen nach Releases

### SEO

- Impressionen
- Klicks
- CTR
- durchschnittliche Positionen
- indexierte und nicht indexierte Seiten
- Suchanfragen und Zielseiten
- technische Indexierungsprobleme

### UX-Diagnose

- Scrolltiefe
- Heatmaps
- Session Recordings
- Formular-Abbruchpunkte
- Klickpfade

UX-Diagnose-Tools sind optional und sollten zeitlich begrenzt, consent-basiert und mit Masking/Sampling geplant werden.

## Tool-Übersicht

### Vercel Web Analytics

Cookielose Web-Analytics für Pageviews, Referrer, Geräte und Custom Events. Besonders geeignet für Vercel-Projekte, schlanke Landingpages und Kunden, die ein reduziertes, datenschutzarmes Setup bevorzugen.

### Vercel Speed Insights

Real-User-Monitoring für Core Web Vitals. Misst reale Performance nach Route und hilft, LCP, INP und CLS auf Basis echter Nutzung zu beobachten.

### Google Search Console

Pflichttool für SEO-Basisdaten. Liefert Suchanfragen, Impressionen, Klicks, CTR, durchschnittliche Positionen, Indexierungsstatus und technische Hinweise zur Auffindbarkeit.

### Plausible

Privacy-first Analytics mit cookielosem Ansatz und einfachen Reports. Gut geeignet für kleine bis mittlere Kunden, die verständliche Kennzahlen ohne großes Marketing-Setup benötigen.

### Umami

Privacy-first Analytics als Self-hosted- oder Cloud-Variante. Bietet Events und Dashboards und ist sinnvoll, wenn Datenkontrolle, schlanke Auswertung und einfache technische Integration wichtig sind.

### Matomo

Umfangreiche Analytics-Plattform als Self-hosted- oder Cloud-Lösung. Privacy-konfigurierbar und passend für EU- oder Datenschutz-fokussierte Kunden mit höherem Reporting-Bedarf.

### Microsoft Clarity

Kostenlose Heatmaps und Session Recordings. Für EU/EEA/UK/CH-Verkehr nur mit Consent, Masking, klarer Datenschutzprüfung und begrenztem Diagnose-Zeitraum einplanen.

### Hotjar

Heatmaps, Recordings, Feedback und Surveys. Gut für gezielte UX-Diagnose, aber consent- und datenschutzintensiver als reine Pageview-Analytics.

### PostHog

Product Analytics mit Funnels, Feature Flags, Cohorts und Session Replay. Eher für SaaS, Webapps und Produkt-Flows geeignet als für einfache Landingpages.

## Empfohlene Pakete

### Basic

Für schlanke Websites und Landingpages mit klarem Datenschutzprofil.

- Vercel Web Analytics, Plausible oder Umami
- Vercel Speed Insights bei Vercel-Projekten
- Google Search Console
- Basis-Eventtracking für CTA, Kontakt und Lead
- monatlicher Kurzreport

### Growth

Für Kunden mit mehreren Kanälen oder stärkerem Marketing-Fokus.

- Plausible, Umami oder Matomo
- Google Search Console
- definierte Key Events
- Kampagnen- und Conversion-Auswertung
- monatlicher Report mit Kanalbewertung

### UX Diagnostic

Für zeitlich begrenzte Analyse von Reibung, Abbrüchen und Nutzerverhalten.

- Microsoft Clarity oder Hotjar
- Consent über CMP
- Masking sensibler Inhalte
- Sampling und begrenzte Laufzeit
- konkrete Hypothesen vor Aktivierung
- Abschlussbericht mit UX-Maßnahmen

### Product Advanced

Für SaaS, Webapps oder produktnahe Funnels.

- PostHog oder Matomo
- Funnel-Analyse
- Cohorts
- Feature- oder Experiment-Auswertung
- optional Session Replay mit strengem Consent- und Masking-Konzept
- regelmäßige Produkt- und Conversion-Reviews

## Datenschutz und Consent

Ein Cookiebanner oder eine Consent-Management-Plattform ist nötig, sobald zustimmungspflichtige Cookies, Marketing-Tags,
Clarity, Hotjar oder Replay-Funktionen genutzt werden.

Für jedes Kundenprojekt gilt:

- Datenschutztexte müssen auf die tatsächlich eingesetzten Tools aktualisiert werden.
- Analytics-Events dürfen keine PII enthalten.
- Event-Payloads dürfen nur kontrollierte technische oder fachliche Felder enthalten.
- Formulareingaben, Namen, E-Mail-Adressen, Telefonnummern und Freitextinhalte werden nicht in Analytics übertragen.
- Replay- und Heatmap-Tools werden nur bei klarem Diagnoseziel, Consent, Masking und zeitlicher Begrenzung eingesetzt.
- Tool-Auswahl und Consent-Status werden im Projekt dokumentiert.

## Reporting

Der Standard ist ein monatlicher Kundenreport mit:

- Traffic-Entwicklung
- wichtigsten Quellen und Kampagnen
- meistbesuchten Seiten
- Leads und Conversion Rate
- CTA- und Kontaktklickraten
- Formularstarts, Formularfehler und erfolgreiche Leads
- Core Web Vitals und Performance-Auffälligkeiten
- Search-Console-KPIs
- konkreten Empfehlungen für den nächsten Monat

Reports sollen nicht nur Zahlen sammeln, sondern Entscheidungen vorbereiten. Jede Auswertung endet mit priorisierten Maßnahmen, erwarteter Wirkung und einem klaren nächsten Schritt.
