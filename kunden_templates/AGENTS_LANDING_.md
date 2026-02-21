# AGENTS_LANDING.md - Landing Ready-to-Ship Mode

## Mission
Ein einziger Ausfuehrungsdurchlauf liefert eine sofort einsetzbare Landingpage.
Die Seite ist modern, klar und hochwertig, hebt sich visuell von generischen Baukasten-Seiten ab und bleibt performant.

## Betriebsmodus
- `single_run_delivery`: keine halbfertigen Artefakte
- wenn Inputs fehlen: Best-Practice-Defaults setzen und transparent markieren
- nur bei blocker-kritischen Luecken Rueckfrage stellen

## Rollen

### 1) Landing Strategist (`landing-strategist`)
Verantwortung:
- Value Proposition schaerfen
- Zielgruppenfit der Copy sichern
- CTA-Strategie und Seitenfluss festlegen

Output:
- finaler Seitenaufbau
- Copy-Blueprint je Section

### 2) UX/UI Builder (`landing-ui`)
Verantwortung:
- responsive Umsetzung (mobile/tablet/desktop)
- visuelle Hierarchie, Kontrast, Lesbarkeit
- konsistente Components und States

Output:
- shipbare UI inkl. responsivem Verhalten

### 3) SEO & Content Agent (`landing-seo`)
Verantwortung:
- On-Page SEO-Basics
- semantische HTML-Struktur
- Meta/OG Grundsetup

Output:
- SEO-ready Seitenkopf und Struktur

### 4) A11y & Quality Agent (`landing-qa`)
Verantwortung:
- Accessibility-Basics pruefen
- technische und visuelle Abnahme
- Ready-to-Ship Gate freigeben

Output:
- kurze QA-Freigabe gegen Checklist

## Verbindliche Landing Standards

### Informationsarchitektur (Pflicht)
1. Hero (Nutzen + primaerer CTA)
2. Problem/Loesung
3. Angebot/Leistungen inkl. Template-Previews (z. B. `example1.md`, `example2.md` als Platzhalter)
4. Trust (Cases, Zahlen, Testimonials)
5. Offer/Pricing mit klaren Preisen und Kaufoption
6. FAQ (Einwandbehandlung)
7. Kontakt (Calendly oder gleichwertig) + Footer + Legal

### Copy Standards
- kurze, scanbare Abschnitte
- konkrete Sprache statt Buzzword-Fuelltext
- klarer Nutzen pro Section
- klare CTA-Verben
- keine Claims ohne Kontext
- Standard-CTA (verbindlich): **"Kostenloses Erstgespraech buchen"**
- Standard-Sekundaer-CTA: **"Projekt anfragen"**
- Tonalitaet: klar, selbstbewusst, modern, kein Marketing-Blabla
- Sprache default: Deutsch (sofern nicht anders vorgegeben)

### Design Standards
- klare visuelle Hierarchie
- CTA-Kontrast und prominente Positionierung
- maximal 1 primaerer CTA-Style
- moderate "fancy" Akzente (z. B. subtile Hover/Reveal-Effekte), kein visuelles Rauschen
- konsistentes Spacing-System
- Logo ist Pflichtinput
- Farbgebung ist optional; ohne Vorgabe wird eine branchenspezifische, kontraststarke Palette gesetzt
- unterschiedliche Runs muessen visuell deutlich unterscheidbar sein (Layout, Typo, Farbwelt, Komponentenstil)
- wenn nur Farbnamen statt exakter Farbcodes geliefert werden (z. B. "gelb"), grelle Varianten vermeiden und moderne, augenschonende Toene verwenden
- nur wenn konkrete Farbcodes vorgegeben sind, werden diese prioritaer uebernommen

### Responsive Standards
- mobile-first bauen
- tablet und desktop gezielt nachziehen
- keine abgeschnittenen Inhalte
- keine versteckten Kernfunktionen auf mobil

### A11y Standards
- Fokus-Styles sichtbar
- Inputs mit Labels
- sinnvolle Alt-Texte (wenn Bilder vorhanden)
- ausreichender Farbkontrast
- Tastaturbedienbarkeit fuer Navigation und CTAs

### SEO Standards
- einzigartiger Title + Description
- 1 klare H1
- korrekte Heading-Hierarchie
- OG-Basisdaten
- sauberer, lesbarer HTML-Aufbau

### Commerce & Kontakt Standards
- Templates werden als kaufbare digitale Produkte dargestellt
- jedes Produkt/jeder Plan hat transparenten Preis und klaren Kauf-CTA
- Zahlungsmoeglichkeit ist Pflicht (mock oder produktiv klar gekennzeichnet)
- Kontaktweg ist Pflicht und direkt erreichbar (bevorzugt Calendly-Link)

### Legal & Compliance Minimum
- Impressum (Platzhalter erlaubt im Mockup)
- Datenschutzerklaerung (Platzhalter erlaubt im Mockup)
- zusaetzliche Pflichttexte je nach Verkaufskontext als Platzhalter vorsehen (z. B. AGB/Widerruf)
- keine irrefuehrenden Aussagen zu Verfuegbarkeit, Preisen oder Zahlungsstatus

### Architektur fuer spaeteren Ausbau
- Struktur fuer spaeteres Nutzer-Management vorbereiten (jetzt nicht ueberbauen)
- i18n-faehige Content-Struktur vorbereiten (locale-ready, externe Texte)
- Komponenten und Routing so anlegen, dass spaetere Skalierung ohne Rebuild moeglich ist

### Technologie-Entscheidung (Pflicht-Output bei Setup)
- bei neuen Landing-Projekten wird eine kurze Stack-Empfehlung dokumentiert:
  - Sprache (Standard: TypeScript)
  - Framework (Standard: Next.js)
  - UI-Styling (Standard: Tailwind CSS)
  - benoetigte Tools (z. B. SEO, Analytics, Form/Calendly, Payment-Anbindung)
- wenn explizit "nur HTML-Mockup" angefragt ist, wird zuerst HTML geliefert und die Stack-Empfehlung separat dokumentiert

## Mock-Regeln fuer noch nicht aktive Features
- sichtbar, aber klar als "bald"/"mock" markiert
- kein irrefuehrendes Verhalten
- deutliche Nutzerhinweise bei Klick
- fuer Payment/Kauf gilt: keine Scheinsicherheit erzeugen; mock-status eindeutig anzeigen

## Definition of Done (Landing Single-Run)
Erst fertig, wenn:
- alle Ready-to-Ship Kriterien aus `ROADMAP_LANDING.md` erfuellt sind
- Seite auf mobil/tablet/desktop stabil laeuft
- CTA-Journey logisch und auffindbar ist
- Pflicht-Kontaktweg funktioniert (z. B. Calendly oder Mail)
- kaufbarer Angebotsbereich inkl. Preislogik sichtbar ist (oder sauber als mock markiert)
- Legal-Minimum im Footer vorhanden ist
- offene Punkte als "mock/coming soon" klar kenntlich sind

## Eskalationslogik fuer Rueckfragen
Rueckfrage nur bei:
- fehlendem Hauptziel der Seite
- fehlendem CTA-Ziel
- fehlendem Kontaktweg
- unklarer Sprache (DE/EN)

In allen anderen Faellen:
- Best-Practice-Default setzen
- Annahme kurz dokumentieren

## Ausgabeformat nach Ausfuehrung
1. Was wurde gebaut (kurz, konkret)
2. Welche Defaults wurden gesetzt
3. Ready-to-Ship Check (Pass/Fail je Punkt)
4. Optional: naechste Ausbaustufe (max 3 Punkte)
