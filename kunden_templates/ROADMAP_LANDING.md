# ROADMAP_LANDING.md
*Ziel:* Wiederholbarer Prozess, um für Kunden **moderne, individuelle Landing Pages** zu liefern, die sich sichtbar von Wix/WordPress-Templates abheben — mit **präziser Umsetzung** anhand einer **konkreten Input-Checkliste**.

---

## Grundprinzipien
- **Input-first:** Inhalte, Struktur und Proof leiten sich aus der Kunden-Checkliste ab (nicht aus einem vorgefertigten Template).
- **Design-Varianz:** Pro Projekt neue **Design-Tokens** (Farben/Typo/Shapes) + neue **Hero-Inszenierung**.
- **Story-driven Layout:** Reihenfolge der Sektionen folgt der Story (Problem → Lösung → Proof → CTA), angepasst an Zielgruppe & Einwände.
- **Qualität:** Mobile-first, barrierearm, performant, sauber implementiert.

---

## Phase 0 — System vorbereiten (einmalig)
**Ziel:** Fundament bauen, damit jedes Projekt schnell + hochwertig geliefert wird, ohne “Template-Vibes”.

**Aufgaben**
- Basis-Stack festlegen (z. B. Next.js/Astro + Tailwind, optional Motion).
- Komponenten-Bibliothek als Bausteine (Hero, Proof, Features, Steps, Pricing, FAQ, CTA, Footer).
- **Layout-Varianten pro Sektion** definieren (mind. 3 Varianten/Sektion).
- **Token-System** definieren (CSS variables / theme file):  
  Farben, Typo-Scale, Spacing-Scale, Radius, Shadow, Gradient-Regeln.
- Content-Schema definieren (JSON/YAML) für strukturierte Inputs.

**Ergebnis**
- Projekt-Starter + Komponenten + Variationssystem + Content-Schema.

---

## Phase 1 — Kunden-Input (Discovery mit Checkliste)
**Ziel:** Konkreter Input, der automatisch zu konkretem Output führt.

### Kunden-Checkliste (konkrete Fragen)
1) **Produkt & Ziel**
- Was ist das Angebot in 1 Satz?
- Primary Goal: Demo / Kauf / Lead / Call?
- Was ist “Done” (Metrik)?

2) **Zielgruppe & Kontext**
- Entscheider-Rolle(n), Branche(n), Unternehmensgröße(n)?
- Woher kommt Traffic (Ads/SEO/LinkedIn/Referral)?
- Welche 3 Einwände kommen immer?

3) **Positionierung**
- Warum ihr statt Alternative X?
- Top 3 Differenzierungsmerkmale (beweisbar)?
- Proof Assets: Zahlen, Cases, Logos, Testimonials?

4) **Conversion & Funnel**
- CTA-Mechanik: Kalender / Formular / Checkout?
- Erlaubte Formularfelder / Friktion?
- Preis sichtbar: ja/nein?

5) **Tonalität & Stil**
- Ton: sachlich / mutig / minimal / verspielt (3–5 Keywords)
- No-Go Wörter/Claims
- 3 Referenzen, die gefallen (nur Geschmack, nicht kopieren)

6) **Assets & Rechtliches**
- Brand Assets (Logo, Farben optional), Screenshots, Grafiken
- Impressum/Datenschutz Links (oder Platzhalter)

**Ergebnis**
- Vollständiger, strukturierter Input-Datensatz (JSON/YAML möglich).

---

## Phase 2 — Mini-Strategy Brief
**Ziel:** Klarheit, bevor Design/Code startet.

**Deliverables**
- Value Proposition (1–2 Sätze)
- Primary/Secondary CTA + Funnel-Logik
- Storyline (Sektionen + Zweck)
- Proof-Plan (welcher Beleg wo)
- Risiken/Annahmen (kurz & konkret)

**Ergebnis**
- “Go” auf Richtung, Story und CTA.

---

## Phase 3 — Art Direction (gegen Templates)
**Ziel:** Ein Look, der sich sichtbar unterscheidet.

**Vorgehen**
- 2–3 Art Directions (keine vollständigen Seiten, sondern Designrichtungen), z. B.:
    - Editorial Minimal (Typo-first, harte Raster, viel Weißraum)
    - Tech Premium (saubere Gradients/Blur, glatte Flächen)
    - Bold Product (kräftige Kontraste, mutige Shapes)
- Pro Direction:
    - Palette + Gradient-Regeln
    - Typo-Pairing + Scale
    - Shape-System (Radius, Dividers, Borders)
    - Hero-Visual-Konzept

**Ergebnis**
- Gewählte Art Direction als Leitplanke.

---

## Phase 4 — Copywriting aus Input
**Ziel:** Keine generische Copy: jede Sektion basiert auf konkreten Kundeninfos.

**Regeln**
- Jede Sektion referenziert mind. **1 Input-Fakt** (Einwand, Proof, Zielgruppe, Differenzierung).
- Claims nur mit Proof oder klarer Einschränkung.
- Headline-Varianten (5–10) aus Positionierung abgeleitet.

**Ergebnis**
- Finaler Text für alle Sektionen + CTA-Microcopy.

---

## Phase 5 — UI Design (Layout + Komponentenwahl)
**Ziel:** Modern, individuell, conversion-stark.

**Anti-Template Mechanik**
- Sektionen-Reihenfolge aus Storyline (nicht Standard-Rezept).
- Hero immer individuell (Layout/Typo/Visual/CTA-Placement).
- Pro Sektion gezielt Layout-Variante wählen (Grid/Split/Timeline/Accordion/etc.).
- Visuelle Signatur je Projekt (Dividers/Pattern/Typo-Rhythmus/Shapes).

**Ergebnis**
- Finales Design (Figma oder direkt in Code, je Prozess).

---

## Phase 6 — Umsetzung (Build)
**Ziel:** Pixelnah, performant, zugänglich.

**Must-haves**
- Tokens als CSS variables / theme config (pro Projekt neu).
- Komponenten modular, aber “skin-able” über Tokens & Layout-Props.
- Animationen subtil: hover + kleine reveal (leichtgewichtig).
- Accessibility: semantische Struktur, Fokuszustände, ARIA fürs FAQ.
- Performance: leichte Assets, keine unnötigen Libraries, Lighthouse-orientiert.

**Ergebnis**
- Implementierte Landing Page (staging-ready).

---

## Phase 7 — QA, Tracking, Launch
**Ziel:** Sauber live, messbar.

**QA**
- Mobile/Tablet/Desktop Breakpoints
- Cross-browser sanity check
- Copy final + Proof korrekt
- Accessibility (Keyboard, Kontrast, Fokus)
- Performance (Lighthouse)

**Tracking**
- Events: CTA click, form submit, scroll depth (optional)
- SEO: title/meta, OG tags, sitemap (falls nötig)

**Launch**
- Deployment (Vercel/Netlify/Server)
- Hand-off: Tokens, Content-Schema, Edit-Guide

---

## Definition of Done (DoD)
- Sektionen sind story-driven und **nachweislich** auf Checkliste gemappt.
- Design-Tokens (Farben/Typo/Shapes) sind projektspezifisch und nicht wiederholt.
- Hero wirkt einzigartig (Layout + Visual + Typo).
- Einwände sind explizit entkräftet (FAQ/Proof).
- Page ist responsive, performant, barrierearm.
- CTA und Tracking funktionieren.

---

## Optional: Lieferpakete
**MVP (schnell)**
- Hero + Features + Proof + CTA + Footer

**Standard**
- MVP + How-it-works + FAQ + Pricing/Offer block

**Growth**
- Standard + A/B Headline Varianten + mehrere Proof-Module + tieferes Tracking
