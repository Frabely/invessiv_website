# ROADMAP_LANDING.md - invessiv Landing One-Run

## Ziel
Mit einem einzigen Agenten-Durchlauf eine **ready-to-ship Landingpage** erzeugen:
- conversion-orientiert
- technisch sauber
- SEO/A11y/Performance-ready
- mobil, tablet und desktop optimiert

## Ergebnisdefinition (Ready-to-Ship)
Eine Landingpage gilt als ready-to-ship, wenn:
- klares Value Proposition Messaging above the fold vorhanden ist
- 1 primaerer CTA und maximal 1 sekundaerer CTA klar priorisiert sind
- Struktur fuer Conversion vorhanden ist (Hero -> Problem/Loesung -> Offer -> Trust -> CTA -> FAQ -> Footer/Legal)
- mobile/tablet/desktop ohne Layout-Brueche funktionieren
- SEO-Basics umgesetzt sind (Title, Description, OG, semantische Struktur, saubere H1-H2-Hierarchie)
- A11y-Basics umgesetzt sind (Kontrast, Fokus-Styles, Labels, Keyboard-Use, sinnvolle ARIA wo noetig)
- Performance-Basics umgesetzt sind (leichtes Markup, keine unnoetigen Dependencies, optimierte Assets)
- rechtliche Pflichtlinks im Footer vorbereitet/eingebunden sind

## Minimal Input Checklist (Kunde)
Nur diese Inputs sind erforderlich. Alles andere wird mit Best-Practice-Defaults gesetzt.

### Pflicht (minimal)
1. Angebotsname: Was wird verkauft?
2. Zielgruppe: Fuer wen ist es?
3. Hauptziel der Seite: z. B. Leads, Calls, Sales
4. Primaerer CTA (fixer Standard): **"Kostenloses Erstgespraech buchen"**
5. Kontaktziel: Calendly-Link oder Kontakt-Mail
6. 3 Kernvorteile: kurz als Bulletpoints
7. 1-3 Trust-Elemente: Referenzen, Zahlen, Kundenstimmen oder Platzhalter erlaubt
8. Sprache: DE, EN oder DE/EN
9. Brand-Basis: **Logo (required)** + Farbgebung (optional, sonst thematischer Default)
   - wenn moeglich als Farbcodes angeben (z. B. `#0F766E`, `#F59E0B`)
   - alternativ Farbnamen/Style-Wunsch (z. B. "blau", "warm", "serioes")
10. Rechtliche Links: Impressum/Datenschutz URLs (falls noch nicht vorhanden: Platzhalter)

### Optional (wenn vorhanden)
- Preisstruktur / Pakete
- FAQ-Rohtexte
- Cases mit Kennzahlen
- Wunsch-Style (z. B. clean, editorial, bold, corporate)
- Tracking-Praeferenz (privacy-first, GA4, Plausible etc.)

## Defaults, wenn Input fehlt
- Copy-Ton: klar, direkt, vertrauenswuerdig, ohne Marketing-Floskeln
- Primaerer CTA-Default (verbindlich): **"Kostenloses Erstgespraech buchen"**
- Sekundaerer CTA-Default: **"Projekt anfragen"**
- Struktur: standardisierte High-Converting Landing-Architektur
- Farbwelt: kontraststarke, seriöse Palette mit A11y-sicherer CTA-Farbe
- Wenn keine Farbwerte geliefert werden: thematisch passende Palette je Branche wählen
- Wenn nur Farbnamen geliefert werden (ohne Codes): moderne, augenschonende Töne wählen
- Jede Ausführung muss eine eigenständige visuelle Richtung haben (keine 1:1 Template-Optik)
- Typo: gut lesbare, performante Webfonts/Fallbacks
- Trust: neutrale Placeholders mit klarer Kennzeichnung
- Legal: Footer-Links als Platzhalter
- Tracking: deaktiviert bzw. privacy-first Platzhalter

## One-Run Workflow
1. Input validieren (Pflichtfelder + Luecken markieren)
2. Informationsarchitektur festlegen (Sections + CTA-Flow)
3. Copy schreiben (Headline, Subheadline, Benefits, CTA, FAQ, Trust)
4. UI bauen (responsive first: mobile -> tablet -> desktop)
5. SEO + Metadaten integrieren
6. A11y-Checks und Verbesserungen
7. Performance-Check (lightweight output)
8. Final QA gegen Ready-to-Ship Checklist
9. Ausgabe + kurze Hand-off Notizen

## Technische Qualitaets-Gates
- Semantisches HTML (header/main/section/footer, saubere headings)
- CLS-sichere Layouts (stabile Container, vorhersehbare Groessen)
- Sichtbare Focus-Ringe fuer alle interaktiven Elemente
- Formularfelder mit Labels (nicht nur placeholder)
- Keine toten Links ohne klaren Mock-Hinweis
- Bilder: `alt`-Texte + sinnvolle Kompressionstrategie

## SEO Mindeststandard
- Unique `<title>` und `<meta name="description">`
- Eine klare H1
- Sinnvolle H2/H3-Hierarchie
- OpenGraph Basis (title/description/type)
- Saubere interne Verlinkung (Ankerstruktur)
- Optional: JSON-LD Organisation/Service (wenn Daten verfuegbar)

## Conversion Mindeststandard
- Above the fold: Problem + Nutzen + klarer CTA
- Relevante Einwaende im Mid-Page adressieren (FAQ / Risikoabbau)
- Trust vor finalem CTA
- Wiederholter CTA nach zentralen Sections
- Kontaktweg jederzeit auffindbar

## Mobile/Tablet/Desktop Standard
- Mobile first Layout
- Breakpoints fuer Tablet + Desktop mit lesbarer Zeilenlaenge
- Touch-freundliche Targets (Buttons/Links)
- Navigation mobil bedienbar (kein verschwundener Nav-Flow)
- Kein horizontales Scrollen

## Abnahme-Checkliste (Final)
- [ ] Pflichtinput verarbeitet oder mit sauberem Default ersetzt
- [ ] Copy kohärent, ohne Platzhalterfehler
- [ ] CTA-Flow eindeutig
- [ ] Responsive in allen Zielgeraeten stabil
- [ ] SEO-Basics gesetzt
- [ ] A11y-Basics gesetzt
- [ ] Performance-Basics eingehalten
- [ ] Legal/Kontakt vorhanden
- [ ] Ready-to-Ship dokumentiert
