# Hero-Zoom-Umbau der Landingpage `/services/landing-page`

Status: geplant (User-approved), Umsetzung in Arbeit
Datum: 2026-07-09

## Kontext & Ziel

Der Hero der Landingpage zeigt rechts aktuell die abstrakte `HeroVisual`-SVG-Grafik. Stattdessen soll dort eine \*
\*Mini-Version der tatsächlichen Landingpage** stehen — echtes DOM, einmal gerendert, kein Mockup/iframe/Screenshot. Beim
Scrollen scrollt nicht die Seite, sondern die Mini wächst per Scroll-Fortschritt auf Vollbild; am Animationsende steht
`#solution` (ProblemSolutionSection) in natürlicher Größe am Viewport-Top und ab da ist das Scrollen **komplett nativ
** (nahtloser Handoff, Transform vollständig entfernt). Rückwärts-Scrollen kehrt die Animation um. Einzige tolerierte
Doppelung: eine dekorative Hero-Replik oben im Mini-Frame (aria-hidden + inert, **kein zweites h1\*\*).

Gates: Desktop-only (Zoom nur bei `pointer: fine` + `min-width: 901px` + `no-preference` reduced-motion);
Mobile/Reduced-Motion/No-JS/Deep-Links erhalten die heutige normale Seite unverändert.

## Architektur: Inverse-Transform auf In-Flow-Content (kein DOM-Swap, kein Scroll-Jump)

Kernidee: Der Frame (Replik + alle echten Sections) bleibt **immer im normalen Dokumentfluss**. Während der Zoom-Phase
bekommt er einen Transform (translate + scale, origin top-left), der ihn visuell in die rechte Hero-Spalte setzt; der
Transform interpoliert scroll-getrieben exakt zur Identität, wenn die natürliche Fluss-Position den Viewport erreicht.
Da Transform das Layout nie beeinflusst, stimmt die Dokumenthöhe immer — der Handoff ist ein No-Op.

DOM in `<main class="marketing-main landing-main">`:

```
<LandingFunnelTracker />                        (Position unverändert)
<HeroZoomStage                                  client ("use client")
  heroSlot={<HeroSection … visualSlot={<HeroZoomPlaceholder/>} />}   server-gerendert
  frameSlot={<>
    <HeroZoomReplica …heroContent />            server, aria-hidden + inert, kein h1, keine id
    <ProblemSolutionSection/> … <FooterSection/>  unveränderte Server-Sections
  </>}
/>
```

`HeroZoomStage` rendert:

```
<div class=stage data-zoom-state="pending" (overflow-anchor: none)>
  <div class=heroPin>       ← position: sticky; top: 0; z-index: 1; spannt die GANZE Stage
    {heroSlot}                (Opacity via --hero-zoom-hero-fade)
  </div>
  <div class=zoomSpacer />  ← height: var(--hero-zoom-spacer, 0px); im Zoom-Modus ~40svh
  <div class=frame ref inert>  ← z-index: 2; normaler Fluss; Transform/Clip nur solange gepinnt
    <div class=frameBackdrop aria-hidden />  ← opaker Seitenhintergrund, faded nahe p=1 aus
    {frameSlot}
  </div>
</div>
```

Gegen den Code validierte Eckpunkte:

- **Sticky-Hero spannt die ganze Stage** — ein „Track, danach Frame"-Layout kann den Hero nicht bis zum Handoff pinnen (
  Sticky würde vorher releasen).
- **Entkoppelte Zoom-Dauer (bewusst kurz):** Der Zoom vollendet, sobald die Frame-Oberkante die Viewport-Oberkante
  erreicht — also nach **einer** Viewport-/Hero-Höhe (`scaleEnd = frameTop`), nicht erst wenn `#solution` oben steht. Am
  Handoff steht die volle Hero (Replik) formatfüllend; ab dann natives Scrollen ins Content. Damit ist die Zoom-Dauer
  von
  der Replik-/Seitenhöhe entkoppelt und spürbar kürzer. Die frühere Kopplung `s_end = frameTop + R − M` (Zoom endet erst
  bei `#solution`) war für die volle Replik-Höhe zu lang.
- **clip-path ist funktional, nicht kosmetisch:** Der Frame ist ~10.000px hoch; der Clip begrenzt die
  gemalte/kompositierte Fläche (Perf).
- **Transform-Clearing bei p≥1 mit leerem String** (`""`, niemals `translate3d(0,0,0) scale(1)`, kein verbleibendes
  `will-change`) — sonst re-basen die Sticky-Elemente `trust-section.module.css:515` (`.intro`) und
  `faq-section.module.css:48` (`.heading`) auf den Frame statt auf den Viewport.
- SSR/`pending`/`idle`-CSS = heutige Seite byte-identisch (Replik `display:none`, Spacer 0, kein Transform, Placeholder
  zeigt Fallback-`HeroVisual`). Kein Dead-Space ohne JS.
- Header (fixed, außerhalb `<main>`) und Consent-Banner (fixed, Sibling unter `ConsentProvider`) sind sicher, weil der
  Transform innerhalb `<main>` bleibt.
- Mini hat keinen Header (SiteHeader liegt außerhalb) — der echte fixe Header schwebt über der Animation; konsistent.

## Geometrie-/Handoff-Vertrag (pure Functions, unit-getestet)

Alle Inputs layout-basiert (transform-unabhängig, via `offsetTop`-Kette), neu gemessen bei
Mount/Resize/Orientation/ResizeObserver auf dem Frame (rAF-throttled):

```
V = innerHeight; yFrame = Layout-Top des Frames (= Hero-/Pin-Höhe); Hf = frame.offsetHeight
Placeholder-Rect (gepinnt = Viewport-Koordinaten): Tp, Lp, Wp, Hp; Lf = Frame-Layout-Left

scaleEnd = yFrame                      (Zoom fertig, sobald Frame-Oberkante = Viewport-Oberkante)
p(s)   = clamp(s / scaleEnd, 0, 1);  e(p) Easing mit e(0)=0, e(1)=1 exakt
k0     = Wp / Wf;  k(p) = k0 + (1−k0)·e(p)
naturalTop(s) = yFrame − s             (Layout-Position der Frame-Oberkante im Viewport)
renderedTop = Tp·(1−e) + naturalTop·e; renderedLeft = Lp·(1−e) + Lf·e
tx = renderedLeft − Lf;  ty = renderedTop − naturalTop
transform: translate3d(tx, ty, 0) scale(k);  origin: top left
hVis(p) = (Hp/k0)·(1−e) + V·e
clip-path: inset(0 0 max(0, Hf−hVis)px 0 round r(p));  r(p) = (RADIUS·(1−e))/k
heroFade: 1→0 über p∈[0.60,0.85];  backdropFade: 1→0 über p∈[0.85,0.98]
```

Invarianten (Tests): bei p=1 gilt tx=ty=0, k=1, naturalTop=0 (Frame-Oberkante am Viewport-Top), Clip-Unterkante exakt
am Viewport-Bottom, Radius 0, Fades 0 → Clearing ist visuell ein No-Op. Bei p=0 entspricht das visuelle Frame-Rect dem
Placeholder-Rect. **Mini-Hintergrund:** Der dekorative Replik-Hero rendert **ohne** Vignette/Noise/Grid, damit die Mini
den normalen `--bg` zeigt (die Vignette ist für den Video-Hero gedacht und würde ohne Video grau wirken).

## State-Machine (`data-zoom-state` + Window-Event)

`pending → (idle | pinned)` einmalig, danach `pinned ⇄ native` (Hysterese: re-pin bei p < 0.999):

- **pending:** SSR + erster Client-Frame, Fallback-Styling.
- **Aktivierung (Effect, einmal):** nur wenn `matchMedia(DESKTOP_FINE_POINTER_MOTION_MEDIA_QUERY).matches` (kanonisches
  Gate aus `use-hero-visual-tilt.ts:14-16`, als Konstante extrahiert) UND `scrollY ≤ 0.5·V` UND `location.hash === ""`.
  Sonst → **idle** für diesen Page-View. Media-Query-`change` deaktiviert zu idle (Inline-Styles räumen).
- **pinned (p<1):** rAF schreibt `transform`/`clip-path`/Fade-Vars; `will-change: transform`; **`inert` auf dem Frame
  ** (kein Fokus/Klick/Analytics in der Mini; React 19: `inert` als Boolean-Prop). Hero interaktiv, Hero-`section_view`
  feuert normal.
- **native (p≥1):** `transform`/`clipPath`/`willChange` = `""`; `inert` entfernen; heroPin `visibility: hidden` (Opacity
  war schon 0). Scroll-Momentum bleibt erhalten (Dokumenthöhe unverändert).
- **Reverse:** p unter Schwelle → pinned wiederherstellen (Werte kontinuierlich → nahtlos).
- Jeder Wechsel dispatcht `window`-CustomEvent `LANDING_HERO_ZOOM_STATE_EVENT` (`"invessiv:landing-hero-zoom-state"`,
  detail `{ state }`).

`motion` (installiert, `motion/react`, erster Adopter lt. AGENTS.md): `useScroll` + `useMotionValueEvent`, **ohne
Spring/Smoothing** (Transform muss exakte Funktion von scrollY sein) + imperative Style-Writes.

## Analytics-Gating (Funnel-Misfire verhindern)

- `useSectionFunnelTracking(eventName, sectionIds, enabled = true)`: neuer optionaler Param; Effect no-opt bis
  `enabled`; Default hält alle anderen Aufrufer identisch.
- Neu `useHeroZoomTrackingGate()` (src/hooks/analytics/): liest `data-zoom-state` beim Mount + abonniert das
  State-Event; released bei state ∈ {idle, native} oder wenn keine Stage existiert.
- `LandingFunnelTracker`: Hero-ID mit `enabled: true` (feuert immer beim Load); die restlichen 7 IDs gegated. Beim
  Handoff feuert `solution` sofort (korrekt — User ist dort), Rest beim Erreichen, je genau einmal.
- Klick-Analytics in der Mini können nicht doppelt feuern (Frame `inert`); Replik trägt keine `data-analytics-*` und
  rendert CTAs als nicht-interaktive Elemente.

## Anchor-Navigation-Fix

- `lib/navigation/anchor-scroll.ts`: neu `getLayoutDocumentTop(element)` — `offsetTop`-Summe über die `offsetParent`
  -Kette (layout-basiert, transform-immun).
- `use-anchor-offset-scroll.ts` `scrollToHashTarget` (aktuell Zeile 76–80 rect-basiert → mid-zoom verzerrt): auf
  `getLayoutDocumentTop(target) − offset` umstellen. Ergebnis: Anker-Klicks während der Pin-Phase landen korrekt; der
  Smooth-Scroll spult den Zoom unterwegs zu Ende; `#solution`-Links landen bei `s_end + (M − scrollMargin)` → nativ,
  interaktiv. Bestehende Tests aktualisieren.

## Hero-Replik & Hero-Section-Änderungen

- `HeroSection` neue Props: `visualSlot?: ReactNode` (ersetzt `<HeroVisual/>` in der rechten Grid-Zelle, wenn gesetzt)
  und `decorative?: boolean`. Decorative: keine `id` (kein doppeltes `#hero`!), `<h1>` → `<p>` mit identischen Klassen,
  CTAs als `<span>` ohne `data-analytics-*`, Hintergrund-Video bleibt (gleiches gecachtes Asset; Perf-Fallback:
  statisches Poster), `HeroVisual` mit deaktiviertem Tilt in der rechten Spalte.
- `useHeroVisualTilt(shotRef, enabled = true)` + `HeroVisual` optional `decorative?: boolean`. Home bleibt unberührt (
  Prop-Defaults).
- `HeroZoomReplica` (server, Subfolder der Stage): `<div aria-hidden inert>` um `<HeroSection decorative …/>`.
- Landing-Mobile (≤900px): Placeholder-Spalte komplett versteckt → HeroVisual entfällt auf der Landing-Mobile (war dort
  below-the-fold); Home unverändert.
- i18n: voraussichtlich keine neuen sichtbaren Strings; falls Review ein `aria-label` für den Frame will →
  `dictionaries/landing/hero/{de,en}.json` parallel.

## Neue Dateien

| Pfad                                                                                                          | Verantwortung                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/plans/landing-page/hero-zoom-scroll-rebuild.md`                                                     | dieses Design-Doc                                                                                                                                                 |
| `apps/web/common/constants/marketing/hero-zoom.ts` (+ `.test.ts`)                                             | `HERO_ZOOM_STATE` Const-Objekt + Type, `HERO_ZOOM_HANDOFF_MARGIN_PX`, Aktivierungs-Ratio, Fade-Fenster, Radius, Attribut-Namen; Re-Export in `marketing/index.ts` |
| `apps/web/common/constants/marketing/desktop-pointer-media-query.ts`                                          | `DESKTOP_FINE_POINTER_MOTION_MEDIA_QUERY` (aus Tilt-Hook extrahiert)                                                                                              |
| `apps/web/common/constants/events/hero-zoom-state-event.ts`                                                   | `LANDING_HERO_ZOOM_STATE_EVENT`; Re-Export in `events/index.ts`                                                                                                   |
| `apps/web/common/contracts/marketing/hero-zoom-geometry.ts`                                                   | Geometry-Input/Output/FrameStyle-Types                                                                                                                            |
| `apps/web/common/patterns/marketing/hero-zoom-geometry.ts` (+ `.test.ts`)                                     | Pure Math (Vertrag oben): `computeHeroZoomGeometry`, `computeHeroZoomProgress`, `computeHeroZoomFrameStyle`                                                       |
| `apps/web/src/hooks/marketing/use-hero-zoom.ts` (+ `.test.ts`)                                                | Gate/Aktivierung, Messung (Offset-Ketten, ResizeObserver), `useScroll` + rAF-Writes, State-Machine, Event-Dispatch, inert/visibility, Cleanup                     |
| `apps/web/src/hooks/analytics/use-hero-zoom-tracking-gate.ts` (+ `.test.ts`)                                  | Release-Signal fürs gegatete Funnel-Tracking                                                                                                                      |
| `apps/web/src/components/marketing/landing/hero-zoom-stage/hero-zoom-stage.tsx` + `.module.css` + `.test.tsx` | Client-Stage: heroPin/Spacer/Frame/Backdrop, Slots, State-Attribut, Fallback-CSS                                                                                  |
| `…/hero-zoom-stage/hero-zoom-placeholder/hero-zoom-placeholder.tsx` + `.module.css`                           | Server-Placeholder (Mess-Ziel, ~16/10, min-height wie `.visual`), enthält Fallback-`HeroVisual`; hidden ≤900px                                                    |
| `…/hero-zoom-stage/hero-zoom-replica/hero-zoom-replica.tsx` + `.module.css`                                   | Server-Replik-Wrapper                                                                                                                                             |

## Geänderte Dateien

- `apps/web/src/components/marketing/landing/landing-page/landing-page.tsx` — Umbau auf Stage/Slots (Sections bleiben
  Server-Components, Props unverändert)
- `apps/web/src/components/marketing/home/sections/hero-section/hero-section.tsx` (+ Test, ggf. CSS) — `visualSlot`,
  `decorative`
- `apps/web/src/components/marketing/hero-visual/hero-visual.tsx`,
  `apps/web/src/hooks/marketing/use-hero-visual-tilt.ts` — `enabled`-Param + geteilte Media-Query-Konstante
- `apps/web/src/hooks/marketing/use-anchor-offset-scroll.ts`, `apps/web/src/lib/navigation/anchor-scroll.ts` (+ Tests) —
  layout-basierter Anchor-Top
- `apps/web/src/hooks/analytics/use-section-funnel-tracking.ts`,
  `…/landing-funnel-tracker/landing-funnel-tracker.tsx` (+ Test) — Gating
- `apps/web/src/components/marketing/landing/landing-page/landing-page.test.tsx` — Hero-Visual-Stub-Assertion ersetzen (
  Placeholder + Replik aria-hidden, genau ein h1, kein doppeltes `#hero`, Section-Reihenfolge, Form-Submit-Regression)
- Barrel-Files `common/constants/{events,marketing}/index.ts`

## Schritt-Reihenfolge (jeder Schritt einzeln verifizierbar; Gates: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`,

`pnpm --filter @invessiv/web build`; KEINE Commits — User committet selbst)

1. Dieses Design-Doc
2. Geteilte Konstanten (Media-Query, Event, Hero-Zoom) + Tilt-Hook-Refactor auf die Konstante — null Verhaltensänderung
3. Anchor-Scroll-Layout-Fix + Tests — eigenständige Verbesserung, heute schon via Header-Nav prüfbar
4. Funnel-Tracking `enabled`-Param (Default true) + Tests — null Verhaltensänderung
5. `HeroSection` `visualSlot`/`decorative` + `HeroVisual`/Tilt `enabled` + Tests — ungenutzte Props, Seiten unverändert
6. Geometry-Pattern-Modul + Invarianten-Unit-Tests
7. Replik- + Placeholder-Komponenten + Render-Tests (noch nirgends gemountet)
8. `use-hero-zoom` + `HeroZoomStage` + Landing-Umbau + Tracker-Gating + aktualisierter `landing-page.test.tsx` — Feature
   live; beide Locales automatisch synchron (gemeinsamer Orchestrator, keine Copy-Änderung)
9. Polish: Fade/Spacer/Easing-Tuning, Hysterese, `contain`-Experimente, Placeholder-Swap-Fade
10. Verifikation (unten)

## Testplan

- **Unit (vitest):** Geometrie-Invarianten (p=1-Identität, Clip-Bottom am Viewport); `getLayoutDocumentTop` mit
  gemockter offsetParent-Kette; Funnel-Hook-Gating (keine Observer solange disabled, feuert je einmal); Tracking-Gate (
  pending → Event `native` released; fehlende Stage released); `use-hero-zoom` mit gemocktem `matchMedia`/`scrollY` (
  idle bei Mobile-Query/Hash/gescrollt, pinned auf Desktop-Top, Transform-Clearing + inert-Entfernung + Event bei p≥1)
- **jsdom:** `HeroZoomStage` (beide Slots, `pending` bei SSR, Frame inert in pinned); Replik (aria-hidden, inert, kein
  h1, kein `id="hero"`, keine `data-analytics-*`, nichts fokussierbar); Hero-Section decorative/visualSlot;
  Landing-Skeleton-Test (ein h1, Reihenfolge, Form-Submit)

## Manuelle Verifikation (Dev-Server + Playwright MCP, 1440×900)

1. `/de/services/landing-page` laden: Hero-Text links, Mini-Live-Seite rechts (Screenshot); genau ein `h1`;
   `querySelectorAll('#hero').length === 1`
2. Scroll zu p ∈ {0.25, 0.5, 0.75}: Screenshots (Smoothness/Clip/Radius); Frame hat Transform + `inert`; Hero faded
   planmäßig
3. Scroll zu `s_end + 50`: `#solution`-Position korrekt, `getComputedStyle(frame).transform === "none"`, kein
   `will-change`, kein `inert`; Screenshot identisch zu Hard-Reload an gleicher Position (nahtloser Handoff); weiter
   scrollen: Trust-`.intro` und FAQ-`.heading` sticken korrekt
4. Reverse: zurück zu 0 — Hero wiederhergestellt, Mini im Placeholder, keine Sprünge
5. Anker mid-zoom: bei p≈0.3 Hero-Secondary-CTA (`#process`) → korrekte Position, State native, FAQ klickbar; Header-Nav
   `#solution` interaktiv
6. Funnel: Conversion-Transport monkeypatchen; `hero` feuert beim Load, nichts während pinned, `solution` genau einmal
   beim Handoff, Rest beim Erreichen; Reverse+Forward feuert nicht erneut
7. Formular: `#contact` post-handoff ausfüllen + submitten → Success-Redirect (Regression, Ads-Conversion-Pfad)
8. Mobile 375×800 → idle, normaler Flow, kein Spacer/Replik, Tracking sofort
9. Reduced-Motion-Kontext → idle-Fallback
10. Deep-Link `#pricing` → idle, korrekte Position; SSR-HTML: Replik vorhanden aber per Default-CSS versteckt, Spacer 0
11. Perf: FPS beim Scrub, Compositor-Layer-Memory des Frames, LCP < 2s unverändert (Hero server-gerendert, untouched);
    Light + Dark Theme; EN-Locale Spot-Check

## Offene Risiken (bewusst akzeptiert / im Polish messen)

1. Compositor-Memory/FPS des transformierten Frames — clip-path begrenzt den Layer, muss aber gemessen werden (
   Mitigations: `contain: layout paint`, will-change-Scope, Spacer-Cap)
2. Zwei Autoplay-Videos während pinned (Hero + Replik, gleiches Asset) — Fallback: statisches Poster in decorative
3. Sticky-Elemente in der Mini verhalten sich während der Pin-Phase statisch — meist außerhalb des Clip-Fensters;
   korrigiert sich beim Handoff
4. h1 verlässt nach Handoff den Accessibility-Tree (heroPin hidden) — entspricht „vorbeigescrollt"; akzeptiert
5. Scrollbar-Semantik während pinned (Daumen bewegt sich, Hero steht) — inhärent bei Scroll-Scrub
6. Easing/Fade-Fenster/Spacer sind Geschmacksparameter — als Konstanten zentralisiert für den Polish-Schritt
