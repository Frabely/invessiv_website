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

## Checks vor Abschluss

- `npm run typecheck`, `npm run lint` grün.
- Betroffene `*.test.tsx` grün; neue interaktive Komponente bekommt einen Test.
- Mobile-first geprüft (360 px), Dark/Light konsistent, sichtbare Focus-States.
