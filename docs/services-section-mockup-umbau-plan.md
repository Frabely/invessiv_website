# Services-Section Mockup-Umbauplan

## Kontext

Dieser Plan beschreibt den Umbau der Services-Section auf Basis des Mockups `new services.png`.

Ziel ist nicht ein kompletter Website-Relaunch, sondern eine vertriebsnahe Verbesserung gemäß `docs/invessiv_8_wochen_aktionsplan.md`:

- Landingpages und Webseiten-Upgrades als primäres Einstiegsangebot sichtbarer machen
- die Services-Section klarer auf qualifizierte Projektanfragen ausrichten
- Copy schärfen, ohne den Contact-Flow oder die Website-Architektur unnötig umzubauen
- den bestehenden Zustand über Git nachvollziehbar halten, statt eine dauerhafte Legacy-Komponente anzulegen

## Kritische Bewertung

Das Mockup passt grundsätzlich zum 8-Wochen-Aktionsplan, weil es den Einstieg stärker auf `Landingpages` und `Webseiten-Upgrade` lenkt. Das unterstützt das Ziel, Website-Arbeit nur dort zu investieren, wo sie Gespräche und Vertrauen direkt fördert.

Aus Conversion-Sicht ist die Richtung sinnvoll:

- Die dominante `Landingpages`-Karte macht das Hauptangebot schneller verständlich.
- `Webseiten-Upgrade` wird früh sichtbar und passt zur Woche-1-Priorität.
- `Webseiten` bleibt als sekundärer Relaunch-Pfad erhalten.
- `Prozess-Tools` wird sichtbar, aber nicht mehr als Hauptverkaufsanker behandelt.
- Die klare CTA-Hierarchie reduziert Entscheidungsaufwand.

Risiken, die bei der Umsetzung aktiv begrenzt werden müssen:

- Die Section darf nicht zu einem breiten Angebotskatalog werden.
- Neben-CTAs dürfen den primären CTA `Projekt anfragen` nicht schwächen.
- Auf Mobile muss der erste Scan schnell bleiben: Angebot, Nutzen, CTA.
- Die Copy muss konkreter werden und darf nicht bei generischen Claims wie "professioneller Auftritt" stehen bleiben.
- Eine Legacy-Kopie im Repo würde voraussichtlich schnell zu Ballast werden, weil die alte Section nach erfolgreichem Umbau nicht parallel gebraucht wird.

## Zielbild

Die neue Section soll als "passender Einstieg"-Block funktionieren:

- Besucher erkennen in wenigen Sekunden, welches Angebot zu ihrem Problem passt.
- `Landingpages` ist der klare Default für mehr Anfragen.
- `Webseiten-Upgrade` wird als schnelle Verbesserung für bestehende Seiten positioniert.
- `Webseiten` wird als größerer nächster Schritt beziehungsweise Relaunch eingeordnet.
- `Wartung & Support` und `Prozess-Tools` bleiben als nachgelagerte oder spezielle Pfade erhalten.

Die Section bleibt i18n-ready. Alle sichtbaren Texte werden in Deutsch und Englisch parallel gepflegt.

## Umsetzungsschritte

### 1. Ausgangszustand sichern

Vor dem aktiven Umbau wird kein `legacy/`-Ordner angelegt.

Stattdessen gilt:

- Der aktuelle Zustand der Services-Section bleibt über Git-Historie und den letzten sauberen Commit nachvollziehbar.
- Vor dem Umbau wird der Arbeitsbaum geprüft, damit keine fremden Änderungen vermischt werden.
- Bei Bedarf wird vor der Umsetzung ein kleiner Vorbereitungscommit erstellt, falls noch uncommittete Plan- oder Mockup-Dateien im Arbeitsbaum liegen.
- Ein Rollback erfolgt über Git, nicht über eine dauerhaft mitgeführte `LegacyServicesSection`.

Begründung:

- Die Services-Section soll ersetzt werden, nicht parallel betrieben werden.
- Eine Legacy-Kopie müsste mehrere Subkomponenten und CSS-Module duplizieren.
- Das erhöht Wartungsaufwand, Testoberfläche und Strukturballast ohne klaren Nutzen.

### 2. Neue aktive Services-Section bauen

Die aktive `ServicesSection` bleibt am bestehenden Importpfad, damit `home-sections-renderer.tsx` keine neue öffentliche Schnittstelle braucht.

Das Layout folgt dem Mockup:

- große `Landingpages`-Karte als dominanter Einstieg
- rechte Spalte: `Webseiten-Upgrade` oben, `Webseiten` darunter
- darunter zwei ruhigere Karten: `Wartung & Support` und `Prozess-Tools`
- Mobile-Reihenfolge: `Landingpages`, `Webseiten-Upgrade`, `Webseiten`, `Wartung & Support`, `Prozess-Tools`

Bestehende technische Verträge bleiben erhalten:

- `data-service-card="true"` für Reveal-Logik
- `data-card-key`
- `data-service-variant`
- Analytics-Attribute auf CTAs
- `invessiv:project-offer-change`
- bestehender Anchor `#services`
- bestehender Contact-Zielpfad `#contact`

### 3. Copy schärfen

Die Copy wird wie beim Hero-Umbau konsequent auf Lead-Generierung ausgerichtet.

Leitlinien:

- klare Nutzen statt Feature-Aufzählung
- konkrete Sprache statt generischer Marketingbegriffe
- Primary CTA bleibt `Projekt anfragen`
- Secondary CTA wird konkreter als `Mehr Infos`
- keine erfundenen Kennzahlen, Testimonials oder Leistungsversprechen

Vorgeschlagene DE-Richtung:

- Section-Titel: `Was brauchst du gerade?`
- Section-Intro: `Wähle den passenden Einstieg. Wir starten mit Landingpages und Webseiten-Upgrades.`
- Kontextnote: `Alle Projekte werden individuell kalkuliert. Vor Start erhältst du ein verbindliches Angebot in Textform.`
- Landingpages Highlight: `schnell live und auf Anfragen ausgerichtet`
- Webseiten-Upgrade Highlight: `bestehende Seite verbessern, ohne neu zu starten`
- Webseiten Highlight: `klarer Relaunch für mehr Vertrauen und bessere Anfragewege`
- Prozess-Tools Highlight: `Speziallösung für wiederkehrende interne Abläufe`

Vorgeschlagene EN-Richtung:

- Section title: `What do you need right now?`
- Section intro: `Choose the right entry point. We start with landing pages and website upgrades.`
- Context note: `Every project is scoped individually. You receive a binding written offer before work starts.`
- Landing pages highlight: `live quickly and focused on inquiries`
- Website upgrade highlight: `improve an existing site without starting over`
- Websites highlight: `clear relaunch for more trust and better inquiry paths`
- Process tools highlight: `special solution for recurring internal workflows`

### 4. Interaktion und Empfehlung

Die Ziel-Chips bleiben erhalten.

Empfehlungslogik:

- `mehr Anfragen gewinnen` -> `landing`
- `professionell online auftreten` -> `upgrade`
- `interne Abläufe vereinfachen` -> `process`

Begründung:

- `landing` passt zum stärksten Lead-Ziel.
- `upgrade` passt besser zur Woche-1-Priorität als ein kompletter Relaunch.
- `process` bleibt bewusst tertiär und wird nur bei passender Absicht hervorgehoben.

Die CTA-Sichtbarkeit wird so gelöst:

- `Landingpages` zeigt den primären Button direkt.
- Empfohlene Karte zeigt ebenfalls eine klare Anfrageaktion.
- Nicht empfohlene Nebenpfade erhalten ruhigere Text-CTAs.

### 5. Design- und Effektentscheidung

Das Mockup wird als visuelle Referenz genutzt, nicht als Pixelvorgabe.

Passende Effekte aus `animation_mockups/effects-catalog.json`:

- `gradient_border_grain` für die hervorgehobene Landingpages-Karte
- `cursor_spotlight_cards` nur dezent auf Desktop, falls die bestehende Spotlight-Logik weiterverwendet wird
- keine neue Animation für diesen Schritt

Performance- und Accessibility-Regeln:

- Motion nur transform/opacity oder CSS-Gradient, keine schweren Canvas-Effekte
- Reduced Motion respektieren
- Fokuszustände sichtbar halten
- Textkontrast in Dark und Light Mode prüfen
- keine horizontalen Überläufe auf Mobile

## Testplan

Pflichttests:

- `ServicesSection` rendert fünf Services in der neuen Priorität
- Default-Empfehlung ist `landing`
- Ziel-Chips ändern Empfehlung und `data-project-goal`
- CTA für `Landingpages` zeigt `data-project-offer="landing"`
- `Webseiten-Upgrade` wird vor `Webseiten` sichtbar
- `Prozess-Tools` bleibt tertiär, aber auswählbar
- DE/EN Copy bleibt parallel gepflegt

Bestehende Tests müssen angepasst werden:

- `src/components/marketing/home/sections/services-section/services-section.test.tsx`
- `src/components/marketing/home/sections/services-section/service-card/service-card.test.tsx`
- `src/components/marketing/home/sections/services-section/secondary-service/secondary-service.test.tsx`
- `e2e/services-localization.e2e.ts`

Wichtige E2E-Prüfungen:

- keine toten Anchor-Links
- kein horizontaler Overflow bei 390px, 768px und 1280px
- genau eine H1 bleibt erhalten
- Footer- und Legal-Links bleiben stabil
- Services-Section bleibt per Navigation erreichbar

Abschlussprüfungen:

```text
npm run lint
npx tsc --noEmit
npx vitest run src/components/marketing/home/sections/services-section
npx vitest run src/components/marketing/home/home-sections-renderer.test.tsx
npm run test:e2e -- services-localization
```

## Finaler Cleanup-Schritt

Der letzte festgelegte Schritt nach QA und visueller Freigabe:

- Prüfen, dass kein temporärer Umbau-Code, keine ungenutzten Klassen und keine veralteten Tests übrig sind.
- Prüfen, dass der Plan keine inzwischen falschen Legacy-Hinweise mehr enthält.
- Prüfen, ob `new services.png` weiterhin als Referenz gebraucht wird oder aus dem Arbeitsbaum entfernt beziehungsweise bewusst versioniert werden soll.

Erst nach diesem Cleanup gilt der Services-Umbau als vollständig abgeschlossen.

## Annahmen

- `new services.png` bleibt nur Referenz und wird nicht als Asset eingebunden.
- Es wird keine Legacy-Komponente angelegt.
- Es wird keine neue Route erstellt.
- Der Contact-Flow bleibt unverändert.
- Die Angebotsauswahl im Formular nutzt weiterhin die bestehenden Service Keys.
- Die Copy wird in `src/i18n/dictionaries/marketing/home.ts` und `home-ui.*.json` gepflegt.
- Header, Footer, Theme-System und globale Tokens bleiben unverändert.
