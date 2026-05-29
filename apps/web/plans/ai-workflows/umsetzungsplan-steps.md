# LinkedIn-Post Landingpage — Step-by-Step Umsetzungsplan

> **Pivot-Notiz (2026-05-28):** Der ursprüngliche "manueller Workflow-Check"-Ansatz wurde ersetzt durch
> ein **Lead-Magnet-Generator-Funnel**: Besucher gibt Thema + Expertise + Ton + E-Mail ein → fertiger
> LinkedIn-Post (Bild + Caption) erscheint sofort auf der Page + wird per Mail zugesendet → weiche CTA
> zur Projektanfrage. Pricing gehört nicht auf diese Page; Pricing-Tiers folgen auf der allgemeinen
> `/services/ai-workflows`-Landingpage (separater Plan: `ki-workflows-landing-stub.md`).
>
> **Für agentische Worker:** Bei Copy-Schritten ist `copywriting` Pflicht; bei UI-Schritten ist
> `frontend-design` Pflicht. Vor Section-/Animationsarbeit müssen `animation_mockups/` und
> `animation_mockups/effects-catalog.json` geprüft werden.
>
> **Commit-Regel:** Commit-Schritte am Ende jeder Task sind **Vorschläge für die Commit-Message**.
> Der Agent führt **keinen** `git commit` aus — der User reviewed und committet selbst.

---

## Zielbild V1

**Route:** `/[locale]/services/linkedin-post`

**Goal:** Conversion-fokussierte Lead-Capture-Page. Besucher gibt Thema, Expertise und Ton ein →
erhält einen fertigen LinkedIn-Post (HTML-generiertes Bild + Caption) direkt auf der Page und per
E-Mail. Danach weiche CTA zur unverbindlichen Anfrage für einen eigenen KI-Content-Workflow.

**Zielgruppe:** Solo-Dienstleister, Berater, Coaches und kleine B2B-Selbstständige, die regelmäßig
auf LinkedIn sichtbar sein wollen, aber keinen stabilen Content-Prozess haben.

**Primäres Conversion-Ziel:** Lead erfassen (E-Mail + Branche + Posting-Kontext).

**Sekundäres Conversion-Ziel:** Projektanfrage nach erlebtem Sofortwert (generierter Post).

**Nicht-Ziel:** Kein allgemeiner KI-Workflow-Berater, kein Dashboard, kein Login, kein Upload,
kein Subscription-Modell, kein Pricing auf dieser Page, kein LinkedIn-Autoposter.

---

## Architektur

- Next.js App Router, Route-Gruppe `(marketing)`.
- Route: `apps/web/src/app/[locale]/(marketing)/services/linkedin-post/page.tsx`
- Komponenten: `apps/web/src/components/marketing/linkedin-post/**`
- Dictionaries: `apps/web/src/i18n/dictionaries/linkedin-post/**`
- Generator-API: `apps/web/src/app/api/public/generator/linkedin-post/route.ts`
- Download-Endpoint: `apps/web/src/app/api/public/generator/linkedin-post/download/route.ts`
- Generator-Service: `apps/web/src/server/services/generator/**`
- App-lokale Shared-Schicht: `apps/web/common/**` (Alias `@/common/*`) — `constants/generator/**`
  (Analytics, State-Kind, Color-Pairs) und `contracts/generator/**` (State, FieldErrors)
- Generierungs-Spezifikation (kanonisch): `apps/web/project-skills/linkedin-post-generator/**`
  (Skill-Contract inkl. `colorPairId`, `references/result-schema.json`, `references/content-schema.json`,
  `references/color-pairs.json`, `templates/post-template.html`)
- Lead-Persistenz über bestehendes Contact-System (neuer `request_kind: "linkedin_post_generator"`)

---

## Ist-Stand & Reconciliation (Stand: 2026-05-29)

**SEAM (S1) + TRACK A (UI) sind umgesetzt** und über `typecheck` / `lint` / `test:unit` / `build` grün.
Wichtige Abweichungen gegenüber der ursprünglichen Planung, die TRACK B & C betreffen:

- **Neuer verbindlicher Parameter `colorPairId`:** Der Generator hat eine Hintergrund-Farbauswahl über die
  10 vordefinierten Paare + `auto` (Zufall). Liegt als Form-Value `colorPairId` vor (Default `"auto"`) und
  **muss bis zum Generierungs-Service durchgereicht werden** (Skill-Parameter, _binding_ — Skill §1/§6).
  → Betrifft **B2** (DTO/Zod), **B3** (Skill-Aufruf `--color`), **B5** (Persistenz), **B7** (Passthrough).
- **Skill ist die kanonische Generierungs-Spezifikation:** `linkedin-post-generator/SKILL.md` definiert Inputs
  (inkl. `colorPairId`), `references/content-schema.json` (= striktes LLM-Output-Schema für den Claude-Call),
  `references/result-schema.json` (Gesamt-`result.json`), Farb-Selektion (§6, binding) und Quality-Gate.
  **B3 implementiert genau diesen Contract**, statt eigene Strukturen zu erfinden.
- **App-lokale Konstanten wiederverwenden** (keine neuen Magic Strings):
  - `@/common/constants/generator/generator-analytics` — `GeneratorAnalyticsEvent`, `GENERATOR_FORM_ID`,
    `GeneratorErrorReason`, `PostDownloadTarget` (Analytics-Mechanik bleibt `window.dispatchEvent`).
  - `@/common/constants/generator/generator-state-kind` — `GeneratorStateKind`.
  - `@/common/constants/generator/generator-color-pairs` — `GENERATOR_COLOR_PAIRS` (10) + `GENERATOR_COLOR_AUTO`.
  - `@/common/contracts/generator/` — `GeneratorState`, `GeneratorFieldErrors`.
- **Generator-Section ist in Einzelkomponenten gesplittet** (je eigenes CSS-Modul): `generator-section.tsx`
  (Orchestrierung) · `generator-form.tsx` · `field.tsx` · `preview-panel.tsx` · `success-preview.tsx` ·
  `custom-post-block/` · `use-field-ids.ts`.
- **Custom-Post-Block zeigt den ECHTEN Post** (Asset-Punkt erledigt): locale-abhängiges Bild
  `/linkedin-post/custom-post-seo{,-en}.png`, Profil Moritz Hecht / Webdesigner (`/linkedin-post/moritz-hecht.jpeg`),
  echte Caption mit klickbarem internem Landing-Link (neuer Tab, Ziel aus `SITE_ROUTES.LANDING_PAGE_SERVICE`)
  - Befehl-Zeile. Statisch, kein API-Call.
- **Example-Section** = klassischer LinkedIn-Post (Profil → Caption mit „… mehr" → full-bleed 1:1-Bild),
  Mobile-Swipe-Carousel, fiktive Profile (Max Mustermann / Mila Musterfrau) + Fiktiv-Hinweis,
  `SampleCard` als eigene Komponente. **Noch offen:** echte `promptText`-Werte (Platzhalter) + echte Beispiel-Bilder.
- **Analytics-Naming-Korrektur:** Custom-Post-CTA nutzt `cta_click` + `data-analytics-location="generator_custom_post"`
  (App-Taxonomie), **nicht** `custom_post_cta_click` wie in A5 ursprünglich notiert.

> **Konsequenz für TRACK B:** Die Submit-/Result-Form-Schnittstelle (S1) steht; `submitLinkedInPostGenerator`
> ist noch ein Stub. B7 ersetzt den Stub durch den echten `fetch`; B2/B3/B5 müssen `colorPairId` aufnehmen.

---

## Verbindliche Copy-Basis

**Hero DE:**

- Tag: `KI-CONTENT FÜR LINKEDIN`
- H1: `Dein nächster LinkedIn-Post in 60 Sekunden`
- Description: `Gib dein Thema ein — wir generieren einen fertigen Post mit Bild. Kostenlos, kein Account nötig.`
- Primary CTA: `Post generieren`
- Trust-Chips: `Kostenlos`, `Sofort-Ergebnis`, `Download inklusive`

**Hero EN (sinngemäß):**

- Tag: `AI CONTENT FOR LINKEDIN`
- H1: `Your next LinkedIn post in 60 seconds`
- Description: `Enter your topic — we generate a ready-to-post image and caption. Free, no account needed.`
- Primary CTA: `Generate post`
- Trust-Chips: `Free`, `Instant result`, `Download included`

---

## Verbindliche Bauprinzipien

- **Mobile First (verbindlich):** Jede Section zuerst für 360 px, dann Tablet/Desktop.
- **Copy-Regel:** Body max. 2 kurze Sätze. Listen max. 5 Wörter pro Punkt.
- **Kein Pricing auf dieser Page.**
- **Output-Qualität vor Geschwindigkeit:** Bei schlechter Bild-Generierung lieber Loading-State
  verlängern als ein qualitativ schlechtes Bild auszuliefern.

---

## SEAM — Gemeinsame Schnittstelle

### Task S1: GeneratorFormValues + Submit-Service-Stub _(✅ umgesetzt)_

> **Stand:** umgesetzt. Real ist `LinkedInPostGeneratorFormValues =
{ topic, expertise, tone, colorPairId, email, consent, company }` (Default `colorPairId: "auto"`,
> `tone` über die `LinkedInPostTone`-Konstante). Das Snippet unten ist die ursprüngliche Skizze **ohne**
> `colorPairId`. `submitLinkedInPostGenerator` ist noch der Stub; Result-Shape unverändert
> `{ ok, imageUrl, caption, downloadToken }`.

**Files:**

- Create/Replace: `packages/common/src/contracts/generator/linkedin-post-generator-form-values.ts`
- Create/Replace: `apps/web/src/client/generator/submit-linkedin-post-generator.ts`

- [ ] **Step 1: Form-Values-Typ definieren**

```ts
export type LinkedInPostGeneratorFormValues = {
  topic: string; // Thema (Freitext, max. 280 Zeichen)
  expertise: string; // Branche / Positionierung (Freitext, max. 120 Zeichen)
  tone: "sachlich" | "persönlich" | "provokativ";
  email: string;
  consent: boolean;
  company: string; // Honeypot
};

export const LINKEDIN_POST_GENERATOR_INITIAL_VALUES: LinkedInPostGeneratorFormValues =
  {
    topic: "",
    expertise: "",
    tone: "persönlich",
    email: "",
    consent: false,
    company: "",
  };
```

- [ ] **Step 2: Submit-Result-Typ + Stub**

```ts
export type LinkedInPostGeneratorResult =
  | { ok: true; imageUrl: string; caption: string; downloadToken: string }
  | { ok: false; fieldErrors?: Record<string, string[]>; code: string };

export async function submitLinkedInPostGenerator(
  _values: LinkedInPostGeneratorFormValues,
): Promise<LinkedInPostGeneratorResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    ok: true,
    imageUrl: "/placeholder-post.png",
    caption: "Beispiel-Caption für deinen LinkedIn-Post.",
    downloadToken: "stub-token",
  };
}
```

- [ ] **Step 3: Verify** — `npm run typecheck`
- [ ] **Step 4: Commit** — `feat(linkedin-post): add generator form seam`

---

# TRACK A — UI

### Task A0: Route-Rename + Scaffold + Navigation _(aktualisiert)_

**Scope:** Die bestehende `ai-workflows`-Route und alle zugehörigen Artefakte werden auf
`linkedin-post` umbenannt. Dies ist ein reiner Rename — keine inhaltliche Änderung an bestehenden
Komponenten oder Dictionaries.

**Files:**

- Modify: `apps/web/src/config/routes.ts`
- Rename: `apps/web/src/app/[locale]/(marketing)/services/ai-workflows/` →
  `apps/web/src/app/[locale]/(marketing)/services/linkedin-post/`
- Rename: `apps/web/src/components/marketing/ai-workflows/` →
  `apps/web/src/components/marketing/linkedin-post/`
- Rename: `apps/web/src/i18n/dictionaries/ai-workflows/` →
  `apps/web/src/i18n/dictionaries/linkedin-post/`
- Rename: `apps/web/src/config/navigation/ai-workflows.ts` →
  `apps/web/src/config/navigation/linkedin-post.ts`
- Update: alle Imports in betroffenen Dateien

- [x] **Step 1:** `SITE_ROUTES` aktualisieren:
  - `LINKEDIN_POST_SERVICE = "/services/linkedin-post"` (diese Kampagnen-Page)
  - `AI_WORKFLOWS_SERVICE = "/services/ai-workflows"` bleibt reserviert für die allgemeine
    KI-Workflows-Landingpage (eigener Plan)
- [x] **Step 2:** Ordner umbenennen (`git mv`), Imports nachziehen.
- [x] **Step 3:** Navigation-Config auf neue Route + Section-IDs `problem`, `offer`, `generator` updaten.
- [x] **Step 4:** Verify `npm run typecheck` + Route `/de/services/linkedin-post` erreichbar.
- [x] **Step 5:** Commit — `refactor(linkedin-post): rename route from ai-workflows`

> **Nach diesem Task stoppen** und Ergebnis reviewen, bevor A1 ff. gestartet wird.

---

### Task A1: Hero-Section _(bleibt, minimale Copy-Anpassung)_

**Files:**

- Modify: `apps/web/src/i18n/dictionaries/linkedin-post/hero/{de.json,en.json}`
- Modify: `apps/web/src/components/marketing/linkedin-post/hero-section/hero-section.tsx`

- [x] **Step 1:** Dictionaries auf neue Copy-Basis aktualisieren (neues H1, neue Description, Trust-Chips).
- [x] **Step 2:** Primary CTA zeigt auf `#generator` (statt `#contact`). Secondary CTA zeigt auf `#offer`.
      `data-analytics-target` auf `"generator"` korrigiert.
- [x] **Step 3:** Verify 360 px, Trust-Chips korrekt.
- [x] **Step 4:** Commit — `feat(linkedin-post): update hero copy for generator funnel`

---

### Task A2: Problem-Section _(bleibt unverändert)_

Keine Änderung. "LinkedIn bleibt liegen weil kein Prozess existiert" passt weiterhin.

---

### Task A3: Offer-Section _(bleibt unverändert — generisch wiederverwendbar)_

Keine Änderung. Die Offer-Section ist bewusst generisch gehalten und wird auf der allgemeinen
`/services/ai-workflows`-Page wiederverwendet.

---

### Task A4: Example-Section _(✅ umgesetzt — offen: echte promptText + Bilder)_

**Files:**

- Create/Modify: `apps/web/src/i18n/dictionaries/linkedin-post/example/{de.json,en.json,index.ts}`
- Create/Modify: `apps/web/src/components/marketing/linkedin-post/example-section/example-section.tsx`
- Create/Modify: `apps/web/src/components/marketing/linkedin-post/example-section/example-section.module.css`

**Inhalt:** Statische Beispiel-Posts (real generierte Ausgaben des eigenen HTML-Skills) mit
Bild-Vorschau + Caption-Text. Zeigt dem Besucher den konkreten Generator-Output bevor er seine
E-Mail angibt. Kein Custom-Workflow-Beispiel hier — das gehört in den Success-State (A5).

**Responsive-Regel (verbindlich):**

- **Mobile (< 720 px):** horizontales **Swipe-Carousel** mit Scroll-Snap. Beide Karten bleiben
  erreichbar; Kartenbreite ~88 % zeigt einen Peek der nächsten Karte als Swipe-Affordance.
  Kein Edge-Bleed (kein `100vw` + negative Margin) — die Karten bleiben im Page-Gutter, damit die
  erste Karte links Abstand behält.
- **Desktop (≥ 720 px):** **2 Karten** nebeneinander im bestehenden 2-Spalten-Grid (Carousel-CSS
  wird ab 720 px vollständig zurückgesetzt).

**Begründung:** Ein Carousel ist hier mindestens so stark wie eine Einzelkarte — wird Karte 2 nicht
geswiped, ist der Mehrwert identisch zur Einzelkarte; wird sie gesehen, ist es zusätzlicher Beweis.
Kein Downside gegenüber der Einzelkarte.

Bild immer mit `alt`-Text (Caption-Inhalt). Carousel-`<ul>` ist `tabIndex={0}` (Keyboard-Scroll).

- [ ] **Step 1:** DE/EN-Dictionaries: Section-Heading, kurzer Subtext, Aria-Labels.
- [ ] **Step 2:** Statische Bild-Assets (real generierte Beispiele via HTML-Skill) einbinden —
      `next/image`, klar dimensioniert. Placeholder verwenden bis echte Assets verfügbar.
- [ ] **Step 3:** Mobile-Carousel: Flex + `scroll-snap-type: x mandatory`, dünne Scrollbar als
      Affordance, `scroll-padding-left: 0`. Ab `min-width: 720px` auf Grid zurücksetzen.
- [ ] **Step 4:** Scroll-Reveal (`scroll_reveal_stagger`) dezent für die Karten.
- [ ] **Step 5:** Kleiner "Mach es selbst"-Link am Ende scrollt zu `#generator`.
- [ ] **Step 6:** Verify 360 px: Karte 1 mit Links-Abstand, Peek von Karte 2, Swipe funktioniert.
      Verify Desktop: 2 Karten nebeneinander, kein Scroll.
- [ ] **Step 7:** Commit — `feat(linkedin-post): restore mobile carousel for example section`

---

### Task A5: Generator-Section _(✅ umgesetzt — inkl. Farbauswahl)_

> **Stand:** umgesetzt. Ergänzungen/Korrekturen gegenüber den Steps unten:
>
> - **Farbauswahl (neu):** kompakter Swatch-Picker über `GENERATOR_COLOR_PAIRS` + „Auto" → Form-Value
>   `colorPairId` (Default `auto`). Jede Swatch = Mini-Vorschau (Gradient + Akzentpunkt), platzsparend auf Mobile.
> - **Komponenten-Split:** `generator-form` / `field` / `preview-panel` / `success-preview` /
>   `custom-post-block`, jeweils eigenes CSS-Modul.
> - **Custom-Post-Block** zeigt den **echten** Post (locale-abhängiges Bild + Profil + Caption mit internem
>   Link + Befehl-Zeile) → Step 6 „Placeholder-Asset" damit erledigt.
> - **Analytics** über `@/common/constants/generator/generator-analytics` (Konstanten statt Magic Strings);
>   Custom-Post-CTA = `cta_click` + `location="generator_custom_post"` (**nicht** `custom_post_cta_click`).
> - **State-Diskriminanten** über `GeneratorStateKind`; Form-Errors über `GeneratorFieldErrors`.

**Files:**

- Create: `apps/web/src/i18n/dictionaries/linkedin-post/generator/{de.json,en.json,index.ts}`
- Create: `apps/web/src/components/marketing/linkedin-post/generator-section/generator-section.tsx`
- Create: `apps/web/src/components/marketing/linkedin-post/generator-section/generator-section.module.css`
- Create: `apps/web/src/components/marketing/linkedin-post/generator-section/generator-section.test.tsx`

**States:**

1. **Idle** — Formular: Thema, Expertise, Ton (3 Buttons: sachlich / persönlich / provokativ),
   E-Mail, Consent-Checkbox, Submit-Button.
2. **Loading** — Submit-Button deaktiviert, Loading-Indicator, Status-Text ("Dein Post wird generiert…").
3. **Success** — Bild-Vorschau + Caption-Text. Download-Buttons (Bild, Text).
   Danach: **Custom-Post-Block** (siehe unten). Danach: **Soft-CTA-Card**.
4. **Error** — Inline-Fehlermeldung, Formular bleibt editierbar.

**Success-State — Custom-Post-Block (neu, verbindlich):**

Erscheint direkt unterhalb von Bild-Vorschau + Download-Buttons, vor der Soft-CTA-Card.
Zeigt einen echten Post aus Moritz' eigenem Custom-Workflow als visuelles Kontrastbeispiel.

Aufbau:

- Trennzeile / visueller Abstand zum Generator-Ergebnis darüber
- Label-Badge (klar sichtbar, nicht subtil): z. B. „Custom Workflow" + Icon (z. B. ⚡ oder
  ein kleines Workflow-Icon) — macht unmissverständlich klar: das ist kein Generator-Output
- Das echte Post-Bild (statisches Asset, generiert via Custom-Skill): mit eigenem Farbthema,
  eigenem Branding-Stil (Icon, URL, individuelle Typografie) — sichtbarer Qualitätsunterschied
  zum Generator-Output
- Darunter kurze Kontext-Zeile (DE/EN aus Dictionary): z. B.
  „Erstellt mit einem maßgeschneiderten Workflow — einem einzigen Befehl, abgestimmt auf
  Nische, Tone-of-Voice und Branding."
- **Soft-CTA-Copy (DE):** `"Lass uns prüfen, ob das für deinen Social-Media-Content-Workflow
umsetzbar ist."` → Link zu Kontaktformular oder Calendly.
  **(EN):** `"Let's check if this is feasible for your social media content workflow."` → selber Link.

**Warum hier (nicht in der Example-Section):**
Der Besucher hat gerade seinen eigenen Generator-Output gesehen — er ist im höchsten Moment
wahrgenommenen Werts. Das Custom-Beispiel trifft genau dann auf die Frage "was wäre möglich
wenn das auf mich zugeschnitten ist?" — maximale Kaufmotivation ohne Pricing-Druck.

**Soft-CTA nach Custom-Block (DE):**
Kein zweiter CTA-Block mehr notwendig; der Custom-Post-Block übernimmt diese Funktion vollständig.
Der alte generische Soft-CTA-Text ("Das war ein Beispiel-Workflow…") entfällt.

**Mobile-first:**

- Alle Felder full-width gestapelt
- Ton-Auswahl: 3 gleichbreite Buttons, full-width auf Mobile
- Output: Bild 100% Breite, Caption darunter
- Download-Buttons: full-width gestapelt
- CTA-Card: full-width, klarer Kontrast

- [ ] **Step 1:** DE/EN-Dictionaries: Labels, Hilfetexte, Ton-Options, Error-Copy, Success-Copy,
      Loading-Text. Neu: `customPost.label`, `customPost.context`, `customPost.ctaLabel`,
      `customPost.ctaAriaLabel`, `customPost.imageAlt` für den Custom-Post-Block.
- [ ] **Step 2:** Failing jsdom-Tests: Required-Errors (topic, email, consent), Tone-Selection,
      Loading-State während Submit, Success-State mit imageUrl + caption, Error-State, Honeypot.
      Neu: Success-State rendert Custom-Post-Block mit Label-Badge, Bild und CTA-Link.
- [ ] **Step 3:** Client Component gegen Stub `submitLinkedInPostGenerator` aus S1 bauen.
      Custom-Post-Block ist statisch (kein API-Call) — immer sichtbar im Success-State.
- [ ] **Step 4:** Analytics: `generator_form_start`, `generator_submit_attempt`,
      `generator_success`, `generator_error`, `post_download`, `custom_post_cta_click` — alle mit
      `form_id: "linkedin_post_generator"`, keine PII.
- [ ] **Step 5:** CSS Module: mobile-first, Ton-Buttons mit klarem Selected-State,
      Loading-Skeleton für Bild-Placeholder, sichtbare Focus-States.
      Custom-Post-Block: visuell vom Generator-Ergebnis abgesetzt (Trennlinie oder Gap),
      Label-Badge prominent (nicht subtil), Bild full-width auf Mobile.
- [ ] **Step 6:** Statisches Custom-Post-Asset bereitstellen (real generiert via Custom-Skill,
      eigenes Branding: Icon, URL, individuelles Farbthema). `next/image`, klar dimensioniert.
      Placeholder bis echtes Asset verfügbar.
- [ ] **Step 7:** `gradient_border_grain`-Effekt für Custom-Post-Block oder Soft-CTA prüfen.
- [ ] **Step 8:** Tests grün: `npm run test:unit -- generator-section`.
- [ ] **Step 9:** Section mit `id="generator"` einhängen.
- [ ] **Step 10:** Commit — `feat(linkedin-post): add linkedin post generator section with custom post block`

---

### Task A6: Privacy-Note-Section _(✅ umgesetzt)_

**Files:**

- Create: `apps/web/src/i18n/dictionaries/linkedin-post/privacy-note/{de.json,en.json,index.ts}`
- Create: `apps/web/src/components/marketing/linkedin-post/privacy-note-section/...`

**Pflichtbotschaft:** E-Mail wird nur für Zusendung des generierten Posts genutzt. Kein Spam.
Keine Weitergabe. Datenschutz-Link. Keine sensiblen Kundendaten oder personenbezogenen Daten Dritter
als Input verwenden.

- [ ] **Step 1:** DE/EN-Dictionaries schreiben.
- [ ] **Step 2:** Ruhiger Hinweisblock mit `<p>` + Datenschutz-Link.
- [ ] **Step 3:** Verify.
- [ ] **Step 4:** Commit — `feat(linkedin-post): add privacy note section`

---

### Task A7: Metadata + Structured Data _(✅ umgesetzt — Werte ggf. final gegenprüfen)_

**Files:**

- Create: `apps/web/src/i18n/dictionaries/linkedin-post/meta/{de.json,en.json,index.ts}`
- Create: `apps/web/src/lib/seo/linkedin-post-structured-data.ts`
- Modify: `apps/web/src/app/[locale]/(marketing)/services/linkedin-post/page.tsx`

- [ ] **Step 1:** Meta-Copy DE/EN. Title: `LinkedIn-Post Generator | Invessiv`.
- [ ] **Step 2:** Canonical und alternates für `/de|/en/services/linkedin-post`.
- [ ] **Step 3:** Service Structured Data: `SoftwareApplication` oder `Service` für den Generator.
- [ ] **Step 4:** Page-Test Metadata DE/EN.
- [ ] **Step 5:** Commit — `feat(linkedin-post): add metadata and structured data`

---

### Task A8: UI-Review

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test:unit`
- [ ] `npm run build`
- [ ] A11y-Smoke: Keyboard, Fokus-Reihenfolge, Kontrast, Dark/Light, Mobile 360 px.
- [ ] Generator-Flow manuell testen (Stub): Idle → Loading → Success → Download.
- [ ] Code-Review UI-Track.

---

# TRACK B — Generator-Logik

### Task B1: `linkedin_post_generator`-Anfrageart

**Files:** Modify `packages/common/src/constants/contact/contact-request-kind.ts`

- [ ] **Step 1:** Failing Konstanten-Test erweitern.
- [ ] **Step 2:** `LinkedInPostGenerator: "linkedin_post_generator"` ergänzen.
- [ ] **Step 3:** Tests grün.
- [ ] **Step 4:** Commit — `feat(generator): add linkedin_post_generator request kind`

---

### Task B2: Generator DTO + Zod-Schema

**Files:**

- Create: `packages/common/src/contracts/generator/linkedin-post-generator-dto.ts`
- Create: `apps/web/src/server/generator/validation/linkedin-post-generator.schema.ts`
- Create: `apps/web/src/server/generator/validation/linkedin-post-generator.schema.test.ts`

**DTO:**

```ts
export type LinkedInPostGeneratorDto = {
  topic: string; // max. 280 Zeichen
  expertise: string; // max. 120 Zeichen
  tone: LinkedInPostTone; // const-Objekt-Typ (kein inline union)
  colorPairId: string; // eine der 10 Pair-Ids ODER "auto"
  email: string;
  kind: "linkedin_post_generator";
};
```

> **colorPairId-Regel:** Gültig sind die 10 Ids aus
> `@/common/constants/generator/generator-color-pairs` (`GENERATOR_COLOR_PAIRS`) **oder**
> `GENERATOR_COLOR_AUTO`. Zod validiert strikt gegen diese Menge (kein stiller Fallback). Die ID
> wird unverändert an B3 weitergereicht (binding, siehe Skill §6).

- [ ] **Step 1:** DTO definieren (inkl. `colorPairId`; `tone` über `LinkedInPostTone`).
- [ ] **Step 2:** Failing Schema-Tests: required fields, topic max-length, invalid email,
      missing consent, Honeypot/Spam, ungültiger tone-Wert, **ungültiger `colorPairId`** (nicht aus
      `GENERATOR_COLOR_PAIRS`-Ids ∪ `auto`).
- [ ] **Step 3:** Zod-Schema implementieren (colorPairId-Enum aus den Color-Pair-Konstanten ableiten).
- [ ] **Step 4:** Tests grün.
- [ ] **Step 5:** Commit — `feat(generator): add linkedin-post-generator DTO and validation`

---

### Task B3: HTML-Skill-Invokation + Caption-Generierung

**Files:**

- Create: `apps/web/src/server/services/generator/linkedin-post/generate-linkedin-post.ts`
- Create: `apps/web/src/server/services/generator/linkedin-post/generate-linkedin-post.test.ts`

**Implementiert den Skill-Contract** (`linkedin-post-generator/SKILL.md`) — keine eigenen Strukturen erfinden.

**Ablauf:**

1. Input (topic, expertise, tone, locale) → Claude-API-Call mit Structured Output gebunden an
   `references/content-schema.json` (= **nur** der Copy-Teil: headlineHtml/headlinePlain/bodyVariant/
   insight|bullets/caption). Niedrige Temperatur, aktuelles Top-Claude-Modell (Skill §8).
2. **Farb-Paar nach Skill §6 (binding) auflösen:** konkrete `colorPairId` → genau dieses Paar
   (`colorPair.source = "selected"`); `auto` → Zufall (`"random"`). Pair-Daten aus
   `references/color-pairs.json`.
3. Wrapper setzt `result.json` (Skill §5) zusammen (LLM-Copy + colorPair + inputs + render) und füllt
   `templates/post-template.html` mit den Pair-Farben → fertiges Post-HTML.
4. Gibt zurück: `{ html: string; caption: string; colorPair }`.

**Fehlerpfade:** KI-Timeout, ungültiger/Schema-invalider LLM-Output, HTML-Rendering-Fehler → jeweils
eigener Fehlercode (Mapping über ein `*-error.ts` gemäß Root-CLAUDE.md); Lead trotzdem persistieren (B5).

- [ ] **Step 1:** Failing Tests: strukturierter Input → schema-valider Output; **konkrete `colorPairId`
      ⇒ `result.json.colorPair.id === colorPairId` & `source === "selected"`**; `auto` ⇒ `"random"`;
      Fehlerpfad-Handling.
- [ ] **Step 2:** Claude-API-Call gegen `content-schema.json` implementieren (server-only).
- [ ] **Step 3:** Farb-Auflösung (binding) + HTML aus `post-template.html` + Copy zusammensetzen;
      `result.json` gegen `references/result-schema.json` validieren (Quality-Gate Skill §11).
- [ ] **Step 4:** Tests grün.
- [ ] **Step 5:** Commit — `feat(generator): implement linkedin post content generation`

---

### Task B4: HTML-to-Image-Konvertierung

**Files:**

- Create: `apps/web/src/server/services/generator/linkedin-post/render-post-image.ts`
- Create: `apps/web/src/server/services/generator/linkedin-post/render-post-image.test.ts`

**Ansatz:** HTML → Screenshot via Puppeteer/Playwright (server-side, headless) oder äquivalenter
Render-Service. Gibt Buffer oder temporäre Datei zurück.

**Performance-Grenze:** Render-Timeout max. 8 Sekunden; bei Überschreitung Fehlercode
`RENDER_TIMEOUT`, Lead trotzdem speichern.

**Speicherung:** Temporäre Ablage in `/tmp` oder externem Storage (z.B. S3/R2) mit TTL 24h.
Download-Token verweist auf diese Datei.

- [ ] **Step 1:** Failing Tests: HTML-Input → Image-Buffer-Output, Timeout-Pfad.
- [ ] **Step 2:** Render-Service implementieren.
- [ ] **Step 3:** Temporäre Datei-Ablage + Download-Token-Generierung.
- [ ] **Step 4:** Tests grün.
- [ ] **Step 5:** Commit — `feat(generator): implement html-to-image rendering`

---

### Task B5: Lead-Persistenz

**Files:** `packages/db/src/record-configuration/**` + Mapper

**Daten:** E-Mail, Expertise, Tone, **colorPairId** (gewähltes Farbschema bzw. `auto`), Topic
(gekürzt, kein PII-Risiko), Zeitstempel, Generator-Status (success/error), Request-Kind
`linkedin_post_generator`.

- [ ] **Step 1:** Failing Mapper/Persistence-Input-Test.
- [ ] **Step 2:** Lead + LeadSubmission + Generator-Details modellieren (eigene Tabelle/Column,
      kein Projektanfrage-Schema zweckentfremden).
- [ ] **Step 3:** Tests grün.
- [ ] **Step 4:** Commit — `feat(generator): persist linkedin post generator leads`

---

### Task B6: E-Mail-Versand (Kopie an Besucher)

**Files:**

- Create: `apps/web/src/server/services/mail/templates/linkedin-post-generator-result.ts`
- Create: entsprechende Test-Datei

**Inhalt:** Generiertes Bild als Anhang + Caption als Text + kurzer Begleittext + weicher Hinweis
auf Kontaktmöglichkeit für eigenen KI-Workflow. Kein Spam, kein Upsell-Druck.

**Sprache:** Richtet sich nach dem locale des Requests (DE/EN).

- [ ] **Step 1:** Failing Template-Test DE/EN.
- [ ] **Step 2:** Template implementieren.
- [ ] **Step 3:** Tests grün.
- [ ] **Step 4:** Commit — `feat(generator): add linkedin post result mail template`

---

### Task B7: API-Route

**Files:**

- Create: `apps/web/src/app/api/public/generator/linkedin-post/route.ts`
- Create: entsprechende Test-Datei

**Flow:**

```
POST /api/public/generator/linkedin-post
  → Validate DTO (B2) — inkl. colorPairId
  → Honeypot/Spam-Check
  → Generate content + HTML (B3) — colorPairId binding durchreichen
  → Render image (B4)
  → Persist lead (B5) — auch bei Generierungsfehler, inkl. colorPairId
  → Send email (B6) — best-effort, kein hard fail
  → Return { imageUrl, caption, downloadToken }   // = Stub-Result-Shape aus S1
```

**Response-Codes:** `200 OK`, `400 Bad Request`, `429 Too Many Requests`, `500 Internal Server Error`.

**Rate-Limit:** Max. 3 Requests pro IP pro Stunde.

> **Konstanten/Reuse:** `GENERATOR_FORM_ID`, Error-Reasons (`GeneratorErrorReason`) und Analytics-Events
> aus `@/common/constants/generator/**` wiederverwenden. Der Client (`submitLinkedInPostGenerator`) sendet
> bereits `colorPairId` mit; B7 reicht es bis B3 durch.

- [ ] **Step 1:** Failing API-Tests: happy path, Validierungsfehler, Rate-Limit, Generierungsfehler.
- [ ] **Step 2:** Route implementieren.
- [ ] **Step 3:** Submit-Service-Stub aus S1 durch echten `fetch`-Call ersetzen.
- [ ] **Step 4:** Tests grün.
- [ ] **Step 5:** Commit — `feat(generator): add linkedin post generator api route`

---

### Task B8: Download-Endpoint

**Files:**

- Create: `apps/web/src/app/api/public/generator/linkedin-post/download/route.ts`

**Logik:** GET mit `?token=<downloadToken>` → Datei aus temporärem Storage → `image/png` mit
`Content-Disposition: attachment`. Token einmalig gültig oder TTL 24h.

- [ ] **Step 1:** Failing Tests: gültiger Token, abgelaufener Token, ungültiger Token.
- [ ] **Step 2:** Endpoint implementieren.
- [ ] **Step 3:** Tests grün.
- [ ] **Step 4:** Commit — `feat(generator): add post image download endpoint`

---

# TRACK C — Integration & SEO

### Task C1: Submit-Service verdrahten + interne Verlinkung

- [ ] Stub aus S1 durch echten API-Call ersetzen (wird in B7 ausgelöst).
- [ ] Crawlbare interne Links aus Home und Marketing-Bereichen auf `/services/linkedin-post` ergänzen,
      nur über `SITE_ROUTES.LINKEDIN_POST_SERVICE`.
- [ ] `sitemap.ts` prüfen und Route aufnehmen.
- [ ] `robots.ts` prüfen; Route bleibt indexierbar.
- [ ] Commit — `feat(linkedin-post): add internal links and sitemap coverage`

### Task C2: Integration Review

- [ ] Generator-Flow gegen echten API-Pfad testen (Stub deaktiviert).
- [ ] E-Mail-Empfang prüfen (Testadresse).
- [ ] Download-Link in der E-Mail funktioniert.
- [ ] Analytics-Payloads: keine PII, korrekte `form_id`.
- [ ] Rate-Limit greift bei Missbrauch.
- [ ] SEO Preview DE/EN prüfen.
- [ ] Commit — `test(linkedin-post): verify generator integration`

---

# TRACK D — QA & Gates

### Task D1: E2E / Smoke

- [ ] `/de/services/linkedin-post` rendert.
- [ ] `/en/services/linkedin-post` rendert.
- [ ] Hero CTA scrollt zum Generator.
- [ ] Formular zeigt Required Errors.
- [ ] Formular kann mit gültigen Daten abgesendet werden (Stub).
- [ ] Loading-State erscheint während Submit.
- [ ] Ergebnis (Bild + Caption) erscheint nach Success.
- [ ] Download-Button funktioniert.
- [ ] Soft-CTA nach Ergebnis sichtbar.
- [ ] Error-State ist verständlich.
- [ ] Keyboard-Navigation funktioniert.
- [ ] Fokus-States sichtbar.
- [ ] Commit — `test(linkedin-post): add e2e smoke tests`

### Task D2: Quality Gates + PR-Doku

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test:unit`
- [ ] `npm run build`
- [ ] Core Web Vitals kurz prüfen: LCP/CLS/INP.
- [ ] PR: Was/Warum, Screenshots DE/EN Mobile/Desktop, Testplan, Risiko/Rollback, Security/Privacy.

---

## Akzeptanzkriterien

- Route unter `/de|/en/services/linkedin-post` erreichbar.
- Hero, Problem, Offer, Beispiel-Section und Generator-Section konsistent auf
  LinkedIn-Post-Generierung für Solo-Dienstleister ausgerichtet.
- Kein Pricing auf dieser Page.
- Kein sichtbarer UI-Text inline in Pages oder Komponenten.
- Generator liefert Ergebnis direkt auf der Page + per E-Mail.
- Lead mit E-Mail + Input-Kontext persistiert, auch bei Generierungsfehler.
- Download-Button funktioniert (Bild-Datei).
- Gewählte Hintergrundfarbe (`colorPairId`) wird im generierten Post eingehalten; `auto` ⇒ Zufallspaar.
- Soft-CTA nach Ergebnis sichtbar und klickbar.
- Rate-Limit für Generator-API aktiv.
- Kein PII in Analytics.
- Metadata, Canonical, Alternates und Structured Data vorhanden.
- Sitemap/Robots geprüft.
- Keine neue globale Section-CSS in `globals.css`.
- Dark Mode default, Light kompatibel.
- Mobile 360 px: kein Textüberlauf, kein Überlappen.

## Offene Punkte vor Umsetzung

- [ ] Temporärer Bild-Storage klären: `/tmp` (serverless-inkompatibel!) vs. R2/S3 vs. Base64 in Response.
- [ ] HTML-to-Image-Lösung für Serverless bestätigen: Puppeteer benötigt Chrome-Layer
      (Vercel: `@sparticuz/chromium`); Playwright ähnlich — oder externer Screenshot-Service.
- [ ] Rate-Limit-Speicher: In-Memory (single-instance) vs. Redis/Upstash für verteilte Deployments.
- [ ] Locale der generierten E-Mail: aus URL-Locale ableiten oder optionalem Feld.
- [ ] Calendly-URL oder Kontaktformular für Soft-CTA festlegen.
- [ ] Example-Section: echte `promptText`-Werte (aktuell Platzhalter) + echte Beispiel-Bilder bereitstellen.
      (Custom-Post-Block-Assets sind bereits real — erledigt.)
