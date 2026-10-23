# AGENTS.md — Referenzseite (`/[locale]/references`)

Ergänzt `apps/web/src/components/AGENTS.md` und die Marketing-Routen-Regeln.

## Aufbau einer Referenz (verbindlich)

- Jede Referenz folgt derselben Reihenfolge: **Problem → Lösung → Ergebnis → Kundenstimme**.
- Problem, Lösung und Ergebnis sind je **ein Satz** (max. 20 Wörter, per Test abgesichert). Keine zusätzlichen
  Fließtext-Felder wie Summary oder Fokus wieder einführen.
- Das Ergebnis wird visuell belegt: 2–3 Section-Screenshots pro Projekt (`shots`) mit kurzem Label und einer
  Bildunterschrift. Solange keine belastbaren Zahlen vorliegen, keine Kennzahlen behaupten.
- Details zum Leistungsumfang (`scope`) bleiben hinter einem nativen `<details>` eingeklappt.

## Kundenstimmen

- Originalzitate (`reference-testimonials.*.json` → `quote`) werden **nie gekürzt oder umformuliert**.
- Der hervorgehobene Kernsatz (`highlight`) ist ein **exakter Teilstring** des Zitats; der Test in
  `src/i18n/dictionaries/marketing/references.test.ts` sichert das ab. Das vollständige Zitat bleibt ausklappbar.

## Screenshots

- Section-Screenshots entstehen ausschließlich über `node apps/web/scripts/capture-reference-shots.mjs` (Live-Seiten,
  1280 × 934, Light-Mode, reduzierte Bewegung) und liegen unter `apps/web/assets/references/<projekt>/`.
- Neue Shots: Eintrag im Skript, Key in `REFERENCE_SHOT_KEY`, Bild in `REFERENCE_SHOT_IMAGES`, Texte in DE und EN.

## Hero

- Der Hero ist ein bildschirmhoher Projekt-Index (ab 900 px `min-height`): links H1 im Frage-Stil und ein Satz Intro,
  rechts pro Projekt eine Karte mit Collage aus den ersten drei `shots` (Übersicht vorn) und Name/Branche direkt
  darunter in derselben Karte. Die Karte ist der Sprunglink zur Referenz. Keine zweite Einleitung daneben.
- Das Keyword „Webdesign-Referenzen“ steht in Meta-Title und Description, nicht zwingend in der H1.
