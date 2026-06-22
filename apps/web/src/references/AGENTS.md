# AGENTS.md — apps/web/src/references

Regeln für **Referenz-/Demo-Seiten** (fiktive Konzeptprojekte zur Demonstration von Design-, Copy- und
Conversion-Bandbreite). Ergänzt die Root- und `components/`-`AGENTS.md`; bei Konflikt gilt die spezifischere Datei.

## Grundprinzip: self-contained & löschbar (verbindlich)

- Eine Referenz ist **Wegwerf-Demo-Code**. Ziel: Sie lässt sich später in **einem Zug** entfernen, wenn sie durch eine
  echte Referenz ersetzt wird.
- Pro Marke **ein einziger, in sich geschlossener Ordner** `apps/web/src/references/<slug>/`, der **alles**
  Marken-Spezifische bündelt: Komponenten, Dictionaries, Constants, Assets, Plan, Landing-Teaser.
- Unvermeidbare Verdrahtung im App-Code (Next-Route, Landing-Teaser-Einbindung, Section-ID, `SITE_ROUTES`) bleibt
  **minimal** und wird mit `// reference demo glue → @/references/<slug> (Entfernen: siehe README)` markiert. Jede
  Referenz hat eine `README.md` mit exakter Entfernungs-Checkliste.

## Zweck & Ehrlichkeit (verbindlich)

- Referenz-Seiten zeigen eine **fiktive Marke** als Konzept. Sie dürfen **nie** einen realen Kundenauftrag vortäuschen.
- Pflicht: sichtbarer Hinweis "fiktives Konzeptprojekt" im Footer der Demo **und** ein als **Mock** gekennzeichneter
  CTA (kein echtes Buchungs-/Conversion-Ziel).
- Verboten: erfundene Testimonials, Fake-Portraits realer Personen, Preisnennung, unbelegter Social Proof.

## Eigenständige Marke

- Eine Referenz-Demo tritt als **eigene Marke** auf: **eigener** Header/Footer der Demo, **nicht** der globale
  invessiv-`SiteHeader`/`FooterSection`.
- Eigene Optik ist erwünscht (Wiedererkennungswert). Fixe Marken-Optik, **kein** `[data-theme]`-Theme-Switch.

## Tokens lokal scopen (verbindlich)

- Marken-Tokens werden **lokal gescopt** unter einer `.brandScope`-Klasse im Orchestrator-`*.module.css`
  (Präfix pro Marke, z. B. `--kk-*` für KlarKompass). **Keine** Marken-Tokens in `globals.css`.
- Alle Section-Module der Demo konsumieren **nur** die gescopten Marken-Tokens, nie die globalen invessiv-Tokens.

## Ordnerstruktur pro Referenz

```
apps/web/src/references/<slug>/
├── README.md                 # Beschreibung + Entfernungs-Checkliste der Glue-Stellen
├── components/               # Orchestrator (<marke>-page/), eigener Header/Footer, je Section ein Unterordner
│   └── …                     # + wiederverwendbare Motion-Bausteine (z. B. *-reveal/, *-spine/), co-located *.module.css
├── landing-teaser/           # die Teaser-Section, die auf der Haupt-Landingpage auf die Demo verlinkt
├── i18n/                     # content/, meta/, landing-teaser/ — je {index.ts, de.json, en.json}, DE+EN identische Keys
├── constants/                # feature-lokale Konstanten (z. B. section-ids.ts)
├── assets/                   # Demo-Bilder (Preview etc.)
└── plans/                    # Brief / Umsetzungsplan der Demo
```

- Eine Komponente = eine Datei (siehe `components/AGENTS.md`). Texte ausschließlich aus den `i18n/`-Dictionaries, keine
  Inline-Strings in `.tsx`. Erlaubt: page-weite `content/`-Dictionary mit Section-Namespaces **oder**
  per-Section-Ordner;
  `meta/` bleibt immer getrennt. Wird `content` zu groß, fachlich aufteilen.

## Bewusste Abweichungen von Projekt-Konventionen (dokumentiert)

Zugunsten der Ein-Ordner-Löschbarkeit weicht eine Referenz bewusst von zwei globalen Regeln ab. Beide sind auf den
Demo-Scope begrenzt, Risiko gering, keine Produktiv-Konvention außerhalb betroffen:

1. **Dictionaries liegen im Feature-Ordner (`<slug>/i18n/`) statt unter `src/i18n/dictionaries/`** (vgl.
   i18n-`AGENTS.md`). Unkritisch, weil Demo-Dictionaries über **direkte Getter** geladen werden
   (`get…Content(locale)`) und **keine** zentrale `get-dictionary`-Registry berühren.
2. **Feature-lokale exportierte Konstanten (`<slug>/constants/`) statt `apps/web/common/`** (vgl. „export → common").
   Unkritisch, weil sie nur innerhalb des Features genutzt werden und mit ihm gelöscht werden.

Geteilte Typen, die **dauerhaft** über Referenzen hinaus gebraucht würden, gehören weiterhin nach
`apps/web/common/` — nicht in den löschbaren Feature-Ordner.

## Routing & SEO

- Route unter `/[locale]/references/<marke>` (englischer Slug), Pfad aus `SITE_ROUTES`. Die `page.tsx` bleibt
  technisch im App-Router (`app/[locale]/(marketing)/references/<slug>/`) und ist eine markierte Glue-Datei, die nur
  Orchestrator + Meta aus `@/references/<slug>` einbindet.
- Demo ist `noindex, nofollow`, **kein** `sitemap.ts`-Eintrag. OG-Tags bleiben fürs Teilen erhalten.

## Interaktion & Motion

- Animationsbibliothek ist `motion` (`motion/react`, vormals framer-motion; siehe `components/AGENTS.md`). Reveal-/
  Scroll-/Signature-Animationen einer Demo laufen über `motion`, **strikt auf den `.brandScope` der Demo gescoped**.
  Der globale `useStaggeredSectionReveal`-Hook bleibt der invessiv-Hauptlandingpage vorbehalten — Demos nutzen ihn
  nicht.
- Wiederverwendbare Motion-Bausteine als **Komponenten** kapseln (z. B. KlarKompass: `klarkompass-reveal/` mit
  `RevealGroup`/`Reveal` für gestaffelte In-View-Reveals, `klarkompass-spine/` für die scroll-gebundene „Bearing-Line").
  **Varianten-Objekte bleiben datei-lokal** (kein Export von Konstanten/Patterns aus `.tsx`).
- `prefers-reduced-motion` immer respektieren (`useReducedMotion()` → statische Variante / `pathLength: 1`); keine
  layout-verschiebenden Animationen, nur `transform`/`opacity`/`pathLength`.
- Server Components default; `"use client"` nur für interaktive/motion-nutzende Teile (Burger, Accordion, Scroll-State,
  Reveal/Spine). Orchestrator (`<marke>-page/`) bleibt Server-Component und reicht Props/Content durch.
- Mobile-first (360px), sichtbare Focus-States, WCAG AA Kontraste, genau eine H1.

## Design-Sprache (KlarKompass-Referenz)

- Verbindliche Richtung „Grounded Bearings“: warm-heller Sand/Creme-Canvas (`#ECE0C8`, tief `#E3D4B6`), Karten in
  Creme (`#F7F0E1`), dunkle Tinte (`#2A1D12` / Body `#41301D`). Warme Akzentfamilie Gold (`--kk-signal #BD7F2A`),
  Amber (`#C98A4A`), Sandton (`#D5C2A8`), Tonbraun/Clay (`#A9795B`), Rindenbraun (`#6B4937`). **Grün (`#2F7D5B`) ist
  KEINE Basisfläche, sondern CTA + Signatur-Highlight.**
- **Eine durchgehende Hintergrundfläche (verbindlich):** Die Content-Sections liegen auf **einem** durchgehenden
  Sand/Creme-Canvas (`--kk-base` → `--kk-base-deep`); **kein** flächiger Hell/Dunkel-Wechsel pro Section. **Hero (Foto)
  und Footer bleiben dunkle Anker** (`--kk-anchor` / `--kk-anchor-deep`) mit heller Tinte – sie rahmen den hellen
  Body. Die warmen Markenfarben (Gold, Amber, Sand) erscheinen als **Akzente**: dezente, vertikal verteilte
  Gold-/Sand-Glows (plus dosierter Grün-Schimmer), dunkle Hairlines, hell angehobene Creme-Karten (`--kk-card`).
  Conversion-Karten (Angebot, Final-CTA) tragen einen markanteren Gold-Glow.
- **Grün als CTA + Signatur (verbindlich):** Das Logo-Grün ist die **primäre Aktionsfarbe** – CTAs sind Grün
  (`--kk-cta` `#2B7254`, Hover `#23624A`) mit warm-heller Tinte – und trägt zusätzlich die Kompass-Signatur
  (Bearing-Line/Spine, Hero-Rail), das Logo-Mark, einzelne Marker und den sichtbaren Fokus-Ring (`--kk-focus`). Grün
  **nie** als Section- oder Karten-Grundfläche. Lime (`#C8F169`) bleibt aktiven Kompassmarkern vorbehalten; keine
  großflächigen Lime-Flächen.
- Display-Font ist **Fraunces** (`--kk-font-display`), Fließtext/UI bleibt **DM Sans** (`--kk-font-sans`).
  Headlines wirken organisch-editorial, UI und längere Texte bleiben ruhig und präzise.
- Signature bleibt die Kompassspur: Bearing-Line, XXL-Azimutwerte (`01°…04°`) und Prozessnummern führen durch die
  Seite. Das Hero-Foto behält seine natürlichen Farben und erhält nur einen zurückhaltenden dunklen Scrim für
  Lesbarkeit sowie eine asymmetrische Textkomposition.
