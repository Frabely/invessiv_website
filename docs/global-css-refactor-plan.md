# Global CSS Refactor Plan

## Ziel

`src/app/globals.css` wird auf echte globale Styles reduziert. Alle komponentenspezifischen Styles wandern in lokale `*.module.css` oder in statische Tailwind-Utilities direkt im JSX. Die Umsetzung erfolgt in sehr kleinen, prüfbaren Schritten, damit jeder Bereich einzeln visuell, funktional und responsiv abgenommen und committed werden kann.

## Best-Practice-Leitlinien

- Next.js empfiehlt globale Styles nur für wirklich globale CSS, Tailwind für häufige Styling-Fälle und CSS Modules für scoped CSS: https://nextjs.org/docs/app/getting-started/css
- Tailwind soll primär für Layout, Spacing, Typografie, einfache Zustände und Responsive-Regeln genutzt werden: https://tailwindcss.com/docs/adding-custom-styles
- Tailwind-Klassen müssen statisch im Source stehen; keine dynamisch zusammengesetzten Utility-Namen: https://tailwindcss.com/docs/detecting-classes-in-source-files
- `globals.css` darf nur noch enthalten: Tailwind-Import, Tokens, Theme-Variablen, Reset/Base, globale Accessibility-Utilities, globale Scroll-/Focus-Defaults
- Jede komplexe produktive Komponente bekommt ein lokales `*.module.css`
- Sehr einfache Komponenten dürfen Tailwind-only bleiben, wenn das sauberer ist als ein künstliches leeres Module
- Mobile first ist Pflicht. Jeder Schritt wird zuerst auf kleinen Viewports geprüft und erst danach auf Tablet/Desktop nachgeschärft
- Im selben Commit, in dem ein Bereich lokalisiert wird, müssen die zugehörigen Regeln aus `globals.css` entfernt werden

## Aktueller Stand

- `src/app/globals.css` hat aktuell 5.918 Zeilen
- Es gibt ca. 317 eindeutige Klassen-Selektoren
- Es gibt aktuell 89 statisch unbenutzte CSS-Kandidaten
- Mehrere Selektoren sind mehrfach definiert, unter anderem `:root`, `body`, `.hero`, `.site-footer`, `.process-*`
- Bereits modularisiert sind nur Teile von `legal`, `projects`, `proof` und `services`
- Header, Hero, Contact, Process, Footer, Q&A, Included und mehrere Shared-Primitives hängen noch direkt an globalen Klassen

## Fortschritt

- [x] Schritt 01: `AGENTS.md` haerten
- [x] Schritt 02: CSS-Audit dokumentieren
- [x] Schritt 03: Tailwind sauber als Basis aktivieren
- [x] Schritt 04: Globalen Vertrag in `globals.css` herstellen
- [x] Schritt 05: Shared `SectionScanPoints` lokalisieren
- [x] Schritt 06: Shared Button-System lokalisieren
- [x] Schritt 07: Shared Layout-Shell lokalisieren
- [x] Schritt 08: Header und Legal Language Switch migrieren
- [x] Schritt 09: Hero-Section migrieren
- [ ] Schritt 10: Hero Visual migrieren
- [ ] Schritt 11: Services Section Shell bereinigen
- [ ] Schritt 12: Service Card und Secondary Service bereinigen
- [ ] Schritt 13: Process Section migrieren
- [ ] Schritt 14: Contact Section Shell migrieren
- [ ] Schritt 15: Project Request Form Layout migrieren
- [ ] Schritt 16: Project Request Form Feldzustaende migrieren
- [ ] Schritt 17: Included, Q&A und Placeholder migrieren
- [ ] Schritt 18: Footer migrieren
- [ ] Schritt 19: Legal- und Projects-Reste bereinigen
- [ ] Schritt 20: Dead CSS loeschen
- [ ] Schritt 21: Dubletten konsolidieren
- [ ] Schritt 22: Finale Schlankheitsrunde fuer `globals.css`

## Regeln für jeden Schritt

- Genau ein thematisch klarer Commit pro Schritt
- Commit-Namensschema: `chore(css): <scope>`
- Automatisch prüfen: `npm run lint`, `npm run test`, `npm run build`
- Manuell prüfen: 360x800, 390x844, 768x1024, 1024x1366, 1440x900
- Immer Dark und Light prüfen
- Immer Keyboard-Fokus, Touch-Bedienung und `prefers-reduced-motion` mitdenken
- Kein Merge eines Schritts, wenn Mobile korrekt ist, Desktop aber regressiert oder umgekehrt
- Keine neuen globalen Komponentenklassen in `globals.css`

## Umsetzungsreihenfolge

### Schritt 01: `AGENTS.md` härten

- Ziel: Die Regeln so präzisieren, dass eine übergroße `globals.css` strukturell nicht wieder entstehen kann
- Dateien: `AGENTS.md`
- Inhalt:
- `src/app/globals.css` auf Tokens, Reset/Base, Theme-Variablen, globale Utilities und Tailwind-Basis beschränken
- neue produktive Komponenten standardmäßig auf lokale `*.module.css` oder Tailwind-only verpflichten
- migrationierte globale Regeln im selben Commit löschen
- Ausnahmen über `architecture-open-items.md` dokumentieren

### Schritt 02: CSS-Audit dokumentieren

- Ziel: belastbare Ausgangsbasis schaffen
- Dateien: diese Plan-Datei
- Inhalt:
- Liste der global gestylten Bereiche dokumentieren
- Liste der Dead-CSS-Kandidaten dokumentieren
- Liste der mehrfach definierten Selektoren dokumentieren

### Schritt 03: Tailwind sauber als Basis aktivieren

- Ziel: technische Grundlage legen, ohne schon große Bereiche umzubauen
- Dateien: `src/app/globals.css`
- Inhalt:
- `@import "tailwindcss";` einführen
- globale Basisblöcke logisch gruppieren
- noch keine Bereichs-Migration erzwingen

### Schritt 04: Globalen Vertrag in `globals.css` herstellen

- Ziel: `globals.css` in erlaubte globale Zonen aufteilen
- Dateien: `src/app/globals.css`
- Inhalt:
- nur Bereiche für `:root`, `[data-theme]`, `html`, `body`, `a`, globale Fokusregeln, `skip-link`, `sr-only`, Scroll-Offsets und wirklich globale Defaults behalten
- nicht-globale Bereiche markieren und schrittweise abbauen

### Schritt 05: Shared `SectionScanPoints` lokalisieren

- Ziel: erster Shared-Baustein ohne globale Klassenabhängigkeit
- Dateien:
- `src/components/marketing/home/shared/section-scan-points/*`
- betroffene Consumer in Hero, Proof, Projects, Process, Included, Q&A
- Inhalt:
- eigenes Module für `SectionScanPoints`
- Varianten und Container-Klassen lokal kapseln
- globale `section-scan-points*`-Regeln aus `globals.css` entfernen

### Schritt 06: Shared Button-System lokalisieren

- Ziel: `btn`, `btn--primary`, `btn--ghost`, `menu-cta`, `theme-switch` aus globalem CSS herausziehen
- Dateien:
- Shared-UI-Komponente für Buttons
- Header, Hero, Contact-Form, Projects, Process

### Schritt 07: Shared Layout-Shell lokalisieren

- Ziel: `layout-shell` und `content-section` nicht mehr global führen
- Dateien:
- Shared-Section-/Shell-Komponente
- Home Renderer, Placeholder-Section, Projects

### Schritt 08: Header und Legal Language Switch migrieren

- Ziel: kompletter Header inkl. Mobile Menu, Locale Switch, Scrolled State lokal
- Dateien:
- `src/components/marketing/site-header/*`
- `src/components/legal/legal-language-switch/*`

### Schritt 09: Hero-Section migrieren

- Ziel: Hero-Shell, Textblock, CTA-Row und Fallback-Tags lokal
- Dateien: `src/components/marketing/home/sections/hero-section/*`

### Schritt 10: Hero Visual migrieren

- Ziel: Aurora-, Glow-, Shot-, Shine- und Layer-Effekte lokal kapseln
- Dateien: `src/components/marketing/hero-visual/*`

### Schritt 11: Services Section Shell bereinigen

- Ziel: bestehende Hybrid-Struktur in einen konsistent lokalen Zustand bringen
- Dateien: `src/components/marketing/home/sections/services-section/*`

### Schritt 12: Service Card und Secondary Service bereinigen

- Ziel: keine Mischung aus lokalen und globalen Services-Klassen mehr
- Dateien:
- `service-card/*`
- `secondary-service/*`
- ggf. `service-card-icon.tsx`

### Schritt 13: Process Section migrieren

- Ziel: `process-*` vollständig lokal
- Dateien: `src/components/marketing/home/sections/process-section/*`

### Schritt 14: Contact Section Shell migrieren

- Ziel: Tabs, Panels, Channel-Cards und Channel-CTAs lokal
- Dateien: `src/components/marketing/home/sections/contact-section/*`

### Schritt 15: Project Request Form Layout migrieren

- Ziel: Stepper, Grid, Step-Container und Footer-Actions lokal
- Dateien: `src/components/marketing/home/sections/contact-section/project-request-form/*`

### Schritt 16: Project Request Form Feldzustände migrieren

- Ziel: Feldstates, Auswahlkarten, Validation, Screenreader-Helfer lokal
- Dateien: `src/components/marketing/home/sections/contact-section/project-request-form/*`

### Schritt 17: Included, Q&A und Placeholder migrieren

- Ziel: kleine Marketing-Sections vollständig aus `globals.css` lösen
- Dateien:
- `included-section/*`
- `q-and-a-section/*`
- `placeholder-section/*`

### Schritt 18: Footer migrieren

- Ziel: Footer komplett lokal kapseln
- Dateien: `src/components/marketing/home/sections/footer-section/*`

### Schritt 19: Legal- und Projects-Reste bereinigen

- Ziel: verbleibende Marketing-/Legal-/Projects-Überschneidungen entfernen
- Dateien:
- `src/components/legal/**`
- `src/components/marketing/projects/**`

### Schritt 20: Dead CSS löschen

- Ziel: alle ungenutzten Kandidaten und weitere nachgewiesene Altlasten entfernen
- Dateien:
- `src/app/globals.css`
- lokal betroffene Modules

### Schritt 21: Dubletten konsolidieren

- Ziel: doppelte Definitionen auf einen Ort reduzieren
- Dateien:
- `src/app/globals.css`
- lokal betroffene Modules

### Schritt 22: Finale Schlankheitsrunde für `globals.css`

- Ziel: Endzustand absichern
- Dateien: `src/app/globals.css`
- Inhalt:
- nur noch globale Tokens, Reset/Base, Theme-Variablen, globale Utilities und Tailwind-Basis behalten
- Datei logisch sortieren und mit kurzen Bereichskommentaren versehen

## Prüfroutine pro Schritt

- Automatisiert: `npm run lint`, `npm run test`, `npm run build`
- Manuell auf mindestens `/de`, `/en/projects`, `/de/terms` oder `/de/privacy`, je nachdem welcher Bereich betroffen ist
- Viewports: 360x800, 390x844, 768x1024, 1024x1366, 1440x900
- UX/A11y: sichtbare Fokus-Styles, Touch-Targets, keine abgeschnittenen Texte, keine horizontalen Scrollbars, Dark/Light konsistent, reduzierte Motion intakt
- Visuell: Spacing, Typografie, Card-Höhen, CTA-Hierarchie, Sticky/Fixed-Elemente, Footer/Header, Form-States

## Definition of Done

- `src/app/globals.css` enthält keine komponentenspezifischen Styles mehr
- jede komplexe produktive Komponente besitzt ein lokales `*.module.css`
- sehr einfache Komponenten dürfen Tailwind-only bleiben, aber nicht mehr an globalen Bereichsklassen hängen
- keine statisch unbenutzten Selektoren mehr
- keine absichtslosen CSS-Dubletten mehr
- Home, Projects und Legal funktionieren und sehen auf Mobile, Tablet und Desktop korrekt aus
- Dark/Light, Fokus-Zustände, Touch-Bedienung und Reduced-Motion sind pro betroffenem Bereich geprüft
