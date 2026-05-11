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
│ Modell                                      │
│ [● Ollama (lokal)]  [○ OpenAI]              │
│   (disabled/loading während Provider-Check) │
│                                             │
│ Kanal                                       │
│ [LinkedIn]  [Instagram]  [WhatsApp]         │
│                                             │
│ [✓] Improvements einbeziehen               │
│     (disabled + Tooltip wenn keine vorhanden)│
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

Form-Elemente bleiben sichtbar und änderbar. Es gibt keinen separaten "Neu generieren"-Button — der Action-Button
zeigt im Result-State `Neu generieren` statt `Generieren`. Einstellungen ändern + erneut klicken = neue Nachricht.

```
┌─────────────────────────────────────────────┐
│ Nachricht generieren            [×]          │
│                                             │
│ Modell: [● Ollama (lokal)]  [○ OpenAI]      │
│ Kanal:  [LinkedIn]  [Instagram]  [WhatsApp] │
│ [✓] Improvements einbeziehen               │
│ Kontext: [................................] │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Hallo Susan, ich bin Moritz von...      │ │
│ │ [editierbares Textarea, auto-resize]    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Kopieren]             [Neu generieren →]   │
└─────────────────────────────────────────────┘
```

### UX Details

- **Modell-Selector:** Beim Öffnen läuft sofort `GET /api/workspace/outreach/providers`. Während des Checks
  sind Radio-Buttons disabled mit Lade-Indikator. Ollama-Radio aktiv wenn erreichbar, sonst deaktiviert (Tooltip
  "Ollama nicht erreichbar — lokalen Server starten"). Wenn nur ein Provider → kein Selector, nur Label. Wenn
  kein Provider verfügbar → Fehlermeldung direkt, Generieren nicht möglich.
- **Channel-Auswahl:** Segmentierter Button, 3 Optionen, immer sichtbar
- **"Improvements einbeziehen"-Checkbox:** disabled + Tooltip wenn Lead keine Improvements hat
- **Kontext-Feld:** optional, max. 200 Zeichen, kein Pflichthinweis im Placeholder
- **Textarea im Result-State:** auto-resize, direkt editierbar vor dem Kopieren
- **"Kopieren"-Button:** wechselt 2 s zu "Kopiert ✓", dann zurück
- **Loading-State:** Action-Button zeigt Spinner, alle Inputs gesperrt

---

## 3. Channel-spezifische Vorgaben

| Kanal     | Max. Zeichen | Anrede | Tonalität                                   | Website-Referenz              |
| --------- | ------------ | ------ | ------------------------------------------- | ----------------------------- |
| LinkedIn  | 300          | Siezen | Professionell, sachlich, unaufdringlich     | „Ihre Website"                |
| Instagram | 500          | Duzen  | Persönlicher, wärmer, aber weiterhin seriös | „deine Website / dein Profil" |
| WhatsApp  | 160          | Duzen  | Ultra-kurz, direkt, freundlich, informell   | „deine Website"               |

### LinkedIn

- Sprache: Siezen durchgehend (`Ihre Website`, `Ihnen die kurz schicke`, `Wäre es okay`)
- Länge: max. 300 Zeichen — entspricht einer kurzen Connection-Request-Nachricht oder einer DM-Eröffnung
- Stil: ruhig, professionell, kein Verkaufsdruck
- Struktur: alle 6 Prompt-Schritte vollständig, kompakt formuliert
- Abschluss: `Viele Grüße, {owner} von Invessiv`

**Beispiel:**

> Hallo Susan, ich bin Moritz von Invessiv und habe gerade Ihre Website gesehen. Mir sind ein paar kleine Punkte aufgefallen, die es Besuchern eventuell schwerer machen könnten, den nächsten Schritt zur Anfrage zu finden. Wäre es okay, wenn ich Ihnen die kurz schicke? Viele Grüße, Moritz von Invessiv

### Instagram

- Sprache: Duzen (`deine Website`, `dir die kurz schicken`, `Wäre das okay für dich?`)
- Länge: max. 500 Zeichen — mehr Raum für eine persönlichere Ansprache
- Stil: wärmer, direkter, trotzdem professionell und nicht aufdringlich
- Struktur: alle 6 Prompt-Schritte — Formulierungen lockerer als LinkedIn
- Kein `Viele Grüße` nötig, ein einfaches `Liebe Grüße, {owner} von Invessiv` ist passender
- **Hinweis:** WhatsApp hat Vorrang für ultra-kurze Nachrichten; Instagram bietet mehr Spielraum

**Beispiel:**

> Hallo Susan, ich bin Moritz von Invessiv — ich habe gerade deine Website gesehen. Mir sind ein paar kleine Punkte aufgefallen, die es Besuchern eventuell schwerer machen könnten, den nächsten Schritt zur Anfrage zu finden. Wäre es okay, wenn ich dir die kurz schicke? Liebe Grüße, Moritz von Invessiv

### WhatsApp _(optional, nur bei vorhanden Telefonnummer)_

- Sprache: Duzen, sehr direkt
- Länge: max. 160 Zeichen — eine SMS-Länge, kein Satz zu viel
- Stil: freundlich-informell, fühlt sich wie eine persönliche Nachricht an
- Struktur: komprimiert — Anrede + kurze Vorstellung + Kernaussage + CTA; Grußformel kann entfallen oder auf `Moritz` gekürzt werden
- **Hinweis:** WhatsApp-Kaltakquise ist in Deutschland regulatorisch sensibel. Der Button zeigt einen Hinweis-Tooltip: "Nur bei bestehender Geschäftsbeziehung rechtlich unbedenklich."

**Beispiel:**

> Hallo Susan, ich bin Moritz von Invessiv. Habe deine Website gesehen — darf ich dir kurz ein paar Punkte schicken, die mehr Anfragen bringen könnten? Moritz

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

### System-Prompt (final, unveränderlich)

```
Du bist {owner} von Invessiv, einer Full-Service-Digitalagentur.

Schreibe eine kurze, professionelle Erstkontakt-Nachricht auf Deutsch für {channel}.

Die Nachricht soll exakt dieser Struktur folgen:
1. Persönliche Anrede mit Vornamen: "Hallo {firstName},"
2. Kurze Vorstellung: "ich bin {owner} von Invessiv"
3. Website-Referenz: erwähne, dass du gerade die Website gesehen hast
4. Dezenter Werthinweis: sage, dass dir ein paar kleine Punkte aufgefallen sind,
   die es Besuchern eventuell schwerer machen könnten, den nächsten Schritt zur
   Anfrage zu finden
5. Weicher CTA: frage, ob es okay wäre, diese Punkte kurz zu schicken
6. Grußformel: "{closingGreeting}, {owner} von Invessiv"

Tonalität:
professionell-persönlich, ruhig, unaufdringlich, kein Sales-Blabla.

Vermeide:
Emojis, Ausrufezeichen, Marketing-Floskeln, Fachbegriffe wie Conversion,
Funnel, SEO, Leadgenerierung, Audit oder Optimierung.

Maximale Länge: {maxChars} Zeichen.

Ausgabe:
Nur den fertigen Nachrichtentext. Keine Erklärung. Kein Prefix. Keine Varianten.
```

**Prompt-Variablen je Channel:**

| Variable            | LinkedIn      | Instagram     | WhatsApp                |
| ------------------- | ------------- | ------------- | ----------------------- |
| `{channel}`         | `LinkedIn`    | `Instagram`   | `WhatsApp`              |
| `{maxChars}`        | `300`         | `500`         | `160`                   |
| `{closingGreeting}` | `Viele Grüße` | `Liebe Grüße` | _(entfällt / nur Name)_ |

Anrede (Siezen/Duzen) wird implizit durch Channel-spezifische Beispiele und die Tonalitätsvorgabe gesteuert — der Prompt-Builder fügt keine separate Anrede-Instruktion hinzu, da das Beispiel-Output-Muster im Invessiv-Template eindeutig ist.

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
│       ├── generate-outreach-request.dto.ts  # { leadId, channel, provider, includeImprovements, contextNote? }
│       └── outreach-providers-result.dto.ts  # { ollama: boolean, openai: boolean }
│
├── server/workspace/outreach/
│   ├── services/
│   │   ├── generate-outreach/
│   │   │   └── generate-outreach-request.schema.ts  # Zod-Schema (analog zu create-lead.schema.ts)
│   │   ├── outreach-ai-service.ts            # Provider-Abstraktion: Ollama-first, OpenAI-Fallback
│   │   └── outreach-prompt-service.ts        # Prompt-Builder: System + User-Prompt aus LeadDetailDto
│   └── command-handler/
│       └── generate-outreach-command-handler.ts  # Koordiniert: DB-Fetch → Prompt → AI → Result
│
└── app/api/workspace/outreach/
    ├── generate/route.ts                     # POST: Auth + Schema-Validation → Command-Handler
    └── providers/route.ts                    # GET: Ollama-Ping + OpenAI-Key-Check → { ollama, openai }
```

### API Route: `POST /api/workspace/outreach/generate`

- Auth via `withWorkspaceApiAuth()` (analog zu bestehenden Lead-Routes)
- Zod-Validation via `generateOutreachRequestSchema` aus `generate-outreach-request.schema.ts`
- Schema: `{ leadId: string, channel: OutreachChannel, provider: OutreachProvider, includeImprovements: boolean, contextNote?: string }`
- Ruft `generateOutreachCommandHandler(input)` auf
- Gibt `{ message: string }` zurück oder strukturiertes Error-Objekt

### API Route: `GET /api/workspace/outreach/providers`

- Auth via `withWorkspaceApiAuth()`
- Prüft: Ollama erreichbar (HTTP GET `{OLLAMA_BASE_URL}/api/tags` mit 2 s Timeout), OpenAI-Key gesetzt
- Gibt `{ ollama: boolean, openai: boolean }` zurück
- Timeout-Fehler → `ollama: false` (kein Fehler-Status, nur Availability-Flag)
- Wird beim Öffnen des Dialogs gecalled; kein Caching (User kann Ollama zwischenzeitlich starten)

### `OutreachProvider` Konstante

Neues Const-Objekt in `src/common/constants/outreach/outreach-providers.ts`:

```ts
export const OutreachProvider = { Ollama: "ollama", OpenAi: "openai" } as const;
export type OutreachProvider =
  (typeof OutreachProvider)[keyof typeof OutreachProvider];
```

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
- State: `provider`, `channel`, `includeImprovements`, `contextNote`, `dialogState: 'idle'|'loading'|'result'|'error'`, `generatedMessage`, `availableProviders: { ollama: boolean, openai: boolean } | null`
- Provider-Check via `GET /api/workspace/outreach/providers` beim Öffnen (eigener `useEffect`)
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
    "modelLabel": "Modell",
    "modelOllama": "Ollama (lokal)",
    "modelOpenAi": "OpenAI",
    "modelChecking": "Verfügbare Modelle werden geprüft...",
    "modelOllamaUnavailable": "Ollama nicht erreichbar — lokalen Server starten",
    "noProviderAvailable": "Kein KI-Dienst verfügbar. Bitte Ollama starten oder OpenAI-Key setzen.",
    "channelLabel": "Kanal",
    "channelLinkedin": "LinkedIn",
    "channelInstagram": "Instagram",
    "channelWhatsapp": "WhatsApp",
    "whatsappLegalHint": "Nur bei bestehender Geschäftsbeziehung rechtlich unbedenklich.",
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
