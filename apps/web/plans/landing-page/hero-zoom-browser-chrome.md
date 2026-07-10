# Hero-Zoom: Browser-Mockup-Rahmen um die Mini-Webseite

Status: umgesetzt und verifiziert (Gates grün, manuelle Playwright-Prüfung bestanden)
Datum: 2026-07-09
Baut auf: `hero-zoom-scroll-rebuild.md`

## Kontext & Ziel

Die Mini-Webseite im Hero-Zoom soll wie ein echtes Browser-Fenster aussehen: Fensterleiste (Ampel-Punkte, URL-Pill
„invessiv.com") oben, dezenter Ring um das sichtbare Fenster. Der Mockup-Rahmen wächst mit dem Zoom mit und
**verschwindet vollständig**, bevor die Webseite volle Größe erreicht — im `native`-Zustand existiert er nicht mehr.
(Ein früherer Ansatz mit dauerhaftem Seitenrahmen wurde verworfen.)

## Ansatz: Screen-Space-Overlay (kein Eingriff in Frame-Transform/Clip)

Neues dekoratives Element `HeroZoomChrome` als Geschwister des Frames in der Stage:

```
<div class=stage>
  <div class=heroPin>…</div>
  <div class=spacer />
  <div class=frame>…</div>
  <HeroZoomChrome />          ← NEU: position fixed, aria-hidden, pointer-events none
</div>
```

- **Screen-Space:** Der Hook kennt pro rAF das sichtbare Fenster-Rect des Frames in Viewport-Koordinaten
  (`targetX/targetY`, `frameWidth·scale`, `visibleLocalHeight·scale`). Er schreibt es als CSS-Variablen auf die
  Stage; das Chrome-Overlay ist `position: fixed` und folgt dem Fenster exakt — ohne Skalierungs-Kompensation
  (alle Chrome-Maße sind konstante Bildschirm-Pixel) und ohne vom `clip-path` des Frames beschnitten zu werden.
- **Verschwinden:** Eigene Fade-Range `HERO_ZOOM_CHROME_FADE_RANGE` (0.65 → 0.9): Opacity 0 deutlich vor dem
  Handoff. Sichtbar (`display: block`) nur im Zustand `pinned`; in `pending`/`idle`/`native` `display: none` →
  Fallbacks byte-identisch, nach der Animation keinerlei Rest.
- Der Ring übernimmt den Bildschirm-Radius des Clips (`clipRadiusPx · scale` = `RADIUS·(1−e)`), die Leiste sitzt
  mit `bottom: 100%` über dem Fenster.

## Umsetzung

### 1. Konstanten (`common/constants/marketing/hero-zoom.ts`)

`HERO_ZOOM_CHROME_FADE_RANGE: HeroZoomProgressRange = { start: 0.65, end: 0.9 }`

### 2. Geometrie (Contract + `common/patterns/marketing/hero-zoom-geometry.ts`)

`HeroZoomFrameStyle` erweitert um das Chrome-Fenster in Viewport-Koordinaten:

- `chromeLeftPx = targetX`, `chromeTopPx = targetY`
- `chromeWidthPx = frameWidth · scale`, `chromeHeightPx = visibleLocalHeight · scale`
- `chromeRadiusPx = clipRadiusPx · scale`
- `chromeOpacity = fadeOutOverRange(progress, HERO_ZOOM_CHROME_FADE_RANGE)`

Invarianten (Tests): bei p=0 entspricht das Chrome-Rect exakt dem Placeholder-Rect, Radius =
`HERO_ZOOM_FRAME_RADIUS_PX`,
Opacity 1; bei p=1 Opacity 0 und Radius 0; Opacity bereits 0 ab p ≥ 0.9.

### 3. Hook (`src/hooks/marketing/use-hero-zoom.ts`)

Lokale Variablen-Konstanten (Pattern `HERO_FADE_VARIABLE`): `--hero-zoom-chrome-x/-y/-w/-h/-radius/-opacity`.
`applyPinned` schreibt sie pro Frame; `enterIdle`, `enterNative` und der Effect-Cleanup entfernen sie
(gemeinsames `clearChromeVariables`).

### 4. Komponente (`…/hero-zoom-stage/hero-zoom-chrome/`)

Server-Komponente `hero-zoom-chrome.tsx` + `hero-zoom-chrome.module.css`, `aria-hidden`, `pointer-events: none`:

- Container = Fenster-Rect aus den Variablen, 1px-Ring (`--color-border`-Ton), Radius-Variable, weicher Schatten,
  Opacity-Variable, `z-index` über dem Frame.
- Leiste (`bottom: 100%`, Höhe ~38px, Surface-Hintergrund, oben gerundet): drei Ampel-Punkte + URL-Pill
  „invessiv.com" (Domain, nicht sprachabhängig → kein Dictionary-Eintrag).
- Sichtbarkeit über Stage-CSS: nur `data-zoom-state="pinned"`.

### 5. Tests

- Geometrie-Invarianten (siehe oben).
- Stage-jsdom: Chrome gerendert (`aria-hidden`), `pinned` setzt die Chrome-Variablen, `native` entfernt sie.

## Geänderte Dateien

| Datei                                                                       | Änderung                                   |
| --------------------------------------------------------------------------- | ------------------------------------------ |
| `apps/web/common/constants/marketing/hero-zoom.ts`                          | Chrome-Fade-Range                          |
| `apps/web/common/contracts/marketing/hero-zoom-geometry.ts`                 | Chrome-Felder in `HeroZoomFrameStyle`      |
| `apps/web/common/patterns/marketing/hero-zoom-geometry.ts` (+ `.test.ts`)   | Chrome-Rect/-Opacity + Invarianten-Tests   |
| `apps/web/src/hooks/marketing/use-hero-zoom.ts`                             | Chrome-Variablen schreiben & räumen        |
| `…/hero-zoom-stage/hero-zoom-stage.tsx` (+ `.module.css`, `.test.tsx`)      | Chrome mounten + Zustands-CSS + Assertions |
| `…/hero-zoom-stage/hero-zoom-chrome/hero-zoom-chrome.tsx` (+ `.module.css`) | neue dekorative Komponente                 |

## Verifikation (Gates: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`; KEINE Commits — User committet)

Dev-Server + Playwright (1440×900): p=0 Browser-Mockup um die Mini (Leiste + Ring + Radius); p ∈ {0.3, 0.6}
Rahmen folgt dem Fenster; p ≥ 0.9 Chrome vollständig unsichtbar; `native` keine Chrome-Variablen, `display: none`;
Reverse stellt das Mockup wieder her; Mobile 375×800 und Deep-Link `#pricing` unverändert; Dark + Light.

## Risiken / bewusste Entscheidungen

1. `position: fixed` setzt voraus, dass kein Vorfahr der Stage einen Transform/Filter hat (re-basing) — auf der
   Landing-Route ist `<main>` transformfrei (der Zoom-Transform liegt auf dem Frame selbst); im Browser verifizieren.
2. Flache Leisten-Unterkante über den (mit `1−e` schrumpfenden) gerundeten Fenster-Ecken kann Mikro-Kerben zeigen —
   bei p=0 deckt der Placeholder dahinter identisch ab; visuell verifizieren, ggf. im Polish anpassen.
3. Ampel-Punkte in Signalfarben sind bewusste Mockup-Sprache (sofort als Browser lesbar), kein irreführendes UI —
   Overlay ist `aria-hidden` + nicht interaktiv.
