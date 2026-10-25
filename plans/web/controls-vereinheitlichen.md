# Controls vereinheitlichen (Web → @invessiv/ui) + CTA-Farbe für Pflicht-/Fokus-/Link-Zustände

## Context

`apps/web/src/components/shared/form/*` und `apps/web/src/components/shared/button/*` sind Kopien von Bausteinen aus
`@invessiv/ui`. Sie sind teils identisch (`FormActions`, `FormRequiredMarker`), teils größer (`FormField`: 50/54px,
Radius 15px, eigener Select, `labelSuffix`). Ziel ist eine Quelle, nämlich `@invessiv/ui` in der kleineren
Workspace-Größe. Dazu kommen diese Designwünsche: Stern, „* Pflichtfelder“ und Fokus im Orange→Blau-CTA-Verlauf,
die Links „Datenschutzerklärung“ und „Schreib mir direkt per Mail.“ wie „Projekt im Detail ansehen“, die
Checkbox-Zustände in CTA-Farbe und „Invessiv“ (Kontakt-Karte + Footer) nicht mehr als Link.

Das hat der Nutzer entschieden (gilt als Freigabe der Standardänderungen in `packages/ui`):

- Fokus: Verlaufsring für Form-Controls in **beiden** Apps; `--color-focus` wird global orange (Verlaufsstart).
- Stern und Pflicht-Hinweis im Verlauf, **überall**, also auch im Workspace.
- Web-Controls auf 44px/10px; die Tokens werden gemeinsam, die CustomSelect-Ausnahme entfällt.
- Datenschutz nutzt `CheckboxControl`; der Checked-Zustand bekommt **überall** die CTA-Verlaufsfarbe statt Blau.
- Die Projektumfang-Chips bleiben eigenes Design und bekommen nur den neuen Fokus.

Arbeit auf `feat/improve-home-design`, nicht committen. Beim Start den Plan nach `plans/web/controls-vereinheitlichen.md`
kopieren (Memory-Regel „Plan zuerst“).

## Schritte

### 1. Gemeinsame Tokens (`packages/ui/src/styles/tokens.css`)

- `--control-height: 44px`, `--control-radius: 10px` und `--control-border-color` aus
  `apps/workspace/src/app/globals.css` (Z. 16–25) nach `tokens.css` `:root` verschieben und im Workspace entfernen.
- `--color-focus: var(--color-action-accent)`. Damit bekommen die globalen Outlines in `base.css` (Z. 74, 97) und alle
  `var(--color-focus)`-Nutzer Orange statt Blau.

### 2. Verlaufsring als gemeinsamer Baustein (`packages/ui/src/components/action-color/action-color.module.css`)

- Neue komponierbare Klasse `focusRing`: `position: relative`. Ein `::after`-Pseudo bei `:focus-within:has(:focus-visible)`
  (für Wrapper) bzw. `:focus-visible` zeichnet einen 2px-Ring per `var(--action-gradient)` mit
  `mask-composite: exclude`. Offset und Radius kommen über `--focus-ring-offset` / `--focus-ring-radius`
  (Default 3px / `--control-radius`). Dazu ein `forced-colors`-Fallback auf normales `outline`.
- Nutzer: `FormField` `.control`/`.inputShell` (Input + Textarea; das bisherige blaue `outline` und `border-color` bei
  `:focus-visible` fallen weg), `CheckboxControl` `.box`, `CustomSelect`-Trigger, Web-`ProjectScopeField`-Chip.

### 3. Standardänderungen in `packages/ui` (freigegeben)

- `form-required-marker.module.css` und `form-actions.module.css` `.requiredHint`: `composes: text from action-color`
  statt `color: var(--color-cta)`.
- `checkbox-control.module.css`: Checked/Indeterminate über `composes: palette` + `--action-gradient` statt
  `--color-cta`-Verlauf; Halo `box-shadow` in Orange-Mix; Fokus über `focusRing`.
- `FormField`: neue app-neutrale Prop `labelSuffix?: ReactNode` (Zähler neben dem Label, `aria-hidden`), Markup und CSS
  aus Web übernehmen (`.labelRow`, `.labelSuffix`). Ein Select-Kind wird **nicht** übernommen, weil Web es produktiv
  nicht nutzt (nur `form-field.test.tsx`).
- Tests ergänzen: `form-field.test.tsx` (labelSuffix), `checkbox-control.test.tsx` unverändert grün.

### 4. Web auf `@invessiv/ui` umstellen und Kopien löschen

- Löschen: `apps/web/src/components/shared/form/{form-field,form-field-label,form-required-marker,form-actions,form-status}`
  und `apps/web/src/components/shared/button` (inkl. Tests). Vorher `form-status` und `form-field-label` gegen ui
  diffen; Abweichungen als ui-Prop übernehmen, nicht als Kopie.
- Aufrufer auf `import { … } from "@invessiv/ui"` umstellen (Barrel-Regel `invessiv/prefer-package-barrel-import`):
  contact-form, contact-identity-fields, contact-message-field, project-scope-field, linkedin generator-form, alle
  `PrimaryCtaLink`/`ButtonLink`-Aufrufer (hero, process, services, pricing, audience, success-page, references-closing-cta,
  linkedin hero/previews/download-card, site-header).
- `useNextLink` → `linkComponent={Link}` (`next/link`), so wie es im Workspace schon gemacht wird.
- `FormField`-API-Unterschiede anpassen: ui rendert `<div>` + `<label htmlFor>`, `Custom` nutzt `renderControl` statt
  `children`. Die Aufrufer anpassen.
- Caller-Overrides abbauen (ui-Regel „nicht umstylen“): `contact-form-primitives.module.css` `.messageField textarea*`
  und `.consent input`, `.form button:disabled`. Die Textarea-Höhe läuft über `rows`. `rows={3}` bleibt, ui-Default
  164/180px prüfen; falls zu hoch, `autoGrow` nutzen statt CSS.

### 5. Datenschutz-Control (`apps/web/src/components/shared/form/contact-consent-field/`)

- Natives `<input type="checkbox">` → `CheckboxControl` aus ui (`registerAction(...)` spreaden, `ref` wird durchgereicht).
  `checkboxClassName` entfällt.
- Link: `TextCta` ohne `variant="quaternary"` (also Default `tertiary` wie „Projekt im Detail ansehen“). Die Overrides
  `.link`, `.link:hover` und `.link:focus-visible` in `contact-consent-field.module.css` löschen.
- `FormRequiredMarker` aus ui.

### 6. „Schreib mir direkt per Mail.“ (`qna-contact-cta`)

- `TextCta` auf Default `tertiary`; in `qna-contact-cta.module.css` `.link` nur noch Typo (Schriftgröße/-gewicht).
  `color` und eigenes `:focus-visible` entfernen.
- `TextCta` (`text-cta.module.css` Z. 39): Fokus auf `focusRing` (oder `--color-focus`, das jetzt orange ist) umstellen.

### 7. „Invessiv“ kein Link (`apps/web/src/components/shared/contact-identity/`)

- `<a href=imprint#company-details>` → `<p className={styles.brand}>`. Prop `animateBrandLink` und
  `createLocalePathname`/`SITE_ROUTES`-Import entfernen. CSS: Hover-, Fokus- und `animatedBrand`-Regeln löschen.
- Aufrufer `footer-section.tsx` (Z. 124 `animateBrandLink`) bereinigen.
- Tests anpassen: `footer-section.test.tsx:42`, `landing-page.test.tsx:123` prüfen jetzt, dass „Invessiv“ kein Link ist.

### 8. Doku

- `packages/ui/AGENTS.md` → „Formular-Bausteine“: Tokens liegen in `tokens.css` für alle Apps; die
  CustomSelect-Kompatibilitätsausnahme streichen; Stern, Pflicht-Hinweis, Checkbox-Checked und Fokus nutzen den
  Aktionsverlauf (`focusRing`).
- `apps/web/DESIGN.md`: Control-Maße und Fokus aktualisieren.

## Offen / bewusst nicht im Scope

- `RadioControl` und `OptionTile` haben noch blaue Checked-Zustände. Nicht angefragt, nach der Sichtprüfung nachfragen.
- Andere Web-Komponenten (`disclosure-button`, `text-cta`, `eyebrow-pill`) haben kein ui-Gegenstück, sie bleiben.

## Verifikation

- `pnpm lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/web build`,
  `pnpm --filter @invessiv/workspace build`.
- Grep: kein Import mehr von `@/components/shared/form/form-*` oder `@/components/shared/button`.
- Playwright (Dev-Server Web + Workspace), Dark und Light, 360px und Desktop:
  Home-Kontaktformular (Höhe 44px, Stern und „* Pflichtfelder“ im Verlauf, Datenschutz-Checkbox checked im Verlauf,
  Link „Datenschutzerklärung“ wie „Projekt im Detail ansehen“, Tab-Fokus zeigt den Verlaufsring auf Input, Textarea,
  Chip und Checkbox), Q&A-Mail-Link, Footer und Kontakt-Karte („Invessiv“ ohne Link), LinkedIn-Generator (Zähler,
  CustomSelect), Landing-Final-CTA, ein Workspace-Formular (Portal-Bogen/CRM-Dialog) für Fokus, Stern und Checkbox.
