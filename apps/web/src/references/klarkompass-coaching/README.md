# KlarKompass Coaching — Referenz-Demo

**Fiktives Konzeptprojekt** (keine echte Marke, kein realer Kundenauftrag) zur Demonstration von Design-, Copy- und
Conversion-Bandbreite. Eigene Marke „KlarKompass Coaching", eigene Optik („Grounded Bearings"): **durchgehender
heller Sand/Creme-Canvas** für die Content-Sections, **Hero (Foto) und Footer als dunkle Anker**. Gold/Amber/Sand nur
als Akzente (Glows, Hairlines, getönte Karten). **Grün ist CTA + Highlight** (Bearing-Line, Logo, Marker), nie
Grundfläche. Eigener Header/Footer, `noindex, nofollow`, Mock-CTA. Konventionen: `apps/web/src/references/AGENTS.md`.

Route: `/[locale]/references/klarkompass-coaching` (DE + EN). Auf der Haupt-Landingpage verlinkt die
`landing-teaser/`-Section auf die Demo.

Die verbindliche Designrichtung mit Palette, Typografie, Flächenlogik, CTA-Regeln und Kompass-Signatur steht in
`apps/web/src/references/AGENTS.md` unter „Design-Sprache (KlarKompass-Referenz)“.

## Aufbau (alles Marken-Spezifische liegt in diesem Ordner)

| Pfad                                                    | Inhalt                                                                                                                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/`                                           | Orchestrator (`klarkompass-page/`), Sektionen, eigener Header/Footer, Motion-Bausteine (`klarkompass-reveal/`, `klarkompass-spine/`), `klarkompass-eyebrow/`, `klarkompass-cta/` |
| `landing-teaser/`                                       | Teaser-Section für die Haupt-Landingpage (`reference-section.tsx`)                                                                                                               |
| `i18n/content/` · `i18n/meta/` · `i18n/landing-teaser/` | DE/EN-Dictionaries (geladen über direkte Getter)                                                                                                                                 |
| `constants/section-ids.ts`                              | Anker-IDs + Nav-Reihenfolge der Demo                                                                                                                                             |
| `assets/klarkompass-preview.png`                        | Preview-Bild für den Landing-Teaser                                                                                                                                              |
| `plans/`                                                | Brief + Umsetzungsplan                                                                                                                                                           |

## Entfernen (wenn durch eine echte Referenz ersetzt)

Alles Marken-Spezifische ist in **diesem Ordner** gebündelt. Im App-Code bleiben nur wenige, mit
`// reference demo glue → @/references/klarkompass-coaching` markierte Stellen. Zum vollständigen Entfernen:

1. **Diesen Ordner löschen:** `apps/web/src/references/klarkompass-coaching/`.
2. **Route-Ordner löschen:** `apps/web/src/app/[locale]/(marketing)/references/klarkompass-coaching/`
   (und das übergeordnete `references/`, falls danach leer).
3. **`apps/web/src/components/marketing/landing/landing-page/landing-page.tsx`:** Import von `ReferenceSection` und
   `getLandingReferenceContent`, die `const reference = …`-Zeile sowie den `<ReferenceSection … />`-Block entfernen.
4. **`apps/web/src/config/navigation/landing.ts`** (+ `landing.test.ts`): `reference`-Eintrag aus
   `LANDING_SECTION_IDS` und `LANDING_FUNNEL_SECTION_IDS` entfernen.
5. **`apps/web/src/config/routes.ts`** (+ `routes.test.ts`): `REFERENCES_KLARKOMPASS` aus `SITE_ROUTES` entfernen.
6. **Optional:** `motion` aus `apps/web/package.json` entfernen, falls kein anderes Feature `motion/react` nutzt
   (vorher per Suche prüfen).

Danach `pnpm --filter @invessiv/web typecheck && pnpm --filter @invessiv/web test` laufen lassen.

> Hinweis: Wird die Referenz-**Infrastruktur** (Teaser-Section auf der Landingpage, Route-Muster) für eine echte
> Referenz beibehalten und nur der Inhalt getauscht, genügt es, einen neuen `<slug>/`-Ordner nach demselben Muster
> anzulegen und die Glue-Stellen auf den neuen Slug umzubiegen, statt sie zu entfernen.
