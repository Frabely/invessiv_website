# AGENTS.md - Invessiv (GPT Codex Agents)

## Ziel

Dieses Repository wird mit Agenten-Workflows entwickelt, um:

- konsistente Qualität in UX, Code, Security und Compliance zu sichern
- Features in kleinen, überprüfbaren PRs auszuliefern
- Regressionen durch klare Tests und Release Gates zu vermeiden

## Grundprinzipien

## Branding & Variation (verbindlich)

- Logo ist Pflichtinput
- Farbgebung ist optional; ohne Vorgabe wird eine thematisch passende, kontraststarke Palette gesetzt
- Immer aktiv neue Ideen für individuelles Design mit Wiedererkennungswert einbringen und Default-Implementierungen vermeiden
- Gute neue Animations-/Interaktionsfunde immer in `animation_mockups/<effekt-name>/` als eigenes Einzel-Mockup ablegen (pro Effekt eigener Ordner mit eigener `index.html` und ggf. `styles.css`/`script.js`), statt mehrere Effekte in einer Sammeldatei zu mischen
- Bei neuen Mockup- oder Landing-Anfragen zuerst die bestehende Effektbibliothek in `animation_mockups/` und die Metadaten in `animation_mockups/effects-catalog.json` prüfen und aktiv in die Umsetzung einbeziehen
- Wenn ein vorhandener Effekt zum Ziel passt, diesen bevorzugt wiederverwenden oder als Basis adaptieren, bevor ein komplett neuer Effekt gebaut wird
- Design-Prioritätsregel (verbindlich): Sobald eine Anfrage visuelles UI, Animation oder eine Section-Umsetzung betrifft (z. B. "bau mir die contact section"), ist der erste Schritt immer der Check von `animation_mockups/` und `animation_mockups/effects-catalog.json` inkl. Use-Case-Fit; passende Effekte müssen aktiv vorgeschlagen und bei klarem Fit direkt in der Umsetzung verwendet werden
- Bei Frontend-Umbauten ist mindestens der Skill `frontend-design` verpflichtend zu nutzen; weitere passende Skills können zusätzlich kombiniert werden
- Agenten arbeiten bei Landingpages und Webseiten als Spezialisten für Conversion-orientierte, performante und visuell differenzierende Umsetzungen
- Ziel ist die vollständige, produktionsreife Website-Umsetzung; Mockups dienen nur als Zwischenartefakte und nicht als Endziel
- Große Tasks werden verpflichtend in kleine, klar abgegrenzte Teilaufgaben gesplittet, damit jede Änderung detailliert, prüfbar und mit hoher Qualität umgesetzt werden kann
- Die Website-Struktur im Projekt muss jederzeit klar, modular und wartbar sein (keine unstrukturierten Sammelordner)
- Next.js + Tailwind Best Practices sind bei Struktur-, Rendering- und UI-Entscheidungen verbindlich einzuhalten
- Architektur, Routing, Content-Layer und Komponenten werden von Anfang an so aufgebaut, dass Mehrsprachigkeit (mindestens DE/EN) ohne strukturellen Umbau erweiterbar bleibt
- SEO ist Pflichtstandard bei jeder Seite: saubere Informationsarchitektur, eindeutige Suchintention, semantische HTML-Struktur und crawlbare interne Verlinkung
- Indexierbarkeit ist Pflicht: korrekte `metadata`, Canonicals, `sitemap.ts`, `robots.ts`, kontrollierter Einsatz von `noindex` und keine blockierten Kernseiten
- Technische Sichtbarkeit ist Pflicht: Core Web Vitals (LCP/CLS/INP), stabile Performance auf Mobile und keine unnötigen Rendering-Blocker
- Structured Data ist Pflicht, wo sinnvoll (`Organization`, `Service`, `Product`, `FAQ`) zur besseren Google-Einordnung und Rich-Result-Fähigkeit
- Content-Qualität nach E-E-A-T-Prinzipien sicherstellen: klare Autorität, belastbare Aussagen, vertrauensbildende Nachweise und konsistente Fachsprache
- UTF-8 ist verpflichtend im gesamten Projekt; deutsche Zeichen (`ä`, `ö`, `ü`, `ß`) müssen in Content, UI und Datenverarbeitung korrekt unterstützt werden
- Deutsche Texte werden immer als echtes UTF-8 gepflegt; keine fehlerhaften Encodings oder Zeichenzerfall und keine Ersetzung durch ASCII-Umschreibungen (`ae`, `oe`, `ue`) in finalem UI-Text.
- Encoding-Artefakte (z. B. `�`, `Ã¤`, `f�r`) sind strikt zu vermeiden; bei Auftreten müssen sie vor Abschluss der Änderung vollständig bereinigt werden.
- Relevante Logik ist verpflichtend mit passenden Logic-/Domain-Tests abzusichern
- Kernabläufe sind verpflichtend durch E2E-Tests abzudecken
- Desktop-Header/Menu nutzt volle Breite; auf Mobile wird eine klare, performante und touch-optimierte Best-Practice-Navigation umgesetzt
- Animationen/Effekte, die nur auf Desktop sinnvoll oder stabil funktionieren, werden auf Mobile deaktiviert oder durch mobile-taugliche Alternativen ersetzt
- Das Gesamtlayout ist standardmäßig zentriert; ausgenommen sind Hero-Section sowie Header/Menu, die layoutseitig bewusst frei geführt werden dürfen
- Jede Section wird einzeln geplant und umgesetzt (inkl. Header/Menu und Footer); pro Section müssen passende Effekte zuerst in `animation_mockups/` und `animation_mockups/effects-catalog.json` geprüft und begründet ausgewählt werden

- Small PRs mit klarem Scope und nachvollziehbaren Commits
- Design zuerst (UX/IA), dann Implementierung
- Accessibility (WCAG 2.2 AA) und Performance (Core Web Vitals) sind Pflicht
- Dark- und Light-Mode sind Pflicht; beide Themes müssen visuell konsistent und voll nutzbar sein
- Theme-Architektur muss von Beginn an erweiterbar sein: Default ist `dark`; ein Theme-Switch ist aktuell nicht zwingend sichtbar, aber spätere Erweiterung auf `light` und weitere Themes muss ohne strukturellen Umbau möglich sein
- Bei CSS Custom Properties gilt: jede verwendete Variable muss vor Nutzung zentral (z. B. in `:root`) oder im jeweiligen Scope explizit definiert sein; keine "impliziten" Variablen nur in `var(...)`-Verwendungen
- Mehrsprachigkeit ist Pflichtfähigkeit: Inhalte und Navigation i18n-ready strukturieren (mindestens DE/EN vorbereiten)
- Mittel-/Hoch-Prioritätskriterium: Bei jeder Textänderung müssen alle verfügbaren Sprachen aktiv geprüft und betroffene Inhalte ggf. direkt mitübersetzt werden (kein Merge mit veralteten Sprachständen).
- Routen- und URL-Slugs werden standardmäßig in Englisch gehalten (z. B. `/terms`, `/privacy`, `/imprint`), auch wenn die sichtbaren UI-Texte auf Deutsch sind
- Security by default (least privilege, keine Secrets im Repo)
- Generierter Code (insbesondere Logik und Workflows) muss durch passende Tests abgedeckt sein (mindestens Unit, Integration oder E2E je nach Änderungsumfang)

## Service-Webseiten Best Practices (Research-basiert)

- Above the fold muss sofort klar sein: Angebot, Zielgruppe und ein primärer CTA
- Primäre Navigation schlank halten (max. 4-6 Hauptpunkte), klare Informationshierarchie
- Content scannbar schreiben: kurze Absätze, klare Überschriften, keine Textwände
- Vertrauen sichtbar machen: klare Kontaktoption, rechtliche Links, konsistente Sprache
- Primäre Journey priorisieren: Erstkontakt/Anfrage mit minimalen Schritten
- Mobile-first umsetzen, dann Tablet/Desktop verfeinern; keine überladenen Sektionen
- Interaktive Elemente mit klaren Zuständen und sichtbaren Fokus-Styles
- Performance und Lesbarkeit vor dekorativen Effekten priorisieren

## Definition of Ready (DoR)

Ein Ticket ist erst startklar, wenn:

- Zielgruppe, Problem und gewünschtes Ergebnis klar sind
- Akzeptanzkriterien testbar formuliert sind
- Nicht-Ziele explizit benannt sind
- Risiken/Abhängigkeiten dokumentiert sind

## Definition of Done (DoD)

Eine Änderung gilt erst als fertig, wenn:

- Akzeptanzkriterien erfüllt sind
- Unit/Integration/E2E (falls relevant) grün sind
- Security- und A11y-Auswirkungen geprüft wurden
- Monitoring/Logging für neue kritische Flows vorhanden ist
- Rollback-Pfad im PR beschrieben ist

---

## Rollen / Agenten

### 1) Product & UX Agent (`ux-lead`)

Aufgaben:

- Informationsarchitektur (Landing, Templates, Checkout, Legal)
- UX-Flows (Browse -> Details -> Buy -> Download -> Support)
- Copywriting (klar, technisch, vertrauenswürdig)
- Accessibility Checks (Kontrast, Fokus, Keyboard, Screenreader-Basics)

Outputs:

- User Stories
- Akzeptanzkriterien
- UI States (loading, empty, error, success)

DoD:

- End-to-end-Flow ist dokumentiert
- Edge Cases sind beschrieben (Payment fehlgeschlagen, Refund, Mail nicht angekommen, Link abgelaufen)

### 2) Frontend Agent (`fe-engineer`)

Aufgaben:

- UI-Implementierung (Next.js, Tailwind, Komponenten)
- Performante Animationen und Übergänge
- SEO (metadata, structured data)
- i18n-ready Architektur (externe Strings, locale routing vorbereitet)
- Responsive Umsetzung für Mobile, Tablet und Desktop inkl. sauberer Breakpoints und Layout-Checks

Qualitätskriterien:

- Lighthouse > 90 (mobile) für Performance/Best Practices/SEO
- Kein unnötiges JS, optimierte Bilder, sinnvolle Caching-Strategie
- Sichtbare Fokus-Styles in allen interaktiven Komponenten
- Visuelle und funktionale Konsistenz über Mobile/Tablet/Desktop in allen Core Flows

### 3) Backend Agent (`be-engineer`)

Aufgaben:

- Payments-Integration (Stripe Checkout + Webhook)
- Entitlements (wer darf welche Datei laden)
- Lizenzmodell (single purchase, bundle, subscription)
- Download-Security (signed URLs, rate limiting)

Qualitätskriterien:

- Webhook idempotent, retry-safe und observierbar
- Keine PII in Logs, strukturierte Events
- Fehlerpfade getestet (timeout, duplicate events, payment pending)

### 4) Security & Compliance Agent (`sec-legal`)

Aufgaben:

- Threat Modeling (Stripe, Auth, Downloads, Abuse)
- DSGVO-Check (Cookies, Tracking, Consent, Retention)
- Rechtstexte (Impressum, Datenschutz, AGB/Terms, Widerruf, Haftung)
- Dependency- und Secret-Scanning

Outputs:

- Security Checklist pro Release
- Minimaler Tracking-Plan (privacy-first)

### 5) QA Agent (`qa`)

Aufgaben:

- Testplan (Unit + Integration + E2E)
- Checkout-E2E (happy path + failure path)
- Regression Suite für Core Paths
- A11y-Smoke-Tests

Outputs:

- Playwright Specs
- Release Gates

---

## Standard-Workflows

### Workflow A - Feature Delivery

1. `ux-lead`: User Story, Akzeptanzkriterien, UI States
2. `fe-engineer`/`be-engineer`: technische Spezifikation
3. Implementierung in kleinen PRs
4. `qa`: Tests + E2E + Regression
5. `sec-legal`: Security/Compliance Review
6. Merge + Release Notes

### Workflow B - Bugfix

1. `qa`: Repro Steps + minimal failing test
2. Engineer: Fix + Test
3. `sec-legal`: Security-Relevanz prüfen
4. Merge

### Workflow C - Hotfix

1. Incident klassifizieren (Severity + Impact)
2. Minimal-invasive Korrektur + Smoke Test
3. Nachgelagerte Root-Cause-Analyse (RCA)
4. Follow-up Ticket zur nachhaltigen Behebung

---

## Branch-/PR-Konvention

- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`
- PR-Template enthält:
  - Was/Warum
  - Screenshots (bei UI)
  - Testplan
  - Risiko/Rollback
  - Security/Privacy Impact

## Repo Qualitäts-Gates

- Lint + Typecheck
- Generierter Code (Logik/Workflows) ist verpflichtend durch Unit-, Integration- oder E2E-Tests abgedeckt
- Playwright E2E (Checkout smoke)
- Dependency Audit
- Secret Scan (pre-commit + CI)

## Merge-Regeln

- Kein Direkt-Merge auf `main`
- Mindestens ein Review bei normalen PRs
- Zwei Reviews für Payment, Auth, Download-Security, Legal-Änderungen

## Prompt-Vorlagen

### Implement feature

- Scope:
- Akzeptanzkriterien:
- UI States:
- Data Model Änderungen:
- Testplan:
- Rollback:

### Security review

- Angriffsflächen:
- PII/DSGVO:
- Webhook/Payment Risiken:
- Rate limiting/abuse:
- Empfohlene Mitigations:

## Architektur- und Code-Standards (ergänzend)

- App Router Struktur mit Route-Gruppen verwenden (`(marketing)`, `(legal)`, später `(app)`), um Verantwortlichkeiten klar zu trennen
- Projektstruktur immer aktiv sauber halten: keine überfüllten Ordner, stattdessen fachlich aufteilen und konsistent benennen
- Sobald ein Ordner zu viele Dateien/Verantwortlichkeiten aufnimmt, in Submodule (z. B. pro Feature/Domain) refactoren
- Komponenten werden standardmäßig als eigener Ordner angelegt (kein einzelnes loses `.tsx` bei produktiven Komponenten)
- Pro Komponente im Ordner mindestens: `component-name.tsx`; bei eigenen Styles `component-name.css` (oder `.scss`), bei relevanter Logik `component-name.test.ts(x)`
- Die Hauptdatei der Komponente nutzt denselben Namen wie der Ordner (z. B. `hero-section/hero-section.tsx`)
- Breadcrumbs werden immer über eine zentrale, wiederverwendbare Komponente umgesetzt; Seiten bauen Breadcrumb-Markup nicht lokal in `page.tsx`/Layouts nach
- Styling für Komponenten wird nicht im `.tsx` gepflegt, sondern immer in separaten Style-Dateien (`.css` oder `.scss`)
- Logiknahe Tests gehören in die Nähe der Komponente/Logik und werden nicht in Sammeldateien fern der Implementierung versteckt
- Route-Dateien (`page.tsx`) orchestrieren nur: keine großen Render-Switches, keine umfangreiche lokale Daten-/Textlogik
- Section-Mapping und Render-Verzweigungen in dedizierte Renderer-Komponenten auslagern (z. B. `home-sections-renderer`)
- Locale- und UI-Textbausteine zentral in `src/content/**` pflegen; Komponenten konsumieren nur bereits aufbereitete Inhalte
- Wiederkehrende UI-Interaktionslogik (Scroll, Pointer, Observer, Motion) konsequent in Hooks kapseln (`src/hooks/**`)
- Keine Business-Logik in UI-Komponenten verstecken; Logik in klar benannte Funktionen/Module auslagern
- Strikte Typisierung nutzen: keine `any`-Workarounds ohne dokumentierten Grund
- Komplexe Logik (z. B. Pfad-, Scroll- oder Layout-Berechnungen) immer mit klaren Variablennamen aufbauen und bei nicht offensichtlichen Schritten mit kurzen, zielgerichteten Kommentaren dokumentieren
- Theme- und Sprachlogik zentralisieren (z. B. src/config, src/content, src/lib) statt in UI-Komponenten zu verteilen
- Feature-Flags für unfertige Flows nutzen, statt halbfertige Logik produktiv zu schalten
- Öffentliche und serverseitige Umgebungsvariablen strikt trennen (`NEXT_PUBLIC_*` nur für wirklich Öffentliche Werte)

## Performance- und Rendering-Standards (ergänzend)

- Server Components als Default, Client Components nur bei Interaktivität
- Bilder ausschließlich über `next/image` (mit klaren Größen und sinnvollen `alt`-Texten)
- Fonts zentral und sparsam laden; keine unnötigen externen Skripte im kritischen Pfad
- Jede neue Seite mit Mobile-Layout zuerst bauen und danach Tablet/Desktop erweitern
- Core Web Vitals pro Release kurz prüfen (LCP/CLS/INP) und Auffälligkeiten im PR dokumentieren

## Monitoring- und Betriebsstandards (ergänzend)

- Kritische User-Flows mit strukturierten Events versehen (z. B. CTA-Klick, Formular-Submit, Checkout-Start)
- Fehlerpfade observierbar halten (z. B. Sentry oder gleichwertig) bevor Payment/Auth live gehen
- Keine PII in Logs oder Analytics Events speichern
- Jede neue kritische Integration mit Fallback-Verhalten dokumentieren (z. B. Mail-Ausfall, Payment-Timeout)

## Content- und Produktpaket-Standards (ergänzend)

- Verkaufbare Pakete versionieren (`vX.Y.Z`) und mit Changelog ausliefern
- Auslieferungsartefakte unveränderlich speichern (pro Version ein eindeutiges Bundle)
- Claims in Landing-Copy nur mit belegbaren Quellen/Kennzahlen verwenden
- Mock-States immer sichtbar kennzeichnen (`Mock`, `Coming Soon`), kein irreführendes Verhalten

## Next.js + Tailwind Landing-Standards (verbindlich)

- Für jede Route eigene `metadata` definieren (Title, Description, Canonical, OpenGraph, ggf. Robots)
- Strukturierte Daten (JSON-LD) für `Organization` und passende `Service`/`Product`-Typen einplanen
- `sitemap.ts` und `robots.ts` im App Router bereitstellen, sobald mehr als 1 indexierbare Seite live geht
- Interaktive Landing-Elemente nur als Client Components; statische Sections als Server Components belassen
- Keine Inline-Styles für produktive Komponenten; Styling konsistent über Tailwind-Klassen und Design-Tokens
- Farb-, Spacing- und Radius-Tokens zentral in `globals.css`/Theme definieren, nicht ad hoc pro Komponente
- Komponentenvarianten (z. B. Button/Card/Badge) standardisieren, um visuelle Drift zwischen Seiten zu vermeiden
- Externe Skripte (Calendly, Tracking, Chat) nur lazy und nur auf benötigten Seiten laden

## Content- und SEO-Workflow (Landing-spezifisch)

- Copy nicht direkt in Komponenten pflegen; Inhalte über strukturierte Content-Dateien oder klaren Config-Layer verwalten
- Jede Landing erhält ein primäres Keyword-Cluster und eine klare Suchintention (informational/commercial)
- Genau eine H1 pro Seite; H2/H3 nur zur inhaltlichen Gliederung, nicht rein für visuelle Größen
- OG-Bilder pro Template/Offer vorsehen (Fallback erlaubt), um Shares konsistent zu halten
- Für Template-/Paketseiten klare Preis- und Leistungsangaben ohne versteckte Bedingungen darstellen

## QA- und Release-Gates (Landing-spezifisch)

- Vor Merge: `npm run lint` und `npm run build` verpflichtend grün
- A11y-Smoke mindestens für Startseite + primären Conversion-Flow (Keyboard, Fokus-Reihenfolge, Kontrast)
- PageSpeed/Lighthouse mobil dokumentieren; Abweichungen gegenüber Zielwerten im PR begründen
- Formulare müssen valide Fehlerzustände haben (required, Format, Submit-Fehler), auch im Mock-Status
- Jeder CTA-Link wird auf Ziel und Tracking-Event geprüft (kein toter CTA)

## Senior-Entwickler Vorgehen (verbindlich)

- Vor Implementierung erst Scope, Abhängigkeiten und Risiken kurz festziehen; dann in kleinen, reviewbaren Schritten liefern
- Erst Struktur, dann Features: Module/Ordner nach Verantwortung schneiden, keine Sammelordner mit zu vielen Dateien
- Pro Änderung klare Verantwortlichkeit: UI, Domain-Logik, Konfiguration und Telemetrie getrennt halten
- Bei neuer Logik oder Workflows früh passende Tests anlegen (Unit/Integration/E2E je nach Risiko)
- Refactoring kontinuierlich einplanen, sobald Komplexität oder Dateidichte ansteigt
- Monolithische Seiten (z. B. große `page.tsx`) frühzeitig in route-nahe Sections, wiederverwendbare Komponenten und dedizierte Hooks aufteilen
- Lange, unwartbare Dateien aktiv vermeiden: frühzeitig in kleine, klar abgegrenzte Dateien/Komponenten aufsplitten, bevor technische Schulden entstehen
- Animations-/Scroll-Logik nicht in Rendering-Dateien lassen, sondern in `hooks/` und `lib/` auslagern; Rendering-Dateien orchestrieren nur
- Pfad-/Layout-Berechnungen als testbare Domain-Funktionen modellieren und mit Unit-Tests gegen Regression absichern
- Section-Komponenten sollen klar typisierte Props nutzen (Content separat, Darstellung separat), damit i18n- und SEO-Layer stabil erweiterbar bleiben
- Neue interaktive Komponenten erhalten mindestens einen `jsdom`-Test für kritische User-Interaktionen (z. B. Click, Toggle, Locale-Wechsel)

## i18n / Dictionaries (verbindlich)

- Dictionaries liegen in `src/i18n/dictionaries/<locale>.json`
- Laden erfolgt serverseitig über `src/i18n/get-dictionary.ts` (`server-only`)
- High-Priority-Regel (verbindlich): Sämtliche sprachabhängigen UI-/Seitentexte liegen ausschließlich in Dictionaries; keine Inline-Texte in `page.tsx`, Layouts oder Komponenten
- High-Priority-Regel (verbindlich): Wenn Dictionary-Dateien pro Sprache zu groß werden, müssen sie in mehrere, fachlich geschnittene Dateien aufgeteilt werden (z. B. `legal`, `home`, `services`, `footer`) statt ein monolithisches Sprachfile weiter anwachsen zu lassen
- High-Priority-Regel (verbindlich): Neue Texte oder Textänderungen werden immer für alle unterstützten Sprachen parallel gepflegt; Merge mit veralteten Übersetzungsständen ist nicht erlaubt
- Key-Konvention:
  - Namespace pro Seite/Domain (z. B. `imprint`)
  - Unterteilung in `meta`, `page`, `sections`, `labels`, `values` konsistent halten
- Page-Dateien (`page.tsx`) enthalten keine locale-spezifischen String-Objekte oder Inline-Übersetzungen mehr
- Neue Sprache hinzufügen:
  1. Locale in `SUPPORTED_LOCALES` ergänzen (`src/config/i18n.ts`)
  2. Neues Dictionary `src/i18n/dictionaries/<locale>.json` mit identischen Keys anlegen
  3. Prüfen, dass `alternates.languages`, Language-Switch und Metadata automatisch korrekt aufgelöst werden
