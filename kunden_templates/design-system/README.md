# Design System Generator (Seeded)

Dieses Modul erzeugt aus einem `seed` unterschiedlich aussehende Landing-Mockups, ohne die Conversion-Logik zu brechen.

## Dateien
- `design-config.json`: Tokens, Varianten, Gewichte, Guardrails, Kompatibilitaeten
- `landing-generator.js`: Seeded Auswahl + HTML-Generierung

## Aufruf
```bash
node kunden_templates/design-system/landing-generator.js --seed "kunde-01-v1" --out "kunden_templates/mockups/landing_kunde_01_v1.html"
```

## Was variiert
- Theme (Farbe, Typo, Radius)
- Layout-Pattern (Hero/Trust/Pricing/FAQ)
- Komponentenstil (Navigation, Karten)
- Effekte (Parallax, Sticky-CTA, Stagger-Reveal, Scroll-Progress, Tilt)
- Ornamentik (Grid/Blobs/Mesh/Noise)

## Guardrails
- Maximal 1 starker Effekt pro Variante
- Maximal 3 Effekte insgesamt
- Effekt-Kompatibilitaet wird geprueft (`parallax-hero` inkompatibel mit `tilt-cards`)
- CTA-Flow bleibt stabil (primaer + sekundaer above-the-fold)

## Empfehlung fuer euren Flow
1. Pro Kunde 3 Seeds bauen (`-v1`, `-v2`, `-v3`)
2. Beste Variante auswaehlen
3. Inhalte und echtes Logo einpflegen
4. Optional in Next.js/Tailwind uebernehmen
