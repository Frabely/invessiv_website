# Projektplan: OpenAI API für LinkedIn-Anfragetexte in Next.js

Stand: 2026-05-07

## 1. Ziel des Projekts

Du möchtest in deinem Next.js-Projekt aus strukturierten Lead-Daten automatisch kurze LinkedIn-Anfragetexte erzeugen.

Der Ablauf:

```txt
Frontend
  -> Next.js Backend API Route
  -> OpenAI Responses API
  -> JSON Response mit fertiger LinkedIn Message
  -> Speicherung von Usage, Tokens und Kosten
```

Geplantes Volumen:

```txt
100x neue LinkedIn-Nachricht pro Monat
100x Korrektur oder Überarbeitung pro Monat
ca. 200 AI-Requests pro Monat
```

Primäres Ziel:

```txt
Schnell, günstig, kontrolliert, reproduzierbar und sicher.
```

---

## 2. Empfohlener MVP-Scope

Für den Start reicht ein kleiner MVP mit diesen Funktionen:

- Endpoint zum Erstellen einer LinkedIn-Nachricht
- Fester Prompt im Backend
- Parameter aus Lead-Daten
- JSON-Ausgabe mit `message`
- Usage-Tracking pro Monat
- Request-Limit pro Monat
- Kostenlimit pro Monat
- `max_output_tokens` als Schutz gegen zu lange Antworten
- OpenAI API Key nur im Backend
- Fehlerbehandlung mit sinnvollen HTTP-Statuscodes

Noch nicht nötig im MVP:

- Streaming
- komplexes Dashboard
- Multi-Tenant-System
- Fine-Tuning
- eigene Prompt-Versionierung mit UI
- automatische Lead-Bewertung

---

## 3. Technischer Stack

Empfohlen für dein Setup:

```txt
Next.js App Router
TypeScript
OpenAI Node SDK
Neon Postgres
Vercel Hosting
Zod für Input-Validierung
```

Packages:

```bash
npm install openai zod @neondatabase/serverless
```

---

## 4. API-Architektur

Empfohlene API-Routen:

```txt
POST /api/ai/linkedin-message
POST /api/ai/linkedin-message/rewrite
GET  /api/ai/usage
```

### 4.1 Erstellung

```txt
POST /api/ai/linkedin-message
```

Zweck:

```txt
Erstellt aus Lead-Daten eine neue LinkedIn-Anfrage.
```

Input:

```json
{
  "firstName": "Susanne",
  "lastName": "",
  "status": "In Bearbeitung",
  "score": "9.0",
  "category": "Coaches",
  "linkedInUrl": "https://de.linkedin.com/in/susanne-l%C3%A4mmel",
  "website": "https://bildungswesen-coaching.de",
  "painPoint": "Gmail wirkt weniger professionell",
  "angle": "Schulleitungs-Angebot klar",
  "suggestion": "Kontaktweg vereinfachen",
  "email": "bildungswesencoaching@gmail.com"
}
```

Output:

```json
{
  "message": "Hallo Susanne, ich bin Moritz von Invessiv. Ihr Coaching-Angebot für Schulleitungen wirkt sehr klar positioniert. Mir ist eine kleine Sache aufgefallen: Der Kontaktweg könnte noch professioneller und einfacher wirken. Darf ich Ihnen kurz eine konkrete Idee dazu schicken?",
  "usage": {
    "inputTokens": 230,
    "outputTokens": 65,
    "totalTokens": 295,
    "costEur": 0.0001
  }
}
```

### 4.2 Korrektur

```txt
POST /api/ai/linkedin-message/rewrite
```

Zweck:

```txt
Überarbeitet eine bereits generierte Nachricht anhand einer Anweisung.
```

Input:

```json
{
  "message": "Hallo Susanne, ich bin Moritz von Invessiv...",
  "instruction": "Kürzer und weniger werblich formulieren.",
  "lead": {
    "firstName": "Susanne",
    "category": "Coaches",
    "website": "https://bildungswesen-coaching.de",
    "painPoint": "Gmail wirkt weniger professionell",
    "angle": "Schulleitungs-Angebot klar",
    "suggestion": "Kontaktweg vereinfachen"
  }
}
```

Output:

```json
{
  "message": "Hallo Susanne, ich bin Moritz von Invessiv. Ihr Angebot für Schulleitungen wirkt sehr klar. Mir ist eine kleine Idee aufgefallen, wie der Kontaktweg noch einfacher wirken könnte. Darf ich sie Ihnen kurz schicken?",
  "usage": {
    "inputTokens": 310,
    "outputTokens": 55,
    "totalTokens": 365,
    "costEur": 0.0001
  }
}
```

---

## 5. OpenAI-Modellwahl

Für dein Projekt brauchst du kein großes Modell. Die Aufgabe ist kurz, klar strukturiert und wiederholt sich.

Empfehlung:

```txt
Standard: gpt-5.4-nano
Fallback bei Qualitätsproblemen: gpt-5.4-mini
```

Aktuelle offizielle Preise laut OpenAI Pricing Page, Stand 2026-05-07:

```txt
gpt-5.4-nano:
Input:  $0.20 / 1 Mio. Tokens
Output: $1.25 / 1 Mio. Tokens

gpt-5.4-mini:
Input:  $0.75 / 1 Mio. Tokens
Output: $4.50 / 1 Mio. Tokens
```

Quellen:

```txt
https://developers.openai.com/api/docs/pricing
https://github.com/openai/openai-node
```

Für deine erwarteten 200 Requests im Monat ist der Unterschied finanziell fast egal. Trotzdem ist `nano` als Start
sinnvoll, weil die Aufgabe einfach ist.

---

## 6. Realistische Kostenabschätzung

Annahme pro Erstellung:

```txt
Input:  250 Tokens
Output: 80 Tokens
```

Annahme pro Korrektur:

```txt
Input:  350 Tokens
Output: 70 Tokens
```

Monatsvolumen:

```txt
100 Erstellungen
100 Korrekturen
```

### 6.1 Token pro Monat

```txt
Erstellung Input:  100 * 250 = 25.000 Tokens
Erstellung Output: 100 * 80  = 8.000 Tokens

Korrektur Input:   100 * 350 = 35.000 Tokens
Korrektur Output:  100 * 70  = 7.000 Tokens

Gesamt Input:  60.000 Tokens
Gesamt Output: 15.000 Tokens
```

### 6.2 Kosten mit gpt-5.4-nano

```txt
Input:  60.000 / 1.000.000 * $0.20 = $0.0120
Output: 15.000 / 1.000.000 * $1.25 = $0.0188

Gesamt: ca. $0.0308 pro Monat
```

Bei einem Wechselkurs von `1 EUR = 1.1762 USD`:

```txt
$0.0308 / 1.1762 = ca. 0,0262 €
```

Mit großzügigem Puffer:

```txt
Realistisch: 0,03 € bis 0,20 € pro Monat
Internes Limit: 1,00 € pro Monat
OpenAI Projektlimit: 5,00 € pro Monat
```

Quelle Wechselkurs:

```txt
https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-usd.en.html
```

---

## 7. Usage-Limit-Konzept

Du brauchst zwei Schutzebenen.

### 7.1 OpenAI Dashboard Limit

Im OpenAI Dashboard ein Projektbudget setzen:

```txt
Projekt: Invessiv LinkedIn Generator
Monatsbudget: 5 €
```

Das ist deine letzte Absicherung, falls dein Backend-Limit fehlerhaft ist.

### 7.2 Backend Limit

In deinem Backend setzt du eigene Limits:

```ts
const MONTHLY_REQUEST_LIMIT = 300;
const MONTHLY_COST_LIMIT_MICRO_EUR = 1_000_000;
const MAX_OUTPUT_TOKENS = 180;
```

Empfohlene Limits:

```txt
Requests pro Monat: 300
Kosten pro Monat: 1,00 €
Max Output Tokens pro Request: 180
Max Input-Länge pro Lead-Feld: begrenzen
```

Warum 300 Requests?

```txt
100 geplante Erstellungen
100 geplante Korrekturen
100 Puffer
```

---

## 8. Datenbank-Schema für Usage Tracking

Tabelle:

```sql
create table ai_usage_limits
(
    user_id        text      not null,
    period text not null,
    request_count  integer   not null default 0,
    input_tokens   integer   not null default 0,
    output_tokens  integer   not null default 0,
    total_tokens   integer   not null default 0,
    cost_micro_eur bigint    not null default 0,
    created_at     timestamp not null default now(),
    updated_at     timestamp not null default now(),
    primary key (user_id, period)
);
```

Optional zusätzlich für einzelne Requests:

```sql
create table ai_usage_events
(
    id             uuid primary key   default gen_random_uuid(),
    user_id        text      not null,
    period text not null,
    endpoint       text      not null,
    model          text      not null,
    input_tokens   integer   not null default 0,
    output_tokens  integer   not null default 0,
    total_tokens   integer   not null default 0,
    cost_micro_eur bigint    not null default 0,
    success        boolean   not null default true,
    created_at     timestamp not null default now()
);
```

Warum zwei Tabellen?

```txt
ai_usage_limits = schnelle Monatsprüfung
ai_usage_events = Analyse, Debugging und Dashboard
```

Für den MVP reicht `ai_usage_limits`. Für saubere Auswertung ist `ai_usage_events` sinnvoll.

---

## 9. Kostenberechnung im Backend

Empfohlen: Preise zentral konfigurieren.

```ts
const MODEL_PRICING = {
  "gpt-5.4-nano": {
    inputUsdPerMillion: 0.2,
    outputUsdPerMillion: 1.25,
  },
  "gpt-5.4-mini": {
    inputUsdPerMillion: 0.75,
    outputUsdPerMillion: 4.5,
  },
} as const;

const USD_TO_EUR = 0.8502;

function calculateCostMicroEur(params: {
  model: keyof typeof MODEL_PRICING;
  inputTokens: number;
  outputTokens: number;
}) {
  const pricing = MODEL_PRICING[params.model];

  const inputUsd =
    (params.inputTokens / 1_000_000) * pricing.inputUsdPerMillion;
  const outputUsd =
    (params.outputTokens / 1_000_000) * pricing.outputUsdPerMillion;
  const totalEur = (inputUsd + outputUsd) * USD_TO_EUR;

  return Math.ceil(totalEur * 1_000_000);
}
```

Für eine saubere spätere Lösung:

```txt
Preise in ENV oder DB speichern
Wechselkurs gelegentlich manuell aktualisieren
Kosten intern lieber konservativ aufrunden
```

---

## 10. Input-Validierung mit Zod

Datei:

```txt
src/lib/ai/schemas.ts
```

```ts
import { z } from "zod";

export const leadSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().max(80).optional(),
  status: z.string().max(80).optional(),
  score: z.string().max(20).optional(),
  category: z.string().max(80).optional(),
  linkedInUrl: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  painPoint: z.string().max(250).optional(),
  angle: z.string().max(250).optional(),
  suggestion: z.string().max(250).optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export const rewriteSchema = z.object({
  message: z.string().min(1).max(1000),
  instruction: z.string().min(1).max(300),
  lead: leadSchema.partial(),
});
```

Warum wichtig?

```txt
Schützt vor riesigen Prompts
Reduziert Kosten
Verhindert kaputte Eingaben
Macht Fehler im Frontend leichter sichtbar
```

---

## 11. Prompt-Strategie

Der Prompt sollte im Backend liegen und nicht vom Frontend frei übergeben werden.

Ziel:

```txt
Das Frontend sendet nur Lead-Daten.
Das Backend entscheidet, wie daraus ein Prompt wird.
```

### 11.1 System-/Instructions-Prompt

```txt
Du bist Moritz von Invessiv.
Erstelle eine kurze LinkedIn-Kontaktanfrage auf Deutsch.

Regeln:
- maximal 450 Zeichen
- freundlich, professionell, nicht salesy
- keine Emojis
- keine Betreffzeile
- keine Platzhalter
- schreibe aus Sicht von Moritz
- erwähne Invessiv natürlich
- beziehe dich konkret auf die Lead-Daten
- mache keine falschen Behauptungen
- Ergebnis ausschließlich als JSON im Format {"message":"..."}
```

### 11.2 Input-Prompt

```ts
function buildLeadInput(lead: LeadInput) {
  return JSON.stringify({
    lead: {
      firstName: lead.firstName,
      lastName: lead.lastName ?? "",
      category: lead.category ?? "",
      website: lead.website ?? "",
      painPoint: lead.painPoint ?? "",
      angle: lead.angle ?? "",
      suggestion: lead.suggestion ?? "",
      email: lead.email ?? "",
    },
    company: {
      name: "Invessiv",
      senderName: "Moritz",
      offer:
        "Websites, Landingpages und bessere Kontaktwege für Coaches, Berater und kleine Anbieter",
    },
  });
}
```

---

## 12. Structured Output

Nutze JSON Schema, damit du zuverlässig `{ "message": "..." }` bekommst.

```ts
const linkedinMessageFormat = {
  type: "json_schema",
  name: "linkedin_message",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      message: {
        type: "string",
      },
    },
    required: ["message"],
  },
} as const;
```

Vorteil:

```txt
Weniger Parsing-Probleme
Einfachere Frontend-Integration
Bessere Tests
Kein manuelles Extrahieren aus Fließtext
```

---

## 13. Beispiel: Next.js API Route für Erstellung

Datei:

```txt
app/api/ai/linkedin-message/route.ts
```

```ts
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { leadSchema } from "@/lib/ai/schemas";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sql = neon(process.env.DATABASE_URL!);

const MODEL = "gpt-5.4-nano";
const MONTHLY_REQUEST_LIMIT = 300;
const MONTHLY_COST_LIMIT_MICRO_EUR = 1_000_000;
const MAX_OUTPUT_TOKENS = 180;
const USD_TO_EUR = 0.8502;

const MODEL_PRICING = {
  "gpt-5.4-nano": {
    inputUsdPerMillion: 0.2,
    outputUsdPerMillion: 1.25,
  },
} as const;

function getPeriod() {
  return new Date().toISOString().slice(0, 7);
}

function calculateCostMicroEur(inputTokens: number, outputTokens: number) {
  const pricing = MODEL_PRICING[MODEL];
  const inputUsd = (inputTokens / 1_000_000) * pricing.inputUsdPerMillion;
  const outputUsd = (outputTokens / 1_000_000) * pricing.outputUsdPerMillion;
  const totalEur = (inputUsd + outputUsd) * USD_TO_EUR;

  return Math.ceil(totalEur * 1_000_000);
}

async function getOrCreateUsage(userId: string, period: string) {
  await sql`
    insert into ai_usage_limits (user_id, period)
    values (${userId}, ${period})
    on conflict (user_id, period) do nothing
  `;

  const rows = await sql`
    select *
    from ai_usage_limits
    where user_id = ${userId}
    and period = ${period}
    limit 1
  `;

  return rows[0];
}

export async function POST(req: Request) {
  try {
    const userId = "moritz";
    const period = getPeriod();

    const usage = await getOrCreateUsage(userId, period);

    if (usage.request_count >= MONTHLY_REQUEST_LIMIT) {
      return NextResponse.json(
        { error: "Monatliches Request-Limit erreicht." },
        { status: 429 },
      );
    }

    if (Number(usage.cost_micro_eur) >= MONTHLY_COST_LIMIT_MICRO_EUR) {
      return NextResponse.json(
        { error: "Monatliches Kostenlimit erreicht." },
        { status: 429 },
      );
    }

    const rawBody = await req.json();
    const lead = leadSchema.parse(rawBody);

    await sql`
      update ai_usage_limits
      set request_count = request_count + 1,
          updated_at = now()
      where user_id = ${userId}
      and period = ${period}
    `;

    const response = await openai.responses.create({
      model: MODEL,
      instructions: `
Du bist Moritz von Invessiv.
Erstelle eine kurze LinkedIn-Kontaktanfrage auf Deutsch.

Regeln:
- maximal 450 Zeichen
- freundlich, professionell, nicht salesy
- keine Emojis
- keine Betreffzeile
- keine Platzhalter
- schreibe aus Sicht von Moritz
- erwähne Invessiv natürlich
- beziehe dich konkret auf die Lead-Daten
- mache keine falschen Behauptungen
- Ergebnis ausschließlich als JSON im Format {"message":"..."}
`,
      input: JSON.stringify({
        lead,
        company: {
          name: "Invessiv",
          senderName: "Moritz",
          offer:
            "Websites, Landingpages und bessere Kontaktwege für Coaches, Berater und kleine Anbieter",
        },
      }),
      max_output_tokens: MAX_OUTPUT_TOKENS,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "linkedin_message",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              message: {
                type: "string",
              },
            },
            required: ["message"],
          },
        },
      },
    });

    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;
    const totalTokens = response.usage?.total_tokens ?? 0;
    const costMicroEur = calculateCostMicroEur(inputTokens, outputTokens);

    await sql`
      update ai_usage_limits
      set input_tokens = input_tokens + ${inputTokens},
          output_tokens = output_tokens + ${outputTokens},
          total_tokens = total_tokens + ${totalTokens},
          cost_micro_eur = cost_micro_eur + ${costMicroEur},
          updated_at = now()
      where user_id = ${userId}
      and period = ${period}
    `;

    const parsed = JSON.parse(response.output_text) as { message: string };

    return NextResponse.json({
      message: parsed.message,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        costEur: costMicroEur / 1_000_000,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "LinkedIn-Nachricht konnte nicht erstellt werden." },
      { status: 500 },
    );
  }
}
```

---

## 14. Beispiel: Korrektur-Endpoint

Datei:

```txt
app/api/ai/linkedin-message/rewrite/route.ts
```

Für den MVP kannst du denselben Usage-Limit-Code wiederverwenden und später in Helper auslagern.

Prompt für Korrektur:

```txt
Du bist Moritz von Invessiv.
Überarbeite die bestehende LinkedIn-Nachricht anhand der Anweisung.

Regeln:
- maximal 450 Zeichen
- freundlich, professionell, nicht salesy
- keine Emojis
- keine Betreffzeile
- keine Platzhalter
- bleibe inhaltlich bei den Lead-Daten
- mache keine neuen Behauptungen
- Ergebnis ausschließlich als JSON im Format {"message":"..."}
```

Input:

```ts
JSON.stringify({
  existingMessage: body.message,
  instruction: body.instruction,
  lead: body.lead,
});
```

---

## 15. Frontend-Aufruf

```ts
async function createLinkedInMessage(lead: unknown) {
  const response = await fetch("/api/ai/linkedin-message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(lead),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Nachricht konnte nicht erstellt werden.");
  }

  return data as {
    message: string;
    usage: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      costEur: number;
    };
  };
}
```

---

## 16. Usage-Dashboard

Endpoint:

```txt
GET /api/ai/usage
```

SQL:

```sql
select period,
       request_count,
       input_tokens,
       output_tokens,
       total_tokens,
       cost_micro_eur / 1000000.0 as cost_eur
from ai_usage_limits
where user_id = 'moritz'
order by period desc limit 12;
```

Frontend-Anzeige:

```txt
Monat: 2026-05
Requests: 48 / 300
Kosten: 0,006 € / 1,00 €
Input Tokens: 14.200
Output Tokens: 3.100
```

---

## 17. Security-Checkliste

Pflicht:

- `OPENAI_API_KEY` nur in `.env.local` und Vercel Environment Variables speichern
- OpenAI Call niemals aus dem Browser machen
- API-Route gegen unautorisierte Nutzung schützen
- Input-Felder begrenzen
- Output-Tokens begrenzen
- Usage-Limit vor jedem Request prüfen
- Request-Zähler vor dem OpenAI-Call erhöhen
- Kosten nach dem OpenAI-Call speichern
- Keine sensiblen Secrets loggen
- Keine kompletten API Responses in Production loggen

Auth-Möglichkeiten:

```txt
MVP privat: einfacher User-Check oder Admin-only
Später: Auth.js, Clerk oder eigenes Login
```

Minimaler Schutz für private Tools:

```txt
Nur eingeloggte User dürfen Endpoint nutzen.
Oder:
Interner API-Key im Header, wenn du es nur für dich nutzt.
```

---

## 18. Fehlerbehandlung

Empfohlene Statuscodes:

```txt
400 = ungültige Eingabe
401 = nicht eingeloggt
403 = keine Berechtigung
429 = Monatslimit erreicht
500 = unerwarteter Serverfehler
```

Beispiel-Fehler:

```json
{
  "error": "Monatliches Request-Limit erreicht."
}
```

Wichtig:

```txt
Dem Frontend immer eine klare Fehlermeldung geben.
Intern genauer loggen, dem User aber keine technischen Details zeigen.
```

---

## 19. Rate Limiting zusätzlich zum Monatslimit

Monatslimit schützt Kosten. Rate Limit schützt gegen Spam oder Loops.

Empfehlung:

```txt
Max 10 Requests pro Minute pro User
Max 50 Requests pro Stunde pro User
Max 300 Requests pro Monat pro User
```

Für den Start kann das Monatslimit reichen. Bei öffentlichem Tool solltest du zusätzlich Rate Limiting einbauen.

Mögliche Tools:

```txt
Upstash Redis
Vercel KV
Neon Postgres mit Zeitfenster-Tabelle
```

---

## 20. Prompt-Qualität testen

Lege 10 bis 20 Test-Leads an:

```txt
Coach
Berater
Handwerker
B2B-Dienstleister
lokaler Anbieter
schlechte Website
keine Website
Gmail-Adresse
unklarer Kontaktweg
starkes Angebot
```

Für jeden Test prüfen:

```txt
Ist die Nachricht unter 450 Zeichen?
Klingt sie menschlich?
Ist sie nicht zu salesy?
Wird Invessiv natürlich erwähnt?
Ist ein klarer Bezug zum Lead vorhanden?
Werden keine falschen Behauptungen gemacht?
Ist die Frage am Ende leicht zu beantworten?
```

Bewertungsskala:

```txt
1 = schlecht
2 = brauchbar
3 = gut
4 = sehr gut
5 = direkt nutzbar
```

Wenn `gpt-5.4-nano` oft unter 4 liegt, auf `gpt-5.4-mini` wechseln.

---

## 21. Speicherung generierter Nachrichten

Optional, aber sinnvoll:

```sql
create table ai_generated_messages
(
    id         uuid primary key   default gen_random_uuid(),
    user_id    text      not null,
    lead_id    text,
    type       text      not null,
    input      jsonb     not null,
    message    text      not null,
    model      text      not null,
    created_at timestamp not null default now()
);
```

Nutzen:

```txt
Du kannst alte Messages nachvollziehen.
Du kannst bessere Prompts anhand echter Beispiele verbessern.
Du kannst später A/B-Tests machen.
```

Achte darauf, keine unnötig sensiblen personenbezogenen Daten dauerhaft zu speichern.

---

## 22. Datenschutz und DSGVO

Da du Lead-Daten verarbeitest, solltest du sparsam speichern.

Empfehlung:

```txt
Nur speichern, was du wirklich brauchst.
Keine unnötigen personenbezogenen Daten in Logs.
Keine kompletten LinkedIn-Profile speichern, wenn nicht nötig.
Generierte Nachricht und Lead-ID reichen oft aus.
```

Für deinen Use Case:

```txt
Vorname: nötig
Kategorie: sinnvoll
Website: sinnvoll
Pain Point: sinnvoll
LinkedIn URL: optional
E-Mail: für LinkedIn-Text meist nicht nötig
```

In den Prompt sollte nur, was zur Nachricht beiträgt.

---

## 23. Empfohlene Ordnerstruktur

```txt
src/
  app/
    api/
      ai/
        linkedin-message/
          route.ts
        linkedin-message/
          rewrite/
            route.ts
        usage/
          route.ts
  lib/
    ai/
      client.ts
      pricing.ts
      prompts.ts
      schemas.ts
      usage.ts
      formats.ts
    db/
      neon.ts
```

---

## 24. Environment Variables

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.4-nano
DATABASE_URL=postgres://...
AI_MONTHLY_REQUEST_LIMIT=300
AI_MONTHLY_COST_LIMIT_MICRO_EUR=1000000
AI_MAX_OUTPUT_TOKENS=180
USD_TO_EUR=0.8502
```

---

## 25. Umsetzungsschritte

### Schritt 1: OpenAI Projekt vorbereiten

- OpenAI Projekt für Invessiv erstellen
- API Key erzeugen
- Projektbudget setzen, z. B. 5 €
- Key in Vercel Environment Variables speichern

### Schritt 2: Datenbank vorbereiten

- Neon DB erstellen
- Tabelle `ai_usage_limits` anlegen
- Optional `ai_usage_events` anlegen
- `DATABASE_URL` in `.env.local` und Vercel setzen

### Schritt 3: Backend-Grundlage

- `openai`, `zod`, `@neondatabase/serverless` installieren
- OpenAI Client erstellen
- Zod Schema erstellen
- Pricing Helper erstellen
- Usage Helper erstellen

### Schritt 4: Erstellung-Endpoint

- `POST /api/ai/linkedin-message` bauen
- Input validieren
- Usage prüfen
- OpenAI Call ausführen
- JSON parsen
- Usage speichern
- Message zurückgeben

### Schritt 5: Korrektur-Endpoint

- `POST /api/ai/linkedin-message/rewrite` bauen
- bestehende Message und Korrekturanweisung validieren
- gleiches Usage Tracking verwenden
- überarbeitete Message zurückgeben

### Schritt 6: Frontend anbinden

- Button „Nachricht generieren“
- Loading State
- Fehleranzeige
- Textarea mit Ergebnis
- Button „Korrigieren“
- Anzeige der geschätzten Kosten optional

### Schritt 7: Testing

- 10 bis 20 Beispiel-Leads testen
- Ergebnisqualität bewerten
- Tokenverbrauch prüfen
- Limit-Verhalten testen
- Fehlerfälle testen

### Schritt 8: Deployment

- Vercel Environment Variables setzen
- Neon Connection testen
- OpenAI API Call in Production testen
- Usage nach erstem Request prüfen
- Budget im OpenAI Dashboard kontrollieren

---

## 26. MVP-Abnahmekriterien

Der MVP ist fertig, wenn:

- Lead-Daten im Frontend eingegeben oder ausgewählt werden können
- Backend eine LinkedIn-Message erzeugt
- Antwort zuverlässig als JSON kommt
- Usage in Neon gespeichert wird
- Monatslimit funktioniert
- Kostenlimit funktioniert
- API Key nicht im Frontend sichtbar ist
- Korrektur-Endpoint funktioniert
- Fehler sauber im Frontend angezeigt werden

---

## 27. Spätere Verbesserungen

Sinnvolle Erweiterungen nach dem MVP:

- Prompt-Versionen speichern
- A/B-Test verschiedener Prompts
- Favoriten-System für gute Messages
- Export nach CSV
- Lead-Historie mit generierten Nachrichten
- Kosten-Dashboard
- Admin-Panel für Limits
- Automatische Qualitätsbewertung
- Template-Auswahl nach Branche
- Unterschiedliche Tonalitäten
- Integration mit CRM oder Lead-Tabelle

---

## 28. Wichtigste Entscheidungen

Empfohlene Entscheidung für Start:

```txt
Modell: gpt-5.4-nano
Backend: Next.js API Route
DB: Neon Postgres
Usage-Limit: 300 Requests pro Monat
Kostenlimit: 1 € pro Monat intern
OpenAI Budget: 5 € pro Monat
Output-Limit: 180 Tokens
Output-Format: JSON Schema
```

Warum diese Kombination?

```txt
Sehr geringe Kosten
Schnell umzusetzen
Gute Kontrolle
Einfach zu erweitern
Für 200 Requests pro Monat komplett ausreichend
```

---

## 29. Quellen

OpenAI Node SDK:

```txt
https://github.com/openai/openai-node
```

OpenAI Pricing:

```txt
https://developers.openai.com/api/docs/pricing
```

ECB EUR/USD Referenzkurs:

```txt
https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-usd.en.html
```
