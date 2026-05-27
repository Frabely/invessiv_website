# AI-Workflows Landingpage — Step-by-Step Umsetzungsplan

> **Für agentische Worker:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development` (empfohlen) oder
> `superpowers:executing-plans`, um diesen Plan Task für Task umzusetzen. Schritte nutzen Checkbox-Syntax (`- [ ]`) zum
> Tracking.

**Goal:** Neue, conversion-fokussierte Marketing-Landingpage unter `/[locale]/services/ai-workflows` (DE/EN) für einen
zweistufigen KI-Flow: zuerst Lead-Erfassung mit Name, E-Mail und Workflow-Frage, danach ein KI-gestützter
LinkedIn-Post-Generator mit Caption; Upload bleibt in V1 außen vor.

**Architecture:** Next.js App Router Route-Gruppe `(marketing)`. Route orchestriert nur Metadata + Dictionary-Laden +
Section-Rendering. Eigene Section-Komponenten unter `components/marketing/ai-workflows/**`, Copy ausschließlich in
DE/EN-Dictionaries. Globaler `SiteHeader` (mit schlanker AI-Workflows-Navigation) + `FooterSection` werden
wiederverwendet. Die Form-UI ist zweistufig: Step 1 erfasst den Lead, Step 2 erzeugt aus dem Nutzer-Input den
LinkedIn-Post samt Caption. Beide Schritte bleiben präsentational und sprechen nur mit typisierten Submit-Services (
Seams); DTO, API-Dispatch, KI-Service, Persistenz und Mail sind ein klar getrennter Logik-Track.

**Tech Stack:** Next.js (App Router, Server Components default), TypeScript (strict), Tailwind + CSS Modules, Zod,
bestehende Contact-Pipeline (`/api/public/contact`), `@invessiv/common` Contracts, `@invessiv/db` Persistenz,
Vitest/jsdom + Playwright.

---

## Entscheidungen aus der Planungsphase (verbindlich für diesen Plan)

| #   | Frage               | Entscheidung                        | Auswirkung auf den Plan                                                                                                                                                                        |
| --- | ------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | KI-Auswertung Scope | **KI in V1**                        | Track B enthält den vollständigen serverseitigen KI-Workflow-Service für den LinkedIn-Post-Generator. Der Flow ist zweistufig: zuerst Lead speichern, danach den Post erzeugen und ausliefern. |
| 2   | Datei-Upload        | **Upload erst V2**                  | V1 ohne multipart/Storage. Das „anonymisierte Beispiel" wird als optionales **Freitextfeld** erfasst. Endpoint bleibt JSON.                                                                    |
| 3   | Header/Footer       | **Bestehendes Landing-Muster**      | Wiederverwendung von `SiteHeader` (schlanke AI-Workflows-Nav, kein Theme-Switch) + `FooterSection`. Kein neuer Header-Code.                                                                    |
| 4   | Section-Komponenten | **Eigene ai-workflows-Komponenten** | Neue Komponenten unter `components/marketing/ai-workflows/**`. Reveal-Hook (`use-staggered-section-reveal`) und `EyebrowPill` werden wiederverwendet.                                          |

Alles andere folgt unverändert dem Quell-Umsetzungsplan `apps/web/plans/ki_workflow_demo_umsetzungsplan.md`.

---

## Skills-Referenz (welcher Skill wann)

| Skill                                        | Einsatz in diesem Plan                                                                                                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `invessiv-landing`                           | Vor jeder Section-/CTA-/Reihenfolge-Arbeit laden. Regelt Struktur, Sektionsreihenfolge, CTA-Strategie und Tonalitäts-Leitplanken.                                                                |
| `copywriting`                                | **Pflicht** bei jedem Schritt, der sichtbare Texte, CTA-Copy, Microcopy, FAQ-Antworten, Meta-/OG-Texte oder Form-Labels erzeugt — inklusive der EN-Übersetzung. Gilt für DE **und** EN parallel. |
| `frontend-design`                            | **Pflicht** bei jedem UI-Bau-Schritt (Sections, Hero, Formular, Pricing-Karte, Animationen, States).                                                                                             |
| `superpowers:test-driven-development`        | Pflicht im gesamten Logik-Track (Track B): erst Test, dann Implementierung.                                                                                                                      |
| `superpowers:systematic-debugging`           | Bei jedem Test-Fail oder unerwartetem Verhalten, vor dem Fix.                                                                                                                                    |
| `superpowers:verification-before-completion` | Vor jedem „fertig"-Claim und vor jedem Commit eines Tasks: Quality Gate real ausführen, Output prüfen.                                                                                           |
| `superpowers:requesting-code-review`         | Vor Merge je Track. Für Payment/Auth/Download gilt 2 Reviews — hier relevant bei API-/Persistenz-/KI-Änderungen.                                                                                 |

> **Vor Animations-/Section-Arbeit (verbindlich):** Zuerst `animation_mockups/` und
> `animation_mockups/effects-catalog.json` prüfen. Die im Plan vorgesehenen Effekte existieren bereits im Katalog:
> `scroll_reveal_stagger`, `gradient_border_grain`, `svg_path_journey`.

---

## Track-Übersicht (UI = Claude, Logik = Codex)

Das Ziel des Schnitts: **UI unabhängig von Logik bauen.** Beide Tracks laufen parallel nach dem gemeinsamen Seam (Task
S1).

- **Seam (zuerst, gemeinsam):** geteilter Form-Values-Typ + Submit-Service-Interface + Stub. Danach sind A und B
  entkoppelt.
- **Track A — UI (Claude):** Route-Scaffold, Dictionaries, Sections, Hero, Pricing, Privacy, Formular-UI (präsentational
  gegen Stub), Styling, Animationen, Metadata/Structured-Data-Verdrahtung.
- **Track B — Logik (Codex):** Lead-Erfassung + `workflow_check`-Anfrageart, `linkedin_post`-Generierung, DTOs + Zod,
  API-Dispatch, Command-Handler, Mapper, Persistenz, KI-Workflow-Service, interne Mail, Unit-/Integrationstests.
- **Track C — Integration & SEO:** Seam-Stub durch echten Service ersetzen, Structured Data, interne Links,
  Sitemap/Robots.
- **Track D — QA & Gates:** E2E/Smoke, A11y, Quality Gates, Doku.

Jeder Task endet mit genau einem Commit. Branch-Konvention: `feat/ai-workflows-landing` (UI) und
`feat/ai-workflows-backend` (Logik) oder ein gemeinsamer Feature-Branch mit getrennten Commits.

---

## File Structure (was wird angelegt / geändert)

### Route & Config

- Create: `apps/web/src/app/[locale]/(marketing)/services/ai-workflows/page.tsx` — Orchestrierung Metadata + Structured
  Data + Section-Rendering.
- Create: `apps/web/src/app/[locale]/(marketing)/services/ai-workflows/page.test.tsx` — Metadata/Render-Smoke.
- Modify: `apps/web/src/config/routes.ts` — `AI_WORKFLOWS_SERVICE` ergänzen.
- Create: `apps/web/src/config/navigation/ai-workflows.ts` — schlanke Header-Navigation + Section-Hrefs/IDs.

### Komponenten (UI)

- Create: `apps/web/src/components/marketing/ai-workflows/ai-workflows-page/` — Orchestrator-Komponente.
- Create: `apps/web/src/components/marketing/ai-workflows/hero-section/`
- Create: `apps/web/src/components/marketing/ai-workflows/problem-examples-section/`
- Create: `apps/web/src/components/marketing/ai-workflows/offer-section/`
- Create: `apps/web/src/components/marketing/ai-workflows/pricing-section/`
- Create: `apps/web/src/components/marketing/ai-workflows/privacy-note-section/`
- Create: `apps/web/src/components/marketing/ai-workflows/workflow-check-form/`

Jede Komponente: `name.tsx` + `name.module.css` (+ `name.test.tsx` bei Interaktion). Hauptdatei = Ordnername.

### Content / i18n

- Create: `apps/web/src/i18n/dictionaries/ai-workflows/<sektion>/{de.json,en.json,index.ts}` für: `meta`, `hero`,
  `problem-examples`, `offer`, `pricing`, `privacy-note`, `form`, `structured-data`.

### SEO

- Create: `apps/web/src/lib/seo/ai-workflows-structured-data.ts` — analog `landing-structured-data.ts`.
- Modify: `apps/web/src/app/sitemap.ts` (prüfen/ergänzen).
- Modify: `apps/web/src/app/robots.ts` (prüfen, dass Route indexierbar bleibt).

### Seam (geteilt)

- Create: `packages/common/src/contracts/contact/forms/workflow-check-form-values.ts` — Form-Values-Typ.
- Create: `apps/web/src/client/contact/workflow-check/submit-workflow-check.ts` — Submit-Service-Interface + Stub (
  später echte Implementierung).

### Logik (Codex)

- Modify: `packages/common/src/constants/contact/contact-request-kind.ts` — `WorkflowCheck`.
- Create: `packages/common/src/contracts/contact/workflow-check/save-workflow-check-dto.ts`
- Create: `apps/web/src/server/contact/validation/workflow-check/workflow-check.schema.ts` (+ `.test.ts`)
- Create: `apps/web/src/server/contact/handlers/submit-workflow-check.command-handler.ts` (+ Test)
- Modify: `apps/web/src/app/api/public/contact/route.ts` — Dispatch für `workflow_check`.
- Modify: `apps/web/src/server/contact/mapper/contact-lead-mapper-service.ts` — Workflow-Check-Mapping.
- Create: `apps/web/src/client/contact/mappers/map-workflow-check-form-to-dto.ts` (+ Test)
- Create: `apps/web/src/server/services/ai/workflow-check/**` — KI-Workflow-Service (+ Tests).
- Create: `apps/web/src/server/services/mail/templates/workflow-check-notification.ts` (+ Test)
- Persistenz: `packages/db/src/record-configuration/**` — Workflow-Check-Detaildaten + KI-Ergebnis (Codex,
  DB-Migration).

---

## SEAM — gemeinsame Schnittstelle zuerst

### Task S1: Form-Values-Typ + Submit-Service-Stub

**Zweck:** UI und Logik entkoppeln. Nach diesem Task kann Claude die Formular-UI komplett gegen den Stub bauen, ohne auf
Codex zu warten.

**Files:**

- Create: `packages/common/src/contracts/contact/forms/workflow-check-form-values.ts`
- Create: `apps/web/src/client/contact/workflow-check/submit-workflow-check.ts`

**Skills:** keine Copy/UI — reine Typdefinition.

- [ ] **Step 1: Form-Values-Typ definieren** (Upload-frei, V2-Feld weggelassen)

```ts
// packages/common/src/contracts/contact/forms/workflow-check-form-values.ts
export type WorkflowCheckFormValues = {
  email: string;
  // Tätigkeit/Unternehmensart ODER Website (mind. eines Pflicht)
  businessType: string;
  website: string;
  recurringTask: string;
  currentProcess: string; // inkl. grober Häufigkeit/Zeitaufwand
  consent: boolean;
  // optional
  name: string;
  desiredOutput: string;
  toolsUsed: string;
  anonymizedExample: string; // Freitext-Ersatz für Upload (V2)
  // Honeypot
  company: string;
};

export const WORKFLOW_CHECK_FORM_INITIAL_VALUES: WorkflowCheckFormValues = {
  email: "",
  businessType: "",
  website: "",
  recurringTask: "",
  currentProcess: "",
  consent: false,
  name: "",
  desiredOutput: "",
  toolsUsed: "",
  anonymizedExample: "",
  company: "",
};
```

- [ ] **Step 2: Submit-Service-Interface + Stub**

```ts
// apps/web/src/client/contact/workflow-check/submit-workflow-check.ts
import type { WorkflowCheckFormValues } from "@invessiv/common/contracts/contact/forms/workflow-check-form-values";

export type SubmitWorkflowCheckResult =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string[]>; code: string };

// STUB — wird in Track C (Task C1) durch echte Mapper+Fetch-Implementierung ersetzt.
export async function submitWorkflowCheck(
  _values: WorkflowCheckFormValues,
): Promise<SubmitWorkflowCheckResult> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { ok: true };
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/common/src/contracts/contact/forms/workflow-check-form-values.ts apps/web/src/client/contact/workflow-check/submit-workflow-check.ts
git commit -m "feat(ai-workflows): add workflow-check form values type and submit seam stub"
```

---

# TRACK A — UI (Claude)

> Skill-Pflicht im gesamten Track A: `frontend-design` bei jedem Bau-Schritt, `copywriting` bei jedem Text-Schritt (DE \*
> \*und\*\* EN), `invessiv-landing` zur Strukturkontrolle.

### Task A0: Route-Konstante + Route-Scaffold + Navigation

**Files:**

- Modify: `apps/web/src/config/routes.ts`
- Create: `apps/web/src/config/navigation/ai-workflows.ts`
- Create: `apps/web/src/app/[locale]/(marketing)/services/ai-workflows/page.tsx`
- Create: `apps/web/src/components/marketing/ai-workflows/ai-workflows-page/ai-workflows-page.tsx`

- [ ] **Step 1: Route-Konstante ergänzen**

```ts
// apps/web/src/config/routes.ts
export const SITE_ROUTES = {
  HOME: "/",
  LANDING_PAGE_SERVICE: "/services/landing-page",
  AI_WORKFLOWS_SERVICE: "/services/ai-workflows",
  PROJECTS: "/projects",
  IMPRINT: "/imprint",
  PRIVACY: "/privacy",
  TERMS: "/terms",
} as const;
```

- [ ] **Step 2: Navigation/Section-IDs anlegen** — analog `config/navigation/landing.ts`. Definiere Section-IDs (
      `problem`, `offer`, `pricing`, `privacy`, `contact`) und `AI_WORKFLOWS_HEADER_NAVIGATION` als schlanke Navigation (
      max. CTA + ggf. „Ablauf ansehen"). Lies zuerst `config/navigation/landing.ts` und spiegele dessen Struktur. CTA-Text
      via `copywriting`.

- [ ] **Step 3: Orchestrator-Komponente (leeres Gerüst)** — `ai-workflows-page.tsx` rendert vorerst `SiteHeader` (mit
      `AI_WORKFLOWS_HEADER_NAVIGATION`, `showThemeSwitch={false}`) + `<main className="marketing-main">` + Platzhalter +
      `FooterSection`. Spiegele Struktur aus `components/marketing/landing/landing-page/landing-page.tsx`.
      Footer-Content-Dictionary: bestehendes `getLandingFooterContent` wiederverwenden ODER eigenes `ai-workflows/footer` —
      siehe Offene Frage O3.

- [ ] **Step 4: Route-Page (Metadata folgt in Task A7, vorerst minimal)** — `page.tsx` spiegelt `landing-page/page.tsx`:
      `generateStaticParams`, `isSupportedLocale`-Guard, rendert `<AiWorkflowsPage locale={activeLocale} />`.
      Structured-Data-Script wird in A7 ergänzt.

- [ ] **Step 5: Verify** — `npm run dev`, beide Routen rufen:
  - `/de/services/ai-workflows` rendert (Header + leerer Main + Footer)
  - `/en/services/ai-workflows` rendert
- [ ] **Step 6: Commit** — `feat(ai-workflows): scaffold route, navigation and page orchestrator`

---

### Task A1: Hero-Section

**Files:**

- Create: `apps/web/src/i18n/dictionaries/ai-workflows/hero/{de.json,en.json,index.ts}`
- Create: `apps/web/src/components/marketing/ai-workflows/hero-section/hero-section.tsx`
- Create: `apps/web/src/components/marketing/ai-workflows/hero-section/hero-section.module.css`

**Content-Shape** (`LandingAiHeroContent`): `tag`, `title` (genau eine H1), `description`, `primaryCta`, `secondaryCta`,
`priceMicrocopy`, `visualAriaLabel`.

**Start-Copy aus Quellplan** (durch `copywriting` final schärfen + EN übersetzen):

- Headline: „Bereitest du Angebote nach Erstgesprächen noch jedes Mal manuell vor?"
- Subheadline: kostenloser Kurz-Check für 5 Webdesign- oder Marketingagenturen.
- Primary CTA: „Aufgabe prüfen lassen"
- Preis-Microcopy: „Der Kurz-Check ist kostenlos. Bezahlte Mini-Piloten starten ab 1.500 € netto."

**Effekt:** ruhiger Hero, kein lauter Effekt. Optional dezent `scroll_reveal_stagger` für die Hero-Bausteine.

- [ ] **Step 1: Dictionary DE/EN + `index.ts`** (`copywriting`)

```ts
// index.ts (Pattern wie dictionaries/landing/problem/index.ts)
import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingAiHeroContent = {
  tag: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  priceMicrocopy: string;
  visualAriaLabel: string;
};

const CONTENT: Record<Locale, LandingAiHeroContent> = { de, en };

export function getAiWorkflowsHeroContent(locale: Locale) {
  return CONTENT[locale];
}
```

- [ ] **Step 2: Hero-Komponente bauen** (`frontend-design`) — Server Component wenn möglich; nur Client, falls
      Reveal/Interaktion nötig. Genau eine `<h1>`. Primary CTA verlinkt auf `#contact` (Formular), Secondary scrollt zur
      Offer-/Ablauf-Zeile. Preis-Microcopy klar sichtbar. `next/image` falls Visual.
- [ ] **Step 3: CSS Module** — mobile-first (360 px ohne Bruch), Dark default, Light kompatibel, sichtbare Fokus-States.
- [ ] **Step 4: In Orchestrator einhängen + verify** (`npm run dev`, DE/EN, 360 px).
- [ ] **Step 5: Commit** — `feat(ai-workflows): add hero section`

---

### Task A2: Problem-+-Beispiele-Section

**Files:** `dictionaries/ai-workflows/problem-examples/{de,en,index}` +
`components/marketing/ai-workflows/problem-examples-section/{tsx,module.css}`

**Content-Shape** (`LandingAiProblemExamplesContent`): `eyebrow`, `title`, `body`, `examplesHeading`,
`examples: string[]`, `summary`.

**Inhalt (Quellplan):** Gesprächsnotizen, Angebote, Follow-ups, Leistungsbeschreibungen kosten wiederkehrend Zeit.
Beispiele: Angebote aus Gesprächsnotizen, Follow-up-Mails, Leistungsbausteine, Projektbriefings, Referenzen.

**Effekt:** `scroll_reveal_stagger` für die Beispiel-Liste (Hook `use-staggered-section-reveal` wie
`problem-section.tsx`). `EyebrowPill` wiederverwenden.

- [ ] **Step 1: Dictionary DE/EN + index.ts** (`copywriting`)
- [ ] **Step 2: Komponente** (`frontend-design`) — Muster aus `landing/problem-section/problem-section.tsx` adaptieren (
      Copy-Column + Beispiel-Panel als Liste). Eine `<h2>`.
- [ ] **Step 3: CSS Module** (mobile-first, reduzierte Mobile-Animation, `prefers-reduced-motion`).
- [ ] **Step 4: Einhängen + verify** (DE/EN, 360 px)
- [ ] **Step 5: Commit** — `feat(ai-workflows): add problem & examples section`

---

### Task A3: Offer-Section („Was du bekommst")

**Files:** `dictionaries/ai-workflows/offer/{de,en,index}` +
`components/marketing/ai-workflows/offer-section/{tsx,module.css}`

**Content-Shape** (`LandingAiOfferContent`): `eyebrow`, `title`, `body`, `deliverables: string[]` (Lead speichern,
Post-Input erfassen, LinkedIn-Post samt Caption generieren, Download erhalten, E-Mail-Versand), `proofNote` (kompakter
Expertise-Beleg: eigener Social-Workflow als Beispiel für wiederholbare KI-Outputs im konsistenten Design),
`steps: { title: string; text: string }[]` (kompakte 3-Schritt-Zeile: Lead senden → Post generieren → Ergebnis
downloaden oder per Mail erhalten).

**Wichtig (Quellplan):** Proof/Expertise und Ablauf werden **nicht** als große eigene Sections gebaut, sondern hier
kompakt eingebettet.

**Effekt:** optional `svg_path_journey` **nur** für die 3-Schritt-Zeile, und nur falls sie dadurch nicht
größer/erklärbedürftiger wirkt — sonst schlichte nummerierte Zeile.

- [ ] **Step 1: Dictionary DE/EN + index.ts** (`copywriting`) — Claims nur belegbar; keine Buzzwords.
- [ ] **Step 2: Komponente** (`frontend-design`) — Deliverables-Liste + kompakter Proof + 3-Schritt-Zeile inline. Eine
      `<h2>`.
- [ ] **Step 3: CSS Module**
- [ ] **Step 4: Einhängen + verify**
- [ ] **Step 5: Commit** — `feat(ai-workflows): add offer section with compact proof and 3-step flow`

---

### Task A4: Pricing-/Pilot-Section

**Files:** `dictionaries/ai-workflows/pricing/{de,en,index}` +
`components/marketing/ai-workflows/pricing-section/{tsx,module.css}`

**Content-Shape** (`LandingAiPricingContent`): `eyebrow`, `title`, `intro`, `tiers: { name; price; description }[]`,
`ctaLabel`, `note`.

- Kostenloser Kurz-Check
- Mini-Pilot ab 1.500 € netto
- Erweiterter Pilot 2.500–3.500 € netto
- Ausbau ab 5.000 € netto

**Effekt:** `gradient_border_grain` für die hervorgehobene Preis-/Pilotkarte (im Katalog vorhanden).

- [ ] **Step 1: Dictionary DE/EN + index.ts** (`copywriting`) — klare Preis-/Leistungsangaben, keine versteckten
      Bedingungen.
- [ ] **Step 2: Komponente** (`frontend-design`) — Karten/Tiers, hervorgehobener kostenloser Check + Pilot-Frame. CTA
      verlinkt auf `#contact`. Eine `<h2>`.
- [ ] **Step 3: CSS Module** (Hover/Focus/Active-States der Karte; Effekt nur Desktop, Mobile reduziert).
- [ ] **Step 4: Einhängen + verify**
- [ ] **Step 5: Commit** — `feat(ai-workflows): add pricing/pilot section`

---

### Task A5: Privacy-Note-Section

**Files:** `dictionaries/ai-workflows/privacy-note/{de,en,index}` +
`components/marketing/ai-workflows/privacy-note-section/{tsx,module.css}`

**Content-Shape** (`LandingAiPrivacyNoteContent`): `eyebrow`, `title`, `body`, `points: string[]` (keine sensiblen
Kundendaten, keine vertraulichen Dokumente, anonymisierte/bereinigte Beispiele reichen).

- [ ] **Step 1: Dictionary DE/EN + index.ts** (`copywriting`)
- [ ] **Step 2: Komponente** (`frontend-design`) — ruhiger, vertrauensbildender Hinweisblock. Eine `<h2>`.
- [ ] **Step 3: CSS Module**
- [ ] **Step 4: Einhängen + verify**
- [ ] **Step 5: Commit** — `feat(ai-workflows): add privacy-note section`

---

### Task A6: Final-CTA + Zwei-Stufen-Formular (Lead zuerst, dann LinkedIn-Post-Generator)

**Files:**

- Create: `dictionaries/ai-workflows/form/{de.json,en.json,index.ts}`
- Create: `components/marketing/ai-workflows/workflow-check-form/workflow-check-form.tsx`
- Create: `components/marketing/ai-workflows/workflow-check-form/workflow-check-form.module.css`
- Create: `components/marketing/ai-workflows/workflow-check-form/workflow-check-form.test.tsx`
- Create: `components/marketing/ai-workflows/linkedin-post-form/linkedin-post-form.tsx`
- Create: `components/marketing/ai-workflows/linkedin-post-form/linkedin-post-form.module.css`
- Create: `components/marketing/ai-workflows/linkedin-post-form/linkedin-post-form.test.tsx`

**Content-Shape** (`LandingAiFormContent`): Lead-Step mit `eyebrow`, `title`, `intro`, Labels/Placeholder/Hilfetexte je
Feld, `consentLabel`, `submitLabel` (CTA-Text), `successTitle`, `successBody`, `errorMessage`, `requiredHint`; danach
Post-Step mit Prompt-Helfern, Post-Ziel, Tonalität, CTA-Text und Ergebnis-Hinweisen. Validierungs-Fehlertexte über das
bestehende client-seitige Error-Mapping-Pattern (`*-error.ts`), nicht inline.

**Felder (V1, Upload entfällt):**

- Lead-Step Pflicht: Name · E-Mail · Workflow-Frage · Consent
- Post-Step Pflicht: Ziel des Posts · Input/Notizen des Besuchers · gewünschter Ton · gewünschtes Ergebnis
- Optional: Hook-Idee · CTA-Ziel · Tools/Vorlagen · anonymisiertes Beispiel (Freitext)
- Honeypot: `company` (visuell versteckt)

**Seam:** Step 1 importiert `WorkflowCheckFormValues` + `submitWorkflowCheck` aus Task S1. Step 2 importiert einen
eigenen Submit-Service für die Post-Generierung. Beide Schritte rufen ausschließlich ihre jeweiligen Submit-Services
auf — keine eigene Fetch-/DTO-Logik. So bleibt die UI unabhängig von Track B.

**Skills:** `frontend-design` (Felder, States, A11y), `copywriting` (alle Labels/Microcopy DE/EN).

- [ ] **Step 1: Dictionary DE/EN + index.ts** (`copywriting`)
- [ ] **Step 2: Failing test schreiben** (`test-driven-development`, jsdom) — Tests: Lead-Step required-Validierung
      zeigt zugängliche Fehlermeldungen; erfolgreicher Lead-Submit zeigt Übergang zu Step 2; Post-Step Submit zeigt
      Result-State; Submit-Fehler (Stub `ok:false`) zeigt Error-State; Honeypot befüllt → kein Submit.

```bash
npm run test:unit -- workflow-check-form
```

Expected: FAIL (Komponente existiert noch nicht)

- [ ] **Step 3: Formular-Komponente bauen** (`frontend-design`) — Client Components für Step 1 und Step 2. Bestehende
      Form-Bausteine wiederverwenden: `components/shared/form/*` (`form-field`, `form-field-label`, `form-required-marker`,
      `form-status`, `form-actions`) und Muster aus `home/sections/contact-section/quick-contact-form`. Analytics-Events
      feuern für den Lead-Step: `form_start`, `form_submit_attempt`, `lead_submit_success`, `form_submit_error` mit
      `form_id: "workflow_check"` und Location `ai_workflows_form`; für den Post-Step eigener `form_id` und eigene
      Result-Events. Submit des Lead-Steps ruft `submitWorkflowCheck`, Submit des Post-Steps ruft den
      Post-Generator-Service.
- [ ] **Step 4: CSS Module** — sichtbare Fokus-States, klare Disabled-/Error-States, mobile-first.
- [ ] **Step 5: Tests grün**

```bash
npm run test:unit -- workflow-check-form
```

Expected: PASS

- [ ] **Step 6: Final-CTA-Wrapper + Einhängen** — Lead-Step in einer Final-CTA-Section mit `id="contact"` (Ziel aller
      Primary-CTAs). Nach erfolgreichem Lead-Submit wird Step 2 eingeblendet oder per Scroll/Fokus erreichbar, damit der
      LinkedIn-Post-Generator direkt weitergeführt werden kann. Verify: alle CTAs scrollen zum Lead-Step und fokussieren
      sinnvoll; der Übergang zu Step 2 ist klar und zugänglich (`AnchorOffsetScroll` wie Landing nutzen).
- [ ] **Step 7: Commit** — `feat(ai-workflows): add workflow-check form UI against submit seam`

---

### Task A7: Metadata + Structured-Data-Verdrahtung (UI-Seite)

**Files:**

- Create: `dictionaries/ai-workflows/meta/{de,en,index}` und `dictionaries/ai-workflows/structured-data/{de,en,index}`
- Create: `apps/web/src/lib/seo/ai-workflows-structured-data.ts`
- Modify: `apps/web/src/app/[locale]/(marketing)/services/ai-workflows/page.tsx`

**Skills:** `copywriting` (Meta-Title/Description, OG-Text, Breadcrumb-/Schema-Labels DE/EN).

**Title-Konvention:** Unterseite = `Seitenthema | Invessiv`.

- [ ] **Step 1: meta + structured-data Dictionaries DE/EN** (`copywriting`) — identische Keys; keine
      locale-Inline-Verzweigung.
- [ ] **Step 2: `createAiWorkflowsStructuredData`** — `landing-structured-data.ts` als Vorlage spiegeln:
      `Organization` + `Service` + `FAQPage` (falls FAQ vorhanden, sonst weglassen) + `BreadcrumbList`. Preis-Range aus
      Pricing-Dictionary ableiten. Keine `de`/Fallback-Branches — locale-keyed.
- [ ] **Step 3: `generateMetadata` + Structured-Data-Script in page.tsx** — `createPageMetadata` +
      `createLocaleAlternates` für `/de|/en/services/ai-workflows`, Canonical, OpenGraph, OG-Image (projektspezifisch, sonst
      Fallback).
- [ ] **Step 4: page.test.tsx** — Metadata DE/EN inkl. Canonical + Alternates; Render-Smoke beider Locales.

```bash
npm run test:unit -- ai-workflows
```

Expected: PASS

- [ ] **Step 5: Commit** — `feat(ai-workflows): add metadata and service structured data`

---

### Task A8: Track-A-Review (UI vollständig gegen Stub)

- [ ] **Step 1:** `superpowers:verification-before-completion` — Gates real ausführen:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

Alle grün.

- [ ] **Step 2: A11y-Smoke** — Startabschnitt + Conversion-Flow: Keyboard-Navigation, Fokus-Reihenfolge, sichtbare
      Fokus-States, Kontrast (Dark + Light). Mobile 360 px ohne Überlauf/Überlappung.
- [ ] **Step 3:** `superpowers:requesting-code-review` für den UI-Track.

---

# TRACK B — Logik (Codex)

> Skill-Pflicht im gesamten Track B: `superpowers:test-driven-development` (erst Test, dann Code),
> `superpowers:systematic-debugging` bei Fails, `superpowers:verification-before-completion` vor Commits. Keine Copy/UI
> hier. PII-Verbot in Logs/Analytics beachten.

### Task B1: `workflow_check`-Anfrageart

**Files:** Modify `packages/common/src/constants/contact/contact-request-kind.ts` (+ vorhandenen Konstanten-Test
erweitern).

- [ ] **Step 1: Failing test** — `toEqual`-Check + Duplikat-Check inkl. neuem Wert.
- [ ] **Step 2: Konstante ergänzen** (Const-Objekt-Pattern, PascalCase-Key):

```ts
export const CONTACT_REQUEST_KIND = {
  DiscoveryCall: "discovery_call",
  ProjectRequest: "project_request",
  QuickContact: "quick_contact",
  WorkflowCheck: "workflow_check",
} as const;

export const CONTACT_REQUEST_KINDS = [
  CONTACT_REQUEST_KIND.ProjectRequest,
  CONTACT_REQUEST_KIND.QuickContact,
  CONTACT_REQUEST_KIND.DiscoveryCall,
  CONTACT_REQUEST_KIND.WorkflowCheck,
] as const;

export type ContactRequestKind = (typeof CONTACT_REQUEST_KINDS)[number];
```

- [ ] **Step 3: Test grün** · **Step 4: Commit** — `feat(contact): add workflow_check request kind`

> Hinweis für den Post-Step: Die zweite Stufe des Flows nutzt einen eigenen `linkedin_post`-Request/Submit-Track. Falls
> der spätere Implementation-Schnitt das als separate Request-Art modelliert, muss die Konstante hier entsprechend ergänzt
> werden. Der Plan bleibt bewusst offen für den exakten Namen, aber die Trennung Lead-Step vs. Post-Step ist verbindlich.

---

### Task B2: Shared DTO + Zod-Schema

**Files:**

- Create: `packages/common/src/contracts/contact/workflow-check/save-workflow-check-dto.ts` (camelCase-Felder,
  `kind: WorkflowCheck`).
- Create: `apps/web/src/server/contact/validation/workflow-check/workflow-check.schema.ts` + `.test.ts`.

**DTO** spiegelt `WorkflowCheckFormValues` (ohne Honeypot) + `kind`. Vorlage: `save-quick-contact-dto.ts` +
`quick-contact.schema.ts`.

- [ ] **Step 1: DTO definieren** (Pattern aus bestehenden `save-*-dto.ts`).
- [ ] **Step 2: Failing schema test** — Fälle: required fields, invalid email, missing consent, Honeypot/Spam,
      „businessType ODER website" Pflichtlogik, Payload-Shape.
- [ ] **Step 3: Zod-Schema** (Vorlage `quick-contact.schema.ts`, inkl. Honeypot- und Refine-Logik für „eines von
      beiden").
- [ ] **Step 4: Tests grün** · **Step 5: Commit** — `feat(contact): add workflow-check DTO and validation schema`

---

### Task B3: Command-Handler + API-Dispatch

**Files:**

- Create: `apps/web/src/server/contact/handlers/submit-workflow-check.command-handler.ts` (+ Test).
- Modify: `apps/web/src/app/api/public/contact/route.ts` (Dispatch-Zweig).

- [ ] **Step 1: Failing handler test** — valider Body → ok; invalider Body → ValidationError; Spam → SpamDetected.
- [ ] **Step 2: Command-Handler** (Vorlage `submit-quick-contact.command-handler.ts`): Body gegen Schema validieren,
      Spam/Honeypot, an Mapper/Persistenz + KI-Service (B6) + Mail (B7) weiterreichen.
- [ ] **Step 3: Dispatch ergänzen** in `route.ts`:

```ts
if (parsedKind.data.kind === CONTACT_REQUEST_KIND.WorkflowCheck) {
  return submitWorkflowCheckCommandHandler(payload, requestId);
}
```

- [ ] **Step 4: Integrationstest** — Contact API Dispatch für `workflow_check` (happy + failure).
- [ ] **Step 5: Tests grün** · **Step 6: Commit** — `feat(contact): dispatch and handle workflow_check submissions`

---

### Task B4: Client-Mapper (echtes Submit, ersetzt später den Stub)

**Files:** Create `apps/web/src/client/contact/mappers/map-workflow-check-form-to-dto.ts` (+ Test).

- [ ] **Step 1: Failing mapper test** — Form-Values → korrektes DTO (Honeypot raus, `kind` gesetzt, Trim/Normalisierung
      wie bei bestehenden Mappern).
- [ ] **Step 2: Mapper** (Vorlage `map-quick-contact-form-to-dto.ts`).
- [ ] **Step 3: Test grün** · **Step 4: Commit** — `feat(contact): add workflow-check client mapper`

---

### Task B5: Persistenz (Lead + LeadSubmission + Workflow-Check-Details)

**Files:** `packages/db/src/record-configuration/**` (Modell/Migration), Mapper in
`apps/web/src/server/contact/mapper/contact-lead-mapper-service.ts`.

> Keine Zweckentfremdung der Projektanfrage-Detaildaten. Eigene Workflow-Check-Detaildaten + Feld/Datensatz für
> KI-Ergebnis (B6).

- [ ] **Step 1: Failing mapper/persistence-input test** — Lead, Submission und Workflow-Check-Details werden korrekt
      befüllt.
- [ ] **Step 2: Modell/Migration** in `record-configuration/**` (`pgTable`, kanonische Modellquelle).
- [ ] **Step 3: Mapper erweitern** für `workflow_check`.
- [ ] **Step 4: Tests grün** · **Step 5: Commit** — `feat(contact): persist workflow-check lead, submission and details`

---

### Task B6: KI-Workflow-Service (serverseitig)

**Files:** Create `apps/web/src/server/services/ai/workflow-check/**` (+ Tests).

> KI-API-Keys, Prompt-Details und Auswertung bleiben **ausschließlich** im Backend. Aufruf erst **nach** Validierung,
> Rate-Limit und Consent. Bei `claude-api`-Nutzung: `claude-api`-Skill laden, Prompt-Caching einplanen.

**Struktur-Output:** LinkedIn-Post-Entwurf, Caption, Hook-Varianten, CTA-Vorschlag, Tonalitäts-Optionen, kurze
Begründung und offene Rückfragen.

- [ ] **Step 1: Failing tests** — (a) baut strukturierte KI-Anfrage aus den Post-Step-Formulardaten; (b) speichert den
      Lead aus Step 1 unabhängig davon; (c) KI-API-Fehler → Lead bleibt erhalten, Post wird als „manuell nachzufassen"
      markiert.
- [ ] **Step 2: Service implementieren** (klar abgegrenztes Modul, strukturierter Prompt, strukturierte Ausgabe,
      Fehlerpfad, Download-Artefakt).
- [ ] **Step 3: Tests grün** · **Step 4: Commit** —
      `feat(ai-workflows): add server-side AI linkedin-post generation service`

---

### Task B7: Interne Mail-Notification

**Files:** Create `apps/web/src/server/services/mail/templates/workflow-check-notification.ts` (+ Test, DE/EN).

**Inhalt:** E-Mail · Name (falls) · Workflow-Frage aus Step 1 · Inputs des Post-Steps · generierter LinkedIn-Post ·
Caption · Download-Hinweis · Datenschutzkontext. (Kein Upload-Hinweis in V1.)

- [ ] **Step 1: Failing template test** (DE/EN enthalten alle Pflichtblöcke). **Step 2: Template** (Vorlage
      `contact-notification`). **Step 3: Test grün** · **Step 4: Commit** —
      `feat(ai-workflows): add internal workflow-check mail notification`

---

# TRACK C — Integration & SEO

### Task C1: Seam-Stub durch echten Submit ersetzen

**Files:** Modify `apps/web/src/client/contact/workflow-check/submit-workflow-check.ts`.

- [ ] **Step 1:** Stub-Body durch echten Ablauf ersetzen: `map-workflow-check-form-to-dto` (B4) →
      `fetch('/api/public/contact')` → Result-Mapping auf `SubmitWorkflowCheckResult`. Signatur bleibt unverändert →
      Formular-UI (A6) bleibt unberührt.
- [ ] **Step 2:** Bestehenden Form-Test (A6) gegen echten Service-Pfad re-validieren (Fetch mocken). Danach den
      Post-Step mit eigenem Submit-Service verdrahten.
- [ ] **Step 3: Commit** — `feat(ai-workflows): wire workflow-check form to real contact endpoint`

### Task C2: Interne Verlinkung + Sitemap/Robots

- [ ] **Step 1:** Crawlbare interne Links aus passenden Marketing-Bereichen auf `/services/ai-workflows` (über
      `SITE_ROUTES.AI_WORKFLOWS_SERVICE`, keine String-Literale).
- [ ] **Step 2:** `sitemap.ts` prüfen — Route aufnehmen, falls nicht automatisch über Route-Konstanten.
- [ ] **Step 3:** `robots.ts` prüfen — Route bleibt indexierbar.
- [ ] **Step 4: Commit** — `feat(ai-workflows): add internal links and sitemap/robots coverage`

---

# TRACK D — QA & Gates

### Task D1: E2E / Smoke

**Files:** Playwright-Spec im bestehenden E2E-Verzeichnis.

- [ ] `/de/services/ai-workflows` rendert · `/en/services/ai-workflows` rendert
- [ ] Primary CTA scrollt zum Lead-Step + sinnvoller Fokus
- [ ] Lead-Step erfolgreich absendbar und öffnet/fokussiert Step 2
- [ ] Post-Step generiert aus gültigen Inputs einen LinkedIn-Post inkl. Caption
- [ ] KI-Fehlerpfad bleibt nachvollziehbar: Lead persistiert, Post wird als manuell nachzufassen markiert
- [ ] Keyboard-Navigation funktioniert · Fokus-States sichtbar
- [ ] Mobile-Viewport ohne Textüberlauf/überlappende UI
- [ ] Commit — `test(ai-workflows): add routing, CTA and form e2e smoke`

### Task D2: Quality Gates + Doku

- [ ] `superpowers:verification-before-completion`:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

Plus relevante Contact-Integrationstests.

- [ ] Core Web Vitals kurz prüfen (LCP/CLS/INP) und im PR dokumentieren.
- [ ] PR-Beschreibung: Was/Warum, Screenshots (DE/EN, Mobile/Desktop), Testplan, Risiko/Rollback,
      Security/Privacy-Impact (KI-Service, kein PII in Logs).
- [ ] `superpowers:requesting-code-review` — 2 Reviews für API/Persistenz/KI-Änderungen.

---

## Akzeptanzkriterien (aus Quellplan, V1-angepasst)

- Route unter `/de|/en/services/ai-workflows` erreichbar; eigene DE/EN-Dictionaries; keine Inline-UI-Texte.
- Zweistufiger Flow: Lead-Step speichert Name/E-Mail/Workflow-Frage, Post-Step erzeugt aus Nutzer-Input einen
  LinkedIn-Post mit Caption; beide Schritte haben eigene DTOs + serverseitige Validierung.
- Anfrageart `workflow_check` für den Lead-Step; Post-Step mit eigener Generierung und sauberem Fallback, keine
  Zweckentfremdung der Projektanfrage.
- Persistenz: Lead + LeadSubmission + eigene Workflow-Check-Detaildaten.
- Echte serverseitige KI-Generierung für den Post-Step nach gespeichertem Lead; Keys/Prompts nur im Backend; bei
  KI-Fehler geht der Lead nicht verloren, der Post wird als manuell nachzufassen markiert.
- **(V1)** Optionaler Upload **nicht** enthalten — anonymisiertes Beispiel als Freitextfeld; Upload ist als V2
  dokumentiert.
- Keine PII in Analytics; Lead- und Post-Step tragen getrennte `form_id`-/Event-Namen.
- SEO-Metadata, Canonical, Alternates, Service Structured Data vorhanden; Sitemap/Robots geprüft.
- Keine neue globale Section-CSS in `globals.css`; keine URL-String-Konstruktion außerhalb `SITE_ROUTES`/Helper.
- Dark Mode default, Light kompatibel; Mobile ohne Überlauf/Überlappung.

---

## Offene Fragen (vor/while Umsetzung klären)

- **O1 — KI-Provider & Kosten/Latenz:** Welches Modell/welcher Provider für die Post-Generierung (z. B. Claude via
  `claude-api`-Skill)? Empfehlung: Lead in Step 1 sofort speichern, Step 2 erzeugt daraus den LinkedIn-Post mit Caption;
  bei längerer Laufzeit wird ein klarer Zwischenstatus gezeigt, das Ergebnis ist downloadbar und wird per Mail
  versendet.
- **O2 — Rate-Limit für KI:** Reicht das bestehende Contact-Rate-Limit, oder braucht der KI-Aufruf ein eigenes,
  strengeres Limit (Kostenschutz)?
- **O3 — Footer-Content:** Bestehendes `getLandingFooterContent` wiederverwenden oder eigenes `ai-workflows/footer`
  -Dictionary? (Beeinflusst Task A0 Step 3.)
- **O4 — FAQ ja/nein:** Quellplan listet keine FAQ-Section für V1, Structured Data unterstützt aber `FAQPage`. FAQ in V1
  aufnehmen (gut für SEO/Rich Results) oder erst V2?
- **O5 — Sekundär-CTA Ziel:** Quellplan-Hero hat nur Primary CTA. Soll es einen Secondary CTA „Ablauf ansehen" (scrollt
  zur 3-Schritt-Zeile in Offer) geben, oder strikt ein CTA wie im Landing-Kernprinzip?
- **O6 — UTM/Tracking-Kennungen:** Konkrete Location-Keys bestätigen (`ai_workflows_hero`, `ai_workflows_form`,
  `ai_workflows_final_cta`) und ob UTM-Outreach-Schema wie bei der Landingpage genutzt wird.
- **O7 — DB-Migration-Ownership:** Übernimmt Codex die `packages/db`-Migration (B5) inkl. Review-/Deploy-Pfad, und gibt
  es ein bestehendes Lead-Detail-Tabellenmuster zum Spiegeln?
- **O8 — Branch-Strategie:** Ein gemeinsamer Feature-Branch mit getrennten UI-/Logik-Commits, oder zwei Branches (
  `feat/ai-workflows-landing` + `feat/ai-workflows-backend`) mit dem Seam (S1) als gemeinsamer Basis?

---

## Self-Review (gegen Quellplan geprüft)

- **Spec-Coverage:** Hero, Problem+Beispiele, Offer (inkl. Proof + 3-Schritt), Pricing, Privacy-Note,
  Final-CTA+Formular, KI-Backend, DTO/Schema, Dispatch, Persistenz, Mail, SEO, Sitemap/Robots, Tests, E2E — alle
  Quellplan-Punkte abgebildet. Einzige bewusste Abweichung: **Upload → V2** (Entscheidung 2), entsprechend aus Feldern,
  Backend, Mail und Akzeptanzkriterien entfernt und als offener V2-Punkt markiert.
- **Platzhalter:** Keine „TBD"/„später" — jeder Logik-Schritt nennt Vorlage-Datei + konkreten Code/Signatur; jeder
  UI-Schritt nennt Content-Shape, Effekt und Skills.
- **Typkonsistenz:** `WorkflowCheckFormValues` (S1) ↔ DTO (B2) ↔ Mapper (B4) ↔ Submit-Service (S1/C1) verwenden dieselbe
  Feldmenge; `submitWorkflowCheck`-Signatur bleibt von S1 bis C1 stabil, sodass die Form-UI (A6) bei der Stub-Ablösung
  unberührt bleibt.
