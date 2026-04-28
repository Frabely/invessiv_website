# Landingpage-Plan — Design-Refit „Editorial Dossier"

> Ersetzt die vorherige Width-Rhythmik-Variante. Bezugsdokumente bleiben `plans/landing-plan.md` (Reihenfolge + Inhalte) und `plans/landing-plan-design.md` (bestehende Sektions-Patterns 6–10).
> Diese Datei spezifiziert den **gestalterischen Mut** der Seite: ein einziges, durchgezogenes Designkonzept, das die Seite aus dem generischen Agentur-Landingpage-Look herauslöst, ohne die Konversions­pfade zu verwässern.

---

## Kontext & Problem

Aktueller Stand auf `/de/landing` und `/en/landing`:

- Visuell „solides SaaS"-Vokabular: Eyebrow-Pills, weiche Blob-Glows, Gradient-Akzente warm + cool, Karten mit Gradient-Border, oversize Numerale.
- Sektionsidentität entsteht heute über Achsen-Variation (sticky-l / Grid / horizontale Schiene / Karte).
- Die Seite ist sauber gebaut — aber sie könnte _von zehn anderen Agenturen_ stammen. Sie sagt nicht laut genug, dass dahinter **ein Mensch mit Handschrift** steht.

**Was die `invessiv-landing`-Skill verlangt:** „klingt wie ein ruhiger, kompetenter Selbstständiger — nicht wie eine Agentur, nicht wie ein Marketing-Funnel, nicht wie ein Tech-Startup."

Der heutige Look kollidiert nicht aktiv mit der Tonalität — aber er stützt sie auch nicht. Bunte Blobs + Gradient-Borders sind _Funnel-Vokabular_. Wenn die Copy „kostenlosen Landingpage-Check anfragen" sagt, der Visual-Treatment aber auf „High-Performance-Datengetrieben" hindeutet, entsteht ein Glaubwürdigkeits-Bruch.

**Ziel dieses Plans:** Ein einziges, durchgehaltenes Designkonzept, das **die Tonalität visuell unterstreicht**: editorial, typografie-getrieben, ein einzelner Akzent statt Doppelgradient, Wireframe statt Glanz-Mockup, Quittung statt Showcase-Karte. Kein Effekt um des Effekts willen — jede Wahl muss begründbar zur Konversion beitragen.

---

## Leitkonzept: „Editorial Dossier"

Die Seite liest sich wie ein **typeset Pitch-Dokument**, das ein Handwerker einem Kunden auf den Tisch legt. Nicht wie eine SaaS-Marketing-Site.

Drei Konsequenzen:

1. **Typografie ist das primäre Designelement.** Hierarchie entsteht durch Größen-Sprünge und Weißraum, nicht durch Farben oder Cards.
2. **Ein Akzent, kein Duo.** `--color-accent-warm` bleibt _das_ Akzentpaar­zeichen der Seite. `--color-cta` bleibt nur dort, wo er die Konversion tragen muss (CTA-Buttons, Form-Submit, FAQ-Open-State). Gradient-Verläufe warm→cool werden auf Hero und Pricing-„Quittung" reduziert; alle anderen Stellen verwenden den warmen Akzent als Solofarbe.
3. **Numerische Narrative.** Jede Inhaltssektion bekommt ein editorial-getypetes Sektions-Label (`01 / 09`, `02 / 09`, …). Der Besucher liest die Seite wie ein Inhaltsverzeichnis, das er ohnehin gleich abscrollt — und sieht: das ist überschaubar, nicht endlos.

Diese drei Bewegungen sind **out-of-the-box im Vergleich zu generischen Agentur-Landingpages**, aber sie sind **konservativ in puncto Konversion**: sie reduzieren Reibung, statt sie hinzuzufügen.

---

## Design-DNA — geänderte Werte

| Element               | Alt                                           | Neu                                                                                                                                              |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sektions-Marker       | EyebrowPill mit dezentem Akzent-Hintergrund   | **Editorial Section Marker**: `01 / 09 — PROBLEM`, monospace-getypet (`var(--font-mono)`), nur Border-Bottom-Linie unter der Zahl                |
| Akzentfarbe-Strategie | Doppelverlauf warm→cool 135deg überall        | **Solo-Warm** auf Body-Akzenten, **Duo-Verlauf** nur im Hero-Title und Pricing-Preis                                                             |
| Background-Vokabular  | weiche Blob-Glows pro Sektion                 | **Plain Surface** + sehr feine, subtile Linien (Hairlines, 1px, opacity ~0.07) als Sektionstrenner; Blobs nur im Hero                            |
| Visual-Anker Solution | Composite-Mockup (Browser + Form + Timeline)  | **Wireframe-SVG einer Landingpage** — meta-bewusst, „die Seite über Landingpages zeigt, wie eine Landingpage aussieht"                           |
| Visual-Anker Process  | numerierte Schiene mit Pictograms             | **Tagebuch-Timeline**: „Tag 1 / Tag 2–3 / Tag 4–5 / Tag 6–7" — was an jedem Tag passiert                                                         |
| Pricing-Karte         | Showcase-Card mit Gradient-Border + Spotlight | **Quittungs-/Angebots-Layout**: monospace-Numerale, Linien-getrennte Positionen, „Gesamt"-Zeile unten, fühlt sich an wie ein PDF                 |
| Hero-Sub-CTA          | „Ablauf ansehen" Button                       | **Ein-Feld-Mikro-Commitment**: Eingabefeld „Deine Website oder dein Angebot in einem Satz" + Pfeil-Button → leitet zu vorausgefülltem Form unten |
| Reading-Confidence    | nichts                                        | **schmale Progress-Bar oben** (2px, akzentfarbig), zeigt Scrollfortschritt — signalisiert „die Seite ist endlich"                                |
| Sektions-Padding Y    | `clamp(4.5rem, 8vw, 7.5rem)` (heutiger Wert)  | unverändert                                                                                                                                      |

**Beibehalten** (kohärenz-tragend):

- `useStaggeredSectionReveal` Hook
- Token-System aus `src/app/globals.css`
- Page-Frame `width: min(...)` Pattern
- i18n-Pflicht: DE und EN immer im selben Commit
- Hero behält seine bisherige Wuchtigkeit (Vignette + Blobs + animated gradient title) — der Hero darf der einzige Ort mit visuellem Drama bleiben, der Rest beruhigt sich

---

## Was diese Plan-Variante NICHT macht (bewusst)

- Keine animierten Hintergründe (verstößt gegen `invessiv-landing` Skill)
- Kein Parallax, kein Scroll-Hijacking
- Keine Custom-Cursor-Effekte oder „kreativen" Hover-States
- Kein Layout-Bruch, der den Lesefluss kostet — das Editorial-Vokabular muss sich _ruhiger_ lesen als das aktuelle, nicht aufregender
- Kein Wechsel auf Serif-Schrift im Body — die heutige Plus Jakarta Sans bleibt für Body, nur die monospace-Akzente kommen hinzu
- Kein Custom-Font-Hinzufügen, das die LCP-Budget-Vorgabe (< 2 s 4G) gefährdet

---

## Neue Tokens

In `src/app/globals.css` unter `:root`:

```css
--font-mono:
  "JetBrains Mono", "Fira Mono", ui-monospace, SFMono-Regular, monospace; /* nur als CSS-Stack, kein zusätzlicher @font-face — System-Fallbacks reichen, das spart LCP-Budget */
--section-marker-size: 0.82rem;
--hairline: color-mix(in srgb, var(--color-text) 14%, transparent);
--hairline-strong: color-mix(in srgb, var(--color-text) 22%, transparent);
--accent-solo: var(--color-accent-warm);
--accent-duo-from: var(--color-accent-warm);
--accent-duo-to: var(--color-cta);
--focus-lane-max: 44rem;
--focus-lane-wide: 50rem;
```

Begründung:

- **`--font-mono` als Stack**: kein Web-Font-Download, nur Systemfonts. Auf Win/Mac/Linux liefert das jeweils eine saubere Mono — perfekt für Numerale und Section-Marker.
- **`--hairline`-Tokens**: ersetzen die Blob-Glows als Sektionstrenner. Eine 1px-Linie ist editorialer Default und kostet nichts.
- **`--accent-solo` / `--accent-duo-*`**: macht die neue Akzent-Hierarchie explizit. Komponenten wählen bewusst aus, nicht ad-hoc.
- **`--focus-lane-max` / `--focus-lane-wide`**: aus dem alten Plan übernommen, weil immer noch sinnvoll.

---

## Sektion 1 — Hero (Update: Sub-CTA wird Ein-Feld-Form)

**Status heute**: 2-spaltig, Hero-Title mit animiertem Gradient, Primary CTA + Secondary „Ablauf ansehen" + Trust-Line.

**Änderungen**:

1. **Section Marker hinzufügen**: oberhalb der Tag-Pille (heute `hero.tag`) ein kleiner monospace-Marker `00 / 09 — INVESSIV` als reine Textzeile. Border-Bottom-Hairline darunter. **Reim** zu allen folgenden Sektionen.
2. **Sekundärer CTA wird zur Ein-Feld-Form**:
   - Statt Button „Ablauf ansehen" steht dort ein flaches Inline-Eingabefeld + Pfeil-Submit:
     ```
     [ Deine Website oder dein Angebot in einem Satz       → ]
     ```
   - On-Submit: Wert wird in Session-Storage gelegt, Browser scrollt zur Form-Sektion, Form-Feld „Was möchtest du mit der Landingpage erreichen?" ist mit dem Wert vorausgefüllt.
   - **Konversions-Logik**: Mikro-Commitment (Tippen ≈ 5 Sekunden) erhöht die Wahrscheinlichkeit, dass die Person unten auch die letzten Felder ausfüllt — Sunk-Cost-Effekt.
   - **Fallback**: leeres Feld + Submit → einfacher Scroll zur Form ohne Vorausfüllen, kein Fehler.
   - Der Sekundär-CTA aus dem Skill (`Ablauf ansehen`) entfällt **bewusst**. Die `invessiv-landing` Skill schreibt nicht zwingend zwei CTAs vor; sie nennt „Ablauf ansehen" als Möglichkeit. Durch das Inline-Feld bleibt ein zweiter Interaktionspfad, aber er konvertiert direkt in die Form-Reise.
   - **Klären vor Bau** (siehe Open Items): Ist das aus Sicht des Users vereinbar mit der CTA-Strategie der Skill? Empfehlung ja, aber nicht selbst entscheiden.
3. **Hero-Visual und animated Gradient-Title bleiben unverändert** — Hero darf die einzige Sektion mit Bewegung sein.

**Files**:

- `src/components/marketing/home/sections/hero-section/hero-section.tsx` — Section Marker oberhalb des Tags hinzufügen, Sekundär-Button durch Inline-Form ersetzen (neue Sub-Komponente: `src/components/marketing/landing/hero-quick-entry/hero-quick-entry.tsx`, Client-Component)
- `src/components/marketing/landing/hero-quick-entry/hero-quick-entry.tsx` (neu) — Client Component, kontrollierter Input, on-submit setzt sessionStorage und scrollt
- `src/components/marketing/landing/hero-quick-entry/hero-quick-entry.module.css` (neu)
- `src/i18n/dictionaries/landing/hero/{de,en}.json` — neuer Key `quickEntry.placeholder`, neuer Key `quickEntry.submitAriaLabel`, alter Key `secondaryCta` bleibt vorerst im Dictionary, wird aber nicht mehr gerendert (Doku-Trail)
- Form-Sektion (Final-CTA): liest beim Mount aus sessionStorage und füllt das Feld vor (siehe Sektion 9+10)

**Reuse**: bestehende Hero-Layout, neuer Section-Marker als wiederverwendbare Komponente (siehe unten).

---

## Wiederverwendbare Sub-Komponente: `<SectionMarker />`

Wird in jeder Inhaltssektion 1–9 statt der EyebrowPill verwendet.

**Datei**: `src/components/marketing/landing/section-marker/section-marker.tsx`

```tsx
type Props = { index: string; total: string; label: string }; // z.B. "01", "09", "PROBLEM"
```

**Visuelle Beschreibung**:

```
01 / 09 ──────── PROBLEM
```

- Monospace, `font-size: var(--section-marker-size)`, letter-spacing `0.16em`, `text-transform: uppercase`
- Color: `var(--color-text-muted)`
- `index` selbst leicht stärker getyped (`color: var(--color-text)`), damit das Auge die fortschreitende Zahl wahrnimmt
- Border-Bottom-Hairline `1px solid var(--hairline)` rechts, oder unter der ganzen Zeile — wir entscheiden bei der Umsetzung anhand Lesbarkeit
- Margin-Bottom zur Sektion: `clamp(1.5rem, 2.4vw, 2rem)`
- Mobile (≤640px): `letter-spacing: 0.12em`, sonst unverändert

**Ersetzt** die heutige EyebrowPill in den Sektionen 2–9. Die EyebrowPill-Komponente bleibt im Repo (wird woanders verwendet — geplante anderen Marketing-Sektionen, Home-Page), nur die Landingpage greift sie nicht mehr ab.

**Reveal**: über `useStaggeredSectionReveal` Stagger-Index 0 — d.h. Marker erscheint zuerst, dann Title, dann Body. Reihenfolge bleibt natürlich.

---

## Sektion 2 — Problem (Update: nur DNA-Migration)

**Status**: 2-spaltig sticky-l, rotierter Blob, Issue-Panel mit orangen Bullet-Dots — bleibt als Achse.

**Änderungen**:

1. EyebrowPill → SectionMarker `01 / 09 — PROBLEM`
2. Rotierter Blob-Hintergrund **entfernen** — durch Hairline-Trenner oben und unten ersetzen (`section::before` und `::after` als 1px-Linien, `var(--hairline)`, full-width within page-frame).
3. Issue-Panel rechts: orange Bullet-Dots bleiben (Solo-Warm-Akzent ist hier perfekt). Border des Panels: heute Gradient — wird zu `1px solid var(--hairline-strong)` mit subtilem `background: color-mix(in srgb, var(--color-surface-1) 96%, var(--color-accent-warm) 4%)` — Akzent ist nur _Hauch_ einer Tönung, kein Border-Verlauf mehr.

**Files**:

- `src/components/marketing/landing/problem-section/problem-section.tsx` — Eyebrow durch SectionMarker tauschen
- `src/components/marketing/landing/problem-section/problem-section.module.css` — Blob raus (`section::before` neu definieren als Hairline), Panel-Border + Background anpassen

**Reuse**: SectionMarker, `useStaggeredSectionReveal`.

---

## Sektion 3 — Solution (Rework: Wireframe-SVG ersetzt Composite-Mockup)

**Brief**: Der Visual-Anker der Solution-Sektion wird vom polierten Composite-Mockup zu einem **stripped Wireframe-SVG einer Landingpage**, das exakt die Sektionen zeigt, die diese Seite selbst hat. Meta-bewusste Geste — der Besucher sieht: „die Seite, auf der ich gerade bin, ist genau das, was ihr baut".

**Achse**: 2-spaltig, Wireframe-l (`1.4fr`) / Text-r (`1fr`). Sticky entfernen, `align-items: center`. (entspricht der vorherigen Plan-Variante, bleibt sinnvoll.)

**Wireframe-SVG**:

- Inline SVG (kein Asset-Import), ca. 480×640px viewport
- Zeigt schematisch: Header-Balken, Hero-Block (Title-Lines + Button), Sektion mit zwei Spalten (Text + Visual), Sektion mit Listen, Sektion mit Karte, Footer
- **Stroke-only**, 1.5px stroke, `var(--color-text-muted)` als Linie, **kein Fill**
- An genau **einer** Stelle ein dezenter warmer Akzent: der CTA-Button im Wireframe-Hero wird mit `fill: var(--color-accent-warm)` ausgefüllt — das eine Element, das ein Besucher anklicken würde, ist farbig hervorgehoben. Visuelle Lehre, ohne Text.
- Subtile reveal: Stroke-Pfade per `stroke-dasharray` + Animation auf 600ms „zeichnen sich" beim Sektions-Reveal. Bei `prefers-reduced-motion: reduce` direkt sichtbar.

**Datei**: `src/components/marketing/landing/solution-section/solution-wireframe/solution-wireframe.tsx` (neu, ersetzt funktional `solution-graphic/`).

**Achtung**: die heutige `solution-graphic`-Komponente und ihr CSS bleiben **noch** im Repo, werden aber nicht mehr von `solution-section.tsx` referenziert — nach erfolgreichem Refit per separatem Cleanup-Commit entfernen, damit der Diff lesbar bleibt.

**Background**: plain. Keine Blobs. Hairline oben und unten zur Sektionstrennung.

**Mobile (≤900px)**: Wireframe schrumpft auf max-width 360px, rückt **unter** den Text. DOM-Order über `order` flippen.

**Files**:

- `src/components/marketing/landing/solution-section/solution-section.tsx` — `SolutionGraphic` durch `SolutionWireframe` ersetzen, EyebrowPill durch SectionMarker, DOM-Order Wireframe-zuerst
- `src/components/marketing/landing/solution-section/solution-section.module.css` — Grid 1.4fr / 1fr, sticky raus, `align-items: center`, Blob raus, Hairlines hinzu
- `src/components/marketing/landing/solution-section/solution-wireframe/solution-wireframe.tsx` (neu)
- `src/components/marketing/landing/solution-section/solution-wireframe/solution-wireframe.module.css` (neu)
- Cleanup-Schritt: alte `solution-graphic/` Komponente entfernen, sobald Tests grün sind

**Reuse**: SectionMarker, `useStaggeredSectionReveal`, Tokens.

**Test**: `landing-page.test.tsx` — Selektoren auf neuen Wireframe-Container anpassen.

---

## Sektion 4 — Inclusions (Update: Bento-Grid mit einem dominanten Item)

**Status**: heute 3-Area-Grid mit numerierten Gradient-Badges + Reassurance-Banner.

**Änderungen**:

1. EyebrowPill → SectionMarker `03 / 09 — WAS DU BEKOMMST`
2. **Bento-Layout statt Badge-Grid**: 5 Inclusion-Items als Tiles, eines davon (Empfehlung: „klare Seitenstruktur" — das wichtigste, was die Person _wirklich_ kauft) belegt 2 Spalten / 2 Reihen und enthält ein zusätzliches Sub-Detail (z.B. einen einzeiligen Erläuterungssatz unter dem Titel). Die anderen Tiles sind kompakt: Titel + 1-Zeile-Erläuterung.
3. **Tile-Style**: kein Card-Border, sondern Hairline-Trenner zwischen den Tiles (CSS Grid mit `gap: 1px; background: var(--hairline)`-Trick — Tiles bekommen `background: var(--color-bg)`, der `gap` wird die Hairline). Editorial-Klassiker.
4. **Numerale**: pro Tile eine kleine monospace-Nummer `01`, `02`, … oben links, statt der heutigen Gradient-Badges. Konsistent mit SectionMarker.
5. **Hero-Tile** (das große): Numeral + Titel + 1-Zeilen-Erklärung; alle anderen: nur Numeral + Titel.
6. **Reassurance-Banner unten** entfällt — der Satz „Du musst keine fertigen Texte mitbringen…" wandert als kleiner muted-Hinweis _innerhalb_ des Hero-Tiles oder direkt unter das Bento-Grid (Klären vor Bau, siehe Open Items — Empfehlung: unter dem Grid, einzeilig, zentriert, muted).

**Mobile (≤900px)**:

- Bento kollabiert zu 1-Spalte
- Hero-Tile bleibt zuerst, Rest folgt vertikal
- Hairline-Trenner werden horizontal

**Files**:

- `src/components/marketing/landing/inclusions-section/inclusions-section.tsx` — komplett neu strukturiert: Bento-Grid mit hero-tile + 4 normale Tiles, optional 9. Item entfällt, falls heutiges Dictionary 9 Items hat (siehe Klärung)
- `src/components/marketing/landing/inclusions-section/inclusions-section.module.css` — komplett neu: Bento-Grid mit `grid-template-areas`
- `src/i18n/dictionaries/landing/inclusions/{de,en}.json` — Struktur muss erweitert werden: pro Item ggf. `headline` + `detail` (optional). Falls heute nur ein Array von Strings, wird ein Objekt-Array. **Type-Update in `index.ts`**.

**Reuse**: SectionMarker, `useStaggeredSectionReveal`.

---

## Sektion 5 — Audience (Rework: Inline-Filter „Ich bin …")

**Brief**: Die Audience-Sektion ist heute eine Liste — gut lesbar, aber statisch. Der Plan macht aus ihr eine **interaktive Self-Identification**, die zum Scrollziel wird.

**Achse**: einspaltig zentriert, Focus-Lane (`var(--focus-lane-wide)` ≈ 50rem).

**Pattern**:

```
Section Marker:  04 / 09 — FÜR WEN

Title:           Für wen ist das geeignet?

Lead:            Für Dienstleister, Selbstständige und kleine Unternehmen,
                 die ein konkretes Angebot online besser präsentieren wollen.

Filler-Satz:     "Ich bin _____________"
                          ↑
            [Handwerker]  [Coach]  [Berater]  [Fotograf]
            [lokaler Dienstleister]  [B2B-Anbieter]  [Agentur]

Beispiel:        (wechselt je nach gewähltem Pill)
                 z.B. für Handwerker: „Eine Seite für 'Badsanierung in Hamburg'
                 — klare Leistung, Preisrahmen, Anfrage-Button. Statt
                 Allround-Webseite."
```

**Interaktion**:

- Default-aktiv: erstes Pill („Handwerker"). Beispielsatz darunter ist der zugehörige.
- Click auf anderes Pill → Beispielsatz wechselt mit 200ms Crossfade.
- **Keine** komplexe Logik (keine URL-Sync, kein State-Persist) — reine Client-State.
- Reduced-Motion: kein Crossfade, sofortiger Wechsel.

**Konversions-Logik**: Self-Identification senkt die Wahrnehmung „das ist nicht für mich". Der Beispielsatz pro Audience macht das Angebot konkret — viel stärker als eine generische Liste.

**Background**: plain. Hairline oben + unten.

**Files**:

- `src/components/marketing/landing/audience-section/audience-section.tsx` — Client Component (`"use client"`), neuer State (gewähltes Pill), Pill-Liste + Beispielsatz-Bereich, kein Icon-Set mehr (Icons werden zugunsten der Klarheit entfernt)
- `src/components/marketing/landing/audience-section/audience-section.module.css` — Pills als wrap-flex, Beispielsatz mit `transition: opacity 200ms`
- `src/components/marketing/landing/audience-section/audience-icon.tsx` — entfällt nach Refit (Cleanup-Commit)
- `src/i18n/dictionaries/landing/audience/{de,en}.json` — pro Item: `label` + `example` (Satz pro Audience). **Type-Update in `index.ts`**.

**Reuse**: SectionMarker. Reveal-Hook für initialen Erscheinen, nicht für die Pill-Interaktion (die ist sofort).

**Test**: `landing-page.test.tsx` — neuer Test: Klick auf Pill ändert Beispielsatz.

---

## Sektion 6 — Process (Rework: Tagebuch-Timeline)

**Brief**: Statt „Schritt 1 / 2 / 3 / 4" mit abstrakten Phasen wird die Sektion zu einer **konkreten Tagebuch-Timeline**: was passiert an Tag 1, was an Tag 2–3, was an Tag 4–5, was an Tag 6–7. Die Versprechung „3–7 Tage" wird dadurch _greifbar_ — Conversion-Asset.

**Achse**: horizontale Schiene auf Desktop (wie heute), aber neue Mikrostruktur. Mobile: vertikal.

**Pro Stage**:

```
TAG 1                     TAG 2–3                  TAG 4–5                  TAG 6–7
─────                     ───────                  ───────                  ───────
Ziel klären               Struktur & Entwurf       Umsetzung                Launch
Angebot, Zielgruppe,      Aufbau, Inhalte,         Modern, mobil,           Online — bereit
gewünschte Anfrage        Designrichtung           sauber                   für Anfragen
```

- **Tag-Label** in `--font-mono`, uppercase, größer als heute (`clamp(0.9rem, 1vw, 1rem)`), als visueller Anker
- **Hairline-Linie** über alle vier Stages, als Verbindung — keine Gradient-Rail-Animation mehr (zu „SaaSy"). Statisch, 1px, `var(--hairline-strong)`.
- **Knoten** an der Linie: kleiner Kreis, `var(--accent-solo)`, 8px Durchmesser, gefüllt — präsent aber nicht bunt.
- **Stage-Titel + Body**: heutige Skala behalten

**Background**: plain. Keine Gradient-Rail.

**Files**:

- `src/components/marketing/landing/process-section/process-section.tsx` — EyebrowPill → SectionMarker `05 / 09 — ABLAUF`. Pro Step das Tag-Label (neues Feld) zusätzlich rendern.
- `src/components/marketing/landing/process-section/process-section.module.css` — Rail-Animation entfernen, Hairline statisch, Knoten als `.node::before`. Tag-Label-Style ergänzen.
- `src/components/marketing/landing/process-section/process-icon.tsx` — entfällt (Pictograms raus). Cleanup-Commit.
- `src/i18n/dictionaries/landing/process/{de,en}.json` — pro Step neues Feld `dayLabel: "Tag 1"` etc. Type-Update.

**Reuse**: SectionMarker, `useStaggeredSectionReveal`.

---

## Sektion 7 — Pricing (Rework: Quittungs-Layout)

**Brief**: Statt Showcase-Karte mit Gradient-Border + Glow wird das Pricing zu einem **typeset Angebot/Quittung**. Vermittelt: „das ist ein konkretes Angebot, kein Marketing-Trick".

**Visuelle Beschreibung**:

```
05 / 09 — ANGEBOT


            Landingpage Starter
            Für ein konkretes Angebot, eine Dienstleistung
            oder eine Kampagne.


            Enthalten
            ──────────────────────────────────────────────
            01    1 Landingpage
            02    Struktur & Text-Grundlage
            03    Design & Umsetzung
            04    Anfrageformular
            05    Mobile Optimierung
            06    Launch-Unterstützung
            ──────────────────────────────────────────────


            Umsetzung                            3–7 Tage
            Preisrahmen                           ab 799 €
            ──────────────────────────────────────────────


              [ Kostenlosen Landingpage-Check anfragen → ]


            Andere Umfänge auf Anfrage.
```

**Charakter**:

- Numerierte Items in monospace (`01`, `02`, …)
- Hairlines als Trenner zwischen Sektionen
- Numerale + Werte (`3–7 Tage`, `ab 799 €`) rechtsbündig, `--font-mono`, größerer Schriftgrad für die Werte (`var(--font-size-section-subtitle)`)
- **Der Preis** behält den Duo-Verlauf warm→cool als gradient-text-fill — eine der zwei Stellen, wo der Doppelverlauf bleibt (Hero ist die andere). Gibt dem Preis visuelles Gewicht.
- **CTA-Button** unverändert primary (Solo-warm wäre zu schwach für die Konversions-Action — der CTA bleibt `var(--color-cta)`-getrieben)
- Box: dünner `1px solid var(--hairline-strong)`, kein Schatten, kein Glow. Padding `clamp(2rem, 4vw, 3rem)`. Width `var(--focus-lane-max)`.

**Files**:

- `src/components/marketing/landing/pricing-section/pricing-section.tsx` — EyebrowPill → SectionMarker `06 / 09 — ANGEBOT`. (Title-Block bleibt außerhalb der Karte.)
- `src/components/marketing/landing/pricing-section/pricing-card.tsx` — komplette Neu-Struktur: monospace-Numerale, Hairline-Trenner, Footer-Zeilen rechtsbündig, kein gradient-Border
- `src/components/marketing/landing/pricing-section/pricing-section.module.css` — Background plain, Spotlight raus, Karten-Border zu `1px solid var(--hairline-strong)`, Box-Shadow raus
- `src/i18n/dictionaries/landing/pricing/{de,en}.json` — keine inhaltlichen Änderungen, nur ggf. Items-Format prüfen

**Reuse**: SectionMarker, vorhandene Button-Komponente, `--focus-lane-max`.

---

## Sektion 8 — FAQ (Update: nur DNA-Migration)

**Status**: heute Single-Column Accordion mit Plus-Symbol. Funktional gut.

**Änderungen**:

1. EyebrowPill → SectionMarker `07 / 09 — HÄUFIGE FRAGEN`
2. Asymmetrische Heading-Komposition (aus altem `landing-plan-design.md`) bleibt — Eyebrow links, Title rechts versetzt darunter
3. Dot-Grid-Pattern-Background **entfernen** — plain Surface mit Hairlines oben/unten
4. Plus-Symbol bleibt, aber mit Solo-Warm-Akzent statt Gradient
5. Frage-Border-Bottom: heute Gradient — wird zu `1px solid var(--hairline)`
6. **Default-open der wichtigsten Frage** („Wie schnell ist die Landingpage fertig?") — bleibt, ist Conversion-relevant

**Files**:

- `src/components/marketing/landing/faq-section/faq-section.tsx` — Eyebrow tauschen
- `src/components/marketing/landing/faq-section/faq-section.module.css` — Dot-Grid raus, Borders zu Hairlines, Plus-Color zu solo-warm

**Reuse**: SectionMarker.

---

## Sektion 9+10 — Final-CTA + Form (Rework: Bühne raus, Document-Look + Auto-Prefill)

**Status**: heute kombinierte Komponente mit Spotlight-Glow, Gradient-Border-Karte, dramatic Headline. Die Bühne war im alten Plan ein bewusster Bruch — passt im Editorial-Konzept aber nicht. Hier wird sie zurückgenommen.

**Änderungen**:

1. EyebrowPill → SectionMarker `08 / 09 — ANFRAGE`
2. **Pulsierender Glow / Spotlight-Background entfällt komplett.** Plain Surface, Hairlines oben/unten.
3. **Headline-Skala** wird auf `var(--font-size-section-title)` zurückgenommen (heute überdimensioniert) — die Headline ist nicht mehr „Bühne", sondern Übergangstext.
4. **Form-Karte** verliert den Gradient-Border. Stattdessen `1px solid var(--hairline-strong)`, `padding: clamp(2rem, 4vw, 3rem)`, `background: var(--color-surface-1)`. Schatten dezent: `box-shadow: 0 14px 30px -22px color-mix(in srgb, var(--color-text) 30%, transparent)` — sanfter Heberhebung, kein Glow.
5. **Submit-Button** bleibt primary (`var(--color-cta)`-getrieben).
6. **Reassurance-Pillen** unter dem Submit-Button bleiben — „Antwort innerhalb 48h / kostenlos / unverbindlich". Diese Pillen sind hier ein Conversion-Asset und bleiben sichtbar, aber als reine Text-Pillen ohne Background, getrennt durch `·` (Mittelpunkt). Editorial-Klassiker.
7. **Auto-Prefill aus Hero-Quick-Entry**: beim Mount liest die Form aus sessionStorage den Wert aus dem Hero-Feld und schreibt ihn in das Feld „Was möchtest du mit der Landingpage erreichen?". Wenn vorhanden, fokussiert die Form das Feld „Name" (nicht das vorausgefüllte) — Person muss nur noch Name + E-Mail tippen.
8. **Erfolgs-State**: schlicht — Text + Hairline darunter, kein Konfetti, kein Modal. Heutiges Verhalten bleibt, nur visuell beruhigt.

**Files**:

- `src/components/marketing/landing/final-cta-section/final-cta-section.tsx` — Eyebrow tauschen, sessionStorage-Read im `useEffect`, Reassurance-Pillen als reine Textzeile
- `src/components/marketing/landing/final-cta-section/final-cta-section.module.css` — Spotlight raus, Gradient-Border raus, Box-Shadow zurückfahren, Reassurance als Text mit `·`-Trennern

**Reuse**: SectionMarker, bestehende Form-Validierung, Backend.

---

## Reading-Progress-Bar

**Datei**: `src/components/marketing/landing/reading-progress/reading-progress.tsx` (neu, Client Component)

- Position: `fixed; top: 0; left: 0; right: 0;`
- Höhe: 2px
- Background: transparent
- Fortschrittsbalken: `var(--accent-solo)`, breite-prozentual am Scroll-Anteil der Seite
- Implementierung: `IntersectionObserver` ist hier nicht das richtige Tool; einfacher `scroll`-Listener mit `requestAnimationFrame`-Throttle
- Reduced-Motion: Bar wird vollständig deaktiviert (Animation = subtile Bewegung beim Scrollen, bei reduced-motion irrelevant)

**Conversion-Logik**: zeigt impizit „diese Seite ist endlich". Reduziert die Wahrnehmung „endloser Scroll", die viele Landingpages haben.

**Mounting**: in `landing-page.tsx` direkt unter `<SiteHeader>`, vor `<main>`.

---

## Mobile-First-Check

Jede Änderung wird auf 360px Breite geprüft, **bevor** sie als „fertig" gilt:

- **SectionMarker**: bleibt einzeilig, letter-spacing reduziert
- **Hero-Quick-Entry**: Eingabefeld + Pfeil-Button stapeln nicht — bleiben in einer Zeile mit `min-width: 0` und `flex: 1` auf dem Input
- **Solution-Wireframe**: max-width 360px, scrollt nicht
- **Inclusions-Bento**: kollabiert zu 1-Spalte, Hero-Tile bleibt erst
- **Audience-Inline-Filter**: Pills wrappen, Beispielsatz-Bereich behält Mindest-Höhe (verhindert Layout-Shift bei Wechsel)
- **Process-Timeline**: vertikale Schiene mit Knoten links, Text rechts
- **Pricing-Quittung**: Numerale + Werte links/rechts behalten Ausrichtung; falls Zeilen brechen, Wert auf neue Zeile
- **Reading-Progress**: 2px reichen auf jedem Display

---

## Reihenfolge der Umsetzung

Schrittweise, jede Stufe verifizierbar im Browser:

1. **Tokens etablieren** in `globals.css` — keine sichtbare Änderung
2. **`<SectionMarker />` Sub-Komponente** bauen + Tests
3. **Sektion 2 Problem** — DNA-Migration als kleinster Brocken, kalibriert das neue Vokabular
4. **Sektion 8 FAQ** — DNA-Migration analog, schnell
5. **Sektion 7 Pricing** — Quittungs-Layout, größere visuelle Wirkung
6. **Sektion 6 Process** — Tagebuch-Timeline, Dictionary-Update
7. **Sektion 4 Inclusions** — Bento-Layout, Dictionary-Update (größter Refit-Brocken nach Sektion 9+10)
8. **Sektion 5 Audience** — Inline-Filter, Client-State
9. **Sektion 3 Solution** — Wireframe-SVG, neues Sub-Component, alte `solution-graphic` aufräumen (separater Cleanup-Commit)
10. **Sektion 9+10 Final-CTA + Form** — Editorial-Refit + sessionStorage-Auto-Prefill
11. **Sektion 1 Hero** — Quick-Entry-Sub-CTA als letzter Schritt, weil das die sessionStorage-Brücke zur Form schließt
12. **Reading-Progress-Bar** — Polish, ganz am Ende

Reihenfolge ist bewusst nicht „von oben nach unten" — kleinste DNA-Änderungen zuerst, größte funktionale Änderungen (Hero-Form-Brücke) zuletzt. Jeder Schritt produziert eine deploybare Zwischenversion.

---

## Verifikation

### Lokal (`npm run dev`)

- `/de/landing` und `/en/landing` jeweils komplett durchscrollen
- **Editorial-Charakter-Check**: Wirkt die Seite wie aus einem Guss? Kein generischer Agentur-Look mehr?
- **Section-Marker-Sequenz**: 01 / 09 → 02 / 09 → … → 08 / 09 lesbar und konsistent platziert?
- **Akzent-Disziplin**: Nur an erlaubten Stellen Doppelverlauf (Hero-Title, Pricing-Preis)? Sonst Solo-Warm?
- **Hairlines statt Blobs**: Keine Blob-Glows mehr (außer Hero)?
- **Hero-Quick-Entry → Form-Prefill**: Wert tippen → klicken → unten ankommen → Feld vorausgefüllt → erste Eingabe ist „Name"?
- **Audience-Filter**: Pills wechseln Beispielsatz reaktiv?
- **Process-Tag-Labels**: „TAG 1" lesbar in Mono, Knoten + Hairline statisch?
- **Pricing-Quittung**: Numerale linksbündig, Werte rechtsbündig, Preis-Verlauf erkennbar?

### Mobile (≤ 640px)

- Alle oben genannten Punkte auf 360px
- Hero-Quick-Entry: Input + Submit nebeneinander, nicht gestapelt
- Wireframe-SVG: scrollt nicht, max-width 360px
- Bento: Hero-Tile zuerst, Rest darunter

### Theme-Wechsel

- Light/Dark beide durchklicken
- Hairlines im Light-Theme sichtbar genug (Token `--hairline` muss in `[data-theme="light"]` ggf. nachjustiert werden)
- Pricing-Preis-Verlauf in Light lesbar

### Reduced Motion

- Hero-Title-Animation bleibt deaktiviert (heutiges Verhalten)
- Wireframe-Stroke-Draw deaktiviert
- Audience-Crossfade durch sofortigen Wechsel ersetzt
- Reading-Progress weiterhin sichtbar (statisch reicht), Section-Reveal-Stagger deaktiviert

### Pre-Merge Gates (CLAUDE.md)

- `npm run lint` grün
- `npm run typecheck` grün
- `npm run build` grün
- `npm run test` grün — `landing-page.test.tsx` an neue Strukturen angepasst

### Conversion-Smoke-Test

- **End-to-End-Form-Submit** (Hero-Quick-Entry-Pfad): Hero-Feld ausfüllen → submit → bei Form ankommen → restliche Felder → submit → Erfolgs-State erscheint → E-Mail trifft
- **End-to-End-Form-Submit** (direkter Pfad): direkt zur Form scrollen → ausfüllen ohne Vorausfüllung → submit → Erfolgs-State

### i18n

- Neue Dictionary-Keys (DE und EN) gesetzt, Type-Updates kompilieren
- Audience-`example` und Process-`dayLabel` und Inclusions-`detail` in beiden Locales

---

## Open Items / vor Implementierung klären

1. **Hero Sekundär-CTA durch Quick-Entry ersetzen — vereinbar mit `invessiv-landing` Skill?** Die Skill nennt Sekundär-CTA „Ablauf ansehen" als _Möglichkeit_ im Hero. Der Quick-Entry konvertiert direkt in die Form-Reise und ist konversionsstärker, aber er ändert das Pattern. **Empfehlung**: ersetzen, weil das Mikro-Commitment messbar konvertiert. Klärung vor Bau bei User einholen.

2. **Inclusions: Hero-Tile-Wahl.** Welches der heutigen 9 Items wird das große Tile? Empfehlung: „klare Seitenstruktur" — das Versprechen, das den größten wahrgenommenen Wert trägt. Klären — User-Entscheidung.

3. **Inclusions auf 5 Tiles reduzieren?** Heute sind es 9 Items. Bento mit 9 ist überladen. Plan empfiehlt 5 (1 hero + 4 normale), Rest wandert in den Lead-Satz oder entfällt. Klären — Inhaltsverlust-Tradeoff.

4. **Audience-Items: heute 7, im Filter wird 1 default-aktiv sein.** Welcher? Empfehlung: „Handwerker" als breitestes Beispiel; alternativ „lokale Dienstleister". Klären.

5. **`process-icon.tsx` und `audience-icon.tsx` und `solution-graphic/`** entfernen oder behalten? Empfehlung: entfernen (Cleanup-Commit nach Refit-Merge), weil ungenutzt. Klären, ob sie ggf. an anderer Stelle wiederverwendet werden.

6. **Reading-Progress-Bar — Performance auf schwachen Geräten?** `scroll`-Listener mit `requestAnimationFrame`-Throttle ist günstig, sollte aber gemessen werden. Falls jank: per `IntersectionObserver` auf Sektionen umstellen (granularer, nur bei Sektions-Wechsel updaten).

7. **Auto-Prefill via sessionStorage — Datenschutz?** Werte werden client-only gespeichert, keine Persistenz. Form-Submit löscht den sessionStorage-Eintrag. Sollte unproblematisch sein, aber im PR-Beschreibung erwähnen.

8. **`--font-mono` Stack — System-Fallback prüfen.** Auf Windows ohne JetBrains Mono fällt es auf Consolas/SFMono/etc. zurück. Optisch konsistent genug? Empfehlung: ja, aber Cross-Browser-Screenshot in Verifikation aufnehmen.

---

## Files-Übersicht (zentrale Änderungen)

| Pfad                                                                                                       | Änderung                                                                                              |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/app/globals.css`                                                                                      | Tokens: `--font-mono`, `--hairline*`, `--accent-solo`, `--accent-duo-*`, `--focus-lane-*`             |
| `src/components/marketing/landing/section-marker/section-marker.tsx`                                       | **neu** — wiederverwendbarer Section Marker                                                           |
| `src/components/marketing/landing/section-marker/section-marker.module.css`                                | **neu**                                                                                               |
| `src/components/marketing/landing/reading-progress/reading-progress.tsx`                                   | **neu** — top progress bar                                                                            |
| `src/components/marketing/landing/reading-progress/reading-progress.module.css`                            | **neu**                                                                                               |
| `src/components/marketing/landing/hero-quick-entry/hero-quick-entry.tsx`                                   | **neu** — Inline-Form im Hero                                                                         |
| `src/components/marketing/landing/hero-quick-entry/hero-quick-entry.module.css`                            | **neu**                                                                                               |
| `src/components/marketing/home/sections/hero-section/hero-section.tsx`                                     | Sekundär-Button durch `HeroQuickEntry` ersetzen, Section-Marker hinzufügen                            |
| `src/components/marketing/landing/landing-page/landing-page.tsx`                                           | `ReadingProgress` mounten                                                                             |
| `src/components/marketing/landing/problem-section/problem-section.{tsx,module.css}`                        | Eyebrow→Marker, Blob raus, Hairlines, Panel-Border-Migration                                          |
| `src/components/marketing/landing/solution-section/solution-section.{tsx,module.css}`                      | Eyebrow→Marker, Wireframe statt Composite, Grid-Spiegelung, Sticky raus, Hairlines                    |
| `src/components/marketing/landing/solution-section/solution-wireframe/solution-wireframe.{tsx,module.css}` | **neu**                                                                                               |
| `src/components/marketing/landing/solution-section/solution-graphic/`                                      | **entfernen** (Cleanup-Commit)                                                                        |
| `src/components/marketing/landing/inclusions-section/inclusions-section.{tsx,module.css}`                  | Eyebrow→Marker, Bento-Layout, monospace-Numerale, Items reduzieren                                    |
| `src/components/marketing/landing/audience-section/audience-section.{tsx,module.css}`                      | Eyebrow→Marker, `"use client"`, Inline-Filter mit State                                               |
| `src/components/marketing/landing/audience-section/audience-icon.tsx`                                      | **entfernen** (Cleanup-Commit)                                                                        |
| `src/components/marketing/landing/process-section/process-section.{tsx,module.css}`                        | Eyebrow→Marker, Tag-Labels, statische Hairline-Schiene, Knoten                                        |
| `src/components/marketing/landing/process-section/process-icon.tsx`                                        | **entfernen** (Cleanup-Commit)                                                                        |
| `src/components/marketing/landing/pricing-section/pricing-section.{tsx,module.css}`                        | Eyebrow→Marker, Spotlight raus, plain background                                                      |
| `src/components/marketing/landing/pricing-section/pricing-card.tsx`                                        | komplette Neu-Struktur — Quittungs-Layout, monospace-Numerale, Hairline-Trenner                       |
| `src/components/marketing/landing/faq-section/faq-section.{tsx,module.css}`                                | Eyebrow→Marker, Dot-Grid raus, Solo-Warm-Akzent                                                       |
| `src/components/marketing/landing/final-cta-section/final-cta-section.{tsx,module.css}`                    | Eyebrow→Marker, Spotlight raus, Karten-Border, sessionStorage-Auto-Prefill, Reassurance als Textzeile |
| `src/i18n/dictionaries/landing/hero/{de,en}.json`                                                          | `quickEntry.placeholder`, `quickEntry.submitAriaLabel`                                                |
| `src/i18n/dictionaries/landing/inclusions/{de,en}.json`                                                    | Items als Objekte mit `headline` + optional `detail`                                                  |
| `src/i18n/dictionaries/landing/audience/{de,en}.json`                                                      | Items mit `label` + `example`                                                                         |
| `src/i18n/dictionaries/landing/process/{de,en}.json`                                                       | Steps mit `dayLabel`                                                                                  |
| `src/i18n/dictionaries/landing/*/index.ts`                                                                 | Type-Updates                                                                                          |
| `src/components/marketing/landing/landing-page/landing-page.test.tsx`                                      | Selektoren auf neue Strukturen anpassen, neuer Test für Audience-Filter                               |

Keine Änderungen an: SiteHeader, FooterSection, EyebrowPill (bleibt für andere Seiten), Form-Backend (`POST /api/public/contact`), DB-Schema, Email-Service, Analytics-Tracking-Events.

---

## Conversion-Garantien (was sicher nicht schlechter wird)

Jede Änderung in diesem Plan hat einen Conversion-Bezug:

| Change                        | Conversion-Hypothese                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| Section Marker `01 / 09`      | Sense of progress → höhere Through-Scroll-Rate → mehr Form-Sichtungen                     |
| Solo-Akzent statt Duo         | Weniger visuelles Rauschen, klarere CTA-Hierarchie → Primary-CTA bleibt eindeutiger Anker |
| Hero-Quick-Entry              | Mikro-Commitment via 1 Feld → Sunk-Cost senkt Form-Abbruch                                |
| Audience-Inline-Filter        | Self-Identification + konkretes Beispiel → höhere wahrgenommene Relevanz                  |
| Process-Tagebuch-Timeline     | „3–7 Tage" wird greifbar → senkt Unsicherheit                                             |
| Pricing-Quittungs-Layout      | wirkt wie konkretes Angebot, nicht wie Marketing → senkt Skepsis                          |
| Reading-Progress-Bar          | reduziert „endloser Scroll"-Wahrnehmung                                                   |
| Auto-Prefill aus Hero zu Form | senkt Eingabeaufwand für die letzten 3 Felder                                             |

Was **nicht** geopfert wird:

- CTA-Wording (`Kostenlosen Landingpage-Check anfragen`) — bleibt überall identisch
- CTA-Platzierung — alle 4 vom Skill geforderten Stellen behalten ihren CTA
- Hero-Wuchtigkeit — Hero behält animated Gradient-Title und Visual
- Form-Felder-Anzahl — bleibt minimal (Name, E-Mail, Website, Ziel)
- Form-Backend — keine Änderung am Roundtrip

---

## Wenn der User V2 / V3 erweitern will

Erweiterungen aus `landing-plan.md` (Testimonials, Mini-Case-Study, Demo-Screenshots) integrieren sich in das Editorial-Vokabular besonders gut:

- Testimonials → als Pull-Quote im Editorial-Stil, ein Zitat pro Sektion zwischen 4 und 5 oder zwischen 7 und 8
- Mini-Case-Study → als „Beispiel"-Box mit Quittungs-ähnlicher Struktur (Vorher / Aufgabe / Ergebnis)
- Demo-Screenshot → als Wireframe-Annotation neben dem Wireframe-SVG in Solution

Kein Rebuild des Konzepts nötig — die DNA trägt.
