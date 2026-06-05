# Review: GeneratorSection — Lead-Tausch, Versuchszähler & LimitReached-Flow (Phase A)

Review des Changesets gegen die `AGENTS.md`-/`CLAUDE.md`-Regeln (Root, `apps/web/common`,
`apps/web/src/components`) sowie auf Clean Code und Wartbarkeit. Bezieht sich auf die Phase-A-Umsetzung
des Plans [`generator-section-lead-flow.md`](./generator-section-lead-flow.md).

Status der Qualitäts-Gates zum Review-Zeitpunkt: `npm run typecheck` grün, `npm run lint` grün
(nur 1 vorbestehende, nicht zugehörige `<img>`-Warnung in `example-section/sample-card/sample-card.test.tsx`),
Vitest generator-section **21/21**, neue Komponententests grün, DE/EN-Key-Parität per Skript verifiziert.

---

## 1. Während des Reviews behoben

### 1.1 Ordner-/Dateiname-Konvention verletzt (behoben)

- **Regel:** `apps/web/src/components/AGENTS.md` — „Komponenten werden als eigener Ordner angelegt; die
  Hauptdatei trägt denselben Namen wie der Ordner: `component-name/component-name.tsx`".
- **Fund:** `lead-capture/lead-capture-card.tsx` → Ordnername (`lead-capture`) ≠ Hauptdateiname
  (`lead-capture-card`).
- **Fix:** Ordner umbenannt zu `lead-capture-card/` → `lead-capture-card/lead-capture-card.tsx`
  (inkl. `.module.css` + `.test.tsx`). Imports in `success-preview.tsx`, `preview-panel.tsx`,
  `generator-section.tsx` angepasst.
- `usage-meter/usage-meter.tsx` und `limit-reached-preview/limit-reached-preview.tsx` waren bereits konform.
- Nach Fix: Typecheck/Lint/Tests grün.

---

## 2. Offen — Entscheidung nötig (Architektur-Gate)

### 2.1 Error-Code-/Message-Konvention (verbindlich) nicht vollständig umgesetzt

- **Regel:** Root-`CLAUDE.md`/`AGENTS.md` — Error-Codes als Const-Objekt in
  `packages/common/src/constants/<domain>/`, Message-Texte in **einer** `*-error.ts`-Helper-Datei,
  Call-Sites rufen ausschließlich den Helper. Gilt ausdrücklich auch client-seitig für Form-Validation.
- **Fund:** `LeadCaptureCard.validate()` mappt Feldfehler **direkt aus dem Dictionary**
  (`content.displayName.requiredError`, `content.email.invalidError`, …) statt über
  Error-Codes + Helper.
- **Kontext:** Bewusst identisch zum bestehenden `generator-section.validate()` im selben Scope; die
  Messages sind also über das Dictionary zentralisiert (keine Inline-Literale), aber das geforderte
  Code-+-Helper-Muster fehlt. Das Kontaktformular (`project-request-form.tsx`) nutzt dagegen das
  korrekte Muster (`CONTACT_FIELD_ERROR_CODE` → `getFieldErrorTextByCode`).
- **Optionen:**
  - (a) So lassen — konsistent mit dem Nachbar-Code `generator-section.validate()`. Dann bleibt die
    Abweichung dokumentiert (dieser Eintrag).
  - (b) Auf das Code-+-Helper-Muster heben — dann sinnvollerweise `LeadCaptureCard` **und**
    `generator-section.validate()` gemeinsam, damit der Generator-Scope einheitlich ist.
- **Empfehlung:** (b) als eigener kleiner Folge-Schritt, da „verbindlich". Bis dahin bewusst zurückgestellt.
- **Betroffen:**
  `apps/web/src/components/marketing/linkedin-post/generator-section/lead-capture-card/lead-capture-card.tsx`,
  `…/generator-section/generator-section.tsx` (`validate()`).

---

## 3. Bewusste Tech-Debt (Phase-A-bedingt)

### 3.1 Tote Identitätsfelder im Form-State und Request-DTO

- **Fund:** `LinkedInPostGeneratorFormValues` + `LINKEDIN_POST_GENERATOR_INITIAL_VALUES` + das Request-DTO
  tragen weiterhin `displayName` / `email` / `consent`. Die anonyme Generier-Form setzt sie nie; sie
  werden leer an den Server geschickt.
- **Bewertung:** Kein Fehler — der Server akzeptiert leere Identitätsfelder (Phase A ohne Server-Änderung).
  Wird in **Phase B** aus dem DTO entfernt, wenn Generierung und Zustellung getrennt werden.
- **Betroffen:** `apps/web/common/contracts/generator/linkedin-post-generator-form-values.ts`,
  `…/linkedin-post-generator-request.ts`, `…/services/linkedin-post-generator-service.ts`.

---

## 4. Verbesserungsvorschläge (nicht blockierend)

### 4.1 Fehlende Tracking-Events auf neuen Conversion-CTAs

- **Regel:** Root-`AGENTS.md` — „Kritische User-Flows mit strukturierten Events versehen
  (z. B. CTA-Klick …)"; „Jeder CTA-Link wird auf Ziel und Tracking-Event geprüft".
- **Fund:** Der Submit-Button trägt `data-analytics-*`. Die neuen, conversion-kritischen Aktionen haben
  keine Events: LeadCapture „Herunterladen"/„Per E-Mail schicken", LimitReached-CTA, Success-FollowUp-CTA.
- **Kontext:** Der bestehende FollowUp-CTA hatte ebenfalls nie Events — also konsistent, aber gerade
  diese Schritte sind die eigentlichen Conversion-Punkte des neuen Flows.
- **Vorschlag:** `cta_click`-Events (mit Location/Target) auf den drei neuen CTAs ergänzen.

### 4.2 Kleinigkeit: toter CSS-Property

- `success-preview.module.css` `.copyButton { justify-self: start }` wirkt nur im Grid-Kontext; der Button
  steht jetzt in einem Flex-`.head`. Harmlos, kann beim nächsten Anfassen entfernt werden.

---

## 5. Housekeeping

### 5.1 `.gitignore`-Änderung durch Tooling

- Beim lokalen Verifizieren hat das Playwright-MCP-Tool `+.playwright-mcp` in `.gitignore` ergänzt
  (für seine Snapshots/Screenshots). Sinnvoll, aber nicht Teil der Aufgabe — behalten oder revertieren.
  Die erzeugten Screenshot-Artefakte selbst wurden gelöscht.
- Außerdem entfernt: ein leeres `…/api/public/generator/linkedin-post/delivery/`-Verzeichnis und eine
  veraltete `.next/types/validator.ts` (beides vorbestehende Artefakte, die den Typecheck blockierten;
  `.next` ist ohnehin git-ignoriert).

---

## 6. Geprüft und konform

- **Const-Objekt-Pattern:** `GeneratorStateKind` (+ `LimitReached`) und internes `LeadCaptureFeedback`
  korrekt, PascalCase-Keys, kein `enum`.
- **i18n:** DE/EN strukturell key-identisch (Skript-Check), keine sprachabhängigen Inline-Texte in
  Komponenten, keine `de`/`en`-Branches (Reset-Datum via `Intl.DateTimeFormat(locale, …)`), UTF-8 sauber,
  keine verwaisten Keys nach Entfernen von `form.delivery`/`displayName`/`email`/`consent`,
  `success.trialNote`/`remainingNote`/`downloadImage`/`downloadCaption`/`imageAlt`/`captionLabel`,
  `error.limitReachedBody`.
- **CSS:** ausschließlich scoped `*.module.css`, keine `globals.css`-Änderung, keine Inline-Styles
  (außer pre-existing dynamischem Swatch-Custom-Prop), nur vorhandene Tokens, mobile-first mit
  `min-width`-Breakpoints, sichtbare Focus-States, Dark/Light über Tokens.
- **Routen/Pfade aus Konstanten:** `LINKEDIN_POST_SECTION_HREFS.contact`, `PROJECT_OFFER_CHANGE_EVENT`,
  `CONTACT_OFFER_KEY.Process` — keine String-Literale.
- **Contracts/Trennung:** `ProjectOfferSyncDetail` als shared Contract extrahiert (vorher inline in
  `project-request-form.tsx`), `GeneratorUsageLimit` dedupliziert, `format-reset-date.ts` als gemeinsamer
  Helper (keine Logik-Duplikation zwischen `UsageMeter` und `LimitReachedPreview`).
- **Typisierung:** kein `any`.
- **Komponentenstruktur:** je eigener Ordner + scoped `*.module.css` + co-located `*.test.tsx`; jede neue
  interaktive Komponente hat einen jsdom-Test (Validierung/Gating/CTA-Dispatch).
- **A11y:** `aria-invalid`/`aria-describedby`-Verdrahtung an allen Feldern, `role="status"`/`aria-live`
  für Status, Pips `aria-hidden`, LimitReached ohne `role="alert"` (kein Error-Look).
- **Mock-State-Kennzeichnung:** E-Mail-Versand sichtbar als „Bald"/Coming-soon markiert (ehrlich, kein
  irreführendes Verhalten); Download funktioniert real.
- **Keine Funktionsfehler:** 429 ohne `usageLimit` fällt sauber auf `Error`; Scroll-Effekt deckt
  Success/LimitReached/Error; Honeypot intakt; Prefill best-effort (kalt erreichtes Limit = leer,
  kein Fehler) — live auf `/de` und `/en` verifiziert.

---

## 7. Empfohlene nächste Schritte

1. Entscheidung zu **2.1** (Error-Code-/Message-Konvention): so lassen oder Code-+-Helper-Muster nachziehen.
2. Optional **4.1**: Tracking-Events auf den neuen Conversion-CTAs ergänzen.
3. **Phase B** (signierter Deliver-Endpoint + Lead-Persistenz) erst nach separater Freigabe; dabei
   **3.1** (tote Identitätsfelder im DTO) bereinigen.
