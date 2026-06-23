# Ergebnis-Section — Redesign „Die Kurslinie / Peilkarte"

Komplette Neugestaltung der Results-Section (`kk-results`, „Ergebnis") als Gegenstück zum Problem-Kompass.
Verworfen: altes 3-Karten-Grid (`results-section.tsx` + `.module.css`).

## Konzept

Die vier Probleme waren ein irrender Kompass-Zeiger. Die Lösung ist ein **geplotteter Kurs**: von „Wo du jetzt
stehst" über drei geordnete Fixes (Klarheit → Kommunikation → Führung) bis „Kurs liegt an". Ordnung trägt Bedeutung
(erst Klarheit, dann Kommunikation, dann Führung), darum sind die Etappen nummeriert.

Bewusst **anderes Gerät** als die anderen Signature-Sections: Problem = Kompass-Dial, Methode = vertikale
Bearing-Line/Spine, Ergebnis = **2D-Peilkarte** (Graticule, Kompassrose, Position-Fixes, Leg-Peilungen).

## Aufbau (spiegelt Problem-Section: Graphic + Liste)

- **Kartusche** (Kopf): Eyebrow + H2 + Lead, dezent gerahmt wie ein Karten-Titelblock.
- **Body-Grid** (mobile-first, 1 Spalte → ≥880px 2 Spalten `Karte | Liste`):
  - **CourseChart** (lokale Komponente, SVG, sprachneutral): Graticule-Hairlines, Kompassrose als Ornament,
    geplante Route gestrichelt, durchgezogene Route zeichnet sich beim Scrollen (`useScroll`→`pathLength`),
    Position-Fix-Marker (⊕) an Start + 3 Wegpunkten, Leg-Peilungen (Azimut), Ziel-Fix in Grün (Signatur-Highlight).
    Fixes leuchten via `useTransform`-Schwellen auf, sobald die Route sie erreicht.
  - **Wegpunkt-Liste**: Start-Label, 3 Karten (Index 01–03 + Peilung-Chip + Mini-Fix-Symbol + Titel + Beschreibung),
    Ziel-Tag auf Karte 03. `RevealGroup`/`Reveal`-Stagger.

## Daten / i18n

- SVG bleibt **sprachneutral** (nur Zahlen/Grad/Symbole) → keine i18n im Chart.
- Content erweitert: `lead`, `startLabel`, `destinationTag` neu; `items` (3 Wegpunkte: Titel + Beschreibung) bleibt.
- Route-Koordinaten, Leg-Peilungen, Indizes = datei-lokale Konstanten in `results-section.tsx` (nicht exportiert,
  wie `POINT_HEADINGS` in Problem).

## Motion / A11y

- Eine orchestrierte Geste: die Route plottet sich beim Scrollen, Fixes rasten nacheinander ein. Sonst ruhig.
- `prefers-reduced-motion`: Route voll gezeichnet (`pathLength: 1`), alle Fixes sichtbar, kein Scroll-Effekt.
- Nur `transform`/`opacity`/`pathLength`. Sichtbare Focus-States (kein interaktives Element außer ggf. keine).
  Farbe nie alleiniges Signal (Index/Peilung/Symbol zusätzlich). Mobile-first, kein Horizontal-Scroll, Body ≥16px.

## Gates

`pnpm --filter @invessiv/web typecheck` + `lint` grün; visuelle Prüfung Desktop + 360px.
