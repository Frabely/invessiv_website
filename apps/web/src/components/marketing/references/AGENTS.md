# AGENTS.md — Referenzseite (`/[locale]/references`)

Ergänzt `apps/web/src/components/AGENTS.md` und die Marketing-Routen-Regeln.

## Aufbau einer Referenz (verbindlich)

- Jede Referenz folgt derselben Reihenfolge: **Problem → Lösung → Ergebnis → Kundenstimme**.
- Problem, Lösung und Ergebnis sind je **ein Satz** (max. 20 Wörter, per Test abgesichert). Keine zusätzlichen
  Fließtext-Felder wie Summary oder Fokus wieder einführen.
- Das Ergebnis wird visuell belegt: 2–3 Section-Screenshots pro Projekt (`shots`) mit kurzem Label und einer
  Bildunterschrift. Solange keine belastbaren Zahlen vorliegen, keine Kennzahlen behaupten.
- Der Leistungsumfang (`scope`, 2–4 kurze Stichpunkte, großgeschrieben) steht sichtbar als Liste direkt unter dem
  Lösungssatz in der Zeile „Lösung“, nicht eingeklappt und nicht als loser Block unter dem Live-Link.

## Kundenstimmen

- Originalzitate (`reference-testimonials.*.json` → `quote`) werden **nie gekürzt oder umformuliert**.
- Der hervorgehobene Kernsatz (`highlight`) ist ein **exakter Teilstring** des Zitats; der Test in
  `src/i18n/dictionaries/marketing/references.test.ts` sichert das ab. Das vollständige Zitat bleibt ausklappbar.

## Screenshots

- Section-Screenshots werden manuell erstellt und liegen unter `apps/web/assets/references/<projekt>/`. Querformat im
  Seitenverhältnis 1280 × 934 beibehalten, damit Galerie-Frame und Collage passen.
- Neue Shots: Key in `REFERENCE_SHOT_KEY`, Bild in `REFERENCE_SHOT_IMAGES`, Label/Bildunterschrift/Alt in DE und EN.
  Bildunterschriften beim Austausch eines Bildes mitprüfen.

## Hero

- Der Hero ist ein bildschirmhoher Projekt-Index (ab 900 px `min-height`): links H1 im Frage-Stil, darunter drei kurze Fragen
  (gefehlt → entstanden → Kunden) mit hervorgehobenem Kernwort (`lead`/`keyword`/`trail`) und ein Satz Hinweis,
  rechts pro Projekt eine Karte mit Collage aus den ersten drei `shots` (Übersicht vorn) und Name/Branche direkt
  darunter in derselben Karte. Die Karte ist der Sprunglink zur Referenz. Keine zweite Einleitung daneben.
- Das Keyword „Webdesign-Referenzen“ steht in Meta-Title, Description und als `kicker` über der H1. Der Kicker nutzt
  die geteilte `EyebrowPill` (`components/shared/eyebrow-pill/`), kein eigenes Kicker-Markup.
- Die drei Hero-Fragen heben ihr Kernwort mit einem blauen Marker (`--color-cta`) hervor.

## Home-Referenzabschnitt

- Die Home zeigt die Referenzen untereinander statt per Tab-Wechsel, die Collage abwechselnd links und rechts
  (`home/sections/references-section/reference-teaser/`). Pro Referenz: Branche, Name, Ergebniszeile, Kernsatz und
  Link zur Detailstelle auf der Referenzseite.
- Inhalte kommen ausschließlich aus dem Referenz-Dictionary; `home.ts` pflegt nur Auswahl/Reihenfolge
  (`referenceKeys`) und den Linktext. Die Collage ist geteilt unter `marketing/shared/reference-collage/`.
