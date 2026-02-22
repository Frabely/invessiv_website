# ROADMAP.md - Invessiv Website Umsetzung

## Zielbild
Diese Roadmap endet bei einer vollstaendigen, produktionsreifen Website in Next.js + Tailwind.  
Umsetzung erfolgt nicht als grosser Block, sondern strikt sectionweise in kleinen, detailierten Schritten.

Verbindlicher Rahmen:
- Finale Website statt reines Visual-Mockup
- Klare, wartbare Projektstruktur im Repository
- Umsetzung nach Next.js + Tailwind Best Practices
- Tests verpflichtend:
  - Logic-/Domain-Tests fuer relevante Geschaeftslogik
  - E2E-Tests fuer Kernablaeufe
- Pro Section werden passende Effekte vor Umsetzung in `animation_mockups/` und `animation_mockups/effects-catalog.json` geprueft

## Arbeitsprinzip (verbindlich)
- Grosse Aufgaben immer in kleine, reviewbare Teilpakete splitten
- Jede Section einzeln planen, umsetzen, testen und abnehmen
- Keine neue Section starten, bevor die vorherige Section visuell, funktional und technisch stabil ist
- Effekte nur mit klarem UX-Zweck und mit Mobile-/Reduced-Motion-Strategie einsetzen

## Nordstern-Metriken
- Core Journey Completion: Nutzer kommt ohne Blocker von Hero zu Anfrage/Kontakt
- CTA Clarity: Primary CTA above the fold klar erkennbar
- Stability: keine regressionskritischen Fehler in Kernablaeufen
- Test Coverage der Kernlogik vorhanden + E2E fuer Hauptpfade gruen

---

## Phase 0 - Scope, Architektur, Struktur
Ziel: belastbare Grundlage vor Feature-Ausbau.

Must-have:
- Informationsarchitektur final (Hero -> Proof -> Leistungen -> Prozess -> Preise -> Kontakt -> Footer)
- Projektstruktur sauber schneiden (keine ueberladenen Ordner)
- Rollen trennen: UI, Domain-Logik, Konfiguration, Telemetrie
- App Router Struktur sauber nutzen

Exit-Kriterien:
- Verzeichnisstruktur ist nachvollziehbar und konsistent
- Kernverantwortungen sind klar getrennt

---

## Phase 1 - Hero (einzeln)
Ziel: erster Screen ist visuell stark, klar und conversion-orientiert.

Must-have:
- Full-viewport Hero beim First Load
- Aurora-inspirierter Hero-Look mit klarer Text-/Visual-Balance
- CTA-Hierarchie (Primary/Secondary) sichtbar ohne Scroll
- Hero-Visual interaktiv und performant (Desktop), mobile-tauglicher Fallback

Effekt-Check:
- `aurora_gradient_hero`
- `floating_glass_ui`
- ggf. `magnetic_cta` (nur Desktop)

Exit-Kriterien:
- Hero ist in Mobile/Desktop ausgewogen
- Kein gequetschter Text, klare Lesespannung

---

## Phase 1b - Header/Menu (einzeln)
Ziel: klare Navigation mit voller Desktop-Breite und sauberem Mobile-Menue.

Must-have:
- Header/Menu als eigene Section umsetzen und nicht nebenbei in anderen Phasen mischen
- Smart Sticky Verhalten als Best-Practice:
  - Startzustand: Header transparent bzw. sehr leicht, damit der Hero sauber wirkt
  - Beim Scrollen: Header wird kompakter und bekommt Blur/Background + klare Trennung (Border/Shadow)
- Desktop: volle Breite, klare Informationshierarchie im Sticky- und Initialzustand
- Mobile: kompaktes sticky Menue mit klarem CTA (touch-optimiert, fokus- und keyboard-stabil)
- Navigation verlinkt exakt auf bestehende Sections

Effekt-Check:
- In der Regel nur dezente Effekte; Fokus auf Klarheit und schnelle Orientierung
- Optional `shimmer_hover` fuer einzelne CTA-Elemente, falls UX-Mehrwert vorhanden

Exit-Kriterien:
- Keine toten Navigation-Links
- Mobile/Desktop Navigation ist konsistent und robust nutzbar
- Smart Sticky Uebergaenge wirken ruhig und stoeren den Hero-Eindruck nicht

---

## Phase 2 - Marquee Strip (einzeln)
Ziel: Social-Proof/Capability-Strip direkt nach der Hero.

Must-have:
- Infinite-Marquee als eigene Section nach der Hero
- Inhalte sind scannbar, nicht visuell ueberladen
- Pause/Reduktion bei Reduced Motion

Effekt-Check:
- `infinite_logo_marquee`

Exit-Kriterien:
- Marquee laeuft stabil und stoert Lesefluss nicht
- Mobile-Darstellung bleibt klar und performant

---

## Phase 3 - Proof Section (einzeln)
Ziel: Vertrauen und messbare Wirkung sichtbar machen.

Must-have:
- KPI-/Proof-Inhalte mit klarer Hierarchie
- Visuelles Kartenlayout analog Mockup-Rhythmus
- CTA-Anschluss zur Services/Contact-Journey

Effekt-Check:
- `scroll_reveal_stagger`
- `gradient_border_grain`
- `shimmer_hover`

Exit-Kriterien:
- Proof ist inhaltlich klar und sofort verstehbar
- Keine toten Links, keine rein dekorativen KPI-Elemente ohne Kontext

---

## Phase 4 - Services Section (einzeln)
Ziel: Angebot klar und differenziert darstellen.

Must-have:
- Bento-artige Kartenstruktur wie im Mockup
- Jede Service-Karte mit klarem Nutzen und CTA-Logik
- Desktop/Mobile konsistente Lesbarkeit

Effekt-Check:
- `cursor_spotlight_cards` (Desktop only)
- `tilt_glass_shine` oder `tilt_cards_3d` (nur falls UX sinnvoll)
- `scroll_reveal_stagger`

Exit-Kriterien:
- Services sind klar vergleichbar
- Keine Motion-Overload-Effekte

---

## Phase 5 - Process Section (einzeln)
Ziel: nachvollziehbarer Delivery-Track ohne Reibung.

Must-have:
- Timeline/Story-Aufbau wie im Mockup
- Klarer Fortschrittsfluss von Input bis Go-live
- Sticky/Scroll-Verhalten ohne Accessibility-Brueche

Effekt-Check:
- `scroll_depth_reveal`
- `svg_path_journey`
- optional `scroll_snap_story_panels` falls UX-Mehrwert gegeben

Exit-Kriterien:
- Prozess ist ohne Animation vollstaendig verstehbar
- Scroll-Verhalten bleibt auf Mobile robust

---

## Phase 6 - Pricing Section (einzeln)
Ziel: transparente Pakete mit klarer Entscheidungsgrundlage.

Must-have:
- Pakete klar unterscheidbar (Scope, Preisrahmen, CTA)
- Fokus auf Conversion ohne Dark Patterns
- Vergleichbarkeit in Desktop und Mobile

Effekt-Check:
- `gradient_border_grain`
- `shimmer_hover`
- optional `toggle_morph_microinteraction` fuer Paketumschalter

Exit-Kriterien:
- Preis-/Leistungsdarstellung ohne Unklarheiten
- CTA-Pfade eindeutig

---

## Phase 7 - Contact Section (einzeln)
Ziel: minimaler, klarer Anfrageflow.

Must-have:
- Kontaktbereich mit klaren Kanaelen/Handlungspfad
- Form-/CTA-Validierung inkl. Fehlerzustaenden
- Kein Login im Mockup-Kontext

Effekt-Check:
- `scroll_reveal_stagger`
- `mobile_bottom_sheet_snap` (nur Mobile, falls Kontakt-CTA davon profitiert)

Exit-Kriterien:
- Anfragepfad ohne Bruch testbar
- Alle Kontakt-CTAs fuehren auf gueltige Ziele

---

## Phase 8 - Footer & Legal (einzeln)
Ziel: sauberer Abschluss mit Navigation, Kontakt, Recht.

Must-have:
- Footer mit Kontakt, Secondary-CTAs, legalen Links
- Impressum/Datenschutz erreichbar und korrekt verlinkt
- Konsistentes Layout in Mobile/Desktop

Effekt-Check:
- In der Regel keine starken Motion-Effekte; Fokus auf Klarheit
- Optional dezentes `shimmer_hover` fuer linknahe UI, falls passend

Exit-Kriterien:
- Keine toten Links
- Footer-Inhalte vollstaendig und zugreifbar

---

## Phase 9 - Best Practices Hardening
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

## Phase 10 - Tests (verbindlich)
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

## Phase 11 - QA, A11y, Performance, Release
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
- Effektgovernance: pro Section dokumentieren, welche Effekte aus dem Katalog geprueft, gewaehlt oder verworfen wurden
