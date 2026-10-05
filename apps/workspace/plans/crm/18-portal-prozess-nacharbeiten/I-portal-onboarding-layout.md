# Portal-Onboardingbogen: Layout, Fortschritt, Mobil

## Context

Der Bogen im Kundenportal (`/portal/[customerId]/onboarding/[formId]`) bleibt eine Seite, nutzt den Platz aber schlecht:
eine zentrierte 48rem-Spalte, einspaltige Felder, eine Schrittleiste, die nur leer/50 %/voll kennt, und eine Fußleiste
ohne Seitenabstand in der falschen Hintergrundfarbe. Der Portal-Header ist zu hoch und bricht mobil um.

Ziel: Der Bogen nutzt Desktop-Breite mit mehrspaltigen Feldern, zeigt Fortschritt und Gültigkeit je Schritt ehrlich,
hat einen kompakten sticky Kopf und eine saubere sticky Fußleiste und ist mobil gut bedienbar. Der Portal-Header wird
niedriger und mobil auf Logo, Theme, Sprache, Profil und Menü reduziert (erster Schritt zu „jede Portalseite mobil
sauber“).

Entscheidungen des Nutzers:

- Rot erst nach Verlassen eines begonnenen Schritts mit fehlender Pflicht, oder bei ungültiger Eingabe.
- Titel und Zurück in einen sticky Bogen-Kopf in der Seite (kein Umbau des globalen Headers dafür).
- Mobil: Menü-Button wie auf der Website für Firma, Projekt, Begrüßung.
- Mobil: Schrittleiste bleibt horizontal scrollbar.

Beim Lesen gefunden (wird mit behoben):

- `.main` der `PortalShell` ist der Scroll-Container; `window.scrollTo({ top: 0 })` im Editor wirkt daher nicht.
- Die Fußleiste nutzt `--color-bg`, die Shell `--color-surface-1`; daher der Farbbruch.
- `.main` reserviert auf jeder Seite 4.25rem rechts für den Chat-Dock, den nur das Dashboard rendert.

## Vorab (Projektregeln)

1. Branch `feat/portal-onboarding-layout` von `master` bzw. vom aktuellen Stand, kein Commit durch mich.
2. Plan als `apps/workspace/plans/crm/<nächster-ordner>/…-portal-onboarding-layout.md` ablegen und den
   Onboarding-Abschnitt in `apps/workspace/src/components/portal/AGENTS.md` anpassen (Schrittleiste, Spaltenregel,
   Bogen-Kopf, Mobil-Header), bevor Code entsteht.
3. Copy über Skill `copywriting`, DE (Du-Form) und EN parallel.

## 1. Fortschritt je Schritt (Logik)

**`packages/common/src/patterns/crm/questionnaire/questionnaire-completeness.ts`** bleibt die einzige Stelle, die
zählt. `QuestionnaireBlockProgress` (`contracts/crm/questionnaire/questionnaire-block-progress.ts`) bekommt additiv:

- `answered` / `total`: alle sichtbaren Fragen des Blocks, nicht nur Pflicht. Eine Gruppe zählt als eine Frage
  (beantwortet mit ≥ 1 Eintrag), dazu ihre sichtbaren Unterfelder je Eintrag.
- Zählung in `visit()` über die vorhandenen `hasAnswer` / `countItems`; `evaluate` und `missing` bleiben unverändert,
  damit Server-Prüfung und CRM sich nicht ändern. Tests in `questionnaire-completeness.test.ts` ergänzen.

**`apps/workspace/src/common/patterns/portal/onboarding-step-progress.ts`** wird zur Statusentscheidung (ersetzt
Empty/Partial/Complete für das Portal), Rückgabe `{ ratio, tone, valid }`:

| Zustand       | Bedingung                                                                                | Darstellung                                               |
| ------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Unberührt     | `answered === 0`                                                                         | leere Spur, warm-neutral (`--color-accent-warm` gedämpft) |
| Unvollständig | begonnen, Rest s. u.                                                                     | blaue Füllung `answered/total` (`--color-cta`)            |
| Erledigt      | `answered === total`                                                                     | volle grüne Füllung (`--color-success`)                   |
| Achtung       | ungültige Eingabe im Schritt, oder begonnen + Pflicht fehlt + nicht der aktuelle Schritt | rote Füllung (`--color-danger`) + Ausrufezeichen          |

- `valid` = keine Pflicht fehlt und nichts ungültig → Haken am Label, auch bei blau („so absendbar, aber nicht
  vollständig“) und bei unberührten Schritten ohne Pflichtfragen. Farbe ist nie das einzige Signal (Icon + Zähler
  `3/10` + `aria-label` mit ausgeschriebenem Status).
- Ungültige Eingaben je Block aus `autosave.invalid` (Slot-Keys → Block über `onboardingAnswerDrafts.indexFields`).
- Neue Konstante `ProcessStepTone` (`neutral | info | success | danger`) in `packages/common/src/constants/ui/`, Test dazu.

## 2. `ProcessTrack` erweitern (`packages/ui/src/components/process-track/`)

Opt-in, CRM-Nutzung (`project-overview`) bleibt unverändert:

- `ProcessTrackStep` (`packages/common/src/contracts/ui/process-track-step.ts`): optional `ratio` (0–1), `tone`,
  `detail` (z. B. „3/10“), `statusLabel` (Screenreader), `valid`.
- Füllung ohne Inline-Style: Segment als SVG (`viewBox="0 0 100 1"`, `preserveAspectRatio="none"`, `<rect width>`),
  Farbe über `data-tone`. Übergang nur unter `prefers-reduced-motion: no-preference`.
- Neue Prop `density="compact"`: Label einzeilig mit Ellipsis (`title` trägt den vollen Text), Zähler daneben, kein
  eigener Rahmen/Kasten mehr (der Bogen-Kopf ist der Rahmen).
- Aktueller Schritt: kräftiger Rahmen + fetter Titel; Prüfschritt ohne Zähler.
- jsdom-Tests für ratio/tone/valid ergänzen.

## 3. Sticky Bogen-Kopf

Neue Komponente `components/portal/onboarding/onboarding-form-header/` (rendert in `onboarding-form-view`, auch in der
Leseansicht, dort ohne Schrittleiste):

- Zeile 1: Zurück als Icon-Link mit Text „Überblick“ (44 px Ziel, `PortalBackLink` um kompakte Variante erweitern),
  `h1` einzeilig mit Ellipsis, rechts Gesamtstand „12 von 30 beantwortet“ und Chip „Absendbar“ (grün, Haken), sobald
  `missing` leer ist, sonst „3 Pflichtangaben offen“.
- Zeile 2: `OnboardingStepTrack` kompakt. Der bisherige `OnboardingProgressBar` in der Leiste entfällt (bleibt im
  Prüfschritt und im CRM).
- `position: sticky; top: 0` im `.main`-Scroller, Hintergrund `--color-surface-1`, Unterkante als Linie, die erst beim
  Scrollen sichtbar wird; negative Seitenränder, damit er bündig bis an den Rand läuft.
- Damit der Kopf den Stand kennt, hebt `onboarding-form-view` nichts an: Der Editor rendert den Kopf selbst über einen
  Slot (`header`-Render-Prop), die Leseansicht rendert ihn ohne Track.

## 4. Volle Breite und mehrspaltige Felder

- `onboarding-form-view.module.css`: `max-width: 48rem` entfällt; Seite nutzt die volle Breite mit Obergrenze ~104rem,
  linksbündig. Texte (`intro`, Hinweise) behalten 62ch.
- `onboarding-block-step`: `.fields` wird Container (`container-type: inline-size`) mit 12er-Raster; jede Frage sitzt
  in einem Wrapper mit `data-span`. Spalten folgen der verfügbaren Breite (Container Queries): 1 Spalte < 40rem,
  2 ab 40rem, 3 ab 64rem, 4 ab 96rem.
- Neuer Helfer `common/patterns/portal/onboarding-field-span.ts` (+ Test), Konstante `OnboardingFieldSpan`
  (`narrow | wide | full`):
  - `narrow` (1 Spalte): Kurztext, E-Mail, Telefon, URL, Farbe, Ja/Nein, Auswahl mit ≤ 4 Optionen, Bestätigung.
  - `wide` (2 Spalten): Langtext, Auswahl/Mehrfachauswahl mit vielen Optionen, Skala.
  - `full`: Gruppe, Dateien, Projektleistungen.
- DOM-Reihenfolge bleibt die Fragenreihenfolge (Tab-Reihenfolge = Lesereihenfolge, zeilenweise). `align-items: start`,
  damit Hilfetexte und Fehler keine Nachbarn strecken.
- Gruppen (`onboarding-group-field.module.css`): Unterfelder je Eintrag im selben Raster über denselben Helfer.
- Leseansicht (eingereicht/abgeschlossen): Status, Terminkarte und Hinweise links als schmale Spalte, Antworten rechts;
  unter 64rem untereinander. `OnboardingAnswerReadView` selbst bleibt unverändert (geteilt mit dem CRM).

## 5. Sticky Fußleiste

`onboarding-form-editor.module.css` + `draft-save-status`:

- Eine Zeile, ~56 px: links Speicherstatus mit Zustandspunkt (grün gespeichert, pulsierend beim Speichern, rot bei
  Fehler) und „zuletzt bearbeitet von …“, rechts Zurück (ghost) und Weiter (primär).
- Schwebend mit Abstand: `bottom: 0.75rem`, Innenabstand links/rechts, Radius 14px, `--color-surface-2` mit Rahmen und
  weichem Schatten statt randloser `--color-bg`-Fläche.
- Weiter nennt das Ziel: „Weiter: Inhalte“, im letzten Block „Zur Prüfung“ (neue Dictionary-Keys `steps.nextTo`,
  `steps.toReview`).
- Fehlerzustand (Retry) klappt als zweite Zeile in derselben Leiste auf.
- Mobil: volle Breite, Status als kleine Zeile über zwei gleich breiten Buttons, Safe-Area bleibt berücksichtigt.
- Scroll-Fix: Schrittwechsel scrollt `#main-content` nach oben statt `window`.

## 6. Portal-Header (`components/portal/portal-shell/`)

- Desktop: Innenabstand runter (Ziel ~52 px Höhe), sonst unverändert.
- Mobil (< 768px): eine Zeile mit Logo links, rechts Theme, Sprache (`LocaleSwitch variant="mobile"`), Profil und
  Menü-Button. Firmenwechsler, Projektwechsler, Begrüßung und Owner-Hinweis wandern in ein Menü
  (`portal-mobile-menu/`, auf Basis `Dialog` aus `@invessiv/ui`, Fokusfalle, Esc, `aria-expanded`). Der Button erscheint
  nur, wenn es Inhalt gibt. Verhalten an `workspace-header` orientieren, aber nichts aus `components/workspace/**`
  importieren.
- Neue Texte in `dictionaries/portal/shell/{de,en}.json` (Menü öffnen/schließen, Titel).
- `.main`: der 4.25rem-Freiraum für den Chat-Dock gilt nur noch, wenn die Seite einen Dock hat (Prop/`data-`-Attribut
  über das Dashboard), sonst volle Breite. `portal-shell.test.tsx` anpassen.

## 7. Weitere Verbesserungen (im Umfang)

- Pflichtfragen klar markiert, optionale mit dezentem „optional“ statt nur Stern (prüfen, was `FormField` schon kann).
- Sprung aus „fehlende Angaben“ hebt das Zielfeld kurz hervor.
- Prüfschritt nutzt die Breite: fehlende Angaben nach Block gruppiert in Spalten.

Nicht im Umfang: andere Portalseiten mobil überarbeiten (profitieren nur vom Header), CRM-Ansicht des Bogens.

## Betroffene Dateien (Kern)

- `packages/common`: `questionnaire-completeness.ts` (+Test), `questionnaire-block-progress.ts`,
  `contracts/ui/process-track-step.ts`, `constants/ui/process-step-tone.ts` (+Test)
- `packages/ui`: `process-track.tsx`, `.module.css`, `.test.tsx`
- `apps/workspace/src/common`: `patterns/portal/onboarding-step-progress.ts` (+Test),
  `patterns/portal/onboarding-field-span.ts` (+Test), `constants/portal/onboarding-field-spans.ts`
- `apps/workspace/src/components/portal/onboarding`: `onboarding-form-view`, `onboarding-form-editor`,
  `onboarding-step-track`, `onboarding-block-step`, `onboarding-submit-step`, `fields/onboarding-group-field`,
  neu `onboarding-form-header`
- `apps/workspace/src/components/portal`: `portal-shell`, neu `portal-mobile-menu`, `portal-back-link`
- `apps/workspace/src/components/shared/draft-save-status`
- `apps/workspace/src/i18n/dictionaries/portal/{onboarding,shell}/{de,en}.json`
- `apps/workspace/src/components/portal/AGENTS.md`, Plan-Datei unter `apps/workspace/plans/crm/`

## Reihenfolge

1. Doku/Plan, dann Logik mit Tests (Abschnitt 1).
2. `ProcessTrack` (2), dann Bogen-Kopf und Schrittleiste (3).
3. Breite und Spalten (4), Fußleiste und Scroll-Fix (5).
4. Portal-Header und Mobil-Menü (6), Rest (7).

## Verifikation

- Unit: `pnpm --filter @invessiv/common test`, `pnpm --filter @invessiv/ui test`, betroffene Workspace-Tests
  (`onboarding-form-view.*.test.tsx`, `onboarding-step-progress.test.ts`, `portal-shell.test.tsx`).
- Gates: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/workspace build`.
- E2E: `apps/workspace/e2e/portal-onboarding.e2e.ts` laufen lassen und Selektoren anpassen.
- Sichtprüfung mit Playwright-MCP am laufenden Dev-Server bei 375, 768, 1024, 1440 und 1920 px, Dark und Light:
  Zustände unberührt/blau/grün/rot/Haken, Schrittwechsel scrollt nach oben, sticky Kopf und Fuß überdecken keine
  Felder (auch bei Fokus per Tastatur), Mobil-Menü per Tastatur bedienbar, keine horizontale Scrollleiste.
- Prettier nur auf die geänderten Dateien (CRLF-Hinweis aus den Notizen).
