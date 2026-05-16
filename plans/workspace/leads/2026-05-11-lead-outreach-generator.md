# Lead Outreach Generator — Revidierter Plan (Stand: 2026-05-16)

> Diese Datei ersetzt den ursprünglichen 11.05-Plan (LM-Studio-first, 3 Kanäle, ein einzelner Trigger). Aus dem
> 11.05-Plan wurde noch nichts implementiert — Greenfield-Start.

## Context

Aus einem bestehenden Lead soll eine personalisierte Outreach-Kurz­nachricht generiert werden, die direkt
copy-paste-fähig ist (LinkedIn / Email / Instagram / Direktnachricht). Ziel: nicht-copy-paste klingend,
individuell-catchy, **kein Pitch** — sondern dezenter Werthinweis (max. 2 Improvements) + weicher CTA.

Drei UI-Trigger (Detail-Panel-Header, Edit-Dialog-Footer, Tabellen-Zeile) öffnen denselben Dialog. Im Dialog wählt der
User Prompt (aus Code-Registry) + Kanal (Default LinkedIn) + optionales freies Kontext-Feld + Improvements-Toggle.
Provider-Auswahl (LM Studio / OpenAI) **nicht** im UI — Server entscheidet automatisch (lokales LM-Studio-Modell zuerst,
OpenAI `gpt-4o-mini` als Fallback).

## Konventionen (zwingend einzuhalten)

- **Keine Inline-String-Literale** für Channel-, Provider-, Error-, Prompt-Keys oder UI-Texte. Jeder String erscheint
  genau **einmal**:
  - String-Union-Werte → const-Objekt in `src/common/constants/outreach/<name>.ts` (PascalCase-Keys, `as const`, plus
    `*_VALUES`-Array, Pattern siehe `LeadFormDialogMode`).
  - UI-Texte → `src/i18n/dictionaries/workspace/leads/outreach/{de,en}.json`. Beide Locales im selben Commit.
  - Error-Codes + Messages → `MESSAGES`-Map in `outreach-api-error.ts` (Pattern aus `CLAUDE.md` → "Error Codes &
    Messages").
  - Prompt-Texte (Copywriting-Guidelines, Outreach-Profil, Prompt-Bodies) → typisierte Konstanten in
    `src/common/prompts/outreach/`.
- **Erlaubte Ausnahmen:** technische Konfigurations-Defaults (Model-Name in `process.env.OPENAI_MODEL ?? "..."`),
  Test-Fixtures.
- **Const-Objekt-Pattern** statt TS-`enum` für alle neuen Unions.
- **DSGVO:** Email und Telefonnummer dürfen **nie** in den LLM-Prompt geschrieben werden. Nur Vorname, Firma, Website,
  Improvements, Notes, Kategorie, Owner.
- **Server-Components by default**; `"use client"` nur im Dialog und in den Trigger-Buttons.
- **i18n:** kein `locale === "de" ? … : …`. Alle Texte via Dictionary.
- Trigger nur sichtbar wenn Lead persistiert:
  - Detail-Panel ✓
  - Edit-Dialog: nur `mode === 'edit'` ✓
  - Create-Dialog: ausgeblendet ✗
  - Tabellen-Aktionen ✓

## File Map

**Hinweis:** Alle outreach-spezifischen Common-Dateien liegen unter `src/common/ai-outreach-generation/` (ein Modul,
kein Split über `constants/` / `contracts/` / `prompts/`).

| Datei                                                                                                   | Aktion | Verantwortung                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/common/ai-outreach-generation/outreach-channels.ts`                                                | NEU    | `OutreachChannel` (4 Werte: Linkedin, Email, Instagram, DirectMessage) + `OUTREACH_CHANNEL_VALUES`                                                                                                 |
| `src/common/ai-outreach-generation/outreach-error-codes.ts`                                             | NEU    | `OutreachErrorCode` (LeadNotFound, ValidationError, ProviderUnavailable, Internal)                                                                                                                 |
| `src/common/ai-outreach-generation/outreach-prompt-keys.ts`                                             | NEU    | `OutreachPromptKey` (initial: `FirstTouch`) + `OUTREACH_PROMPT_KEY_VALUES`                                                                                                                         |
| `src/common/ai-outreach-generation/outreach-defaults.ts`                                                | NEU    | `OUTREACH_DEFAULT_CHANNEL`, `OUTREACH_DEFAULT_PROMPT_KEY`, `OUTREACH_CONTEXT_NOTE_MAX_LEN = 200`, `OUTREACH_MAX_IMPROVEMENTS = 2`, `OUTREACH_DEFAULT_OWNER_FALLBACK = "Moritz"`                    |
| `src/common/ai-outreach-generation/generate-outreach-request.dto.ts`                                    | NEU    | Request-DTO (`leadId`, `promptKey`, `channel`, `includeImprovements`, `contextNote?`)                                                                                                              |
| `src/common/ai-outreach-generation/generate-outreach-result.dto.ts`                                     | NEU    | Result-DTO: `{ ok: true; channel; promptKey; subject?; body } \| { ok: false; code: OutreachErrorCode }`                                                                                           |
| `src/common/ai-outreach-generation/outreach-lead-facts.ts`                                              | NEU    | `OutreachLeadFacts` — sanitisierter Lead-Ausschnitt (kein email/phone-Feld — strukturell DSGVO-sicher)                                                                                             |
| `src/common/ai-outreach-generation/outreach-prompt-options.ts`                                          | NEU    | `OutreachPromptOptions` (`includeImprovements`, `contextNote?`)                                                                                                                                    |
| `src/common/ai-outreach-generation/prompt-build-context.ts`                                             | NEU    | `PromptBuildContext` (`channel`, `lead: OutreachLeadFacts`, `options: OutreachPromptOptions`)                                                                                                      |
| `src/common/ai-outreach-generation/outreach-prompt-messages.ts`                                         | NEU    | `OutreachPromptMessages` (`systemPrompt`, `userPrompt`)                                                                                                                                            |
| `src/common/ai-outreach-generation/outreach-prompt-entry.ts`                                            | NEU    | `OutreachPromptEntry` (`key`, `descriptionDictKey`, `build(ctx)`)                                                                                                                                  |
| `src/common/ai-outreach-generation/outreach-profile.ts`                                                 | NEU    | `OUTREACH_PROFILE` — Persona/Tonalität (Moritz als Absender)                                                                                                                                       |
| `src/common/ai-outreach-generation/copywriting-guidelines.ts`                                           | NEU    | `COPYWRITING_GUIDELINES` — 12 Pflichtregeln für System-Prompt                                                                                                                                      |
| `src/common/ai-outreach-generation/channel-profiles.ts`                                                 | NEU    | `ChannelProfile` + `CHANNEL_PROFILES: Record<OutreachChannel, ChannelProfile>`                                                                                                                     |
| `src/common/ai-outreach-generation/outreach-prompt-registry.ts`                                         | NEU    | `OUTREACH_PROMPT_REGISTRY: Record<OutreachPromptKey, OutreachPromptEntry>`                                                                                                                         |
| `src/common/ai-outreach-generation/prompts/first-touch-prompt.ts`                                       | NEU    | `build` baut System + User-Prompt aus Profile, Guidelines, Channel-Profil, Lead-Daten; `serializeLeadFacts` überspringt leere Felder                                                               |
| `src/server/workspace/outreach/generate-outreach-message.schema.ts`                                     | NEU    | Zod-Schema gegen Request-DTO — Domain-Root, zwischen Route und Command-Handler                                                                                                                     |
| `src/server/tests/workspace/outreach/services/generate-outreach-message.schema.test.ts`                 | NEU    | Schema-Tests (TDD) — in `src/server/tests/` per Konvention                                                                                                                                         |
| `src/server/workspace/outreach/services/outreach-prompt-service.ts`                                     | NEU    | `buildSystemPrompt`, `buildUserPrompt` — orchestriert Registry + Channel-Profil + Lead-Sanitization                                                                                                |
| `src/server/workspace/outreach/services/outreach-ai-service.ts`                                         | NEU    | LM-Studio-zuerst (Qwen3-14B-GGUF Q4_K_M), OpenAI-`gpt-4o-mini`-Fallback (kein UI-Switch). **Kein** `checkAvailability`-Export.                                                                     |
| `src/server/workspace/outreach/services/outreach-message-parser.ts`                                     | NEU    | Parser: für Email → `{ subject, body }`; sonst → `{ body }`                                                                                                                                        |
| `src/server/workspace/outreach/command-handler/generate-outreach-message.command-handler.ts`            | NEU    | DB-Fetch → Prompt → AI → Parser → `appendLeadActivity` → Result                                                                                                                                    |
| `src/server/workspace/outreach/types/outreach-internal-types.ts`                                        | NEU    | Server-interne Typen, falls welche entstehen (z. B. Provider-Client-Konfig). Alle prompt-bezogenen Typen leben in `src/common/ai-outreach-generation/` — common darf nicht aus server importieren. |
| `src/server/tests/workspace/outreach/services/outreach-prompt-service.test.ts`                          | NEU    | Prompt-Service-Tests inkl. **DSGVO-Negativtests** (Email/Phone nie im Output)                                                                                                                      |
| `src/server/tests/workspace/outreach/services/outreach-ai-service.test.ts`                              | NEU    | AI-Service-Tests mit gemocktem OpenAI-Client                                                                                                                                                       |
| `src/server/tests/workspace/outreach/services/outreach-message-parser.test.ts`                          | NEU    | Parser-Tests (Email-Subject-Extraktion, Falsch-Format-Robustheit)                                                                                                                                  |
| `src/server/tests/workspace/outreach/command-handler/generate-outreach-message-command-handler.test.ts` | NEU    | Handler-Tests + Verifikation, dass `appendLeadActivity` mit `type=message_drafted` + Metadata aufgerufen wird                                                                                      |
| `src/lib/workspace/outreach/outreach-api-error.ts`                                                      | NEU    | Error-Response-Helper (Pattern analog `lead-api-error.ts`)                                                                                                                                         |
| `src/app/api/workspace/outreach/generate/route.ts`                                                      | NEU    | `POST` — `withWorkspaceApiAuth` + Schema-Validate → Command-Handler                                                                                                                                |
| `src/i18n/dictionaries/workspace/leads/outreach/de.json`                                                | NEU    | Outreach-i18n-Block DE (Trigger-Label, Dialog-Texte, Channel-Labels, Channel-Hints, Prompt-Descriptions, Error-Messages, Buttons)                                                                  |
| `src/i18n/dictionaries/workspace/leads/outreach/en.json`                                                | NEU    | Outreach-i18n-Block EN (analog)                                                                                                                                                                    |
| `src/i18n/dictionaries/workspace/leads/outreach/index.ts`                                               | NEU    | Re-Export + `LeadsOutreachDictionary`-Type (`typeof outreachDe`)                                                                                                                                   |
| `src/i18n/dictionaries/workspace/leads/index.ts`                                                        | EDIT   | Outreach-Section ins Leads-Dictionary-Bundle aufnehmen                                                                                                                                             |
| `src/components/workspace/leads/outreach/lead-outreach-dialog/lead-outreach-dialog.tsx`                 | NEU    | Eigene Client-Komponente — alle Dialog-Phasen (idle, loading, result, error) + Email-Sonderfall                                                                                                    |
| `src/components/workspace/leads/outreach/lead-outreach-dialog/lead-outreach-dialog.module.css`          | NEU    | Dialog-Styles                                                                                                                                                                                      |
| `src/components/workspace/leads/outreach/lead-outreach-trigger/lead-outreach-trigger.tsx`               | NEU    | Wieder­verwendbarer Trigger; 2 Varianten (`icon-only`, `icon+text`); hostet Dialog-State                                                                                                           |
| `src/components/workspace/leads/outreach/lead-outreach-trigger/lead-outreach-trigger.module.css`        | NEU    | Trigger-Styles                                                                                                                                                                                     |
| `src/components/workspace/leads/detail/lead-detail-panel/lead-detail-panel.tsx`                         | EDIT   | Trigger (`variant="icon-only"`) im Header neben Edit/Close                                                                                                                                         |
| `src/components/workspace/leads/form/lead-form-dialog/lead-form-dialog.tsx`                             | EDIT   | Trigger (`variant="icon+text"`) im Footer neben Speichern; nur wenn `mode === 'edit'`                                                                                                              |
| `src/components/workspace/leads/table/leads-table-row-actions/leads-table-row-actions.tsx`              | EDIT   | Trigger (`variant="icon-only"`) zwischen Edit- und Delete-Button                                                                                                                                   |

## Architektur

### Render-Pipeline

```
{ leadId, promptKey, channel, includeImprovements, contextNote? }
  → Zod-Validate (Channel ∈ OUTREACH_CHANNEL_VALUES, PromptKey ∈ OUTREACH_PROMPT_KEY_VALUES, contextNote ≤ 200)
  → getLeadById(leadId)                            // re-use aus P1-T13
  → ChannelProfile = CHANNEL_PROFILES[channel]     // {maxChars, greetingStyle, requiresSubject, tone}
  → Registry[promptKey].build({channel, lead, options}) → { systemPrompt, userPrompt }
  → outreachAiService.generate(system, user)       // LM Studio (Qwen3-14B Q4_K_M) → OpenAI gpt-4o-mini Fallback
  → outreachMessageParser.parse(channel, rawText)  // Email: {subject, body}, sonst: {body}
  → lead-activity-service.appendLeadActivity({     // re-use aus P1-T14
       leadId, type: 'message_drafted',
       body: parsed.body,
       metadata: { promptKey, channel, subject? }
     })
  → Response: { ok: true, subject?, body, channel, promptKey }
```

### Channel-Profile

Const-Object in `channel-profiles.ts`. Werte:

| Channel         | maxChars | Greeting      | requiresSubject | Tonalitäts-Direktive                                                                 |
| --------------- | -------- | ------------- | --------------- | ------------------------------------------------------------------------------------ |
| LinkedIn        | 300      | „Viele Grüße" | nein            | professionell-persönlich, ruhig, kein Sales-Sprech                                   |
| Email           | 900      | „Viele Grüße" | **ja**          | professionell, klare Struktur, Subject < 60 Zeichen, neugierig-machend               |
| Instagram       | 500      | „Liebe Grüße" | nein            | locker-freundlich, leicht informell                                                  |
| Direktnachricht | 250      | keine         | nein            | privat-persönlich, „du", für private Kontakte — **kein** Firmen-Pitch, kein Fremdeln |

### Prompt-Registry

`OutreachPromptKey = { FirstTouch: "first-touch" } as const`. Initial **ein** Eintrag — Channel ist Variation zur
Laufzeit (kein eigener Eintrag pro Kanal).

```ts
// outreach-prompt-registry.ts (Skizze, kein finaler Code)
export const OUTREACH_PROMPT_REGISTRY: Record<
  OutreachPromptKey,
  OutreachPromptEntry
> = {
  [OutreachPromptKey.FirstTouch]: firstTouchPrompt,
} as const;
```

Der Eintrag hat:

- `key`
- `descriptionDictKey`: i18n-Key (z. B. `"promptFirstTouchDescription"`), zeigt im Select „Erstkontakt — dezenter
  Werthinweis, weicher CTA, kein Pitch".
- `build(ctx)`: liefert `{ systemPrompt, userPrompt }`.
  - **systemPrompt** = `OUTREACH_PROFILE` + `COPYWRITING_GUIDELINES` + Channel-Profile-Instruktionen (maxChars,
    Greeting, „kein Pitch — nur dezenter Werthinweis"; „nicht copy-paste, individuell-catchy"; bei Email zusätzlich
    Subject-Anweisung mit Format-Vorgabe).
  - **userPrompt** = serialisierte Lead-Daten:
    - `Vorname: <firstName>` (Fallback „dort" wenn fehlt)
    - `Firma: <companyName>` (nur wenn gesetzt)
    - `Website: <websiteUrl>` (nur wenn gesetzt)
    - `Kategorie: <category.labelKey>` (nur wenn gesetzt)
    - `Notizen: <notes>` (nur wenn gesetzt)
    - `Verbesserungshinweise: <improvements.slice(0, OUTREACH_MAX_IMPROVEMENTS).join(", ")>` (nur wenn
      `includeImprovements=true` UND vorhanden)
    - `Zusätzlicher Kontext: <contextNote>` (nur wenn gesetzt)
  - **Niemals**: `email`, `phone`. Negativ-getestet.

Neue Prompts später: weiteren Wert in `OutreachPromptKey` + neue Datei unter
`src/common/prompts/outreach/prompts/<key>.ts` + Registry-Eintrag + i18n-Description. Kein UI-Touch nötig.

### AI-Service (Server-only)

- **Primär: lokales Modell via LM Studio.**
  - Runtime: LM Studio Server (OpenAI-kompatibler HTTP-Endpoint).
  - Model: `Qwen3-14B-GGUF` Quantisierung `Q4_K_M`.
  - Base URL: `http://localhost:1234/v1` (konfigurierbar via `LMSTUDIO_BASE_URL`, Default `http://localhost:1234/v1`).
  - Model-ID via `LM_STUDIO_MODEL` (Default `qwen3-14b`; muss exakt dem in LM Studio geladenen Identifier entsprechen).
  - Aufruf über `openai`-SDK mit obiger Base-URL und `apiKey: "lm-studio"` (Dummy — LM Studio ignoriert den Key).
- **Fallback: OpenAI `gpt-4o-mini`.**
  - Bei LM-Studio-Fehler (ECONNREFUSED, Timeout, 4xx/5xx) → automatisch OpenAI mit `process.env.OPENAI_API_KEY` und
    `OPENAI_MODEL` (Default `gpt-4o-mini`, in `.env.local` überschreibbar).
- Wenn beide nicht erreichbar/konfiguriert → wirft `Error("PROVIDER_UNAVAILABLE")`, vom Handler in
  `OutreachErrorCode.ProviderUnavailable` gemappt.
- **Kein** `checkAvailability`-Export, **kein** `/providers`-Route — der UI-Provider-Switch entfällt komplett.
- Roadmap (nicht in dieser Iteration): wenn OpenAI-Modell Web-Tool/Browser unterstützt, Tool aktivieren, damit das
  Modell die Website fetchen kann (User-Wunsch). V1: nur die URL im Prompt mitschicken.

### Trigger-Component

Eine wieder­verwendbare Komponente, die den Dialog-Open-State kapselt:

```tsx
<LeadOutreachTrigger
    variant="icon-only" | "icon+text"
lead = {lead}
content = {leadsDict.outreach}
sharedContent = {sharedDict}
/>
```

- `variant="icon-only"`: Button mit `aria-label={content.triggerLabel}`, `title={content.triggerLabel}`,
  `<FontAwesomeIcon aria-hidden="true" icon={faComment} />`. Verwendet im **Detail-Panel-Header** und in \*
  \*Table-Row-Actions\*\*.
- `variant="icon+text"`: Button mit Icon + sichtbarem Text `content.triggerLabel`. Verwendet im **Edit-Dialog-Footer**
  neben Speichern.
- Beide Varianten mounten `<LeadOutreachDialog>` bedingt (`isOpen && …`).
- **Wichtig im Form-Dialog:** Trigger darf das umliegende `<form>` nicht submitten → `type="button"` zwingend; ggf.
  ausserhalb des `<form>` rendern (Footer ist ohnehin meist außerhalb).
- **Click-Propagation in der Table:** in `leads-table-row-actions.tsx` muss der Klick-Handler die Row-Selection-Logik
  nicht triggern → `stopRowPropagation(event)` wie bei den anderen Aktionen.

### Dialog-Inhalt

- **Header:** Titel (i18n: `dialogTitle`), Close-Button (`faXmark`, ARIA).
- **Prompt-Select:** `<select>` mit allen Einträgen aus `OUTREACH_PROMPT_KEY_VALUES`. Unter dem Select: Description aus
  `t.promptDescriptions[selectedKey]`. Auch mit 1 Eintrag rendern, damit Layout bei zukünftigen Prompts konsistent
  bleibt.
- **Channel-Select:** Segmented-Buttons (4 Stück) aus `OUTREACH_CHANNEL_VALUES`, Default `OUTREACH_DEFAULT_CHANNEL`.
- **Channel-Hint:** bei `DirectMessage` Hint („nur sinnvoll bei privatem Kontakt, den du bereits kennst" —
  `directMessageHint`).
- **Improvements-Toggle:** Checkbox, default `true` wenn Lead Improvements hat. Disabled mit Tooltip wenn keine
  Improvements am Lead.
- **Kontext-Textfeld:** `<textarea>` max 200 Zeichen, optional. Placeholder + Counter aus i18n.
- **Generate-Button** (primär).
- **Nach Render:**
  - Bei Email: zwei Felder (`Subject` + `Body`), beide editierbar, jedes mit eigenem Copy-Button.
  - Sonst: ein `<textarea>` mit Copy-Button.
  - „Neu generieren" überschreibt das Ergebnis.
- **Fehler­zustände** (alle aus `OutreachErrorCode`): ValidationError, LeadNotFound, ProviderUnavailable, Internal — je
  eigene i18n-Texte.

## Tasks

Modell-Wahl pro Task. Faustregel: **Sonnet 4.6** für mechanisches Pattern-Matching (Konstanten, DTOs, Zod, Tests,
Routen, Integrationen). **Opus 4.7** dort, wo Output-Qualität sichtbar ist (Prompt-Engineering, Dialog-UX).

| #   | Task                                                                                                                                                                                                                                                                                                                                        | Modell     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | ✅ **Konstanten + DTOs** — `outreach-channels.ts` (4 Werte nach WhatsApp-Entfernung), `outreach-error-codes.ts`, `outreach-prompt-keys.ts`, `outreach-defaults.ts`, `generate-outreach-request.dto.ts`, `generate-outreach-result.dto.ts`. **Abgeschlossen 2026-05-16.**                                                                    | **Sonnet** |
| 2   | ✅ **Prompts-Modul** — 2a: `copywriting-guidelines.ts` + `outreach-profile.ts`; 2b: `channel-profiles.ts` (inkl. `ChannelProfile` Typ inline in common); 2c: `outreach-prompt-registry.ts` (inkl. `OutreachLeadFacts`, `PromptBuildContext`, `OutreachPromptEntry` inline) + `prompts/first-touch-prompt.ts`. **Abgeschlossen 2026-05-16.** | **Opus**   |
| 3   | ✅ **Zod-Schema + Test** (TDD) — 14 Tests grün. **Abgeschlossen 2026-05-16.**                                                                                                                                                                                                                                                               | **Sonnet** |
| 4   | ✅ **Prompt-Service + Tests** (TDD, inkl. **DSGVO-Negativtests** — Email/Phone nie im Prompt-Output) — 18 Tests grün. **Abgeschlossen 2026-05-16.**                                                                                                                                                                                         | **Sonnet** |
| 5   | ✅ **AI-Service + Tests** — LM-Studio (Qwen3-14B Q4_K_M) primär, OpenAI `gpt-4o-mini` Fallback; 7 Tests grün (LM-Studio-Erfolg / LM-Studio-Fail→OpenAI-Erfolg / beide-Fail / kein API-Key). `openai` als Dependency installiert. **Abgeschlossen 2026-05-16.**                                                                              | **Sonnet** |
| 6   | ✅ **Message-Parser + Tests** — 11 Tests grün (Subject-Extraktion kanalunabhängig via `Betreff:`-Prefix, Falsch-Format → subject=undefined/body=rawText). **Abgeschlossen 2026-05-16.**                                                                                                                                                     | **Sonnet** |
| 7   | ~~**Mehrsprachigkeit + Sprachauswahl**~~ — **Verworfen.** Sprache wird via `contextNote`-Freitextfeld gesteuert (z. B. „in English"). Kein eigenes Pipeline-Feld nötig.                                                                                                                                                                     | —          |
| 8   | ✅ **Command-Handler + Tests** — `generate-outreach-command-handler.ts`; `appendLeadActivity` (no-tx) zu `lead-activity-service.ts` ergänzt; `MessageDrafted` zu `LeadActivityType` + Dictionary-Eintrag + Icon; 10 Tests grün. **Abgeschlossen 2026-05-16.**                                                                               | **Sonnet** |
| 9   | ✅ **API-Layer** — `outreach-api-error.ts` + `POST /api/workspace/outreach/generate` (Auth + Schema + Handler) in einem Commit. **Abgeschlossen 2026-05-16.**                                                                                                                                                                               | **Sonnet** |
| 10  | ✅ **i18n-Block** — `de.json` + `en.json` + `index.ts` für Outreach-Section + Einbau in `workspace/leads/index.ts`. Beide Locales **zwingend** im selben Commit. **Abgeschlossen 2026-05-16.**                                                                                                                                              | **Sonnet** |
| 11  | **UI-Komponenten + Integrationen** — `LeadOutreachDialog` (alle Phasen, Email-Sonderfall) → `LeadOutreachTrigger` (zwei Varianten) → Mounts in Detail-Panel-Header, Edit-Dialog-Footer, Table-Row-Actions.                                                                                                                                  | **Opus**   |

### Definition of Done (vor PR, keine eigenen Tasks)

- `npm run lint && npm run typecheck && npm run test && npm run build` grün.
- Manueller Smoke-Test (`npm run dev`) gemäß Verifikations-Sektion durchlaufen.
- DSGVO-Check (Network-Tab + Server-Log) bestanden.

## Re-Use-Punkte

- `withWorkspaceApiAuth` (`src/lib/auth/api.ts`)
- `getLeadById` (`src/server/workspace/leads/query-handler/`)
- `lead-activity-service.appendLeadActivity()`
- `LeadFormDialogMode` (`src/common/constants/leads/forms/lead-form-dialog-modes.ts`) — Vorlage für const-Objekt-Pattern
- `lead-api-error.ts` — Vorlage für `outreach-api-error.ts`
- FontAwesome-Button-Pattern aus `lead-detail-panel.tsx` (Z. 119–139) und `leads-table-row-actions.tsx` (Z. 47–70)
- Dictionary-Loader-Pipeline aus `src/i18n/dictionaries/workspace/leads/index.ts`

## Verifikation (End-to-End-Akzeptanz)

1. **Gates grün:** `npm run lint && npm run typecheck && npm run test && npm run build`.
2. **Unit-Tests:**
   - Zod-Schema akzeptiert/lehnt Channel-Werte, PromptKey-Werte und contextNote-Länge korrekt ab.
   - Prompt-Service: bei `includeImprovements=true` max **2** Improvements im Output; **niemals** Email/Telefon im
     Output (negativer Test mit gefüllten Feldern).
   - AI-Service: LM-Studio-Erfolg → Text; LM-Studio-Fail + OpenAI-Key gesetzt → OpenAI-`gpt-4o-mini`-Erfolg; beide-Fail
     → `PROVIDER_UNAVAILABLE`.
   - Parser: Output mit `Betreff: …` → `{subject, body}`; Falsch-Format →
     `subject = undefined`, `body = vollständigerText`.
   - Command-Handler: Lead-not-found → `LeadNotFound`; bei Erfolg wird `appendLeadActivity` mit
     `type='message_drafted'`, `body=parsedBody` und `metadata={promptKey, channel, subject?}` aufgerufen.
3. **Manueller Smoke-Test** (`npm run dev`):
   - Trigger erscheint im **Detail-Panel-Header** (icon-only), im **Edit-Dialog-Footer** (icon+text, nur Edit-Mode), in
     der **Table-Row** (icon-only). Im **Create-Dialog**: NICHT sichtbar.
   - Prompt-Select zeigt „First-Touch" mit Description darunter.
   - Channel-Default ist LinkedIn; Wechsel auf Email zeigt nach Generate zwei Felder (Subject + Body) statt eines
     Textareas.
   - Direktnachricht zeigt den `directMessageHint`.
   - Improvements-Checkbox disabled mit Tooltip, wenn Lead keine Improvements hat.
   - Copy-Button kopiert tatsächlich (Toast).
   - „Neu generieren" überschreibt das Ergebnis.
4. **DSGVO-Check (manuell):** Lead mit gesetztem `email` + `phone` öffnen, Generate triggern, DevTools-Network-Tab:
   Request-Body zum `/generate`-Endpoint enthält email/phone **nicht** als Prompt-Inhalt (es geht nur die `leadId`
   raus). Im Server-Log dann verifizieren, dass auch der konstruierte User-Prompt keine email/phone enthält.
5. **Activity-Stream:** Nach Generate erscheint im Lead-Activity-Stream ein `message_drafted`-Eintrag mit `promptKey` +
   `channel` im Metadata.

## Offene Punkte / Roadmap (nicht in dieser Iteration)

- **Website-Inhalt fetchen** (Cheerio-Light-Scraping oder OpenAI-Browser-Tool, wenn Modell es unterstützt) — bewusst auf
  später verschoben. V1: nur URL im Prompt; Modell paraphrasiert auf Basis Domain-Namen + Improvements + Kategorie.
- **Mehrere Prompts in Registry** (z. B. „Follow-up", „Re-Engagement", „Termin-Vorschlag") — Code-Pfad ist vorbereitet,
  nur weitere Files unter `src/common/prompts/outreach/prompts/` + i18n-Description anlegen.
- **Direkt-Senden** (Resend für Email, LinkedIn-API etc.) — bleibt manuell per Copy-Paste.
- **Bulk-Outreach** (mehrere Leads gleichzeitig) — nicht jetzt.
- **A/B-Vergleich von zwei Outputs** im Dialog — Idee, falls 1 Generate zu wenig ist.
