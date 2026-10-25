# CTA-Hierarchie: vier Stufen global in `@invessiv/ui`

## Context

Ziel ist eine feste Hierarchie für Aktionen, die beide Apps aus `@invessiv/ui` beziehen:

1. **Primary CTA:** Fläche im Orange→Blau-Verlauf.
2. **Secondary CTA:** ruhige Fläche mit Rahmen, beim Hover Verlaufsrahmen und Verlaufstext.
3. **Tertiary CTA:** Textlink, Text und Unterstreichung im CTA-Verlauf.
4. **Quaternary CTA:** blauer Textlink (`--color-cta`) mit Unterstreichung im Verlauf.

Stufe 1 gibt es heute vollständig in ui. Stufe 2 gibt es nur als Button (`SecondaryCtaButton`), ein Link fehlt.
Stufe 3 und 4 gibt es nur in der Website (`apps/web/src/components/shared/text-cta/`, Varianten `tertiary` und
`quaternary`). Die Aufrufer stylen sie dort per `className` um (Farbe, Gewicht 500–800, Fokus). Das ist in ui
verboten.

**Scope:** `packages/common`, `packages/ui` und `apps/web`. **Der Workspace bleibt unverändert.** Seine eigenen
Textlinks und umgestylten `ButtonControl`-Links werden später migriert.

Arbeit auf `feat/improve-home-design`, nicht committen. **Erster Schritt der Umsetzung:** diesen Plan samt
Entscheidungen als `plans/web/cta-hierarchie.md` ins Repo legen.

## Entscheidungen (mit dem Nutzer abgestimmt, 25.10.2026)

| Thema                     | Entscheidung                                                                                                                                                                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API                       | Vier benannte Stufen: `PrimaryCta*`, `SecondaryCta*`, `TertiaryCta`, `QuaternaryCta`. `TextCta` mit `variant` bleibt die Basis.                                                                                                                                            |
| Hover                     | Bleibt beim heutigen Website-Standard. Stufe 3 ohne Hover-Wechsel; Stufe 4 wird beim Hover zum Verlaufstext. Hover gilt nur auf Geräten mit `hover: hover` und `pointer: fine`, mobil also nie. Unklare oder neue Abweichungen vom Website-Standard werden vorher erfragt. |
| Typografie                | Die Komponente setzt das Gewicht einheitlich auf **600**. Die Schriftgröße ist Kontext: Sie erbt, und der Aufrufer darf sie am Element oder am Wrapper setzen. Farbe, Gewicht, Linie, Hover und Fokus gehören der Komponente.                                              |
| Landing-FAQ-Abschlusslink | Wird wie auf Home der Mail-Link unter den Q&A: **Stufe 3**. Die eigene Gestaltung (grau, Highlight-Linie, Touch-Hover) entfällt. Die Texte bleiben unverändert.                                                                                                            |
| Workspace                 | Keine Änderung in diesem Schritt.                                                                                                                                                                                                                                          |
| Links im Fließtext        | Auch sie tragen Gewicht 600 (z. B. „Datenschutzerklärung“ in der Einwilligung, vorher normale Satzschrift). Keine Inline-Ausnahme.                                                                                                                                         |

## Umsetzungsstand (25.10.2026)

Umgesetzt wie geplant und nicht committet. Common-, ui-, Web- und Workspace-Tests, Typecheck, Lint sowie die Builds
von Web und Workspace sind grün. Im Browser geprüft: Home, Landing (inkl. FAQ-Abschlusslink) und Referenzseite. Offen
ist die spätere Workspace-Migration auf `TertiaryCta`/`QuaternaryCta`.

## Sichtbare Änderungen in der Website (bewusst, durch die Entscheidungen oben)

- **Gewicht 600:** Q&A-Antwortlinks Home (800), Referenz-Links Home und Referenzseite (700), Zitat-Toggles
  „Ganzes Zitat lesen“/„Mehr lesen“ (700) und FAQ-Antwortlinks Landing (500) werden auf 600 vereinheitlicht.
- **Landing-FAQ-Abschlusslink:** grau → Verlauf (Stufe 3).
- **Fokus:** Eigene Fokus-Outlines der Aufrufer entfallen. Es gilt der Komponentenfokus (2px `--color-focus`,
  Abstand 3px). Bei den Landing-FAQ-Links wird die Outline damit orange statt Highlight-Blau.
- **FAQ-Antwortlinks Landing:** Die 2px dicke Hover-Unterstreichung entfällt; es gilt das normale Stufe-4-Hover.
- Schriftgrößen, Abstände und Layout bleiben überall gleich.

## Schritte

### 1. Konstanten nach `packages/common`

- `packages/common/src/constants/ui/text-cta-variants.ts`: `TextCtaVariant = { Tertiary, Quaternary }` als
  Const-Objekt plus Typ, im Stil von `button-variants.ts`.
- `packages/common/src/constants/ui/text-cta-elements.ts`: `TextCtaElement = { Anchor, Button, Summary }`.
- Je ein kleiner Test nach dem Muster von `button-variants.test.ts`.
- `apps/web/common/constants/ui/text-cta.ts` löschen.

### 2. `TextCta` nach `packages/ui/src/components/text-cta/`

- `text-cta.tsx` und `text-cta.module.css` aus Web übernehmen. `composes` zeigt relativ auf
  `../action-color/action-color.module.css`.
- `useNextLink` ersetzen durch `linkComponent` und `linkComponentProps`, genau wie `ButtonLink` (Contract
  `ButtonLinkComponentProps` aus `@invessiv/common/contracts/ui/button-link-component-props` wiederverwenden). Ohne
  `linkComponent` wird ein natives `<a>` gerendert, denn ui importiert kein `next/*`.
- Die übrigen Props bleiben: `as` (a/button/summary), `arrow`, `variant` (Standard `tertiary`).
- CSS: `.root` bekommt `font-weight: 600`; `font: inherit` bleibt für die Größe. Das Hover-Gating
  `@media (hover: hover) and (pointer: fine)` und der Fokus über `--color-focus` bleiben wie heute.
- Benannte Stufen in derselben Datei: `TertiaryCta` und `QuaternaryCta`. Das sind Wrapper mit festem `variant`,
  analog zu `PrimaryCtaButton`.
- `packages/ui/src/components/button/button.tsx`: `SecondaryCtaLink` ergänzen (`ButtonLink` mit `variant="ghost"`).
- Exporte in `packages/ui/src/index.ts`. Test von `apps/web/.../text-cta.test.tsx` nach ui verschieben, Import über
  den Barrel `@invessiv/ui` (Lint-Regel), und um `linkComponent` sowie die benannten Stufen ergänzen.

### 3. Website umstellen

- `apps/web/src/components/shared/text-cta/` löschen. Alle Aufrufer importieren aus `@invessiv/ui`:
  - Stufe 3 (`TertiaryCta`): `reference-teaser` (vorher `useNextLink`, jetzt `linkComponent={Link}`),
    `qna-contact-cta`, `contact-consent-field`, `service-action-cta`, Landing-FAQ `ctaLink`.
  - Stufe 4 (`QuaternaryCta`): `qna-question-bubble`, Landing-FAQ `answerLink`, `reference-project-card`,
    `reference-quote` (als Button), `reference-full-quote` (als summary).
- `ButtonLink variant="ghost"` wird `SecondaryCtaLink`: `home/hero-section`, `linkedin-post/hero-section`,
  `success-page`, `references-closing-cta`.
- **Overrides abbauen.** In den Caller-CSS-Klassen bleiben nur Größe und Layout (`font-size`, `margin`, `width`,
  `display`, `min-height`, `justify-self`, `line-height`). Gelöscht werden `color`, `font-weight`,
  `text-decoration*`, `text-underline-offset`, `transition`, `:hover` und `:focus-visible`. Betroffen sind u. a.:
  - `faq-section.module.css`: `.answerLink`, `.ctaLink`
  - `qna-question-bubble.module.css`: `.answerLink`
  - `qna-contact-cta.module.css`: `.link`
  - `reference-project-card.module.css`: `.projectLink`
  - `reference-teaser.module.css`: `.link`
  - `reference-quote.module.css`: `.toggle`
  - `reference-full-quote.module.css`: `.summary`
  - `service-action-cta.module.css`: `.cta`
- Web-Tests anpassen, die `TextCta` importieren oder `useNextLink` erwarten.

### 4. Doku

- `packages/ui/AGENTS.md`: neuer Abschnitt „CTA-Hierarchie (verbindlich)“ mit den vier Stufen, ihren Komponenten,
  Hover nur bei `hover: hover`/`pointer: fine` und der Regel „Größe ist Kontext, alles andere gehört der
  Komponente“. Die Altlast „Text-Button-Baustein fehlt“ bleibt stehen, mit Hinweis, dass `TertiaryCta`/`QuaternaryCta`
  das Ziel der späteren Workspace-Migration sind.
- `apps/web/src/components/AGENTS.md`: Textlinks und CTAs nur über die vier Stufen aus `@invessiv/ui`.
- `apps/web/DESIGN.md`: Abschnitt „Buttons“ um die vier Stufen ergänzen.
- Memory: Eintrag `project-controls-unification` um den offenen Workspace-Teil ergänzen.

## Verifikation

- `pnpm --filter @invessiv/common test`, `pnpm --filter @invessiv/ui test`, `pnpm --filter @invessiv/web test`.
- `pnpm -r typecheck`, `pnpm lint`, `pnpm --filter @invessiv/web build`. Den Workspace-Build einmal mitlaufen lassen,
  weil sich ui-Exporte ändern.
- Grep: kein `components/shared/text-cta`, kein `useNextLink`, kein `TEXT_CTA_` mehr in `apps/web`.
- Prettier nur auf die geänderten Dateien (CRLF).
- Playwright gegen den laufenden Dev-Server (Port 3000), Desktop 1280 und Mobil 390, Dark und Light:
  - Home: Referenz-Teaser-Link (Stufe 3), Q&A-Antwortlink (Stufe 4, Hover zum Verlauf), Mail-Link (Stufe 3), Hero
    (Stufe 1 und 2), Leistungs-CTAs (Stufe 3 mit Pfeil), Datenschutz-Link.
  - Landing: FAQ-Antwortlink (Stufe 4), FAQ-Abschlusslink (Stufe 3).
  - Referenzseite: Projekt-Link (Stufe 4), Zitat-Toggle.
  - Gewicht per `getComputedStyle` = 600. Mobil per Touch-Emulation prüfen, dass Hover nicht greift. Tab-Fokus zeigt
    den Komponentenfokus.
