# Referenzseite neu: Problem → Lösung → Ergebnis → Kundenstimme

## Context

Die Referenzseite (`/[locale]/references`, apps/web) ist zu textlastig und unübersichtlich:

- Der Hero hat zwei konkurrierende Einleitungen (links Eyebrow, H1, Intro, 3 Highlights und eine Notiz; rechts noch einmal Eyebrow, H2 und Beschreibung).
- Jede Projektkarte hat rund 10 Textblöcke (Kicker, Kategorie, Summary, Fokus, Bausteine, Outcomes, langes Zitat).
- Die Felder überschneiden sich inhaltlich. Die Struktur folgt nicht der Frage, die Besucher sich stellen.

Ziel ist, dass Besucher in Sekunden verstehen: Welches Problem gab es, wie wurde es gelöst, was ist das Ergebnis und was sagt der Kunde. Die H1 „Webdesign Referenzen“ passt nicht zur Tonalität der Seite (Du-Form, direkte Fragen) und wird ersetzt. Das Keyword bleibt in Meta-Title und Description.

Entscheidungen des Users:

- Hero = **Projekt-Index**: knappe H1 plus ein Satz, darunter klickbare Projekt-Kacheln als Sprungmarken.
- H1 im **Frage-Stil**.
- Das **Ergebnis** wird visuell gezeigt, weil beide Seiten frisch gelauncht sind und es keine Zahlen gibt. Dafür gibt es 2–3 Section-Screenshots pro Projekt, ein Bild groß und Thumbnails zum Wechseln.
- **Originalzitate werden nicht gekürzt.** Ein Kernsatz wird hervorgehoben, das ganze Zitat bleibt ausklappbar.
- **Consumption Trial** bleibt per Flag ausgeblendet, wird aber ins neue Schema überführt.

## Vorgehen

0. Branch `feat/references-redesign` von `master` anlegen. Kein Auto-Commit, der User committet selbst.
   Diesen Plan nach `plans/web/references-redesign.md` übernehmen und `apps/web/src/components/marketing/references/AGENTS.md` (+ `CLAUDE.md` mit `@AGENTS.md`) anlegen. Darin steht:
   - die 4-Schritt-Struktur
   - die Regel, dass Zitate nie gekürzt werden und der Kernsatz ein exakter Teilstring des Zitats ist
   - Screenshots kommen nur über das Skript
1. Skills: `frontend-design` für den Umbau, `copywriting` für die gesamte Copy und Meta.

### 1. Datenmodell (Dictionary + Contracts)

`apps/web/src/i18n/dictionaries/marketing/references.{de,en}.json` neu strukturieren:

- `hero`: `title` (H1), `intro` (1 Satz), `indexLabel` (aria-Label der Kachelliste). Es entfallen `kicker`, `highlights`, `supportingNote` und der komplette `sectionIntro`.
- `labels`: `problem`, `solution`, `result`, `voice`, `scope` („Was genau umgesetzt wurde“), `galleryLabel`, `showShot`, `collapseQuote`, `expandQuote`.
- Pro Projekt: `imageKey`, `clientName`, `industry`, `title` (H2), `problem`, `solution`, `result` (je **ein** Satz mit höchstens ~18 Wörtern), `shots: [{ shotKey, caption, alt }]` (2–3 Einträge), `scope: string[]` (ausklappbar), `linkLabel`, `href`, `imageAlt`.
  Es entfallen `kicker`, `category`, `summary`, `focus*`, `deliverables*` und `outcomes*`.

`reference-testimonials.{de,en}.json`: optionales Feld `highlight` pro Eintrag. Es muss ein **exakter Teilstring** von `quote` sein, der Test sichert das ab.

Typen verschieben: Neue bzw. geänderte Shapes gehen nach `apps/web/common/contracts/marketing/` (z. B. `reference-case-study.ts`, `reference-shot.ts`, benannte Untertypen statt Indexed Access). `references.ts` behält nur Loader und Mapping. Shot-Keys als Const-Objekt in `apps/web/common/constants/marketing/reference-shot-key.ts`, Bild-Map `REFERENCE_SHOT_IMAGES` neben `reference-images.ts`.

### 2. Screenshots

Neues Skript `apps/web/scripts/capture-reference-shots.mjs` nach dem Muster von `generate-og-images.mjs`:

- Es fotografiert per Playwright einzelne Sections der Live-Seiten (allmacher-coaching.de, kolja-wienigk.de) über Section-Selektoren. Die Section-Namen kommen aus den Repos unter `C:\Users\MoritzDesktop\Invessiv\repos\…`:
  - Allmacher: `IntroSequence`, `HighlightsSection` (USP), `TrainerSection`
  - Kolja: `hero`, `problem-solution`, `services`/`usp`
- Desktop-Breite fix, Ausgabe nach `apps/web/src/assets/references/<key>/<shot>.png`. Danach visuell prüfen.
- Das bestehende Hauptbild (`reference-allmacher.png` usw.) bleibt der erste Shot.

### 3. Komponenten (`apps/web/src/components/marketing/references/references-page/`)

- `references-hero/` (Server) mit Breadcrumbs (zentrale Komponente), H1, Intro und dem Unterordner `reference-index-card/`. Jede Kachel ist ein `<a href="#<REFERENCE_SECTION_IDS[key]>">` mit kleinem Bild (`next/image`), Kundenname und Branche. Die Projekte werden wie bisher über das Consumption-Flag gefiltert.
- `reference-project-card/` wird umgebaut. Das Layout ist zweispaltig, mobil gestapelt:
  - **Links:** H2, dann `reference-case-story/` als `<dl>` mit 3 Zeilen (Problem, Lösung, Ergebnis), dann der Live-Link (bestehendes Analytics-Attribut `ReferenceOpened` bleibt), dann die Kundenstimme.
  - **Rechts:** `reference-result-gallery/` (`"use client"`, nur diese Komponente). Das große Bild liegt im bestehenden `ReferenceProjectFrame`, darunter 2–3 Thumbnail-Buttons (`aria-pressed`, sichtbarer Fokus, Bildunterschrift unter dem großen Bild).
  - Darunter `reference-scope-details/` als natives `<details>`/`<summary>` (Text bleibt im HTML, gut für SEO, kein JS).
  - `ReferenceProjectFrame` bekommt `src` statt nur `imageKey`.
- Kundenstimme: Das geteilte `shared/reference-testimonial/` bekommt eine optionale `highlight`-Prop. Ist sie gesetzt, erscheint der Kernsatz groß als Pull-Quote und darunter „Ganzes Zitat lesen“ (bestehender Expand-Mechanismus). Die Home-Section bleibt unverändert, solange sie die Prop nicht nutzt.
- `references-page.tsx` setzt nur noch Hero, Projekte und Closing-CTA zusammen. `SectionReachTracker`-IDs bleiben gleich.
- `references-page.module.css` aufräumen: Klassen für `heroAside`, `sectionTitle`, `supportingNote` und `heroHighlights` entfernen.
- Mobile-first ab 360 px, Dark/Light, `prefers-reduced-motion` für den Bildwechsel.

### 4. SEO

- `references-meta.{de,en}.json`:
  - Title `Webdesign-Referenzen | Invessiv` (Konvention „Seitenthema | Brand“)
  - Description neu, Du-Ton, mit Chemnitz, Ausgangslage, Lösung, Kundenstimmen und „live ansehen“
- OG-Copy anpassen und `node apps/web/scripts/generate-og-images.mjs` neu ausführen (DE + EN, 1200×630).
- `lib/seo/references-structured-data.ts`:
  - `description` = `solution`, `name` = `title`
  - `image` = erster Shot
  - optional `review` pro CreativeWork (Autor + vollständiges Zitat)
- Genau eine H1 bleibt erhalten, Projekte als H2.

### Copy-Entwürfe (DE, finale Fassung mit `copywriting`, EN parallel)

- **Hero H1:** „Wie sieht das bei anderen aus?“
- **Intro:** „Was vorher gefehlt hat, was wir gebaut haben und was meine Kunden dazu sagen. Jede Seite kannst du dir live ansehen.“
- **Allmacher:**
  - Problem: „Ein starkes Verhandlungsseminar, aber kein Ort, der Führungskräften schnell zeigt, warum es sich lohnt.“
  - Lösung: „Eine Seminarseite, die Inhalt, Trainer und Tickets in klarer Reihenfolge erzählt und direkt zur Anfrage führt.“
  - Ergebnis: „Ein Auftritt, der Dr. Allmacher als Trainer nach vorn stellt und das Seminar auf einen Blick greifbar macht.“
  - Kernsatz: „Eigene Ideen werden ernst genommen, konstruktiv weiterentwickelt und zuverlässig umgesetzt.“
- **Kolja:**
  - Problem: „Finanzthemen wirken schnell kompliziert, und Interessenten brauchen Vertrauen, bevor sie anfragen.“
  - Lösung: „Ein ruhiger Auftritt, der Leistungen verständlich ordnet und Schritt für Schritt zum Kontakt führt.“
  - Ergebnis: „Eine Seite, die seriös wirkt, schnell Orientierung gibt und Anfragen sauber vorbereitet.“
  - Kernsatz: „Von Anfang an hatte ich das Gefühl, dass wirklich verstanden wurde, was ich mit meiner Website erreichen möchte.“

## Kritische Dateien

- `apps/web/src/app/[locale]/(marketing)/references/page.tsx`: Count-Ersetzung in den Highlights entfernen, Flag-Filter bleibt
- `apps/web/src/components/marketing/references/references-page/**`
- `apps/web/src/components/marketing/shared/reference-testimonial/reference-testimonial.tsx`
- `apps/web/src/i18n/dictionaries/marketing/references*.json`, `references.ts`, `reference-testimonials*.json`
- `apps/web/common/contracts/marketing/`, `apps/web/common/constants/marketing/`
- `apps/web/src/lib/seo/references-structured-data.ts`
- `apps/web/scripts/capture-reference-shots.mjs` (neu), `generate-og-images.mjs`

## Verifikation

- Tests anpassen/ergänzen:
  - `references-page.test.tsx`: eine H1, Index-Links zeigen auf die Section-IDs
  - `reference-project-card.test.tsx`: 3 Story-Zeilen, Scope in `<details>`
  - neu `reference-result-gallery.test.tsx` (jsdom): Thumbnail-Klick wechselt Bild und Caption, `aria-pressed`
  - `reference-testimonial.test.tsx`: Highlight plus Expand
  - Dictionary-Test: `highlight` ist Teilstring von `quote`, DE/EN-Keys identisch
  - `references-structured-data.test.ts`
- `pnpm lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/web build`.
- Sichtprüfung per Playwright-MCP auf `/de/references` und `/en/references`:
  - 360 px / 768 px / 1440 px, Dark und Light
  - Tastatur: Kacheln → Story → Link → Galerie-Buttons → Details → Zitat; Fokus sichtbar
  - Kontrast
- Lighthouse mobil > 90 (zusätzliche Bilder lazy, nur das erste Bild priority).
- OG-Bilder DE und EN visuell prüfen.

## Umsetzungsstand (23.10.2026)

Gebaut auf `feat/references-redesign`, ungecommittet. Abweichungen vom Plan:

- **OG-Bild nicht neu erzeugt.** Die OG-Felder (`imageTitle`, `imageKicker`, …) sind unverändert; geändert wurden nur
  Meta-Title und Description. Das Layout hängt ` | Invessiv` per Template an.
- **Kein `review` in den Structured Data.** Google wertet selbst eingebundene Kundenstimmen als „self-serving“.
  `description` ist jetzt die Lösungszeile, das Bild bleibt das Hauptbild.
- **Bild-Priorität** liegt bei der ersten Hero-Kachel; die Galerie-Bilder laden lazy.
- **Tab-Reihenfolge Desktop:** H2 → Galerie-Thumbnails (rechte Spalte) → Live-Link → Details → Zitat. Die DOM-Reihenfolge
  folgt bewusst der Mobilansicht (Story → Bild → Aktionen → Stimme).

Offen: Sichtprüfung durch den User, Lighthouse mobil, ggf. Shots nach Relaunch der Kundenseiten neu erzeugen.
