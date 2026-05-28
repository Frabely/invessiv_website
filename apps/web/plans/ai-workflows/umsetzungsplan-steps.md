# AI-Workflows Landingpage — Step-by-Step Umsetzungsplan

> **Für agentische Worker:** Schritte nutzen Checkbox-Syntax (`- [ ]`) zum Tracking. Bei Copy-Schritten ist
> `copywriting`
> Pflicht; bei UI-Schritten ist `frontend-design` Pflicht. Vor Section-/Animationsarbeit müssen `animation_mockups/` und
> `animation_mockups/effects-catalog.json` geprüft werden.

## Zielbild V1

**Goal:** Neue conversion-fokussierte Marketing-Landingpage unter `/[locale]/services/ai-workflows` (DE/EN) für einen
kostenlosen Content-Workflow-Check.

**Zielgruppe:** Solo-Dienstleister, Berater, Coaches und kleine B2B-Selbstständige, die regelmäßig auf LinkedIn sichtbar
sein wollen, aber keinen stabilen Content-Prozess haben.

**Konkretes Problem:** LinkedIn bleibt liegen, obwohl genug Material vorhanden wäre: Kundenfragen, Projektlearnings,
Sprachnotizen, Stichpunkte, alte Posts, Website-Inhalte oder Beratungsalltag.

**Konkretes Angebot:** Kostenloser Content-Workflow-Check für 5 passende Selbstständige. Besucher beschreiben ihren
aktuellen LinkedIn-/Content-Prozess; Invessiv prüft, ob daraus ein wiederholbarer KI-Content-Workflow mit klarem
Pilot-Scope werden kann.

**Anschlussangebot:** Bezahlte Mini-Piloten ab 1.500 € netto mit klar begrenztem Scope.

**Nicht-Ziel:** Kein kostenloser LinkedIn-Post-Generator, keine vollautomatische Veröffentlichung, kein
Content-Kalender-
SaaS, kein Login/Dashboard, kein Upload in V1.

## Architektur

- Next.js App Router Route-Gruppe `(marketing)`.
- Route orchestriert nur Metadata, Dictionary-Laden, Structured Data und Section-Rendering.
- Komponenten liegen unter `apps/web/src/components/marketing/ai-workflows/**`.
- Sichtbare Copy liegt ausschließlich in DE/EN-Dictionaries unter `apps/web/src/i18n/dictionaries/ai-workflows/**`.
- Form-UI spricht gegen typisierte Submit-Services; DTO, API-Dispatch, Persistenz, KI-Auswertung und Mail bleiben im
  Logik-Track.
- Upload bleibt V2. V1 nutzt anonymisierte Freitextbeispiele.

## Verbindliche Copy-Basis

Hero DE:

- Tag: `LINKEDIN-CONTENT-WORKFLOW`
- H1: `Kosten dich LinkedIn-Posts zu viel Zeit?`
- Description:
  `Kostenloser Check für 5 Selbstständige: Wir prüfen, ob aus deinen Ideen ein wiederholbarer Content-Workflow werden kann.`
- Primary CTA: `Content-Workflow prüfen`
- Secondary CTA: `Was du bekommst`
- Trust-Chips: `Kostenloser Check`, `Klare Workflow-Einschätzung`

Hero EN sinngemäß:

- Tag: `LINKEDIN CONTENT WORKFLOW`
- H1: `Why does LinkedIn keep slipping?`
- Description:
  `Free check for 5 solo service providers: we test whether your ideas can become a repeatable content workflow.`
- Primary CTA: `Check my content workflow`
- Secondary CTA: `What you get`
- Trust-Chips: `Free check`, `Clear workflow assessment`

Primärer CTA im gesamten Flow: `Content-Workflow prüfen`.

## Track-Übersicht

- **Seam S:** geteilter Form-Values-Typ + Submit-Service-Stub.
- **Track A — UI:** Route, Dictionaries, Hero, Problem-/Beispiele-Section, Offer, Pricing, Privacy, Formular, Metadata.
- **Track B — Logik:** `workflow_check`-Request-Art, DTO/Zod, API-Dispatch, Persistenz, optionaler KI-Check, interne
  Mail.
- **Track C — Integration & SEO:** echter Submit-Service, interne Links, Sitemap/Robots.
- **Track D — QA:** E2E, A11y-Smoke, Quality Gates.

Jeder Task endet mit genau einem Commit.

---

## SEAM — gemeinsame Schnittstelle zuerst

### Task S1: Form-Values-Typ + Submit-Service-Stub

**Zweck:** UI und Logik entkoppeln.

**Files:**

- Create: `packages/common/src/contracts/contact/forms/workflow-check-form-values.ts`
- Create: `apps/web/src/client/contact/workflow-check/submit-workflow-check.ts`

- [ ] **Step 1: Form-Values-Typ definieren**

```ts
export type WorkflowCheckFormValues = {
  email: string;
  businessType: string;
  website: string;
  postingBlocker: string;
  contentSources: string;
  currentProcess: string;
  consent: boolean;
  name: string;
  desiredOutput: string;
  toolsUsed: string;
  anonymizedExample: string;
  company: string;
};

export const WORKFLOW_CHECK_FORM_INITIAL_VALUES: WorkflowCheckFormValues = {
  email: "",
  businessType: "",
  website: "",
  postingBlocker: "",
  contentSources: "",
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
import type { WorkflowCheckFormValues } from "@invessiv/common/contracts/contact/forms/workflow-check-form-values";

export type SubmitWorkflowCheckResult =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string[]>; code: string };

export async function submitWorkflowCheck(
  _values: WorkflowCheckFormValues,
): Promise<SubmitWorkflowCheckResult> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { ok: true };
}
```

- [ ] **Step 3: Verify** — `npm run typecheck`
- [ ] **Step 4: Commit** — `feat(ai-workflows): add workflow-check form seam`

---

# TRACK A — UI

### Task A0: Route-Konstante + Route-Scaffold + Navigation

**Files:**

- Modify: `apps/web/src/config/routes.ts`
- Create: `apps/web/src/config/navigation/ai-workflows.ts`
- Create: `apps/web/src/app/[locale]/(marketing)/services/ai-workflows/page.tsx`
- Create: `apps/web/src/components/marketing/ai-workflows/ai-workflows-page/ai-workflows-page.tsx`

- [ ] **Step 1:** `SITE_ROUTES.AI_WORKFLOWS_SERVICE = "/services/ai-workflows"` ergänzen.
- [ ] **Step 2:** Navigation mit Section-IDs `problem`, `offer`, `pricing`, `privacy`, `contact` anlegen.
- [ ] **Step 3:** Orchestrator rendert `SiteHeader`, `main.marketing-main`, Sections und `FooterSection`.
- [ ] **Step 4:** Route-Page spiegelt bestehende Marketing-Route mit Locale-Guard.
- [ ] **Step 5:** Verify `/de/services/ai-workflows` und `/en/services/ai-workflows`.
- [ ] **Step 6:** Commit — `feat(ai-workflows): scaffold route and navigation`

### Task A1: Hero-Section

**Files:**

- Create: `apps/web/src/i18n/dictionaries/ai-workflows/hero/{de.json,en.json,index.ts}`
- Create: `apps/web/src/components/marketing/ai-workflows/hero-section/hero-section.tsx`
- Create: `apps/web/src/components/marketing/ai-workflows/hero-section/hero-section.module.css`

**Content-Shape:** `tag`, `title`, `description`, `primaryCta`, `secondaryCta`, `trustChips`, `visualAriaLabel`.

- [ ] **Step 1:** DE/EN-Dictionaries mit verbindlicher Copy-Basis anlegen.
- [ ] **Step 2:** Komponente mit genau einer `<h1>` bauen.
- [ ] **Step 3:** Primary CTA auf `#contact`, Secondary CTA auf `#offer`.
- [ ] **Step 4:** CSS Module mobile-first, Dark default, Light kompatibel, sichtbare Fokus-States. Auf Mobile wird nur
      der Primary CTA gezeigt; der Secondary CTA bleibt Desktop/Tablet vorbehalten.
- [ ] **Step 5:** Trust-Chips unter dem CTA mit der bestehenden `SectionScanPoints`-Komponente rendern, keine neue
      lokale Chip-Komponente oder eigene Chip-Optik einführen.
- [ ] **Step 6:** Optional `scroll_reveal_stagger` dezent einsetzen.
- [ ] **Step 7:** Verify 360 px Mobile ohne Textüberlauf.
- [ ] **Step 8:** Commit — `feat(ai-workflows): add hero section`

### Task A2: Problem- und Beispiele-Section

**Files:**

- Create: `apps/web/src/i18n/dictionaries/ai-workflows/problem-examples/{de.json,en.json,index.ts}`
- Create:
  `apps/web/src/components/marketing/ai-workflows/problem-examples-section/{problem-examples-section.tsx,problem-examples-section.module.css}`

**Content-Fokus:** LinkedIn bleibt liegen, weil kein wiederholbarer Prozess vom Material zum Post existiert.

**Beispiele:** Kundenfragen, Projektlearnings, Sprachnotizen, Stichpunkte, alte Posts, Website-Inhalte, Beratungsalltag.

- [ ] **Step 1:** DE/EN-Dictionaries schreiben.
- [ ] **Step 2:** Eine `<h2>`, kurzer Body, scannbare Beispiel-Liste.
- [ ] **Step 3:** `scroll_reveal_stagger` für die Liste prüfen und reduziert auf Mobile einsetzen.
- [ ] **Step 4:** Verify DE/EN und 360 px.
- [ ] **Step 5:** Commit — `feat(ai-workflows): add content workflow problem section`

### Task A3: Offer-Section

**Files:**

- Create: `apps/web/src/i18n/dictionaries/ai-workflows/offer/{de.json,en.json,index.ts}`
- Create: `apps/web/src/components/marketing/ai-workflows/offer-section/{offer-section.tsx,offer-section.module.css}`

**Content-Fokus:** Was der kostenlose Check liefert:

- kurze Prozessdiagnose,
- 1-2 KI-Content-Workflow-Ideen,
- Einschätzung geeigneter Input-Quellen,
- Pilot-Empfehlung,
- nächster Schritt bei passendem Prozess.

**3-Schritt-Zeile:** `Prozess beschreiben` → `Workflow-Ideen erhalten` → `Pilot-Scope entscheiden`.

- [ ] **Step 1:** DE/EN-Dictionaries schreiben; keine Reichweiten- oder Zeitersparnis-Garantien.
- [ ] **Step 2:** Deliverables-Liste + kompakter Proof-Hinweis auf Invessiv-eigenen Social-Workflow.
- [ ] **Step 3:** `svg_path_journey` nur einsetzen, wenn die 3-Schritt-Zeile dadurch nicht überladen wirkt.
- [ ] **Step 4:** Verify.
- [ ] **Step 5:** Commit — `feat(ai-workflows): add content workflow offer section`

### Task A4: Pricing-/Pilot-Frame

**Files:**

- Create: `apps/web/src/i18n/dictionaries/ai-workflows/pricing/{de.json,en.json,index.ts}`
- Create:
  `apps/web/src/components/marketing/ai-workflows/pricing-section/{pricing-section.tsx,pricing-section.module.css}`

**Tiers:**

- Kostenloser Kurz-Check: Prozessdiagnose + 1-2 Workflow-Ideen + Pilot-Empfehlung.
- Mini-Pilot ab 1.500 € netto: ein Content-Prozess, ein Input-Format, ein Ziel-Output, 1-2 Testläufe.
- Erweiterter Pilot 2.500-3.500 € netto: zweiter Output oder einfache Freigabe-/Übergabelogik.
- Ausbau ab 5.000 € netto: stabilerer Workflow, mehrere Varianten, Dokumentation oder Tool-Anbindung.

- [ ] **Step 1:** DE/EN-Dictionaries schreiben.
- [ ] **Step 2:** Pricing-Karte mit `gradient_border_grain` prüfen.
- [ ] **Step 3:** Klare Scope-Grenzen nennen; kein "unbegrenzter Content".
- [ ] **Step 4:** Verify.
- [ ] **Step 5:** Commit — `feat(ai-workflows): add pilot pricing section`

### Task A5: Privacy-Note-Section

**Files:**

- Create: `apps/web/src/i18n/dictionaries/ai-workflows/privacy-note/{de.json,en.json,index.ts}`
- Create:
  `apps/web/src/components/marketing/ai-workflows/privacy-note-section/{privacy-note-section.tsx,privacy-note-section.module.css}`

**Pflichtbotschaft:** Keine sensiblen Kundendaten, vertraulichen Dokumente oder personenbezogenen Daten Dritter.
Anonymisierte Beispiele als Text reichen.

- [ ] **Step 1:** DE/EN-Dictionaries schreiben.
- [ ] **Step 2:** Ruhigen Hinweisblock mit einer `<h2>` bauen.
- [ ] **Step 3:** Verify.
- [ ] **Step 4:** Commit — `feat(ai-workflows): add privacy note section`

### Task A6: Final-CTA + Workflow-Check-Formular

**Files:**

- Create: `apps/web/src/i18n/dictionaries/ai-workflows/form/{de.json,en.json,index.ts}`
- Create: `apps/web/src/components/marketing/ai-workflows/workflow-check-form/workflow-check-form.tsx`
- Create: `apps/web/src/components/marketing/ai-workflows/workflow-check-form/workflow-check-form.module.css`
- Create: `apps/web/src/components/marketing/ai-workflows/workflow-check-form/workflow-check-form.test.tsx`

**Pflichtfelder:**

- E-Mail,
- Tätigkeit/Positionierung oder Website,
- `Was hält dich aktuell davon ab, regelmäßig auf LinkedIn zu posten?`,
- `Woraus könnten bei dir Beiträge entstehen?`,
- aktueller Ablauf inklusive grober Häufigkeit oder Zeitaufwand,
- Consent.

**Optionale Felder:** Name, gewünschter Output, Tools/Vorlagen, anonymisiertes Beispiel, wichtigstes Ziel.

- [ ] **Step 1:** DE/EN-Dictionaries für Labels, Hilfetexte, Error-/Success-Copy schreiben.
- [ ] **Step 2:** Failing jsdom-Test schreiben: Required Errors, Honeypot, Success, Submit Error, Fokus nach Submit.
- [ ] **Step 3:** Client Component gegen `submitWorkflowCheck` aus S1 bauen.
- [ ] **Step 4:** Analytics: `form_start`, `form_submit_attempt`, `lead_submit_success`, `form_submit_error` mit
      `form_id: "workflow_check"` und Location `ai_workflows_form`; keine PII.
- [ ] **Step 5:** CSS Module: mobile-first, klare Error-/Disabled-/Focus-States.
- [ ] **Step 6:** Tests grün: `npm run test:unit -- workflow-check-form`.
- [ ] **Step 7:** Section mit `id="contact"` einhängen.
- [ ] **Step 8:** Commit — `feat(ai-workflows): add content workflow check form`

### Task A7: Metadata + Structured Data

**Files:**

- Create: `apps/web/src/i18n/dictionaries/ai-workflows/meta/{de.json,en.json,index.ts}`
- Create: `apps/web/src/i18n/dictionaries/ai-workflows/structured-data/{de.json,en.json,index.ts}`
- Create: `apps/web/src/lib/seo/ai-workflows-structured-data.ts`
- Modify: `apps/web/src/app/[locale]/(marketing)/services/ai-workflows/page.tsx`

- [ ] **Step 1:** Meta-Copy DE/EN schreiben. Title-Konvention: `KI-Content-Workflows | Invessiv`.
- [ ] **Step 2:** Canonical und alternates für `/de|/en/services/ai-workflows`.
- [ ] **Step 3:** Service Structured Data für Content-Workflow-Check, keine locale-Ternaries.
- [ ] **Step 4:** Page-Test für Metadata DE/EN.
- [ ] **Step 5:** Commit — `feat(ai-workflows): add metadata and structured data`

### Task A8: UI-Review

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test:unit`
- [ ] `npm run build`
- [ ] A11y-Smoke: Keyboard, Fokus-Reihenfolge, Kontrast, Dark/Light, Mobile 360 px.
- [ ] Code Review für UI-Track.

---

# TRACK B — Logik

### Task B1: `workflow_check`-Anfrageart

**Files:** Modify `packages/common/src/constants/contact/contact-request-kind.ts`.

- [ ] **Step 1:** Failing Konstanten-Test erweitern.
- [ ] **Step 2:** Const-Objekt-Pattern ergänzen: `WorkflowCheck: "workflow_check"`.
- [ ] **Step 3:** Tests grün.
- [ ] **Step 4:** Commit — `feat(contact): add workflow_check request kind`

### Task B2: Shared DTO + Zod-Schema

**Files:**

- Create: `packages/common/src/contracts/contact/workflow-check/save-workflow-check-dto.ts`
- Create: `apps/web/src/server/contact/validation/workflow-check/workflow-check.schema.ts`
- Create: `apps/web/src/server/contact/validation/workflow-check/workflow-check.schema.test.ts`

**DTO:** spiegelt `WorkflowCheckFormValues` ohne Honeypot + `kind`.

- [ ] **Step 1:** DTO definieren.
- [ ] **Step 2:** Failing Schema-Tests: required fields, invalid email, missing consent, Honeypot/Spam, `businessType`
      oder `website`, Payload shape.
- [ ] **Step 3:** Zod-Schema implementieren.
- [ ] **Step 4:** Tests grün.
- [ ] **Step 5:** Commit — `feat(contact): add workflow-check DTO and validation`

### Task B3: Command-Handler + API-Dispatch

**Files:**

- Create: `apps/web/src/server/contact/handlers/submit-workflow-check.command-handler.ts`
- Create: `apps/web/src/server/contact/handlers/submit-workflow-check.command-handler.test.ts`
- Modify: `apps/web/src/app/api/public/contact/route.ts`

- [ ] **Step 1:** Failing Handler-/Dispatch-Tests schreiben.
- [ ] **Step 2:** Handler validiert Body, Spam/Honeypot und reicht an Mapper/Persistenz/KI/Mail weiter.
- [ ] **Step 3:** Contact API Dispatch für `CONTACT_REQUEST_KIND.WorkflowCheck`.
- [ ] **Step 4:** Tests grün.
- [ ] **Step 5:** Commit — `feat(contact): handle workflow_check submissions`

### Task B4: Client-Mapper + echter Submit

**Files:**

- Create: `apps/web/src/client/contact/mappers/map-workflow-check-form-to-dto.ts`
- Create: `apps/web/src/client/contact/mappers/map-workflow-check-form-to-dto.test.ts`
- Modify: `apps/web/src/client/contact/workflow-check/submit-workflow-check.ts`

- [ ] **Step 1:** Failing Mapper-Test: Form Values → DTO, Honeypot raus, `kind` gesetzt, Trim/Normalisierung.
- [ ] **Step 2:** Mapper implementieren.
- [ ] **Step 3:** Stub durch `fetch("/api/public/contact")` ersetzen; Signatur bleibt stabil.
- [ ] **Step 4:** Tests grün.
- [ ] **Step 5:** Commit — `feat(contact): wire workflow-check form submit`

### Task B5: Persistenz

**Files:** `packages/db/src/record-configuration/**` + Contact Mapper.

- [ ] **Step 1:** Failing Mapper/Persistence-Input-Test.
- [ ] **Step 2:** Eigene Workflow-Check-Detaildaten modellieren; Projektanfrage-Details nicht zweckentfremden.
- [ ] **Step 3:** Lead + LeadSubmission + Workflow-Check-Details persistieren.
- [ ] **Step 4:** Tests grün.
- [ ] **Step 5:** Commit — `feat(contact): persist content workflow check details`

### Task B6: Optionaler KI-Workflow-Check

**Files:** Create `apps/web/src/server/services/ai/workflow-check/**`.

**Output:** Problemzusammenfassung, 1-2 Content-Workflow-Ideen, geeignete Input-Quellen, Pilot-Scope, offene Rückfragen.

- [ ] **Step 1:** Failing Tests: strukturierte Anfrage, strukturierte Ausgabe, Fehlerpfad.
- [ ] **Step 2:** Server-only Service implementieren; keine KI-Keys oder Prompt-Details im Client.
- [ ] **Step 3:** Bei KI-Fehler Lead erhalten und Check als manuell nachzufassen markieren.
- [ ] **Step 4:** Tests grün.
- [ ] **Step 5:** Commit — `feat(ai-workflows): add server-side content workflow check`

### Task B7: Interne Mail-Notification

**Files:** Create `apps/web/src/server/services/mail/templates/workflow-check-notification.ts`.

**Inhalt:** E-Mail, Name falls vorhanden, Tätigkeit/Website, Posting-Blocker, Content-Quellen, aktueller Ablauf,
gewünschter Output, anonymisiertes Beispiel, KI-Auswertung falls vorhanden, Datenschutzkontext.

- [ ] **Step 1:** Failing Template-Test DE/EN.
- [ ] **Step 2:** Template implementieren.
- [ ] **Step 3:** Tests grün.
- [ ] **Step 4:** Commit — `feat(ai-workflows): add workflow-check mail notification`

---

# TRACK C — Integration & SEO

### Task C1: Interne Verlinkung + Sitemap/Robots

- [ ] Crawlbare interne Links aus passenden Marketing-Bereichen auf `/services/ai-workflows` ergänzen, nur über
      `SITE_ROUTES.AI_WORKFLOWS_SERVICE`.
- [ ] `sitemap.ts` prüfen und Route aufnehmen, falls nicht automatisch enthalten.
- [ ] `robots.ts` prüfen; Route bleibt indexierbar.
- [ ] Commit — `feat(ai-workflows): add internal links and sitemap coverage`

### Task C2: Integration Review

- [ ] Formular gegen echten API-Pfad testen.
- [ ] Analytics-Payloads prüfen: keine PII, korrekte `form_id`.
- [ ] Datenschutztexte gegen Formularfelder prüfen.
- [ ] SEO Preview DE/EN prüfen.
- [ ] Commit — `test(ai-workflows): verify content workflow integration`

---

# TRACK D — QA & Gates

### Task D1: E2E / Smoke

- [ ] `/de/services/ai-workflows` rendert.
- [ ] `/en/services/ai-workflows` rendert.
- [ ] Hero ist mobile verständlich und ohne Überlauf.
- [ ] Primary CTA scrollt zum Formular + sinnvoller Fokus.
- [ ] Formular zeigt Required Errors.
- [ ] Formular kann mit gültigen Daten abgesendet werden.
- [ ] Submit Error State ist verständlich.
- [ ] Keyboard-Navigation funktioniert.
- [ ] Fokus-States sichtbar.
- [ ] Commit — `test(ai-workflows): add routing and workflow-check e2e smoke`

### Task D2: Quality Gates + PR-Doku

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test:unit`
- [ ] `npm run build`
- [ ] Relevante Contact-Integrationstests.
- [ ] Core Web Vitals kurz prüfen: LCP/CLS/INP.
- [ ] PR-Beschreibung: Was/Warum, Screenshots DE/EN Mobile/Desktop, Testplan, Risiko/Rollback, Security/Privacy-Impact.

---

## Akzeptanzkriterien

- Route unter `/de|/en/services/ai-workflows` erreichbar.
- Zielgruppe, Problem, Angebot und CTA sind überall konsistent auf LinkedIn-Content-Workflow für Solo-Dienstleister
  ausgerichtet.
- Keine Hero-, Formular-, Meta- oder Section-Copy aus dem alten Angebotsprozess-Frame übrig.
- Keine sichtbaren UI-Texte inline in Pages oder Komponenten.
- Anfrageart `workflow_check`; eigene DTOs und serverseitige Validierung.
- Kein Upload in V1.
- Kein kostenloser LinkedIn-Post-Generator als Flow oder Claim.
- Persistenz nutzt Lead + LeadSubmission + eigene Workflow-Check-Detaildaten.
- KI-Auswertung, falls aktiv, läuft ausschließlich serverseitig und verliert bei Fehlern keine Lead-Anfrage.
- Keine PII in Analytics.
- SEO-Metadata, Canonical, Alternates und Service Structured Data vorhanden.
- Sitemap/Robots geprüft.
- Keine neue globale Section-CSS in `globals.css`.
- Keine URL-String-Konstruktion außerhalb zentraler Route-Konstanten/Helper.
- Dark Mode default, Light kompatibel.
- Mobile ohne Textüberlauf oder überlappende UI.

## Offene Punkte vor Umsetzung

- KI-Provider und Kosten-/Rate-Limit für den optionalen serverseitigen Check festlegen.
- Entscheiden, ob FAQ in V1 enthalten ist oder erst V2.
- Footer-Content: bestehendes `getLandingFooterContent` verwenden oder eigenes `ai-workflows/footer`-Dictionary anlegen.
- Branch-Strategie festlegen: gemeinsamer Feature-Branch oder getrennte UI-/Backend-Branches.
