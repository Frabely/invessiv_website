# Landingpage-Plan — Width-Rhythmus + Sektionen 2–5 Design-Differenzierung

> Ergänzt `plans/landing-plan-design.md` (Sektionen 6–10) und `plans/landing-plan.md` (Copy + Reihenfolge).
> Diese Datei spezifiziert (a) eine bewusste Width-Rhythmik mit zwei klar getrennten Layern + einem Anker-Bruch in der Vorderhälfte und (b) eine Achsen-Differenzierung für Sektionen 2–5, damit das Trio Problem/Solution/Audience nicht mehr dieselbe Sticky-L-Achse teilt.

---

## Kontext

Aktueller Stand auf `/de/landing` und `/en/landing`:

- Sektionen 2–5 (Problem, Solution, Inclusions, Audience) **füllen alle den Page-Frame** (max 1520px) und teilen weitgehend die Achse "2-spaltig sticky-l" (mit Ausnahme von Inclusions = 3-Area-Grid).
- Sektion 6 (Process) ist horizontale Schiene — Page-Frame.
- Sektionen 7–10 (Pricing, FAQ, Final-CTA, Form) verengen sich abrupt auf ~700–780px (`--card-max-width: 44rem`, `--faq-max-width: 48.75rem`, `--form-max-width: 44rem`), zentriert.

Wirkung: Die abrupte Verengung nach Sektion 6 liest sich nicht als Designentscheidung, sondern als "ab hier wurde anders gedacht". Zusätzlich liest sich das Sticky-L-Trio in der Vorderhälfte monoton — drei Sektionen hintereinander mit identischer Achse + ähnlichem Blob-Background lassen die Variation der Visual-Anker untergehen.

Lt. User-Klärung:

- **Width-Rhythmik**: "Funnel mit Anker-Brüchen" — Vorderhälfte breit, ein bewusster schmaler Anker-Bruch im Front-Half (Sektion 5 Audience), Hinterhälfte schmal Focus-Lane.
- **Final-CTA (Sektion 9) + Form (Sektion 10)**: bleiben **kombiniert in einer Komponente** (`final-cta-section`) und visuell Focus-Lane wie heute. Form-Rahmen darf etwas präsenter werden, **kein** Full-Bleed nötig.

Ziel des Plans: Width-Wechsel werden zum bewussten Designelement, das die Aufmerksamkeitsführung unterstützt (breit = explorativer Kontext, schmal = Selbsterkennung / Entscheidung), statt willkürlich mid-page zu kippen.

---

## Width-Strategie: zwei Layer + Anker-Bruch

Die Seite wird auf **genau zwei** horizontale Container reduziert. Jede Sektion bekennt sich zu einem von beiden — kein schleichendes Verengen.

### Layer A — Page-Frame (default)

```css
width: min(
  calc(100% - (var(--page-inline-gutter) * 2)),
  var(--max-content-width)
);
margin: 0 auto;
```

- **Effektive Breite**: ≤ 1520px
- **Charakter**: explorative / informierende Sektionen — Inhalt darf atmen, Achse variiert
- **Sektionen**: 1 Hero · 2 Problem · 3 Solution · 4 Inclusions · 6 Process

### Layer B — Focus-Lane

```css
/* Section bleibt im Page-Frame (für konsistenten Side-Gutter), Inhalt verengt sich */
width: min(
  calc(100% - (var(--page-inline-gutter) * 2)),
  var(--max-content-width)
);
margin: 0 auto;

/* Inhalt zentriert, neuer Token */
.content {
  width: min(100%, var(--focus-lane-max));
  margin-inline: auto;
}
```

- **Effektive Inhaltsbreite**: 44–50rem (≈ 700–800px)
- **Charakter**: Entscheidungs- oder Selbsterkennungsmomente — Aufmerksamkeit wird verengt
- **Sektionen**: 5 Audience (Anker-Bruch) · 7 Pricing · 8 FAQ · 9+10 Final-CTA/Form

### Neue Tokens (Vorschlag, eingeführt in `src/app/globals.css` unter `:root`)

```css
--focus-lane-max: 44rem; /* für Karten: Pricing, Final-CTA-Stage, Form */
--focus-lane-wide: 50rem; /* für Listen / Audience-Pills / FAQ */
```

Die neuen Tokens ersetzen die heute pro Sektion individuell definierten `--card-max-width: 44rem` / `--faq-max-width: 48.75rem` / `--form-max-width: 44rem` — dadurch bleiben künftige Width-Anpassungen an einer Stelle. Sektions-CSS referenziert die globalen Tokens.

> **Begründung im Plan, nicht im Code-Kommentar**: zwei Tokens statt einem, weil Karten (Pricing, Final-CTA, Form) bewusst etwas schmaler stehen sollen als Text-Listen (Audience-Pills, FAQ-Accordion), damit das Karten-Pattern als Visualgeste lesbar bleibt.

---

## Resultierender Rhythmus

| #     | Sektion        | Layer          | Achse                                                  | Width-Funktion                   |
| ----- | -------------- | -------------- | ------------------------------------------------------ | -------------------------------- |
| 1     | Hero           | Page-Frame     | 2-col (Text-l / Visual-r)                              | Eröffnung                        |
| 2     | Problem        | Page-Frame     | 2-col sticky-l                                         | Pain-Setup                       |
| 3     | Solution       | Page-Frame     | **editorial swapped** (Visual-l / Text-r, kein sticky) | Reframe                          |
| 4     | Inclusions     | Page-Frame     | 3-Area-Grid                                            | Inhalts-Inventar                 |
| **5** | **Audience**   | **Focus-Lane** | **einspaltig zentriert**                               | **Anker-Bruch: Selbsterkennung** |
| 6     | Process        | Page-Frame     | horizontale Schiene                                    | Wieder-Aufweitung "wie läuft es" |
| 7     | Pricing        | Focus-Lane     | einspaltig Showcase-Karte                              | Showcase                         |
| 8     | FAQ            | Focus-Lane     | einspaltig asymmetrisch                                | Einwandbehandlung                |
| 9+10  | Final-CTA/Form | Focus-Lane     | einspaltig zentriert                                   | Drama + Formular                 |

**Pattern lesen als**: `WIDE WIDE WIDE | NARROW | WIDE | NARROW NARROW NARROW`

Drei breite Setup-Sektionen → erster bewusster Verengungsmoment (Audience: "schau mal genau hin, ob du dich wiedererkennst") → eine Aufweitung (Process: "und so läuft es") → Funnel in die Entscheidung (Pricing → FAQ → CTA+Form). Die Audience-Verengung ist der **gepflanzte Keim**, der die spätere Verengung als designed liest.

Regel: **Nach Umsetzung darf an keiner Stelle ein Width-Wechsel als ungewollt erscheinen.** Jeder Wechsel zwischen Page-Frame und Focus-Lane ist begründbar als Aufmerksamkeits-Wechsel.

---

## Gemeinsame Design-DNA (unverändert ggü. landing-plan-design.md)

| Element           | Wert / Quelle                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Eyebrow Pill      | `src/components/shared/eyebrow-pill/`                                                               |
| Section-Padding Y | `clamp(4.5rem, 8vw, 7.5rem)`                                                                        |
| Reveal-Animation  | `useStaggeredSectionReveal` aus `src/hooks/marketing/use-staggered-section-reveal.ts`, 80ms Stagger |
| Farbpaar          | `--color-accent-warm` + `--color-cta`, Verlauf 135deg                                               |
| Tokens            | `src/app/globals.css` — keine neuen Farben/Radii ohne Token                                         |
| i18n              | `src/i18n/dictionaries/landing/<section>/{de,en}.json` + `index.ts`, beide Locales im selben Commit |

---

## Sektion 2 — Problem (Update: Width-Bekenntnis, Achse bleibt)

**Status**: heute bereits Page-Frame + 2-col sticky-l. Achse bleibt — das Sticky-L hier funktioniert, weil Problem die einzige Sticky-Sektion bleibt, nachdem Sektion 3 und 5 umgebaut werden.

**Achse**: 2-spaltig sticky-l (`grid-template-columns: minmax(0, 0.9fr) minmax(20rem, 1.1fr)`)

**Background**: rotierter Blob-Frame hinter linker Spalte (`section::before`, opacity 0.58, transform: rotate(-3deg)) — wie heute.

**Visual-Anker**: Issue-Panel rechts mit oranger Bullet-Dot-Liste + Reassurance-Summary unten — wie heute.

**Width-Bekenntnis**: Page-Frame. Title-Skala bleibt `clamp(2.1rem, 4.2vw, 4.45rem)`.

**Files**: keine strukturellen Änderungen

- `src/components/marketing/landing/problem-section/problem-section.tsx` — unverändert
- `src/components/marketing/landing/problem-section/problem-section.module.css` — unverändert

**Reuse**: EyebrowPill, `useStaggeredSectionReveal`, Tokens.

---

## Sektion 3 — Solution (Rework: Achse + Visual-Hierarchie)

**Brief**: Achse umkehren, damit Solution nicht mehr wie ein zweites Problem wirkt. Visual-Anker (Composite-Mockup) wird zum _Hero_ der Sektion, Text begleitet rechts.

**Achse**: editorial **swapped 2-col**, _ohne_ sticky.

```css
grid-template-columns: minmax(0, 1.4fr) minmax(16rem, 1fr);
align-items: center;
gap: clamp(1.75rem, 4vw, 4.75rem);
```

- **Links** (1.4fr): Composite-Mockup, deutlich vergrößert ggü. heute (Browser-Frame + Form-Card + Timeline-Strip), als visueller Held
- **Rechts** (1fr): Eyebrow + Titel + Body-Text, max-width 28rem, vertikal zentriert zur Mockup-Höhe (kein sticky — die Sektion soll nicht im Scroll "kleben")

> Inhaltlicher Kontrast zu Problem: Problem hat Text-l / Liste-r (lineares Lesen), Solution hat Visual-l / Text-r (Auge wird vom Mockup gefangen, dann erklärt Text). Auch der Reading-Pattern unterscheidet sich.

**Background**:

- Dual-Blob bleibt, aber **Position spiegeln** ggü. heute: statt top-right → **bottom-left** (heute ist top-right; das wandert zu Inclusions). So unterscheiden sich auch die Blob-Anker zwischen 3 und 4.
- Filter-Blur, opacity ~0.65

**Visual-Anker**: das vergrößerte Composite-Mockup. Behält das heutige `solution-graphic`-Subkomponenten-Pattern (`src/components/marketing/landing/solution-section/solution-graphic/`), wird nur größer skaliert (Mindesthöhe ~clamp(20rem, 32vw, 28rem)).

**Mobile (≤960px)**:

- 1-Spalte, **Mockup unter dem Text** (umgekehrte DOM-Order via `order: -1`/`order: 1` oder Grid-Areas), damit Text als erstes gelesen wird
- Mockup-Höhe schrumpft proportional

**Files**:

- `src/components/marketing/landing/solution-section/solution-section.tsx` — Grid-Order spiegeln (`solutionGraphic` zuerst rendern, intro danach)
- `src/components/marketing/landing/solution-section/solution-section.module.css` — `grid-template-columns` umkehren (1.4fr / 1fr), `position: sticky` entfernen, `align-items: center` setzen, Blob `inset` zu `auto auto -8% -8%` ändern
- `src/components/marketing/landing/solution-section/solution-graphic/solution-graphic.module.css` — Mindesthöhe leicht erhöhen, sonst unverändert
- Dictionary unverändert

**Reuse**: EyebrowPill, `useStaggeredSectionReveal`, vorhandene `solution-graphic` Subkomponente, Tokens.

**Test-Update**: bestehender Snapshot/Reveal-Test in `landing-page.test.tsx` muss möglicherweise an die neue DOM-Order angepasst werden — lokal verifizieren.

---

## Sektion 4 — Inclusions (Update: Blob umpositionieren, sonst keep)

**Brief**: bleibt das 3-Area-Grid — diese Achse ist bereits visuell distinkt von 2 und 3. Nur Background-Anker verschieben, damit nach der Solution-Spiegelung kein Blob doppelt liegt.

**Achse**: 3-Area-Grid (intro top-l + deliverables top-r + reassurance bottom-full) — wie heute.

**Background**: Dual-Blob **top-right** (übernimmt die Position, die Solution heute hat — Solution wandert zu bottom-left). So sind Background-Anker zwischen 3 und 4 visuell gespiegelt, was die Sequenz lebendig hält.

**Visual-Anker**: numerierte Gradient-Badges + Reassurance-Banner — wie heute.

**Files**:

- `src/components/marketing/landing/inclusions-section/inclusions-section.module.css` — `section::before` `inset` zu `6% -6% auto auto` ändern (top-right)
- TSX und Dictionary unverändert

**Reuse**: EyebrowPill, `useStaggeredSectionReveal`, Tokens.

---

## Sektion 5 — Audience (Rework: **Anker-Bruch zu Focus-Lane**)

**Brief**: erste bewusste Verengung der Seite. Das ist der "Spiegel-Moment": Besucher liest, ob er sich wiedererkennt. Achse, Background und Visual-Anker werden komplett überarbeitet.

**Achse**: **einspaltig zentriert** in Focus-Lane (`width: min(100%, var(--focus-lane-wide))` ≈ 50rem ≈ 800px).

```
┌────── Page-Frame (max 1520px) ──────┐
│                                     │
│       ┌─── Focus-Lane (50rem) ───┐  │
│       │  [Eyebrow]               │  │
│       │  Title (zentriert)       │  │
│       │  Body (zentriert)        │  │
│       │                          │  │
│       │  ┌──┐ ┌──┐ ┌──┐ ┌──┐    │  │
│       │  │  │ │  │ │  │ │  │    │  │
│       │  └──┘ └──┘ └──┘ └──┘    │  │
│       │  ┌──┐ ┌──┐ ┌──┐         │  │
│       │  │  │ │  │ │  │         │  │
│       │  └──┘ └──┘ └──┘         │  │
│       │                          │  │
│       │  Reassurance-Satz        │  │
│       └──────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Heading-Block**: zentriert (`text-align: center`, `justify-items: center`). Title-Skala etwas kleiner als die Wide-Sektionen — `clamp(1.85rem, 3.4vw, 3.4rem)` — passt zur engeren Lane und reimt sich auf die Pricing/Final-CTA-Title-Skala.

**Background**: `plain` mit subtilem Radial-Spotlight hinter dem Heading (analog Pricing, aber zarter — opacity ~0.35, blur 28px). **Kein Blob** — Blobs sind das Vokabular der Wide-Sektionen; die Focus-Lane bekommt ihr eigenes Background-Vokabular (Spotlight + Plain), das später bei Pricing und Final-CTA wieder aufgegriffen wird → schafft visuelles Reim-Pattern zwischen den Focus-Lane-Sektionen.

**Visual-Anker**: **Audience-Pills als wrapping flex** (statt der heutigen border-getrennten Reihen-Liste).

- Pro Audience-Typ eine pillenförmige Karte
- 7 Audience-Typen aus dem Dictionary: Handwerker, Coaches, Berater, Fotografen, lokale Dienstleister, kleine B2B-Anbieter, Agenturen mit Kampagnenbedarf
- Pille-Layout: Icon (links, 1.5rem, gradient-ring wie heutige `rowIcon`) + Label (mittlerer Schriftgrad, semi-bold)
- `display: flex; flex-wrap: wrap; gap: 0.75rem 0.85rem; justify-content: center;`
- Padding pro Pille: `0.75rem 1.15rem`, border-radius 999px, border 1px subtle, background subtle surface-2-tint
- Hover: scale(1.02) + border-color verstärken — minimal, kein Glow
- Reveal: Stagger pro Pille (80ms via Hook)

**Reassurance-Satz**: zentriert unter den Pills, max-width 50ch, muted, font-size body-md — der heute optionale Satz "Besonders sinnvoll ist eine Landingpage, wenn du bereits ein klares Angebot hast oder gerade ein neues Angebot testen möchtest" wird hier prominent platziert.

**Mobile (≤640px)**:

- Pills wrappen weiter, evtl. `gap: 0.5rem`
- Title-Skala: `clamp(1.85rem, 7vw, 2.6rem)`

**Files**:

- `src/components/marketing/landing/audience-section/audience-section.tsx` — komplette Neu-Struktur:
  - äußere `<section>` bleibt
  - innen: `.intro` (eyebrow + title + body, alle zentriert), `.pillList` (flex-wrap), `.reassurance` (optionaler Satz)
  - Icons werden weiterhin aus `audience-icon.tsx` referenziert
- `src/components/marketing/landing/audience-section/audience-section.module.css` — komplette Neu-Stylung:
  - `.section`: `display: grid; justify-items: center; text-align: center; gap: clamp(2rem, 4vw, 3rem);` plus `width: min(...)` Page-Frame
  - `.intro`: `width: min(100%, var(--focus-lane-wide))`, `display: grid; justify-items: center; gap: clamp(0.85rem, 1.6vw, 1.2rem)`
  - `.pillList`: `display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; max-width: var(--focus-lane-wide)`
  - `.pill`: pill-Stylung wie oben spezifiziert
  - `.reassurance`: muted, max-width 50ch, zentriert
  - `.spotlight::before` analog zur Pricing-Sektion (subtile Radial-Glow), opacity ~0.35
- `src/components/marketing/landing/audience-section/audience-icon.tsx` — bleibt, wird in Pills statt Rows verwendet
- `src/i18n/dictionaries/landing/audience/{de,en}.json` — Struktur bleibt (`items` als Array mit `label` und `scenario`); falls `scenario` (heutige zweizeilige Beschreibung) nicht in die Pille passt, wird sie für die Pille-Variante weggelassen oder als optional `tooltip-style title attribute` gesetzt. **Klären vor Umsetzung**: ob `scenario` ganz wegfällt oder als Hover-Tooltip bleibt — siehe Open Items.
- `src/i18n/dictionaries/landing/audience/index.ts` — TypeScript-Type ggf. anpassen, falls `scenario` optional wird

**Reuse**: EyebrowPill, `useStaggeredSectionReveal` (für Pill-Stagger), `audience-icon.tsx`, neue Token `--focus-lane-wide`.

**Test-Update**: `landing-page.test.tsx` ggf. anpassen — Audience hat heute eine Liste mit `role="list"` und `<li>`-Rows; nach Rework sind es Pills. Selektor-Anpassung.

---

## Sektion 6 — Process (Status: keep)

**Status**: bereits umgesetzt mit horizontaler Schiene, Page-Frame, klarer Achsen-Distinktion. Keine Änderung nötig.

**Width-Bekenntnis**: Page-Frame. Bestätigt im Rhythmus als wiederkehrendes "Wie läuft es" nach dem Audience-Bruch.

---

## Sektion 7 — Pricing (Update: Token-Migration)

**Status**: bereits Focus-Lane (44rem Karte) — Layout passt.

**Änderung**: lokales `--card-max-width: 44rem` durch globales `--focus-lane-max` ersetzen. Funktional identisch, sorgt aber dafür, dass künftige Width-Anpassungen zentral funktionieren.

**Files**:

- `src/components/marketing/landing/pricing-section/pricing-section.module.css` — `--card-max-width: 44rem;` entfernen, `width: min(100%, var(--focus-lane-max));` direkt verwenden

**Reuse**: bestehend, plus neuer Token aus globals.

---

## Sektion 8 — FAQ (Update: Token-Migration)

**Status**: bereits Focus-Lane (48.75rem ≈ 50rem). Layout passt.

**Änderung**: lokales `--faq-max-width: 48.75rem` durch globales `--focus-lane-wide: 50rem` ersetzen (minimaler Width-Shift von ~20px, akzeptabel).

**Files**:

- `src/components/marketing/landing/faq-section/faq-section.module.css` — `--faq-max-width: 48.75rem;` entfernen, alle Referenzen durch `var(--focus-lane-wide)` ersetzen

**Reuse**: bestehend.

---

## Sektion 9+10 — Final-CTA + Form (Update: Form-Rahmen präsenter, Token-Migration)

**Status**: kombinierte Komponente `final-cta-section/`, bereits Focus-Lane (44rem Karte). Achse passt.

**Änderungen**:

1. **Token-Migration**: `--form-max-width: 44rem` → `var(--focus-lane-max)`.
2. **Form-Rahmen präsenter** (User-Wunsch):
   - **Border-Thickness**: `--form-border-thickness` von `1.5px` → `2px`. Subtile, aber spürbare Verstärkung.
   - **Box-Shadow zweistufig erhöhen**:
     ```css
     box-shadow:
       0 36px 90px -50px color-mix(in srgb, var(--color-cta) 55%, transparent),
       0 16px 36px -22px
         color-mix(in srgb, var(--color-accent-warm) 42%, transparent);
     ```
     (heute: `0 30px 80px -50px ... 45%`, `0 12px 30px -20px ... 35%` — also Schatten +20% Spread, +10pp Opacity)
   - **Light-Theme-Pendant**: gleiche Logik in `:global([data-theme="light"]) .formCard` und `.successPanel`
   - **Spotlight-Glow**: leicht intensiver — opacity von `0.5` → `0.6`, `filter: blur(26px)` → `blur(30px)`. Macht den Karten-Anker minimal "leuchtender" ohne den Hero-Effekt zu kopieren.
3. **Title-Hierarchie unverändert** — die kombinierte CTA-Headline bleibt im Focus-Lane-Charakter, kein Full-Bleed.

**Files**:

- `src/components/marketing/landing/final-cta-section/final-cta-section.module.css` — Token-Migration, Border-Thickness, Box-Shadow, Spotlight (`.formCard`, `.successPanel`, `.spotlight`)

**Reuse**: bestehend.

**Klärung**: Der heutige Komponenten-Name `final-cta-section` bleibt — keine Umbenennung nötig, da Komponente bewusst kombiniert.

---

## Reihenfolge der Umsetzung (empfohlen)

Schrittweise, jede Stufe einzeln verifizierbar:

1. **Tokens etablieren** — `--focus-lane-max`, `--focus-lane-wide` in `src/app/globals.css` ergänzen. Keine sichtbare Änderung.
2. **Token-Migration in 7/8/9** — Pricing, FAQ, Final-CTA-Form auf neue Tokens umstellen. Visuell ~unverändert (FAQ leicht breiter, +20px). Verifiziert, dass Tokens funktionieren.
3. **Sektion 5 Audience Rework** — größter Brocken, kalibriert das Focus-Lane-Vokabular im Front-Half.
4. **Sektion 3 Solution Rework** — Achsen-Spiegelung, Sticky entfernen, Mockup-Skalierung. Mockup-Subkomponente wird wiederverwendet.
5. **Sektion 4 Inclusions Background-Spiegelung** — kleine CSS-Änderung am `::before`.
6. **Sektion 9+10 Form-Rahmen-Präsenz** — Border-/Shadow-Anpassung. Schnell.
7. **Cross-Section-Verifikation** — siehe Verifikation unten.

Sektion 2 (Problem) und Sektion 6 (Process) erhalten in diesem Plan keine Code-Änderungen.

---

## Verifikation

### Lokal im Browser (`npm run dev`)

- `/de/landing` und `/en/landing` jeweils komplett durchscrollen
- **Width-Rhythmus-Check**: Beim Scrollen darf an keiner Stelle ein Width-Wechsel "ungewollt" wirken. Konkret prüfen:
  - Übergang 4 → 5 (Inclusions Page-Frame → Audience Focus-Lane): erste Verengung, muss als bewusster Aufmerksamkeits-Wechsel lesbar sein
  - Übergang 5 → 6 (Audience Focus-Lane → Process Page-Frame): Wieder-Aufweitung
  - Übergang 6 → 7 (Process Page-Frame → Pricing Focus-Lane): finaler Funnel beginnt
- **Achsen-Variation prüfen**: Sektionen 2 und 3 dürfen nicht mehr identisch wirken. Sektion 2 = Text-l/Liste-r, Sektion 3 = Visual-l/Text-r.
- **Background-Anker-Variation**: Solution-Blob (jetzt bottom-l) und Inclusions-Blob (jetzt top-r) sind klar unterschiedlich verortet.
- **Audience-Pills**: alle 7 Items wrappen sauber, Hover-Skalierung funktioniert, keine Layout-Brüche bei langen Labels (besonders DE).
- **Form-Karte**: Border und Shadow spürbar präsenter als vorher, ohne wuchtig zu wirken.

### Mobile (≤ 640px)

- Audience-Pills behalten ihre Lesbarkeit (mind. 7 Items in 2–3 Zeilen)
- Solution: Mockup unter Text (DOM-Order korrekt invertiert)
- Form: Padding eng genug, Karte berührt die Page-Gutter nicht direkt

### Theme-Wechsel

- Light/Dark beide Themes durchklicken — neue Spotlight-Intensität bei Form-Karte muss in Light nicht überstrahlen
- Audience-Pills sichtbar in Light (border + background sichtbar genug)

### Reduced Motion

- `prefers-reduced-motion: reduce` testen: Pill-Stagger, Solution-Reveal, Form-Spotlight-Pulse (falls vorhanden) deaktiviert

### Pre-Merge Gates (verpflichtend laut CLAUDE.md)

- `npm run lint` grün
- `npm run build` grün
- `npm run typecheck` grün
- `npm run test` grün — `landing-page.test.tsx` ggf. an Audience-Pill-Struktur und Solution-DOM-Order anpassen

### i18n

- Dictionary-Typen kompilieren (besonders falls `audience.items[].scenario` optional wird)
- DE und EN beide manuell durchscrollen — kein Locale-Drift

---

## Open Items / vor Implementierung klären

1. **Audience `scenario`-Field**: Heute hat jeder Audience-Eintrag `label` + `scenario` (zweizeilige Beschreibung). In der Pill-Variante passt nur `label`. Drei Optionen — vor Sektion-5-Rework klären:
   - (a) `scenario` ganz aus dem Dictionary entfernen (klar, aber Inhaltsverlust)
   - (b) `scenario` bleibt als `title`-Attribut auf der Pill (Hover-Tooltip, Accessibility-Tradeoff)
   - (c) `scenario` wird zu einem zentral platzierten Beispielsatz unterhalb der Pills, der je nach gehoverter Pille wechselt (interaktiver, mehr Code)
   - **Empfehlung**: (a) — Pills bleiben rein klassifizierend, der Reassurance-Satz unten übernimmt die Erläuterungs-Funktion. Klären.

2. **Solution Mobile-Order**: Mockup unter Text auf Mobile — alternativ Mockup oben behalten (visuell zuerst, wie auf Desktop). Klären, ob Lesefluss oder visuelle Konsistenz priorisiert.

3. **Token-Doppelung vermeiden**: heute existieren `--card-max-width`, `--faq-max-width`, `--form-max-width` jeweils lokal. Werden sie nach Migration vollständig entfernt oder als Section-spezifische Aliase auf die globalen Tokens geführt? **Empfehlung**: vollständig entfernen, globale Tokens direkt referenzieren.

4. **Test-Aufwand `landing-page.test.tsx`**: Aktuell prüft der Test wahrscheinlich Sektions-Reihenfolge und ggf. einzelne Selektoren. Solution-DOM-Order und Audience-Listenstruktur ändern sich — Test muss vor Implementierung gelesen und Änderungen pro Sektion mitgeplant werden.

---

## Files-Übersicht (zentrale Änderungen)

| Pfad                                                                                | Änderung                                                                                   |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/app/globals.css`                                                               | Neue Tokens `--focus-lane-max`, `--focus-lane-wide`                                        |
| `src/components/marketing/landing/solution-section/solution-section.tsx`            | DOM-Order: Mockup vor Intro                                                                |
| `src/components/marketing/landing/solution-section/solution-section.module.css`     | Grid umkehren, `position: sticky` raus, `align-items: center`, Blob `inset` zu bottom-left |
| `src/components/marketing/landing/inclusions-section/inclusions-section.module.css` | Blob `inset` zu top-right                                                                  |
| `src/components/marketing/landing/audience-section/audience-section.tsx`            | Komplett neu: zentriertes Heading + Pills + Reassurance                                    |
| `src/components/marketing/landing/audience-section/audience-section.module.css`     | Komplett neu: Focus-Lane, Pills-Layout, Spotlight                                          |
| `src/components/marketing/landing/pricing-section/pricing-section.module.css`       | Token-Migration                                                                            |
| `src/components/marketing/landing/faq-section/faq-section.module.css`               | Token-Migration                                                                            |
| `src/components/marketing/landing/final-cta-section/final-cta-section.module.css`   | Token-Migration + Border 2px + intensiverer Box-Shadow + Spotlight-Boost                   |
| `src/i18n/dictionaries/landing/audience/{de,en}.json`                               | ggf. `scenario` entfernen (siehe Open Item 1)                                              |
| `src/i18n/dictionaries/landing/audience/index.ts`                                   | Type-Update falls `scenario` weg                                                           |
| `src/components/marketing/landing/landing-page/landing-page.test.tsx`               | Selektoren an neue Audience-Struktur + Solution-DOM-Order anpassen                         |

Keine Änderungen an: Hero, Header, Footer, Problem, Process, Solution-Graphic-Component (außer Mindesthöhe), Form-Backend.
