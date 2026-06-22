# Umsetzungsplan – KlarKompass Coaching Landingpage (Demo/Konzept)

**Projekttyp:** Konzept-/Referenzprojekt (fiktive Marke) — ehrlich als Demo gekennzeichnet
**Route:** `/[locale]/references/klarkompass-coaching` (englischer Slug, DE + EN)
**Primärziel der Demo:** Design-, Copy- und Conversion-Bandbreite zeigen; CTA "Kostenloses Erstgespräch buchen" ist ein
als **Mock** gekennzeichneter Platzhalter
**Stack (invessiv-Konventionen):** Next.js App Router · CSS Modules + lokal gescopte Token-Variablen (`--kk-*`) ·
`next/font` (Display: Fraunces, Body: DM Sans) · `next/image` · `motion` (`motion/react`, scoped) · DE/EN-Dictionaries

> Dieser Plan ist an den invessiv-Monorepo-Stack angepasst (vorher generisches Next.js/Tailwind/Framer). Er ist die
> Arbeitsgrundlage für die technische Umsetzung als in sich geschlossene, ehrlich gekennzeichnete Demo-Seite innerhalb von
> `apps/web`.

> **Redesign-Update (Richtung „Grounded Bearings“, Juni 2026):** Aktueller Stand ist eine organisch-editoriale
> Waldboden-Optik mit Waldgrün, Rindenbraun, warmem Lehmpapier und Sandton. Fraunces prägt die Headlines, DM Sans
> bleibt für Fließtext/UI. Primäre CTAs sind sattes Tonbraun; Lime ist auf Fokus und aktive Kompassmarker begrenzt.
> Bearing-Line, XXL-Azimutwerte und
> Prozessnummern bilden die Kompassspur. Animationen laufen über `motion` (scoped auf `.brandScope`). Maßgeblich ist
> `apps/web/src/references/AGENTS.md` → „Design-Sprache (KlarKompass-Referenz)“. Frühere Richtungen „Editorial
> Clarity“/Kobalt und die historische Ausgangstabelle in §4 sind nicht mehr der aktuelle Designstand.

---

## 1. Zielbild & Erfolgskriterien

Die Demo ist erfolgreich, wenn sie:

- ruhig, premium und vertrauensbildend wirkt (kein Corporate-Kälte-Look),
- die Zielgruppe (28–45, neue/angehende Führungskräfte) in Problem und Ergebnis abholt,
- den Besucher klar zum (Mock-)CTA "Kostenloses Erstgespräch buchen" führt,
- vollständig responsiv ist (Mobile-first, 360px) und Lighthouse ≥ 90 in allen Kategorien anstrebt,
- **sichtbar als fiktives Konzeptprojekt gekennzeichnet** ist (Footer-Hinweis + Mock-Label am CTA),
- als eigenständige Marke auftritt (eigener Header/Footer, eigene warme Palette, Serif-Headlines) — **ohne**
  invessiv-Header/-Footer.

Wichtig für die Referenz: keine erfundenen Testimonials, keine Fake-Portraits realer Personen, keine Preisnennung.

---

## 2. Konventionen (verbindlich, aus AGENTS.md)

- Eine Komponente = eine Datei, eigener Ordner, co-located `*.module.css`; Sub-Komponenten als Unterordner.
- Server Components default; `"use client"` nur für interaktive Teile (Accordion, Burger-Menü, Reveal-Hooks).
- Kein Inline-Styling, keine neuen globalen Klassen. Tokens lokal gescopt (`--kk-*`), nicht in `globals.css`.
- Sämtliche Texte in Dictionaries (`de.json`/`en.json` + `index.ts`-Getter); keine Inline-Strings in `.tsx`.
- Geteilte/exportierte Typen → `apps/web/common` (`contracts/`); nichts dergleichen aus `.tsx` exportieren. Kein `enum`.
- Route-Pfade aus `SITE_ROUTES`. Reveal über `useStaggeredSectionReveal` (`data-reveal-item`), `prefers-reduced-motion`
  respektieren.
- Demo ist `noindex, nofollow`, kein `sitemap.ts`-Eintrag; OG-Tags bleiben fürs Teilen.
- DE/EN strukturell synchron.

---

## 3. Projekt- & Routing-Struktur

```txt
src/app/[locale]/(marketing)/references/klarkompass-coaching/
  page.tsx                  → generateStaticParams + noindex-Metadata, rendert <KlarkompassPage />

src/components/marketing/references/
  AGENTS.md                 → scope-spezifische Regeln (eigene Marke, --kk-*-Tokens, Mock, noindex)
  klarkompass/
    klarkompass-page/        → Orchestrator (Server Component, setzt .brandScope)
    klarkompass-header/      → sticky Header, Wortmarke, Anker-Nav, Mock-CTA (client für Burger/Scroll)
    hero-section/            → H1, Badge, zwei CTAs, Trust-Zeile, Floating-Cards-Visual
    problem-section/
    results-section/         → 3 Karten
    method-section/          → 4-Schritt-Timeline
    offer-section/           → hervorgehobene Card, KEIN Preis
    about-section/           → abstrakte Portrait-Card (keine reale Person)
    process-section/         → 4 Schritte
    trust-points-section/    → 5 Trust-Punkte (statt Testimonials)
    faq-section/             → Accordion (client, A11y)
    final-cta-section/       → Mock-CTA
    klarkompass-footer/      → Pflicht-Hinweis "fiktives Konzeptprojekt"

src/i18n/dictionaries/references/klarkompass/
  meta/ hero/ problem/ results/ method/ offer/ about/ process/ trust-points/ faq/ final-cta/ footer/ header/
    └─ je { index.ts, de.json, en.json }
```

Geteilte Content-Typen, falls über mehrere Dateien genutzt → `apps/web/common/contracts/references/`.

---

## 4. Design-System (lokal gescopte Tokens)

Alle Tokens leben unter einer `.brandScope`-Klasse in `klarkompass-page.module.css` (nicht global):

| Token                | Wert      | Verwendung                      |
| -------------------- | --------- | ------------------------------- |
| `--kk-bg`            | `#f7f3ee` | Hauptfläche                     |
| `--kk-surface`       | `#efe7dc` | abgesetzte Sections             |
| `--kk-card`          | `#ffffff` | Cards                           |
| `--kk-text`          | `#1e2528` | Headlines & Fließtext           |
| `--kk-primary`       | `#2f5d50` | Buttons, Labels, Icons, Akzente |
| `--kk-primary-hover` | `#264b41` | Primary-Hover                   |
| `--kk-accent`        | `#c78f5a` | Highlights, Linien, Badges      |
| `--kk-border`        | `#ddd2c4` | Card-/Trennlinien               |

Fixe Optik, **kein** `[data-theme]`-Switch (eigenständige Marke). Section-Module konsumieren nur `--kk-*`.

### Typografie

- Headlines: Serif via `next/font/google` (Fraunces), an `.brandScope` gebunden (`--kk-font-serif`).
- Fließtext/UI: Sans (Inter via `next/font` oder vorhandene System-Sans) als `--kk-font-sans`.
- H1 Desktop 56–72px / Mobile 40–48px; H2 36–48 / 30–36; Body 18px; Button 16px semibold.

### Buttons

- **Primary (Mock):** `--kk-primary`, weißer Text, Hover dunkler, Radius 16px/Pill, Text "Kostenloses Erstgespräch
  buchen", sichtbar als Platzhalter gekennzeichnet (z. B. Tooltip/Mini-Label "Demo").
- **Secondary:** transparent/hell, Text `--kk-text`, Border `--kk-border`, Text "Programm ansehen" (Scroll zur
  Offer-Section).

---

## 5. Komponenten-Bauplan (Section für Section)

Reihenfolge = Bau-Reihenfolge. Jede Section bekommt `useStaggeredSectionReveal` im Wrapper, Texte aus Dictionary.

1. **Header (sticky):** Wortmarke "KlarKompass", Anker-Nav, Mock-CTA rechts; Mobile Burger (`"use client"`).
2. **Hero:** zweispaltig Desktop / einspaltig Mobile. Links Badge + H1 + Subheadline + 2 CTAs + Trust-Zeile. Rechts
   Bild-/Form-Card mit drei Floating-Cards ("Mehr Klarheit", "Souveräner auftreten", "Nächster Karriereschritt").
3. **Problem:** Headline + 4 Pain-Points (Liste oder 4-Card-Grid).
4. **Ergebnis:** 3 Karten (Klarheit · Kommunikation · Führung), Icon + Headline + Beschreibung.
5. **Methode:** Headline + 4-Schritte-Timeline `01 Standort · 02 Muster · 03 Strategien · 04 Umsetzung`.
6. **Angebot:** große Card auf `--kk-surface`: "Das 8-Wochen Leadership Reset Coaching", Leistungsumfang, "Geeignet
   für", CTA. **Kein Preis.**
7. **Über den Coach:** abstrakte Portrait-Card (kein Fake-Foto), Text "Anna Berger" (fiktiv), drei Werte.
8. **Ablauf:** 4 Schritte Erstgespräch → Standortanalyse → Coaching-Phase → Transfer.
9. **Vertrauen:** 5 Trust-Punkte statt Testimonials; ehrlicher Hinweis, dass hier in einem echten Projekt Kundenstimmen
   stünden.
10. **FAQ:** Accordion, 5 Fragen, nur eine offen, tastaturbedienbar (`"use client"`).
11. **Final CTA:** zentriert, Headline + Mock-CTA.
12. **Footer:** Wortmarke, Nav, sichtbarer Pflicht-Hinweis "Dieses Projekt ist ein fiktives Konzeptprojekt …".

---

## 6. Interaktion & Animation

- Sticky Header mit Scroll-State (`useScrolledHeader`-Muster oder lokal).
- Smooth-Scroll zu Ankern.
- Section-Reveal via `motion` — `klarkompass-reveal/` (`RevealGroup`/`Reveal`, In-View-Stagger). Signature-Motion:
  Hero-Auftritt (Masked-Text-Reveal + Bearing-Line-Draw) und `klarkompass-spine/` (scroll-gebundene `pathLength`) in der
  Methode. Strikt auf `.brandScope` gescoped.
- CTA-Hover-States; FAQ-Accordion mit weicher Höhen-Animation; Hero-Floating-Cards mit gestaffeltem Reveal.
- `prefers-reduced-motion` via `useReducedMotion()` abschalten (statische Variante / `pathLength: 1`). Desktop-only-
  Effekte auf Mobile deaktivieren.

---

## 7. Responsive

Mobile-first; Hero & Über-den-Coach zweispaltig ab Desktop, sonst gestapelt; Grids auf Mobile einspaltig; Touch-Ziele ≥
44px; geprüft bei 360/768/1024/1280.

---

## 8. SEO / A11y / Performance

- `noindex, nofollow`; eine H1 (Hero); saubere Heading-Hierarchie; OG-Tags vorhanden.
- Kontraste (warme Palette) prüfen; Alt-Texte; `aria` für Accordion/Burger; volle Tastaturbedienung; sichtbarer Fokus.
- `next/image` mit Dimensionen; `next/font` (swap); leichte Animationen; Ziel Lighthouse ≥ 90.

---

## 9. Teaser auf der invessiv-Landingpage (Außenkommunikation)

Nach der Pricing-Card auf `/services/landing-page` (zwischen Pricing und FAQ) ein Referenz-Teaser:
Browser-Frame-Screenshot der Demo (Muster aus `/projects`), sichtbar als **Konzeptprojekt** gelabelt, ehrlicher Satz,
Link "Demo ansehen" → `SITE_ROUTES.REFERENCES_KLARKOMPASS`. Sekundäraktion, **nicht** der Haupt-CTA-Text; eigenes
Tracking `cta_click` / `reference`.

Formulierung bewusst als Konzeptprojekt — nicht "Ich habe für Coach Anna Berger eine Landingpage gebaut".

---

## 10. Definition of Done

- [ ] Alle 11 Sections umgesetzt, Copy aus Dictionaries DE + EN (identische Keys)
- [ ] Eigene Marke: KlarKompass-Header/-Footer, `--kk-*`-Tokens lokal gescopt, Serif via `next/font`
- [ ] (Mock-)CTA sichtbar als Platzhalter; keine Fake-Testimonials/-Portraits; kein Preis
- [ ] Footer-Hinweis "fiktives Konzeptprojekt" sichtbar; Seite `noindex`, kein Sitemap-Eintrag
- [ ] Vollständig responsiv (360–1280), `prefers-reduced-motion`, sichtbare Focus-States
- [ ] Teaser auf der Landingpage zwischen Pricing und FAQ, locale-aware Link, Funnel-Tracking ergänzt
- [ ] `pnpm --filter @invessiv/web lint`/`typecheck`/`test`/`build` grün
