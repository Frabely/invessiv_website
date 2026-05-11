# Lead Outreach Generator — Design Spec

**Date:** 2026-05-11  
**Status:** Approved  
**Author:** Moritz Hecht / Claude Code

---

## 1. Overview

Add a "Nachricht generieren" feature to the Lead Detail Panel in the workspace CRM. A click opens a dialog where the user selects a channel (LinkedIn, Instagram, WhatsApp), optionally adds context, optionally includes improvements, and generates a personalized outreach message. The generated text can be edited inline and copied with one click.

**Goal:** Enable Moritz (Invessiv owner) to quickly create personalized first-contact messages without writing from scratch — consistent with Invessiv's soft-sell, value-first approach.

---

## 2. Entry Point & UI Flow

### Trigger

- A single **"Nachricht generieren"** button is added to the `LeadDetailPanel` header area (alongside existing Edit / Close buttons).

### Dialog States

1. **Idle** — Channel selector + optional toggles/inputs + "Generieren" button
2. **Loading** — Button spinner, inputs locked, no content flicker
3. **Result** — Generated text in editable `<textarea>` + "Kopieren" + "Neu generieren" buttons
4. **Error** — Inline error message (provider unreachable, no fallback key) + "Erneut versuchen" button

### Dialog Content (Idle State)

```
┌─────────────────────────────────────────────┐
│ Nachricht generieren            [×]          │
│                                             │
│ Kanal                                       │
│ [LinkedIn]  [Instagram]  [WhatsApp]         │
│                                             │
│ [✓] Improvements einbeziehen               │
│     (nur verfügbar wenn Lead Improvements   │
│     hat, sonst grayed out)                  │
│                                             │
│ Zusätzlicher Kontext (optional)             │
│ ┌─────────────────────────────────────────┐ │
│ │ z.B. "Hat gerade Rebranding gemacht"    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│              [Generieren →]                 │
└─────────────────────────────────────────────┘
```

### Dialog Content (Result State)

```
┌─────────────────────────────────────────────┐
│ Nachricht generieren  [LinkedIn] [×]         │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Hallo Susan, ich bin Moritz von...      │ │
│ │ [editierbares Textarea, auto-resize]    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Kopieren]          [Neu generieren]        │
└─────────────────────────────────────────────┘
```

### UX Details

- Channel-Auswahl als segmentierter Button (nicht Dropdown) — 3 Optionen = überschaubar
- "Improvements einbeziehen"-Checkbox: wenn Lead keine Improvements hat → disabled + Tooltip "Keine Improvements hinterlegt"
- Kontext-Feld: optional, kein Placeholder-Text als Pflichthinweis, max. 200 Zeichen
- Textarea im Result-State: auto-resize, user kann Text vor dem Kopieren direkt bearbeiten
- "Kopieren"-Button: nach erfolgreichem Kopieren kurz zu "Kopiert ✓" wechseln (2 s), dann zurück
- "Neu generieren": schickt denselben Request erneut (mit gleichen Einstellungen), ersetzt vorherigen Text

---

## 3. Channel-spezifische Vorgaben

| Kanal     | Max. Zeichen | Tonalität                | Format                            |
| --------- | ------------ | ------------------------ | --------------------------------- |
| LinkedIn  | ~300         | Professionell-persönlich | Kurze Absätze, Siezen             |
| Instagram | ~500         | Lockerer, direkt         | Ein Block, Du/Sie je nach Branche |
| WhatsApp  | ~160         | Sehr direkt, informell   | Ein Absatz                        |

---

## 4. Prompt-Strategie

### Invessiv-Nachrichtenmuster (Pflicht)

Das Modell muss immer diesem Muster folgen:

1. Persönliche Anrede (`Hallo [Vorname]`)
2. Referenz zur Website/Branche des Kontakts
3. Konkreter Werthinweis (aus Improvements oder allgemeiner Beobachtung)
4. Weicher CTA (`Darf ich kurz schicken?` / `Wäre das interessant?`)
5. Grußformel mit Owner-Name + "von Invessiv"

**Beispiel-Output:**

> Hallo Susan, ich bin Moritz von Invessiv und habe gerade Ihre Website gesehen. Mir sind ein paar kleine Punkte aufgefallen, die es Besuchern eventuell schwerer machen könnten, den nächsten Schritt zur Anfrage zu finden. Wäre es okay, wenn ich Ihnen die kurz schicke? Viele Grüße, Moritz von Invessiv

### System-Prompt (Struktur)

```
Du bist {owner} von Invessiv – einer Full-Service-Digitalagentur.
Du schreibst eine kurze Erst-Kontakt-Nachricht auf {channel}.
Halte dich exakt an dieses Muster: [Anrede] → [Website-Referenz] → [Werthinweis] → [Weicher CTA] → [Grußformel mit "{owner} von Invessiv"].
Tonalität: professionell-persönlich, kein Sales-Blabla.
Sprache: Deutsch. Keine Emojis. Keine generischen Floskeln.
Maximale Länge: {maxChars} Zeichen.
Ausgabe: nur der Nachrichtentext, keine Erklärungen, kein Prefix.
```

### User-Prompt — gesendete Lead-Daten (DSGVO-minimiert)

| Feld                | Gesendet             | Begründung                                               |
| ------------------- | -------------------- | -------------------------------------------------------- |
| `firstName`         | ✅                   | Für Anrede unverzichtbar; Vorname allein geringes Risiko |
| `companyName`       | ✅                   | Unternehmensdatum, öffentlich                            |
| `websiteUrl`        | ✅                   | Öffentliche Daten                                        |
| `category.labelKey` | ✅                   | Klassifikation, kein Personenbezug                       |
| `improvements`      | ✅ wenn Toggle aktiv | Firmbezogene Optimierungshinweise                        |
| `notes`             | ✅ wenn vorhanden    | Nur wenn firmenbezogen formuliert                        |
| `contextNote`       | ✅ wenn eingegeben   | Vom User selbst eingegeben                               |
| `owner`             | ✅                   | Name des Absenders                                       |
| `email`             | ❌                   | Personendatum, nie senden                                |
| `phone`             | ❌                   | Personendatum, nie senden                                |
| `lastName`          | ❌                   | Identifizierend, nicht nötig                             |
| `socialProfiles`    | ❌                   | Nicht benötigt                                           |

---

## 5. Serverarchitektur

### Neue Dateien

```
src/
├── common/
│   ├── constants/outreach/
│   │   ├── outreach-channels.ts              # OutreachChannel const object + type + VALUES
│   │   └── outreach-error-codes.ts           # OutreachErrorCode const object + type
│   └── contracts/outreach/
│       └── generate-outreach-request.dto.ts  # { leadId, channel, includeImprovements, contextNote? }
│
├── server/
│   └── services/outreach/
│       ├── outreach-ai-service.ts            # Provider-Abstraktion: Ollama-first, OpenAI-Fallback
│       ├── outreach-prompt-service.ts        # Prompt-Builder: System + User-Prompt aus LeadDetailDto
│       └── generate-outreach-command-handler.ts  # Koordiniert: DB-Fetch → Prompt → AI → Result
│
└── app/api/workspace/outreach/
    └── generate/route.ts                     # POST handler: Auth + Zod-Validation → Command-Handler
```

### API Route: `POST /api/workspace/outreach/generate`

- Auth via `requireWorkspaceAccess()` (bestehender Helper)
- Zod-Validation: `{ leadId: string, channel: OutreachChannel, includeImprovements: boolean, contextNote?: string }`
- Ruft `generateOutreachCommandHandler(input)` auf
- Gibt `{ message: string }` zurück oder strukturiertes Error-Objekt

### `outreach-ai-service.ts`

```ts
export const outreachAiService = {
  generate: async (prompt: OutreachPrompt): Promise<string>
}
```

Intern: Try Ollama (`OLLAMA_BASE_URL`) → bei Connection-Fehler auto-Fallback zu OpenAI (`OPENAI_API_KEY`).  
Wenn beide nicht verfügbar: wirft `OutreachErrorCode.ProviderUnavailable`.

**Ollama-Kompatibilität:** Ollama's REST API ist OpenAI-kompatibel → ein SDK (`openai`), zwei `baseURL`-Konfigurationen.

### `outreach-prompt-service.ts`

```ts
export const outreachPromptService = {
  buildSystemPrompt: (channel: OutreachChannel, owner: string): string,
  buildUserPrompt: (lead: LeadDetailDto, options: PromptOptions): string,
}
```

### `generate-outreach-command-handler.ts`

```ts
export async function generateOutreachCommandHandler(
  input: GenerateOutreachRequestDto,
): Promise<GenerateOutreachResult>;
```

Ablauf: Lead aus DB laden → Prompt bauen → AI aufrufen → Result zurückgeben

---

## 6. Komponenten

### `LeadOutreachDialog` (Client Component)

```
src/components/workspace/leads/detail/
└── lead-outreach-dialog/
    ├── lead-outreach-dialog.tsx
    └── lead-outreach-dialog.module.css
```

- Props: `{ lead: LeadDetailDto, content: LeadsDetailDictionary }`
- State: `channel`, `includeImprovements`, `contextNote`, `dialogState: 'idle'|'loading'|'result'|'error'`, `generatedMessage`
- Kein direktes DB-Zugriff — alles via API-Route

### Integration in `LeadDetailPanel`

- Neuer "Nachricht generieren"-Button im `header`-Bereich
- `LeadOutreachDialog` als gesteuertes Dialog-Element (open/onClose via State)
- Alle neuen Labels in den bestehenden `LeadsDetailDictionary` i18n-Dateien ergänzen

---

## 7. i18n

Neue Keys in `src/i18n/dictionaries/workspace/leads/detail/{de,en}.json`:

```json
{
  "outreach": {
    "buttonLabel": "Nachricht generieren",
    "dialogTitle": "Nachricht generieren",
    "channelLinkedin": "LinkedIn",
    "channelInstagram": "Instagram",
    "channelWhatsapp": "WhatsApp",
    "includeImprovements": "Verbesserungshinweise einbeziehen",
    "noImprovementsTooltip": "Keine Verbesserungshinweise hinterlegt",
    "contextLabel": "Zusätzlicher Kontext",
    "contextPlaceholder": "z.B. „Hat gerade Rebranding gemacht"",
    "generateButton": "Generieren",
    "copyButton": "Kopieren",
    "copiedButton": "Kopiert",
    "regenerateButton": "Neu generieren",
    "retryButton": "Erneut versuchen",
    "errorProviderUnavailable": "KI-Dienst nicht erreichbar. Bitte später erneut versuchen.",
    "errorGeneric": "Fehler beim Generieren. Bitte erneut versuchen."
  }
}
```

---

## 8. Fehlerbehandlung

| Fehlerfall                       | HTTP Status | OutreachErrorCode     | UI                           |
| -------------------------------- | ----------- | --------------------- | ---------------------------- |
| Ollama + OpenAI nicht erreichbar | 503         | `ProviderUnavailable` | Error-State mit Retry        |
| Kein OpenAI-Key + Ollama down    | 503         | `ProviderUnavailable` | Error-State                  |
| Lead nicht gefunden              | 404         | `LeadNotFound`        | Error-State                  |
| Validation fehlgeschlagen        | 400         | `ValidationError`     | — (client-seitig abgefangen) |
| Timeout (>15 s)                  | 504         | `Timeout`             | Error-State mit Retry        |

---

## 9. Konfiguration & Deployment

### Env-Variablen

| Variable          | Pflicht | Default                  | Beschreibung                     |
| ----------------- | ------- | ------------------------ | -------------------------------- |
| `OLLAMA_BASE_URL` | Nein    | `http://localhost:11434` | Ollama Endpoint                  |
| `OLLAMA_MODEL`    | Nein    | `mistral`                | Modellname                       |
| `OPENAI_API_KEY`  | Nein\*  | —                        | Fallback; ohne Key → Ollama-only |
| `OPENAI_MODEL`    | Nein    | `gpt-4o-mini`            | Fallback-Modell                  |

\*Wenn `OPENAI_API_KEY` fehlt und Ollama down → Fehlermeldung im UI.

### Lokales Setup (dev)

```bash
# Ollama installieren: https://ollama.ai
ollama pull mistral
# .env.local:
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral
OPENAI_API_KEY=sk-...   # optional, für Fallback-Tests
```

### Vercel (Production)

Ohne lokales Ollama → automatisch OpenAI-Fallback wenn `OPENAI_API_KEY` gesetzt.

---

## 10. Testing

- **Unit-Tests** für `outreach-prompt-service.ts`: System- und User-Prompt-Output für alle Channels, mit/ohne Improvements
- **Unit-Test** für Command-Handler: Mock der AI-Service, prüft korrektes Prompt-Routing
- **E2E-Test** (optional): Dialog öffnen, Kanal wählen, Generieren — prüft UI-States (keine echte AI-Call nötig, Mock-API-Route)

---

## 11. Out of Scope (jetzt)

- Website-Scraping für zusätzlichen Firmen-Kontext (späteres Feature)
- XING-Kanal
- Nachrichtenhistorie / gespeicherte Drafts
- Mehrsprachige Outputs (aktuell nur Deutsch)
- Streaming-Response (aktuell nur full response)
