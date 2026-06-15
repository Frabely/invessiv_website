# AGENTS.md — apps/web/src/components

Regeln für UI-Komponenten der Web-App. Ergänzt die Root-`AGENTS.md`; bei Konflikt
gilt die spezifischere Datei im Pfad.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Eine Komponente = ein eigenes File (verbindlich)

- **Jede produktive Komponente lebt in einer eigenen Datei** — niemals mehrere
  Komponenten in einer Sammeldatei und keine produktive Komponente als loses
  Inline-Funktion neben einer anderen Komponente.
- Sobald eine Sub-Komponente entsteht (z. B. eine Karte, ein Listenelement, ein
  Panel), wird sie in ein **eigenes File** ausgelagert, statt sie in der
  Eltern-Datei zu belassen. Auslagern passiert spätestens, wenn die Sub-Komponente
  eigenen State, eigene Effekte oder nennenswertes eigenes Markup/Styling hat.
- Reine, triviale Render-Helfer (wenige Zeilen JSX, kein State, nur in genau einer
  Datei genutzt) dürfen lokal bleiben. Im Zweifel: auslagern.

## Ordnerstruktur pro Komponente

- Komponenten werden als **eigener Ordner** angelegt; die Hauptdatei trägt denselben
  Namen wie der Ordner: `component-name/component-name.tsx`.
- Co-located im selben Ordner, sofern benötigt:
  - `component-name.module.css` — Styles (kein Inline-Styling im `.tsx`, keine neuen
    globalen Klassen; siehe Root-`AGENTS.md` → CSS-Regeln).
  - `component-name.test.tsx` — Tests für relevante Logik/Interaktion (mind. ein
    `jsdom`-Test für kritische User-Interaktionen wie Click/Toggle/Locale-Wechsel).
- Sub-Komponenten werden als **Unterordner** der Eltern-Komponente abgelegt:
  `parent/child/child.tsx` (+ `child.module.css`). Jede Komponente besitzt damit ihr
  eigenes, scoped CSS-Modul.

## Typen & Konstanten (verbindlich)

- **Export entscheidet über den Ort.** Typen, Konstanten, Objekt-Maps und Patterns dürfen lokal in der
  Komponenten-Datei (`.tsx`) stehen, **solange sie nicht exportiert werden** (nur in dieser Datei genutzt) — z. B. der
  eigene `XxxProps`-Type, ein lokaler Helfer-Type oder eine datei-interne Map.
- **Sobald ein `export` nötig wird (der Baustein von einer anderen Datei gebraucht wird), wandert er vorher nach**
  `apps/web/common` (bzw. `packages/common` app-übergreifend):
  - Datentypen/DTOs/Shapes → `common/contracts/`
  - String-Unions, Status-/Kind-/Variant-Werte, Event-Namen, Storage-Keys, Maps → `common/constants/`
    (Const-Objekt-Pattern, siehe `packages/common/AGENTS.md`)
  - Default-/Initialwerte → `common/defaults/`
  - Seiteneffektfreie Helfer/Patterns → `common/patterns/`
- Aus einer Komponenten-Datei wird **kein** Typ/keine Konstante/kein Pattern exportiert. Wird ein Domänenkonzept
  (Status, Variante, DTO, Konfig) abgebildet, gehört es ohnehin nach `common`, weil es geteilt wird.

```tsx
// ❌ nicht exportieren aus der Komponente — vorher nach common
export type LeadCardVariant = "default" | "compact";
export const LEAD_CARD_TAG_LIMIT = 5;

// ✅ erlaubt: lokal, nicht exportiert (nur in dieser Datei genutzt)
const MAX_VISIBLE_TAGS = 5;
type SortableColumn = "name" | "created"; // rein lokaler Helfer-Type

// ✅ erlaubt: der eigene Props-Type
interface LeadCardProps {
  lead: LeadDto; // LeadDto aus common/contracts
  variant: LeadCardVariant; // geteilte Variante aus common/constants
}
```

## Wiederverwendbare Komponenten

- Breadcrumbs werden ausschließlich über die zentrale Komponente
  `apps/web/src/components/legal/breadcrumbs/breadcrumbs.tsx` umgesetzt. Seiten/Layouts bauen kein eigenes
  Breadcrumb-Markup nach; bei neuem Bedarf wird die zentrale Komponente erweitert, statt lokale Varianten zu erstellen.

## Verantwortungs-Schnitt

- Layout-/Carousel-/Reveal-Verantwortung des Container-Elements bleibt bei der
  Eltern-Komponente; die Sub-Komponente rendert nur ihr eigenes Innenleben. CSS-Module
  sind pro Datei scoped — Klassen, die der Eltern-Layout-Container braucht
  (z. B. das `<li>`-Item eines Grids/Carousels), gehören ins Eltern-Modul.
- Keine Business-/Daten-Logik in UI-Komponenten verstecken; Daten kommen aufbereitet
  über Props (Content aus Dictionaries, siehe Root-`AGENTS.md` → i18n).

## Client vs. Server

- Server Components sind Default; `"use client"` nur bei Interaktivität (State, Effekte,
  Event-Handler, Browser-APIs).
- Wird nur eine Sub-Komponente interaktiv, erhält **nur diese** das `"use client"`,
  damit der statische Teil Server-Component bleiben kann.

## Animationen / Effektbibliothek

- Unter `animation_mockups/` (Repo-Root) liegt eine Bibliothek wiederverwendbarer Animations-/Interaktions-Mockups; der
  Katalog `animation_mockups/effects-catalog.json` beschreibt Effekte inkl. Use-Cases.
- **Als Ressource nutzen, nicht als Pflicht-Gate:** Wenn ein vorhandener Effekt klar zum Ziel passt, ihn bevorzugt
  wiederverwenden oder als Basis adaptieren, statt einen sehr ähnlichen Effekt neu zu bauen. Es gibt keine Pflicht, vor
  jeder UI-Änderung die Bibliothek zu durchsuchen, und keinen Vorrang vor besserem, maßgeschneidertem Design (vgl.
  Branding-Ziel „Wiedererkennungswert, keine Default-Implementierungen").
- Lohnt sich ein neuer, allgemein nützlicher Effekt, wird er als eigenständiges Einzel-Mockup unter
  `animation_mockups/<effekt-name>/` abgelegt (eigener Ordner, eigene `index.html`, bei Bedarf `styles.css`/`script.js`)
  und im `effects-catalog.json` ergänzt — keine Sammeldateien mit mehreren Effekten.
- Desktop-only-Effekte auf Mobile deaktivieren oder durch mobile-taugliche Alternativen ersetzen; Performance und
  Lesbarkeit vor dekorativen Effekten.

## Checks vor Abschluss

- `pnpm -r typecheck`, `pnpm -r lint` grün.
- In der `.tsx` wird kein Typ/keine Konstante/kein Pattern exportiert; nicht-exportierte lokale Bausteine dürfen
  bleiben, alles Geteilte liegt in `common`.
- Betroffene `*.test.tsx` grün; neue interaktive Komponente bekommt einen Test.
- Mobile-first geprüft (360 px), Dark/Light konsistent, sichtbare Focus-States.
