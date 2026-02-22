# ROADMAP.md - invessiv Website Umsetzung

## Zielbild
Diese Roadmap endet nicht beim Mockup, sondern bei einer vollstaendig umgesetzten, produktionsreifen Website in Next.js + Tailwind.

Verbindlicher Rahmen:
- Finale Website statt reines Visual-Mockup
- Klare und wartbare Projektstruktur im Repository
- Umsetzung nach Next.js + Tailwind Best Practices
- Tests verpflichtend:
  - Logic-/Domain-Tests fuer relevante Geschaeftslogik
  - E2E-Tests fuer Kernablaeufe

## Priorisierungsprinzipien
- Kernjourney und Conversion-Pfade vor dekorativen Features
- Struktur, Lesbarkeit und Wartbarkeit vor kurzfristigen Design-Hacks
- Performance, Accessibility und Testbarkeit sind Pflicht

## Nordstern-Metriken
- Core Journey Completion: Nutzer kommt ohne Blocker von Hero zu Anfrage/Kontakt
- CTA Clarity: Primary CTA above the fold klar erkennbar
- Stability: keine regressionskritischen Fehler in Kernablaeufen
- Test Coverage der Kernlogik vorhanden + E2E fuer Hauptpfade gruen

---

## Phase 0 - Scope, Architektur, Struktur
Ziel: belastbare Grundlage vor Feature-Ausbau.

Must-have:
- Informationsarchitektur final (Hero -> Proof -> Leistungen -> Prozess -> Preise -> Kontakt)
- Projektstruktur sauber schneiden (keine ueberladenen Ordner)
- Rollen trennen: UI, Domain-Logik, Konfiguration, Telemetrie
- App Router Struktur sauber nutzen

Exit-Kriterien:
- Verzeichnisstruktur ist nachvollziehbar und konsistent
- Kernverantwortungen sind klar getrennt

---

## Phase 1 - Hero & Above-the-fold (Final)
Ziel: erster Screen ist visuell stark, klar und conversion-orientiert.

Must-have:
- Full-viewport Hero beim First Load
- Aurora-inspirierter Hero-Look mit klarer Text-/Visual-Balance
- CTA-Hierarchie (Primary/Secondary) sichtbar ohne Scroll
- Infinite Marquee als eigene Section nach der Hero

Exit-Kriterien:
- Hero ist in Mobile/Desktop ausgewogen
- Kein gequetschter Text, klare Lesespannung

---

## Phase 2 - Sections & Core Journey
Ziel: durchgaengige, klare Nutzerfuehrung.

Must-have:
- Navigation entspricht exakt den realen Sections
- Sektionen in konsistenter Reihenfolge und Rhythmik
- Footer als eigener Abschlussbereich mit Kontakt, rechtlichen Links und klaren Secondary-CTAs
- Login im Mockup-Kontext entfernt (vorerst out of scope)
- Alle Links/CTAs zeigen auf existierende Ziele

Exit-Kriterien:
- Keine toten CTAs/Anker
- Core Journey ohne Brueche testbar
- Footer-Inhalte sind vollstaendig, erreichbar und auf Mobile/Desktop konsistent nutzbar

---

## Phase 3 - Effektintegration (katalogbasiert)
Ziel: visuelle Differenzierung mit kontrollierter Komplexitaet.

Must-have:
- Effektauswahl aus `animation_mockups/effects-catalog.json`
- Jeder Effekt hat klaren UX-Zweck (Fokus, Orientierung, Feedback)
- Reduced-motion-Fallback fuer Motion-Effekte

Exit-Kriterien:
- Keine willkuerliche Effektmischung
- Lesbarkeit und Performance bleiben stabil

---

## Phase 4 - Next.js + Tailwind Best Practices
Ziel: produktionsnahe Implementierung ohne Architektur-Schulden.

Must-have:
- Server Components als Default, Client Components nur wenn noetig
- Konsistente Tokens/Designsystem statt ad-hoc Styling
- Metadata + SEO-Grundlagen je Route
- Keine Business-Logik in Presentational Components

Exit-Kriterien:
- Struktur und Komponenten folgen den vereinbarten Standards
- Keine offensichtlichen Best-Practice-Verstoesse

---

## Phase 5 - Tests (verbindlich)
Ziel: funktionale Sicherheit fuer Kernablaeufe.

Must-have:
- Logic-/Domain-Tests fuer neue oder geaenderte Kernlogik
- E2E-Tests fuer Kernablaeufe:
  - Navigation/Kernjourney
  - Formular-/Anfragepfad
  - CTA-Ziele und kritische Interaktionen
- Regressionen bei Kernpfaden verhindern

Exit-Kriterien:
- Relevante Unit/Integration-Tests gruen
- E2E-Kernsuite gruen

---

## Phase 6 - QA, A11y, Performance, Release
Ziel: release-faehige Website.

Must-have:
- A11y-Smoketests (Keyboard, Fokus, Kontrast)
- Responsive-Checks (Mobile/Tablet/Desktop)
- Performance-Checks (LCP/CLS/INP orientiert)
- Abschluss-Review inkl. Rollback-Hinweis

Exit-Kriterien:
- Website ist funktional, visuell und technisch release-faehig
- Kernziele sind in Tests und QA abgesichert

---

## Querschnittsthemen (alle Phasen)
- Accessibility: WCAG 2.2 AA als Mindeststandard
- Performance: Motion/Rendering budgets einhalten
- Wartbarkeit: klare Datei- und Ordnerstruktur, trennscharfe Module
- Testbarkeit: neue Logik ohne Tests gilt nicht als fertig
