# Redesign-Nachzug Workspace + gemeinsamer UI-Kern (Branch `feat/improve-home-design`, 24.10.2026)

Ziel: Das Website-Redesign (neue Palette, Figtree/Metrophobic, Orange-Blau-CTA-Verlauf, neue Header-Controls,
neues Logo) auf den Workspace inkl. Kundenportal übertragen und 1:1-Duplikate nach `packages/ui` ziehen.
Website-Darstellung bleibt unverändert; bei Abweichungen gewinnt das Website-Design. Widget-Farben bleiben.

## Umgesetzt

| Bereich              | Ergebnis                                                                                                                                                                                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Token-Kern           | `packages/ui/src/styles/tokens.css` (Palette, Schriftfamilien/-größen, Layoutschiene inkl. Breakpoints) und `base.css` (Reset, Body, Selection, Skip-Link, Fokus). Beide Apps importieren sie in `globals.css`. Web-Werte wurden 1:1 verschoben; der Deklarationsabgleich alt ↔ Kern+neu ist identisch (nur Wrapper-Blöcke). |
| Web `globals.css`    | Enthält nur noch web-eigene Tokens (FAQ-Open-, Hero-Grid-, Section-Headline-, Marketing-Main-Tokens, Caveat, Heading-Display-Font, Page-Accents).                                                                                                                                                                            |
| Workspace `globals`  | Alte Palette (`#1d1a18`, `#4e83e6` …), Radial-Hintergründe und tote Marketing-/FAQ-/Landing-Kopien entfernt. Bleiben: `--control-*`, `--color-success`, `--widget-accent-*`, `--button-disabled-*`.                                                                                                                          |
| Schrift Workspace    | `src/config/fonts.ts` lädt Figtree per `next/font` (`--font-figtree`); vorher wurde „Plus Jakarta Sans“ nur per Name referenziert und nie geladen.                                                                                                                                                                           |
| `packages/ui` Button | `primary` = CTA-Verlauf der Website (`action-color`), `--shadow-action`, Gewicht 550; `ghost` = Verlaufsrahmen + Verlaufstext beim Hover. Größen (46 px, `control`, `icon`, `row`) unverändert. CTA-Farbe ist damit in Web und Workspace gleich.                                                                             |
| Umgezogen nach ui    | `action-color`, `ActionIcon`, `header-control`, `ThemeSwitch`, `LocaleSwitch`, `useDismissibleDetails` (Web-Version gewinnt). Web importiert aus `@invessiv/ui`, die Workspace-Kopien unter `components/shared/{theme,locale}-switch` sind gelöscht.                                                                         |
| Neue Konstanten      | `ColorTheme` und `HeaderControlVariant` in `packages/common/src/constants/ui/` (Const-Objekt + Test).                                                                                                                                                                                                                        |
| Auth-Frame           | Nutzt `BrandLockup` (Logo + Verlaufs-Wortmarke) statt eigenem `<Image>` + Label.                                                                                                                                                                                                                                             |
| Doku                 | `apps/web/DESIGN.md` (Pfade), `packages/ui/AGENTS.md` (Abschnitt „Gemeinsamer Design-Kern“, Button).                                                                                                                                                                                                                         |

Gates: `pnpm -r typecheck` grün, `pnpm -r lint` grün (2 bestehende Warnungen), Tests ui 136 / common 767 / web 559 /
workspace 4081 grün, Build web + workspace grün. Sichtprüfung Workspace-Login (dark/light) per Playwright.
Nicht geprüft: eingeloggte Workspace-/Portal-Seiten (Clerk-Login nötig), Web-E2E `theme-colors.e2e.ts`.

## Größen- und Designabweichungen (notiert, nicht angeglichen)

| Komponente               | Website                                                                                | Workspace / `packages/ui`                                                                         | Empfehlung                                                                                                                                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button (Duplikat bleibt) | `apps/web/src/components/shared/button/` ohne `gap`, Hover auch auf Touch, kein `size` | `packages/ui` Button mit `gap: 0.5rem`, Hover nur `@media (hover: hover)`, Disabled ohne Schatten | Web auf `@invessiv/ui`-Button umstellen (`linkComponent={Link}` statt `useNextLink`), danach Web-Button löschen. Nicht gemacht, weil globale Website-Komponente und Touch-Hover sich minimal ändern würde. |
| Form-Controls            | DESIGN.md: Button/Input 46–50 px, Radius 12 px (Control) bzw. 15 px (Feld)             | `--control-height` 44 px, `--control-radius` 10 px                                                | Bewusst gelassen (dichte App-UI, Touch-Minimum 44 px). Bei Wunsch nach mehr „Website-Gefühl“ im Portal Radius auf 12 px anheben.                                                                           |
| `quiet`-Button           | existiert nicht                                                                        | Gewicht 600 (> Primary 550)                                                                       | Auf 550 angleichen, wenn es im Portal zu laut wirkt.                                                                                                                                                       |
| Eyebrow                  | `EyebrowPill` (Bogen, Highlight-Blau, Uppercase)                                       | Dialog-/Access-/Einladungs-Eyebrows: gedämpfter Text, eigene Größen                               | Kein Duplikat; `EyebrowPill` erst nach `packages/ui` ziehen, wenn das Portal es übernehmen soll.                                                                                                           |

## Unklar – bewusst ausgelassen (mit Empfehlung)

1. **Display-Schrift auf Überschriften im Workspace.** Web setzt Metrophobic (nur 400, `font-synthesis-weight: none`)
   auf alle `h1–h6`. Im dichten Workspace würden Widget-/Kartentitel ihr Gewicht 700 verlieren.
   _Empfehlung:_ Metrophobic nur für Seitentitel (`h1`) und die Portal-Begrüßung, `h2–h6` bleiben Figtree.
2. **Clerk-Primärbutton** („Fortsetzen“) ist Clerk-Standard dunkel, nicht CTA-Verlauf. _Empfehlung:_ über
   `ClerkProvider appearance` (`variables.colorPrimary` bzw. `elements.formButtonPrimary`) anbinden; vorher prüfen, ob
   CSS-Variablen in der eingesetzten Clerk-Version unterstützt werden.
3. **Portal-Header-Logo** ist nur das Icon (kein Wortmarken-Label), Workspace-Header und Login nutzen `BrandLockup`.
   _Empfehlung:_ Portal ebenfalls `BrandLockup` mit `collapseLabelOnMobile`, falls der Platz neben Firmen-/Projekt-Switcher reicht.
4. **Website-only-Bausteine für das Portal** (`TextCta`, `DisclosureButton`, `NavigationLink`, `GradientText`):
   kein Duplikat im Workspace, daher nicht verschoben. _Empfehlung:_ `TextCta` als Text-Button nach `packages/ui`
   ziehen – löst auch die Altlast im Portal-Bogen (`onboarding-submit-step` macht aus `ButtonControl` einen Textlink).
5. **Duplizierte Nicht-UI-Logik** (identisch in beiden Apps): `ThemeProvider`, `LanguageProvider`, `lib/theme`,
   `lib/navigation/*`, `lib/format-relative-time`, `config/i18n`. Hängen an `next-themes`/`next/navigation` und
   App-Konfiguration; `packages/ui` darf kein `next/*` importieren. _Empfehlung:_ reine Logik (`lib/theme`,
   `format-relative-time`, Navigation-Helfer) nach `packages/common/patterns`; Provider in ein eigenes
   Next-gebundenes Paket oder bewusst pro App belassen.
6. **`apps/web/DESIGN.md` Typografie-Frontmatter** nennt noch Bricolage Grotesque / Plus Jakarta Sans, Laufzeit nutzt
   Metrophobic / Figtree. Nicht angepasst (Website-Doku-Inhalt); beim nächsten Design-Update korrigieren.
7. **`workspace-header.tsx`** übergibt `className={styles.themeSwitch}`, die Klasse existiert nicht (bestehend,
   wirkungslos). Beim nächsten Anfassen entfernen.
8. **Web-Fonts zentral:** `config/fonts.ts` existiert pro App (next/font muss in der App laufen). Bleibt so.
