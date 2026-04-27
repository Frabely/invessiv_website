# Landingpage-Plan — Design-Variation-Update

> Ergänzt `landing-plan.md`. Der Hauptplan enthält Copy, Reihenfolge und Inhalte. Diese Datei definiert pro Sektion das **Design-Pattern** (Layout, Background, Visual-Anker), damit die Seite nach Umsetzung nicht aus 10× derselben Sektion besteht.

## Kontext

Die Landingpage besteht aus 9 Inhaltssektionen + Hero. Die ersten 5 sind umgesetzt — und folgen fast alle dem gleichen Skeleton: _Eyebrow + Titel + Body links (sticky), Inhalt rechts, weicher Blob-Glow im Hintergrund_. Wenn die restlichen 5 Sektionen (Ablauf, Angebot, FAQ, Abschluss-CTA, Formular) im selben Schema gebaut werden, wirkt die Seite monoton — ~10× dieselbe Sektion in leicht verschiedenen Inhaltskleidern.

Dieses Update definiert für jede Restsektion ein **eigenständiges Layout-Pattern** mit eigenem Hintergrund-Treatment und eigenem Visual-Anker, das aber dieselbe Design-DNA (Typo, Farbpaar, Animation) teilt — damit das Ganze trotz Variation aus einem Guss wirkt.

Ziel: nach Umsetzung sollen zwei aufeinanderfolgende Sektionen **niemals** dieselbe Achse + denselben Background haben. Jede Sektion soll einen erkennbaren visuellen Charakter haben.

---

## Gemeinsame Design-DNA (gilt für alle Sektionen)

Diese Bausteine bleiben sektionsübergreifend gleich, damit Kohärenz entsteht:

| Element             | Wert / Quelle                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Eyebrow Pill        | `src/components/shared/eyebrow-pill/`                                                                                     |
| Section-Titel-Skala | `clamp(2.05rem, 4vw, 4.25rem)` (Final-CTA + Pricing weichen bewusst ab)                                                   |
| Body-Skala          | `var(--font-size-body-lg)`, muted                                                                                         |
| Farbpaar            | `--color-accent-warm` + `--color-cta`, üblicher Verlauf 135deg                                                            |
| Reveal-Animation    | `useStaggeredSectionReveal` aus `src/hooks/marketing/use-staggered-section-reveal.ts`, 80ms Stagger                       |
| Section-Padding     | `clamp(4.5rem, 8vw, 7.5rem)` vertikal                                                                                     |
| Tokens              | alle aus `src/app/globals.css` (keine neuen Farben/Radii ohne Tokens)                                                     |
| i18n                | je Sektion eigene Dictionary unter `src/i18n/dictionaries/landing/<section>/{de,en}.json`, beide Locales im selben Commit |

---

## Variations-Achsen (was pro Sektion bewusst variiert wird)

1. **Layout-Achse**: einspaltig zentriert · zweispaltig sticky · Grid mit Areas · Full-Bleed-Bühne · horizontale Schiene · asymmetrisch
2. **Background-Treatment**: Blob-Glow · Gradient-Stage · Pattern-Textur · plain · Card-Frame als Hintergrund-Ersatz
3. **Visual-Anker**: SVG-Icon-Set · Mockup-Komposition · oversize Numerik · oversize Typografie · keiner

Regel: keine zwei aufeinanderfolgenden Sektionen mit derselben Achse + demselben Background.

---

## Bestand: Sektionen 1–5 (umgesetzt, in diesem Schritt unverändert)

| #   | Sektion    | Achse                         | Background                          | Visual-Anker                                    |
| --- | ---------- | ----------------------------- | ----------------------------------- | ----------------------------------------------- |
| 1   | Hero       | 2-spaltig (Text-l / Visual-r) | Vignette + Grid + Blobs             | animated Gradient-Title + drifting Blobs        |
| 2   | Problem    | 2-spaltig sticky-l            | rotierter Blob hinter linker Spalte | Issue-Panel rechts mit orangen Bullet-Dots      |
| 3   | Solution   | 2-spaltig sticky-l            | Dual-Blob top-right                 | Composite-Mockup (Browser + Form + Timeline)    |
| 4   | Inclusions | 3-Area-Grid                   | Dual-Blob bottom-left               | numerierte Gradient-Badges + Reassurance-Banner |
| 5   | Audience   | 2-spaltig sticky-l            | plain                               | Icon-Liste mit border-getrennten Reihen         |

**Beobachtung**: 2/3/5 teilen die _sticky-l_-Achse; akzeptabel, weil Sektion 4 (Grid) dazwischenliegt und die Visual-Anker stark variieren. Ab Sektion 6 muss aber konsequent variiert werden — sonst wird die Schwäche kumulativ sichtbar.

---

## Sektion 6 — Ablauf / Process

**Brief**: Glühende horizontale Schiene mit 4 Schritt-Lozenges. Bricht erstmals die Sticky-2-Spalten-Logik komplett auf.

**Achse**: Full-Bleed horizontal, 4 Schritt-Karten in einer Reihe (Desktop). Mobile (≤720px): vertikal mit Rail links und Karten rechts.

**Background**: plain Surface, **kein Blob**. Stattdessen ein durchgehender Gradient-Rail (warm → cool, 1px) als Verbindungslinie zwischen den Schritten. Rail wird beim Scrollen "eingezeichnet" (CSS: `mask-image` linearer Verlauf, dessen Position über `transform`/`width 0→100%` per Reveal-Hook gesteuert wird).

**Visual-Anker**:

- **oversize Schrittnumerale** `clamp(4rem, 8vw, 7rem)`, gradient-text-fill (warm → cool), als Hauptmotiv
- pro Schritt ein 24–32px Pictogram (Ziel / Struktur / Build / Launch) — zur Differenzierung von Inclusions, deren Numerale klein und in Pillen stecken
- Glow-Knoten (Radial-Gradient, Ø 14px) an der Rail markieren jeden Step

**Inhaltsrhythmus pro Schritt**: oversize Numeral → Step-Titel (1 Zeile, semi-bold) → Beschreibung (max 2 Zeilen, muted)

**Files**:

- `src/components/marketing/landing/process-section/process-section.tsx`
- `src/components/marketing/landing/process-section/process-section.module.css`
- `src/components/marketing/landing/process-section/process-rail.tsx` (CSS-basierte Linie, kein SVG nötig)
- `src/i18n/dictionaries/landing/process/{de,en}.json`

**Reuse**: EyebrowPill, `useStaggeredSectionReveal`, Color-Tokens.

---

## Sektion 7 — Angebot / Pricing

**Brief**: Eine zentrierte Showcase-Karte als visuelles Statement. Keine Side-by-Side-Achse — Bühne für genau ein Angebot.

**Achse**: einspaltig zentriert, max-width ~720px für die Karte. Eyebrow + Section-Titel **außerhalb** und über der Karte (kleiner als sonst, weil die Karte der Held ist).

**Background**: punktuelles Radial-Glow direkt hinter der Karte (warm + kühl überlagert, opacity ~0.5, blur 24px) — wirkt wie Bühnenlicht. Rest plain.

**Visual-Anker**: die Karte selbst.

- gradient-Border 1.5px (warm → cool 135deg)
- Header-Band oben mit subtle Gradient-Tint, darin "Starter"-Plakette
- 2-spaltige Inklusions-Checklist innerhalb der Karte
- Footer-Band horizontal split: links "Umsetzung 3–7 Tage" mit kleinem Clock-Pictogram, rechts "ab 799 €" als typografisches Statement (gradient-text-fill, größerer Schriftgrad)
- darunter unaufdringlicher Hinweissatz ("Andere Umfänge auf Anfrage.")

**Reveal**: Karte als Ganzes (kein item-stagger), damit der Showcase-Charakter gewahrt bleibt.

**Files**:

- `src/components/marketing/landing/pricing-section/pricing-section.tsx`
- `src/components/marketing/landing/pricing-section/pricing-section.module.css`
- `src/components/marketing/landing/pricing-section/pricing-card.tsx`
- `src/i18n/dictionaries/landing/pricing/{de,en}.json`

**Reuse**: EyebrowPill, Tokens, vorhandene Button-Komponente aus `src/components/shared/`.

---

## Sektion 8 — FAQ

**Brief**: Single-Column Accordion mit asymmetrischer Heading-Komposition. Kein Sticky-Side-Layout.

**Achse**: einspaltig, max-width 780px. Heading-Block bewusst asymmetrisch — Eyebrow links oben, Section-Titel rechts versetzt darunter (oder umgekehrt) — bricht das "alles links/zentriert"-Gefühl.

**Background**: plain mit feiner Dot-Grid-Pattern-Textur (24px Punktraster, opacity 0.04) — bewusst anders als Blobs der vorherigen Sektionen.

**Visual-Anker**:

- Accordion-Items mit gradient-Bottom-Border (1px, warm → cool, opacity .35)
- Plus-Symbol rechts, rotiert auf 45° beim Öffnen
- Frage `clamp(1.1rem, 2vw, 1.4rem)`, semi-bold
- Antwort muted, line-height 1.7
- die wichtigste Frage ("Wie schnell ist die Landingpage fertig?") darf default-open sein

**Interaktion**: native `<details>`/`<summary>` für Accessibility; CSS-Animation für Open/Close (`grid-template-rows: 0fr → 1fr` Trick für höhen-animierbare Container).

**Files**:

- `src/components/marketing/landing/faq-section/faq-section.tsx`
- `src/components/marketing/landing/faq-section/faq-section.module.css`
- `src/i18n/dictionaries/landing/faq/{de,en}.json`

**Reuse**: EyebrowPill, Reveal-Hook (für Items, nicht für die Heading-Komposition), Tokens.

---

## Sektion 9 — Abschluss-CTA

**Brief**: Full-Bleed Gradient-Bühne. Der dramatische Moment vor dem Formular. Komplett anders als jede andere Sektion auf der Seite.

**Achse**: Full-Bleed (Viewport-Rand zu Viewport-Rand, kein Section-Container-Padding-Limit), Inhalt zentriert.

**Background**:

- großflächiger weicher Radial-Gradient (warm 30% / cool 70% / center sehr weich), erstreckt sich über die gesamte Sektionsbreite
- langsam pulsierender Glow (`animation: pulse 6s ease-in-out infinite`, `transform: scale(1) → scale(1.04)` + Opacity-Shift), bei `prefers-reduced-motion` deaktiviert
- subtile Grain-Overlay (gleiche Noise-Texture wie auf Page-Ebene, hier stärker)

**Visual-Anker**:

- Headline ÜBERGROSS: `clamp(2.5rem, 6vw, 5.5rem)` — größer als alle anderen Section-Titel
- gradient-text-fill (warm → cool), statisch (kein Animation-Loop, weil Größe + Bühnenkontext schon prominent genug)
- darunter eine kurze Body-Zeile + ein einzelner primärer CTA-Button (größer als Standard)
- optional darüber 3 kleine Reassurance-Pillen ("Antwort innerhalb 48h" / "kostenlos" / "unverbindlich")
- **keine** Bullet-Lists, **keine** Cards

**Files**:

- `src/components/marketing/landing/final-cta-section/final-cta-section.tsx`
- `src/components/marketing/landing/final-cta-section/final-cta-section.module.css`
- `src/i18n/dictionaries/landing/final-cta/{de,en}.json`

**Reuse**: Hero-Title-Gradient-Tokens, vorhandener primary Button.

---

## Sektion 10 — Formular

**Brief**: Single-Column Focus-Card. Nach dem Bühnenstop in Sektion 9 ein bewusst ruhiger, fokussierter Moment. Visuelles Reim-Pattern zur Pricing-Karte (Sektion 7) — schließt die Seite gestalterisch.

**Achse**: einspaltig zentriert, max-width ~620px für die Karte.

**Background**: plain. **Kein Blob**, **kein Gradient** — Ruhe nach dem CTA-Drama.

**Visual-Anker**:

- Form-Karte mit dem **gleichen** gradient-Border-Pattern wie die Pricing-Karte (Sektion 7) → bewusster visueller Reim
- innen: Titel, kompakte Beschreibung, 4 Felder (Name, E-Mail, Website optional, Was möchtest du erreichen?), Submit-Button
- **unter** der Karte 3 horizontale Reassurance-Pillen ("Privat behandelt" / "Antwort innerhalb 48h" / "Unverbindlich")
- Erfolgs-State: Card-Inhalt wird durch Erfolgsmeldung mit Check-Icon ersetzt — Icon im selben Gradient-Circle-Pattern wie der Reassurance-Banner aus Inclusions (Sektion 4) → zweiter visueller Reim

**Backend**: `POST /api/public/contact` Pattern aus `src/server/contact/`. Nach CLAUDE.md ein dedizierter Command-Handler pro Kind nötig — also wahrscheinlich neuer Kind `LANDING_CHECK` mit eigenem Zod-Schema, Persistenz und Resend-Mail. Vor Implementierung der UI prüfen, ob ein bestehender Kind reicht (siehe Open Items).

**Files**:

- `src/components/marketing/landing/form-section/form-section.tsx`
- `src/components/marketing/landing/form-section/form-section.module.css`
- ggf. `src/server/contact/<new-kind>-handler.ts`
- ggf. neuer Kind in `src/common/constants/contact-kinds.ts`
- ggf. neue Drizzle-Schema-Erweiterung in `src/server/db/record-configuration/`
- `src/i18n/dictionaries/landing/form/{de,en}.json`

**Reuse**: bestehendes Contact-API-Skelett, `src/server/services/email-service`, Anti-Abuse + Rate-Limiter, Form-Field-Styles aus dem Hauptkontaktformular falls vorhanden.

---

## Resultierender Variations-Verlauf

| #      | Sektion       | Achse                       | Background                      | Visual-Anker                       |
| ------ | ------------- | --------------------------- | ------------------------------- | ---------------------------------- |
| 1      | Hero          | 2-spaltig                   | Vignette + Blobs                | animiertes Mockup                  |
| 2      | Problem       | 2-spaltig sticky-l          | rotierter Blob                  | Bullet-Issue-Panel                 |
| 3      | Solution      | 2-spaltig sticky-l          | Dual-Blob top-r                 | Composite-Mockup                   |
| 4      | Inclusions    | 3-Area-Grid                 | Dual-Blob bottom-l              | Numerierte Badge-Karten            |
| 5      | Audience      | 2-spaltig sticky-l          | plain                           | Icon-Liste                         |
| **6**  | **Process**   | **horizontale Schiene**     | **plain + Gradient-Rail**       | **oversize Numerale + Pictograms** |
| **7**  | **Pricing**   | **einspaltig zentriert**    | **Spotlight-Glow hinter Karte** | **Showcase-Karte**                 |
| **8**  | **FAQ**       | **einspaltig asymmetrisch** | **Dot-Grid-Pattern**            | **Accordion + Plus-Rotation**      |
| **9**  | **Final CTA** | **Full-Bleed**              | **pulsierender Gradient-Stage** | **oversize Headline**              |
| **10** | **Form**      | **einspaltig zentriert**    | **plain**                       | **Focus-Karte (reimt Pricing)**    |

Keine zwei aufeinanderfolgenden Restsektionen teilen Achse + Background. Pricing (7) und Form (10) reimen visuell, ohne identisch zu sein — das schließt die Seite gestalterisch.

---

## Reihenfolge der Umsetzung (empfohlen)

1. **Sektion 6 Ablauf** — größter Variations-Sprung, kalibriert das Design-Vokabular
2. **Sektion 7 Pricing** — etabliert das "zentrierte Karte"-Pattern, das Sektion 10 wieder aufgreift
3. **Sektion 9 Final CTA** — visuell auffällig, technisch unkompliziert
4. **Sektion 8 FAQ** — Accordion-Animation braucht Sorgfalt
5. **Sektion 10 Formular** — komplexester Backend-Flow zuletzt; greift bereits etabliertes Karten-Pattern auf

---

## Verifikation

- `npm run dev` und alle 10 Sektionen scrollen — bewusst prüfen: keine zwei direkt aufeinanderfolgenden Sektionen mit gleicher Achse + gleichem Background
- Mobile (≤640px) prüfen: jede Sektion behält ihre Identität auch im Stack (Process bricht zu vertikaler Rail um, Pricing-Karte bleibt zentral, Final-CTA-Headline bleibt dominant)
- `npm run lint` + `npm run build` grün (Pre-Merge-Gate aus CLAUDE.md)
- Beide Locales (de/en) auf jeder neuen Sektion durchklicken
- `prefers-reduced-motion: reduce` testen: Reveal-Stagger, Final-CTA-Pulse und Process-Rail-Draw sind deaktiviert
- Form-Submit Ende-zu-Ende: API-Roundtrip, E-Mail trifft ein, Erfolgsmeldung erscheint, Rate-Limiter greift bei Doppelversand

---

## Open Items / vor Implementierung klären

- **Sektion 10 Contact-Kind**: reicht ein bestehender Kind, oder muss `LANDING_CHECK` neu angelegt werden? CLAUDE.md fordert dedizierten Command-Handler pro Kind. Vor Sektion 10 prüfen.
- **Process-Rail Animation**: CSS-`mask-image` für Draw-On-Scroll funktioniert, ist aber nicht in jedem Browser scroll-getriggert ohne JS. Falls das visuelle Polish wichtig ist, evtl. kleine `IntersectionObserver`-basierte Klasse umschalten.
- **Final-CTA Pulse**: Performance-Check auf schwacher Hardware — `transform: scale` ist günstig, aber Filter-Blur in der Schleife kann zu Frame-Drops führen. Lieber Opacity + Scale als Blur animieren.
