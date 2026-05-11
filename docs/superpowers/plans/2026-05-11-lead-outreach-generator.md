# Lead Outreach Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Nachricht generieren" dialog to the Lead Detail Panel that generates personalized outreach messages (LinkedIn / Instagram / WhatsApp) using a local Ollama model with automatic OpenAI fallback.

**Architecture:** A new `outreach` domain is added server-side (`src/server/workspace/outreach/`) with a prompt service, an AI service (Ollama-first via OpenAI SDK, auto-fallback), and a command handler. Two new API routes (`POST /generate`, `GET /providers`) serve a new client component `LeadOutreachDialog` embedded in the existing `LeadDetailPanel`.

**Tech Stack:** Next.js App Router (App Router server/client split), `openai` npm SDK (used for both Ollama and OpenAI endpoints), Zod, Vitest, Tailwind CSS via CSS Modules.

---

## File Map

| File                                                                                                | Action | Responsibility                                                |
| --------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------- |
| `src/common/constants/outreach/outreach-channels.ts`                                                | Create | `OutreachChannel` const + type + VALUES                       |
| `src/common/constants/outreach/outreach-providers.ts`                                               | Create | `OutreachProvider` const + type + VALUES                      |
| `src/common/constants/outreach/outreach-error-codes.ts`                                             | Create | `OutreachErrorCode` const + type                              |
| `src/common/contracts/outreach/generate-outreach-request.dto.ts`                                    | Create | Request DTO interface                                         |
| `src/common/contracts/outreach/outreach-providers-result.dto.ts`                                    | Create | Providers check result interface                              |
| `src/common/contracts/outreach/generate-outreach-result.dto.ts`                                     | Create | Command handler result union type                             |
| `src/server/workspace/outreach/services/generate-outreach/generate-outreach-request.schema.ts`      | Create | Zod validation schema                                         |
| `src/server/workspace/outreach/services/generate-outreach/generate-outreach-request.schema.test.ts` | Create | Schema unit tests                                             |
| `src/server/workspace/outreach/services/outreach-prompt-service.ts`                                 | Create | System + user prompt builder                                  |
| `src/server/workspace/outreach/services/outreach-ai-service.ts`                                     | Create | Ollama-first AI provider, OpenAI fallback, availability check |
| `src/server/workspace/outreach/command-handler/generate-outreach-command-handler.ts`                | Create | Orchestrates: DB fetch → prompt → AI → result                 |
| `src/lib/workspace/outreach/outreach-api-error.ts`                                                  | Create | Error response helper (analog to lead-api-error.ts)           |
| `src/app/api/workspace/outreach/providers/route.ts`                                                 | Create | GET: Ollama ping + OpenAI key check                           |
| `src/app/api/workspace/outreach/generate/route.ts`                                                  | Create | POST: auth + schema validate → command handler                |
| `src/i18n/dictionaries/workspace/leads/detail/de.json`                                              | Modify | Add `outreach` key block                                      |
| `src/i18n/dictionaries/workspace/leads/detail/en.json`                                              | Modify | Add `outreach` key block (English)                            |
| `src/components/workspace/leads/detail/lead-outreach-dialog/lead-outreach-dialog.tsx`               | Create | Client component — all 4 dialog states                        |
| `src/components/workspace/leads/detail/lead-outreach-dialog/lead-outreach-dialog.module.css`        | Create | Dialog styles                                                 |
| `src/components/workspace/leads/detail/lead-detail-panel/lead-detail-panel.tsx`                     | Modify | Add button + dialog mount                                     |
| `src/server/tests/workspace/outreach/services/outreach-prompt-service.test.ts`                      | Create | Prompt service unit tests                                     |
| `src/server/tests/workspace/outreach/services/outreach-ai-service.test.ts`                          | Create | AI service unit tests (mocked)                                |
| `src/server/tests/workspace/outreach/command-handler/generate-outreach-command-handler.test.ts`     | Create | Command handler unit tests (mocked)                           |

---

## Task 1: Install openai package + document env variables

**Files:**

- Modify: `package.json` (via npm install)
- Document: `.env.local` additions (not committed)

- [ ] **Step 1: Install the openai npm package**

```bash
npm install openai
```

Expected: `package.json` and `package-lock.json` updated, `node_modules/openai` present.

- [ ] **Step 2: Add env variables to `.env.local`**

Add these lines to `.env.local` (create if missing, never commit this file):

```
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral
# OPENAI_API_KEY=sk-...    # optional: enables cloud fallback
# OPENAI_MODEL=gpt-4o-mini # optional: defaults to gpt-4o-mini
```

- [ ] **Step 3: Verify Ollama is installed locally (optional for dev)**

```bash
ollama --version
ollama list
```

If not installed: https://ollama.ai — then run `ollama pull mistral`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add openai package for lead outreach generation"
```

---

## Task 2: Constants — OutreachChannel, OutreachProvider, OutreachErrorCode

**Files:**

- Create: `src/common/constants/outreach/outreach-channels.ts`
- Create: `src/common/constants/outreach/outreach-providers.ts`
- Create: `src/common/constants/outreach/outreach-error-codes.ts`

No tests needed — constants are pure data with no logic.

- [ ] **Step 1: Create `outreach-channels.ts`**

```ts
// src/common/constants/outreach/outreach-channels.ts
export const OutreachChannel = {
  Linkedin: "linkedin",
  Instagram: "instagram",
  Whatsapp: "whatsapp",
} as const;

export type OutreachChannel =
  (typeof OutreachChannel)[keyof typeof OutreachChannel];

export const OUTREACH_CHANNEL_VALUES = [
  OutreachChannel.Linkedin,
  OutreachChannel.Instagram,
  OutreachChannel.Whatsapp,
] as const;
```

- [ ] **Step 2: Create `outreach-providers.ts`**

```ts
// src/common/constants/outreach/outreach-providers.ts
export const OutreachProvider = {
  Ollama: "ollama",
  OpenAi: "openai",
} as const;

export type OutreachProvider =
  (typeof OutreachProvider)[keyof typeof OutreachProvider];

export const OUTREACH_PROVIDER_VALUES = [
  OutreachProvider.Ollama,
  OutreachProvider.OpenAi,
] as const;
```

- [ ] **Step 3: Create `outreach-error-codes.ts`**

```ts
// src/common/constants/outreach/outreach-error-codes.ts
export const OutreachErrorCode = {
  LeadNotFound: "LEAD_NOT_FOUND",
  ValidationError: "VALIDATION_ERROR",
  ProviderUnavailable: "PROVIDER_UNAVAILABLE",
  Internal: "INTERNAL",
} as const;

export type OutreachErrorCode =
  (typeof OutreachErrorCode)[keyof typeof OutreachErrorCode];
```

- [ ] **Step 4: Commit**

```bash
git add src/common/constants/outreach/
git commit -m "feat(outreach): add OutreachChannel, OutreachProvider, OutreachErrorCode constants"
```

---

## Task 3: DTOs — contracts for request, providers result, and command result

**Files:**

- Create: `src/common/contracts/outreach/generate-outreach-request.dto.ts`
- Create: `src/common/contracts/outreach/outreach-providers-result.dto.ts`
- Create: `src/common/contracts/outreach/generate-outreach-result.dto.ts`

No tests needed — pure TypeScript interfaces.

- [ ] **Step 1: Create `generate-outreach-request.dto.ts`**

```ts
// src/common/contracts/outreach/generate-outreach-request.dto.ts
import type { OutreachChannel } from "@/common/constants/outreach/outreach-channels";
import type { OutreachProvider } from "@/common/constants/outreach/outreach-providers";

export interface GenerateOutreachRequestDto {
  leadId: string;
  channel: OutreachChannel;
  provider: OutreachProvider;
  includeImprovements: boolean;
  contextNote?: string;
}
```

- [ ] **Step 2: Create `outreach-providers-result.dto.ts`**

```ts
// src/common/contracts/outreach/outreach-providers-result.dto.ts
export interface OutreachProvidersResultDto {
  ollama: boolean;
  openai: boolean;
}
```

- [ ] **Step 3: Create `generate-outreach-result.dto.ts`**

```ts
// src/common/contracts/outreach/generate-outreach-result.dto.ts
import type { OutreachErrorCode } from "@/common/constants/outreach/outreach-error-codes";

export type GenerateOutreachResultDto =
  | { ok: true; message: string }
  | { ok: false; code: OutreachErrorCode };
```

- [ ] **Step 4: Commit**

```bash
git add src/common/contracts/outreach/
git commit -m "feat(outreach): add outreach DTO contracts"
```

---

## Task 4: Zod Schema (TDD)

**Files:**

- Create: `src/server/workspace/outreach/services/generate-outreach/generate-outreach-request.schema.ts`
- Create: `src/server/workspace/outreach/services/generate-outreach/generate-outreach-request.schema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/server/workspace/outreach/services/generate-outreach/generate-outreach-request.schema.test.ts
import { describe, expect, it } from "vitest";
import { generateOutreachRequestSchema } from "./generate-outreach-request.schema";

const validBase = {
  leadId: "abc-123",
  channel: "linkedin",
  provider: "ollama",
  includeImprovements: true,
};

describe("generateOutreachRequestSchema", () => {
  it("accepts valid input without contextNote", () => {
    expect(generateOutreachRequestSchema.safeParse(validBase).success).toBe(
      true,
    );
  });

  it("accepts valid input with contextNote within 200 chars", () => {
    const result = generateOutreachRequestSchema.safeParse({
      ...validBase,
      contextNote: "Hat gerade Rebranding gemacht",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing leadId", () => {
    const { leadId: _, ...rest } = validBase;
    expect(generateOutreachRequestSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects invalid channel", () => {
    expect(
      generateOutreachRequestSchema.safeParse({
        ...validBase,
        channel: "telegram",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid provider", () => {
    expect(
      generateOutreachRequestSchema.safeParse({
        ...validBase,
        provider: "anthropic",
      }).success,
    ).toBe(false);
  });

  it("rejects contextNote over 200 chars", () => {
    expect(
      generateOutreachRequestSchema.safeParse({
        ...validBase,
        contextNote: "a".repeat(201),
      }).success,
    ).toBe(false);
  });

  it("rejects non-boolean includeImprovements", () => {
    expect(
      generateOutreachRequestSchema.safeParse({
        ...validBase,
        includeImprovements: "yes",
      }).success,
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test -- --run generate-outreach-request.schema
```

Expected: FAIL — `generateOutreachRequestSchema` not found.

- [ ] **Step 3: Implement the schema**

```ts
// src/server/workspace/outreach/services/generate-outreach/generate-outreach-request.schema.ts
import { z } from "zod";
import { OUTREACH_CHANNEL_VALUES } from "@/common/constants/outreach/outreach-channels";
import { OUTREACH_PROVIDER_VALUES } from "@/common/constants/outreach/outreach-providers";

export const generateOutreachRequestSchema = z.object({
  leadId: z.string().min(1),
  channel: z.enum(OUTREACH_CHANNEL_VALUES),
  provider: z.enum(OUTREACH_PROVIDER_VALUES),
  includeImprovements: z.boolean(),
  contextNote: z.string().max(200).optional(),
});

export type GenerateOutreachRequestInput = z.infer<
  typeof generateOutreachRequestSchema
>;
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm run test -- --run generate-outreach-request.schema
```

Expected: PASS — all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/server/workspace/outreach/
git commit -m "feat(outreach): add Zod validation schema for generate-outreach request"
```

---

## Task 5: Prompt Service (TDD)

**Files:**

- Create: `src/server/workspace/outreach/services/outreach-prompt-service.ts`
- Create: `src/server/tests/workspace/outreach/services/outreach-prompt-service.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/server/tests/workspace/outreach/services/outreach-prompt-service.test.ts
import { describe, expect, it } from "vitest";
import { outreachPromptService } from "@/server/workspace/outreach/services/outreach-prompt-service";
import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";

const mockLead: LeadDetailDto = {
  id: "lead-1",
  firstName: "Susan",
  lastName: "Müller",
  companyName: "Müller GmbH",
  email: "susan@mueller-gmbh.de",
  phone: "+49 123 456789",
  websiteUrl: "https://mueller-gmbh.de",
  score: 80,
  source: "manual",
  leadStatus: "new",
  owner: "Moritz",
  notes: "Interessiert an UX-Audit",
  improvements: ["Kein klarer CTA", "Fehlende Kontaktseite"],
  externalGuid: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  category: { id: "1", labelKey: "ecommerce" },
  socialProfiles: [],
  activities: [],
  submissions: [],
};

describe("outreachPromptService.buildSystemPrompt", () => {
  it("contains owner name", () => {
    const prompt = outreachPromptService.buildSystemPrompt(
      "linkedin",
      "Moritz",
    );
    expect(prompt).toContain("Moritz");
  });

  it("contains LinkedIn channel label", () => {
    const prompt = outreachPromptService.buildSystemPrompt(
      "linkedin",
      "Moritz",
    );
    expect(prompt).toContain("LinkedIn");
  });

  it("contains max 300 chars limit for linkedin", () => {
    const prompt = outreachPromptService.buildSystemPrompt(
      "linkedin",
      "Moritz",
    );
    expect(prompt).toContain("300");
  });

  it("contains max 500 chars limit for instagram", () => {
    const prompt = outreachPromptService.buildSystemPrompt(
      "instagram",
      "Moritz",
    );
    expect(prompt).toContain("500");
  });

  it("contains max 160 chars limit for whatsapp", () => {
    const prompt = outreachPromptService.buildSystemPrompt(
      "whatsapp",
      "Moritz",
    );
    expect(prompt).toContain("160");
  });

  it("uses Viele Grüße for linkedin", () => {
    const prompt = outreachPromptService.buildSystemPrompt(
      "linkedin",
      "Moritz",
    );
    expect(prompt).toContain("Viele Grüße");
  });

  it("uses Liebe Grüße for instagram", () => {
    const prompt = outreachPromptService.buildSystemPrompt(
      "instagram",
      "Moritz",
    );
    expect(prompt).toContain("Liebe Grüße");
  });

  it("does not include closing greeting for whatsapp", () => {
    const prompt = outreachPromptService.buildSystemPrompt(
      "whatsapp",
      "Moritz",
    );
    expect(prompt).not.toContain("Viele Grüße");
    expect(prompt).not.toContain("Liebe Grüße");
  });
});

describe("outreachPromptService.buildUserPrompt", () => {
  it("includes firstName", () => {
    const prompt = outreachPromptService.buildUserPrompt(mockLead, {
      includeImprovements: false,
    });
    expect(prompt).toContain("Susan");
  });

  it("includes companyName", () => {
    const prompt = outreachPromptService.buildUserPrompt(mockLead, {
      includeImprovements: false,
    });
    expect(prompt).toContain("Müller GmbH");
  });

  it("includes websiteUrl", () => {
    const prompt = outreachPromptService.buildUserPrompt(mockLead, {
      includeImprovements: false,
    });
    expect(prompt).toContain("https://mueller-gmbh.de");
  });

  it("never includes email address (DSGVO)", () => {
    const prompt = outreachPromptService.buildUserPrompt(mockLead, {
      includeImprovements: true,
      contextNote: "extra context",
    });
    expect(prompt).not.toContain("susan@mueller-gmbh.de");
  });

  it("never includes phone number (DSGVO)", () => {
    const prompt = outreachPromptService.buildUserPrompt(mockLead, {
      includeImprovements: true,
    });
    expect(prompt).not.toContain("+49 123 456789");
  });

  it("includes improvements when toggle is true", () => {
    const prompt = outreachPromptService.buildUserPrompt(mockLead, {
      includeImprovements: true,
    });
    expect(prompt).toContain("Kein klarer CTA");
    expect(prompt).toContain("Fehlende Kontaktseite");
  });

  it("excludes improvements when toggle is false", () => {
    const prompt = outreachPromptService.buildUserPrompt(mockLead, {
      includeImprovements: false,
    });
    expect(prompt).not.toContain("Kein klarer CTA");
  });

  it("includes contextNote when provided", () => {
    const prompt = outreachPromptService.buildUserPrompt(mockLead, {
      includeImprovements: false,
      contextNote: "Hat gerade Rebranding gemacht",
    });
    expect(prompt).toContain("Hat gerade Rebranding gemacht");
  });

  it("omits contextNote section when not provided", () => {
    const prompt = outreachPromptService.buildUserPrompt(mockLead, {
      includeImprovements: false,
    });
    expect(prompt).not.toContain("Zusätzlicher Kontext");
  });

  it("includes notes when present on lead", () => {
    const prompt = outreachPromptService.buildUserPrompt(mockLead, {
      includeImprovements: false,
    });
    expect(prompt).toContain("Interessiert an UX-Audit");
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test -- --run outreach-prompt-service
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the prompt service**

```ts
// src/server/workspace/outreach/services/outreach-prompt-service.ts
import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";
import type { OutreachChannel } from "@/common/constants/outreach/outreach-channels";

const MAX_CHARS: Record<OutreachChannel, number> = {
  linkedin: 300,
  instagram: 500,
  whatsapp: 160,
};

const CHANNEL_LABEL: Record<OutreachChannel, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
};

const CLOSING_GREETING: Record<OutreachChannel, string> = {
  linkedin: "Viele Grüße",
  instagram: "Liebe Grüße",
  whatsapp: "",
};

export type PromptOptions = {
  includeImprovements: boolean;
  contextNote?: string;
};

function buildClosingInstruction(
  channel: OutreachChannel,
  owner: string,
): string {
  const greeting = CLOSING_GREETING[channel];
  if (!greeting) return `"${owner} von Invessiv"`;
  return `"${greeting}, ${owner} von Invessiv"`;
}

export const outreachPromptService = {
  buildSystemPrompt(channel: OutreachChannel, owner: string): string {
    const maxChars = MAX_CHARS[channel];
    const channelLabel = CHANNEL_LABEL[channel];
    const closingInstruction = buildClosingInstruction(channel, owner);

    return `Du bist ${owner} von Invessiv, einer Full-Service-Digitalagentur.

Schreibe eine kurze, professionelle Erstkontakt-Nachricht auf Deutsch für ${channelLabel}.

Die Nachricht soll exakt dieser Struktur folgen:
1. Persönliche Anrede mit Vornamen: "Hallo {firstName},"
2. Kurze Vorstellung: "ich bin ${owner} von Invessiv"
3. Website-Referenz: erwähne, dass du gerade die Website gesehen hast
4. Dezenter Werthinweis: sage, dass dir ein paar kleine Punkte aufgefallen sind, die es Besuchern eventuell schwerer machen könnten, den nächsten Schritt zur Anfrage zu finden
5. Weicher CTA: frage, ob es okay wäre, diese Punkte kurz zu schicken
6. Grußformel: ${closingInstruction}

Tonalität:
professionell-persönlich, ruhig, unaufdringlich, kein Sales-Blabla.

Vermeide:
Emojis, Ausrufezeichen, Marketing-Floskeln, Fachbegriffe wie Conversion, Funnel, SEO, Leadgenerierung, Audit oder Optimierung.

Maximale Länge: ${maxChars} Zeichen.

Ausgabe:
Nur den fertigen Nachrichtentext. Keine Erklärung. Kein Prefix. Keine Varianten.`;
  },

  buildUserPrompt(lead: LeadDetailDto, options: PromptOptions): string {
    const parts: string[] = [];

    if (lead.firstName) parts.push(`Vorname: ${lead.firstName}`);
    if (lead.companyName) parts.push(`Firma: ${lead.companyName}`);
    if (lead.websiteUrl) parts.push(`Website: ${lead.websiteUrl}`);
    if (lead.category?.labelKey)
      parts.push(`Kategorie: ${lead.category.labelKey}`);

    if (options.includeImprovements && lead.improvements?.length) {
      parts.push(`Verbesserungshinweise: ${lead.improvements.join(", ")}`);
    }

    if (lead.notes) parts.push(`Notizen: ${lead.notes}`);

    if (options.contextNote) {
      parts.push(`Zusätzlicher Kontext: ${options.contextNote}`);
    }

    return parts.join("\n");
  },
};
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm run test -- --run outreach-prompt-service
```

Expected: PASS — all 16 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/server/workspace/outreach/services/outreach-prompt-service.ts src/server/tests/workspace/outreach/services/outreach-prompt-service.test.ts
git commit -m "feat(outreach): add outreach prompt service with tests"
```

---

## Task 6: AI Service (TDD)

**Files:**

- Create: `src/server/workspace/outreach/services/outreach-ai-service.ts`
- Create: `src/server/tests/workspace/outreach/services/outreach-ai-service.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/server/tests/workspace/outreach/services/outreach-ai-service.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockCreate = vi.fn();

vi.mock("openai", () => ({
  default: vi.fn(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}));

// Import AFTER mocks are set up
const { outreachAiService } =
  await import("@/server/workspace/outreach/services/outreach-ai-service");

const successResponse = (text: string) => ({
  choices: [{ message: { content: text } }],
});

describe("outreachAiService.generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OLLAMA_BASE_URL = "http://localhost:11434";
    process.env.OLLAMA_MODEL = "mistral";
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it("returns message from Ollama when provider is ollama and call succeeds", async () => {
    mockCreate.mockResolvedValueOnce(successResponse("Hallo Susan von Ollama"));

    const result = await outreachAiService.generate("ollama", "system", "user");

    expect(result).toBe("Hallo Susan von Ollama");
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("falls back to OpenAI when Ollama throws and OPENAI_API_KEY is set", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    mockCreate
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockResolvedValueOnce(successResponse("Hallo Susan von OpenAI"));

    const result = await outreachAiService.generate("ollama", "system", "user");

    expect(result).toBe("Hallo Susan von OpenAI");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("throws PROVIDER_UNAVAILABLE when Ollama fails and no OPENAI_API_KEY", async () => {
    mockCreate.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    await expect(
      outreachAiService.generate("ollama", "system", "user"),
    ).rejects.toThrow("PROVIDER_UNAVAILABLE");
  });

  it("uses OpenAI directly when provider is openai", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    mockCreate.mockResolvedValueOnce(successResponse("Hallo Susan via OpenAI"));

    const result = await outreachAiService.generate("openai", "system", "user");

    expect(result).toBe("Hallo Susan via OpenAI");
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("throws PROVIDER_UNAVAILABLE when openai provider selected but no API key", async () => {
    await expect(
      outreachAiService.generate("openai", "system", "user"),
    ).rejects.toThrow("PROVIDER_UNAVAILABLE");
  });
});

describe("outreachAiService.checkAvailability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  it("returns ollama: true when Ollama endpoint responds ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

    const result = await outreachAiService.checkAvailability();

    expect(result.ollama).toBe(true);
  });

  it("returns ollama: false when Ollama endpoint is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    );

    const result = await outreachAiService.checkAvailability();

    expect(result.ollama).toBe(false);
  });

  it("returns openai: true when OPENAI_API_KEY is set", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    const result = await outreachAiService.checkAvailability();

    expect(result.openai).toBe(true);
  });

  it("returns openai: false when OPENAI_API_KEY is absent", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    const result = await outreachAiService.checkAvailability();

    expect(result.openai).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test -- --run outreach-ai-service
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the AI service**

```ts
// src/server/workspace/outreach/services/outreach-ai-service.ts
import "server-only";

import OpenAI from "openai";
import type { OutreachProvider } from "@/common/constants/outreach/outreach-providers";
import type { OutreachProvidersResultDto } from "@/common/contracts/outreach/outreach-providers-result.dto";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "mistral";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function getOllamaClient(): OpenAI {
  return new OpenAI({
    baseURL: `${OLLAMA_BASE_URL}/v1`,
    apiKey: "ollama",
  });
}

function getOpenAiClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function callModel(
  client: OpenAI,
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content ?? "";
}

async function isOllamaReachable(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const outreachAiService = {
  async generate(
    provider: OutreachProvider,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    if (provider === "ollama") {
      try {
        return await callModel(
          getOllamaClient(),
          OLLAMA_MODEL,
          systemPrompt,
          userPrompt,
        );
      } catch {
        const openai = getOpenAiClient();
        if (!openai) throw new Error("PROVIDER_UNAVAILABLE");
        return await callModel(openai, OPENAI_MODEL, systemPrompt, userPrompt);
      }
    }

    const openai = getOpenAiClient();
    if (!openai) throw new Error("PROVIDER_UNAVAILABLE");
    return await callModel(openai, OPENAI_MODEL, systemPrompt, userPrompt);
  },

  async checkAvailability(): Promise<OutreachProvidersResultDto> {
    const [ollama, openai] = await Promise.all([
      isOllamaReachable(),
      Promise.resolve(Boolean(process.env.OPENAI_API_KEY)),
    ]);
    return { ollama, openai };
  },
};
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm run test -- --run outreach-ai-service
```

Expected: PASS — all 9 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/server/workspace/outreach/services/outreach-ai-service.ts src/server/tests/workspace/outreach/services/outreach-ai-service.test.ts
git commit -m "feat(outreach): add AI service with Ollama-first and OpenAI fallback"
```

---

## Task 7: Command Handler (TDD)

**Files:**

- Create: `src/server/workspace/outreach/command-handler/generate-outreach-command-handler.ts`
- Create: `src/server/tests/workspace/outreach/command-handler/generate-outreach-command-handler.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/server/tests/workspace/outreach/command-handler/generate-outreach-command-handler.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler",
  () => ({
    getLeadById: vi.fn(),
  }),
);

vi.mock("@/server/workspace/outreach/services/outreach-prompt-service", () => ({
  outreachPromptService: {
    buildSystemPrompt: vi.fn().mockReturnValue("system-prompt"),
    buildUserPrompt: vi.fn().mockReturnValue("user-prompt"),
  },
}));

vi.mock("@/server/workspace/outreach/services/outreach-ai-service", () => ({
  outreachAiService: {
    generate: vi.fn(),
  },
}));

import { getLeadById } from "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler";
import { outreachAiService } from "@/server/workspace/outreach/services/outreach-ai-service";
import { generateOutreachCommandHandler } from "@/server/workspace/outreach/command-handler/generate-outreach-command-handler";
import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";

const mockLead: LeadDetailDto = {
  id: "lead-1",
  firstName: "Susan",
  lastName: null,
  companyName: "Müller GmbH",
  email: "susan@test.de",
  phone: null,
  websiteUrl: "https://mueller-gmbh.de",
  score: null,
  source: "manual",
  leadStatus: "new",
  owner: "Moritz",
  notes: null,
  improvements: ["Kein CTA"],
  externalGuid: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  category: null,
  socialProfiles: [],
  activities: [],
  submissions: [],
};

describe("generateOutreachCommandHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok: false with LeadNotFound when lead does not exist", async () => {
    vi.mocked(getLeadById).mockResolvedValue(null);

    const result = await generateOutreachCommandHandler({
      leadId: "missing",
      channel: "linkedin",
      provider: "ollama",
      includeImprovements: false,
    });

    expect(result).toEqual({ ok: false, code: "LEAD_NOT_FOUND" });
  });

  it("returns ok: true with generated message on success", async () => {
    vi.mocked(getLeadById).mockResolvedValue(mockLead);
    vi.mocked(outreachAiService.generate).mockResolvedValue("Hallo Susan, ...");

    const result = await generateOutreachCommandHandler({
      leadId: "lead-1",
      channel: "linkedin",
      provider: "ollama",
      includeImprovements: false,
    });

    expect(result).toEqual({ ok: true, message: "Hallo Susan, ..." });
  });

  it("uses lead.owner for prompt; falls back to 'Moritz' when owner is null", async () => {
    const leadNoOwner = { ...mockLead, owner: null };
    vi.mocked(getLeadById).mockResolvedValue(leadNoOwner);
    vi.mocked(outreachAiService.generate).mockResolvedValue("msg");

    const { outreachPromptService } =
      await import("@/server/workspace/outreach/services/outreach-prompt-service");

    await generateOutreachCommandHandler({
      leadId: "lead-1",
      channel: "linkedin",
      provider: "ollama",
      includeImprovements: false,
    });

    expect(outreachPromptService.buildSystemPrompt).toHaveBeenCalledWith(
      "linkedin",
      "Moritz",
    );
  });

  it("returns ok: false with ProviderUnavailable when AI service throws", async () => {
    vi.mocked(getLeadById).mockResolvedValue(mockLead);
    vi.mocked(outreachAiService.generate).mockRejectedValue(
      new Error("PROVIDER_UNAVAILABLE"),
    );

    const result = await generateOutreachCommandHandler({
      leadId: "lead-1",
      channel: "linkedin",
      provider: "ollama",
      includeImprovements: false,
    });

    expect(result).toEqual({ ok: false, code: "PROVIDER_UNAVAILABLE" });
  });

  it("returns ok: false with Internal on unexpected error", async () => {
    vi.mocked(getLeadById).mockResolvedValue(mockLead);
    vi.mocked(outreachAiService.generate).mockRejectedValue(
      new Error("Unexpected"),
    );

    const result = await generateOutreachCommandHandler({
      leadId: "lead-1",
      channel: "linkedin",
      provider: "ollama",
      includeImprovements: false,
    });

    expect(result).toEqual({ ok: false, code: "INTERNAL" });
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test -- --run generate-outreach-command-handler
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the command handler**

```ts
// src/server/workspace/outreach/command-handler/generate-outreach-command-handler.ts
import "server-only";

import { OutreachErrorCode } from "@/common/constants/outreach/outreach-error-codes";
import type { GenerateOutreachRequestDto } from "@/common/contracts/outreach/generate-outreach-request.dto";
import type { GenerateOutreachResultDto } from "@/common/contracts/outreach/generate-outreach-result.dto";
import { getLeadById } from "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler";
import { outreachAiService } from "@/server/workspace/outreach/services/outreach-ai-service";
import { outreachPromptService } from "@/server/workspace/outreach/services/outreach-prompt-service";

const DEFAULT_OWNER = "Moritz";

export async function generateOutreachCommandHandler(
  input: GenerateOutreachRequestDto,
): Promise<GenerateOutreachResultDto> {
  const lead = await getLeadById(input.leadId);
  if (!lead) {
    return { ok: false, code: OutreachErrorCode.LeadNotFound };
  }

  const owner = lead.owner ?? DEFAULT_OWNER;
  const systemPrompt = outreachPromptService.buildSystemPrompt(
    input.channel,
    owner,
  );
  const userPrompt = outreachPromptService.buildUserPrompt(lead, {
    includeImprovements: input.includeImprovements,
    contextNote: input.contextNote,
  });

  try {
    const message = await outreachAiService.generate(
      input.provider,
      systemPrompt,
      userPrompt,
    );
    return { ok: true, message };
  } catch (err) {
    if (err instanceof Error && err.message === "PROVIDER_UNAVAILABLE") {
      return { ok: false, code: OutreachErrorCode.ProviderUnavailable };
    }
    return { ok: false, code: OutreachErrorCode.Internal };
  }
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm run test -- --run generate-outreach-command-handler
```

Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/server/workspace/outreach/ src/server/tests/workspace/outreach/
git commit -m "feat(outreach): add generate-outreach command handler with tests"
```

---

## Task 8: Outreach API Error Helper

**Files:**

- Create: `src/lib/workspace/outreach/outreach-api-error.ts`

No tests needed — pure mapping function, analogous to `lead-api-error.ts`.

- [ ] **Step 1: Create the error helper**

```ts
// src/lib/workspace/outreach/outreach-api-error.ts
import { HttpResponseCode } from "@/common/constants/http/http-response-codes";
import { OutreachErrorCode } from "@/common/constants/outreach/outreach-error-codes";

const MESSAGES: Record<OutreachErrorCode, string> = {
  [OutreachErrorCode.LeadNotFound]: "Lead not found",
  [OutreachErrorCode.ValidationError]: "Validation failed",
  [OutreachErrorCode.ProviderUnavailable]: "AI provider unavailable",
  [OutreachErrorCode.Internal]: "Unexpected server error",
};

export function outreachApiError(
  code: OutreachErrorCode,
  status: HttpResponseCode,
  details?: unknown,
): Response {
  return Response.json(
    {
      error: code,
      message: MESSAGES[code],
      ...(details !== undefined ? { details } : {}),
    },
    { status },
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/workspace/outreach/outreach-api-error.ts
git commit -m "feat(outreach): add outreach API error response helper"
```

---

## Task 9: API Route — GET /api/workspace/outreach/providers

**Files:**

- Create: `src/app/api/workspace/outreach/providers/route.ts`

- [ ] **Step 1: Create the route**

```ts
// src/app/api/workspace/outreach/providers/route.ts
import "server-only";

import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@/common/constants/http/http-response-codes";
import { withWorkspaceApiAuth } from "@/lib/auth/api";
import { outreachAiService } from "@/server/workspace/outreach/services/outreach-ai-service";

export const runtime = "nodejs";

export const GET = withWorkspaceApiAuth(async (_request: NextRequest) => {
  const providers = await outreachAiService.checkAvailability();
  return Response.json(providers, { status: HttpResponseCode.Ok });
});
```

- [ ] **Step 2: Verify the route compiles without errors**

```bash
npm run typecheck
```

Expected: no type errors related to the new route.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/workspace/outreach/providers/route.ts
git commit -m "feat(outreach): add GET /api/workspace/outreach/providers route"
```

---

## Task 10: API Route — POST /api/workspace/outreach/generate

**Files:**

- Create: `src/app/api/workspace/outreach/generate/route.ts`

- [ ] **Step 1: Create the route**

```ts
// src/app/api/workspace/outreach/generate/route.ts
import "server-only";

import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@/common/constants/http/http-response-codes";
import { OutreachErrorCode } from "@/common/constants/outreach/outreach-error-codes";
import { withWorkspaceApiAuth } from "@/lib/auth/api";
import { generateOutreachCommandHandler } from "@/server/workspace/outreach/command-handler/generate-outreach-command-handler";
import { generateOutreachRequestSchema } from "@/server/workspace/outreach/services/generate-outreach/generate-outreach-request.schema";
import { outreachApiError } from "@/lib/workspace/outreach/outreach-api-error";

export const runtime = "nodejs";

export const POST = withWorkspaceApiAuth(async (request: NextRequest) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return outreachApiError(
      OutreachErrorCode.ValidationError,
      HttpResponseCode.BadRequest,
    );
  }

  const parsed = generateOutreachRequestSchema.safeParse(body);
  if (!parsed.success) {
    return outreachApiError(
      OutreachErrorCode.ValidationError,
      HttpResponseCode.BadRequest,
      parsed.error.issues,
    );
  }

  const result = await generateOutreachCommandHandler(parsed.data);

  if (!result.ok) {
    if (result.code === OutreachErrorCode.LeadNotFound) {
      return outreachApiError(
        OutreachErrorCode.LeadNotFound,
        HttpResponseCode.NotFound,
      );
    }
    if (result.code === OutreachErrorCode.ProviderUnavailable) {
      return outreachApiError(
        OutreachErrorCode.ProviderUnavailable,
        HttpResponseCode.ServiceUnavailable,
      );
    }
    return outreachApiError(
      OutreachErrorCode.Internal,
      HttpResponseCode.InternalServerError,
    );
  }

  return Response.json(
    { message: result.message },
    { status: HttpResponseCode.Ok },
  );
});
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/workspace/outreach/generate/route.ts
git commit -m "feat(outreach): add POST /api/workspace/outreach/generate route"
```

---

## Task 11: i18n — add outreach keys to detail dictionaries

**Files:**

- Modify: `src/i18n/dictionaries/workspace/leads/detail/de.json`
- Modify: `src/i18n/dictionaries/workspace/leads/detail/en.json`

`LeadsDetailDictionary` is `typeof detailDe` — no changes to `index.ts` needed; TypeScript picks up new keys automatically.

- [ ] **Step 1: Add `outreach` block to `de.json`**

Add at the end of `de.json`, before the closing `}`:

```json
  "outreach": {
    "buttonLabel": "Nachricht generieren",
    "dialogTitle": "Nachricht generieren",
    "modelLabel": "Modell",
    "modelOllama": "Ollama (lokal)",
    "modelOpenAi": "OpenAI",
    "modelChecking": "Prüfe verfügbare Modelle…",
    "modelOllamaUnavailable": "Ollama nicht erreichbar — Server starten",
    "noProviderAvailable": "Kein KI-Dienst verfügbar. Ollama starten oder OpenAI-Key setzen.",
    "channelLabel": "Kanal",
    "channelLinkedin": "LinkedIn",
    "channelInstagram": "Instagram",
    "channelWhatsapp": "WhatsApp",
    "whatsappLegalHint": "Nur bei bestehender Geschäftsbeziehung rechtlich unbedenklich.",
    "includeImprovements": "Verbesserungshinweise einbeziehen",
    "noImprovementsTooltip": "Keine Verbesserungshinweise hinterlegt",
    "contextLabel": "Zusätzlicher Kontext",
    "contextPlaceholder": "z. B. „Hat gerade Rebranding gemacht"",
    "generateButton": "Generieren",
    "copyButton": "Kopieren",
    "copiedButton": "Kopiert",
    "regenerateButton": "Neu generieren",
    "retryButton": "Erneut versuchen",
    "errorProviderUnavailable": "KI-Dienst nicht erreichbar. Bitte später erneut versuchen.",
    "errorGeneric": "Fehler beim Generieren. Bitte erneut versuchen."
  }
```

- [ ] **Step 2: Add `outreach` block to `en.json`**

Add at the end of `en.json`, before the closing `}`:

```json
  "outreach": {
    "buttonLabel": "Generate message",
    "dialogTitle": "Generate message",
    "modelLabel": "Model",
    "modelOllama": "Ollama (local)",
    "modelOpenAi": "OpenAI",
    "modelChecking": "Checking available models…",
    "modelOllamaUnavailable": "Ollama unreachable — start local server",
    "noProviderAvailable": "No AI provider available. Start Ollama or set an OpenAI key.",
    "channelLabel": "Channel",
    "channelLinkedin": "LinkedIn",
    "channelInstagram": "Instagram",
    "channelWhatsapp": "WhatsApp",
    "whatsappLegalHint": "Only legally safe with an existing business relationship.",
    "includeImprovements": "Include improvement notes",
    "noImprovementsTooltip": "No improvement notes on this lead",
    "contextLabel": "Additional context",
    "contextPlaceholder": "e.g. \"Just completed a rebranding\"",
    "generateButton": "Generate",
    "copyButton": "Copy",
    "copiedButton": "Copied",
    "regenerateButton": "Regenerate",
    "retryButton": "Try again",
    "errorProviderUnavailable": "AI service unavailable. Please try again later.",
    "errorGeneric": "Generation failed. Please try again."
  }
```

- [ ] **Step 3: Typecheck — verify `LeadsDetailDictionary` now includes `outreach`**

```bash
npm run typecheck
```

Expected: clean. The type is derived via `typeof detailDe`, so it updates automatically.

- [ ] **Step 4: Commit both locale files together**

```bash
git add src/i18n/dictionaries/workspace/leads/detail/de.json src/i18n/dictionaries/workspace/leads/detail/en.json
git commit -m "feat(outreach): add outreach i18n keys to leads detail dictionaries"
```

---

## Task 12: LeadOutreachDialog component

**Files:**

- Create: `src/components/workspace/leads/detail/lead-outreach-dialog/lead-outreach-dialog.tsx`
- Create: `src/components/workspace/leads/detail/lead-outreach-dialog/lead-outreach-dialog.module.css`

- [ ] **Step 1: Create the CSS module**

```css
/* src/components/workspace/leads/detail/lead-outreach-dialog/lead-outreach-dialog.module.css */

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  width: min(480px, calc(100vw - 2rem));
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.closeButton {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
}

.closeButton:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.segmentedGroup {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.segmentButton {
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: transparent;
  font-size: 0.875rem;
  cursor: pointer;
  color: var(--color-text);
  transition:
    background 120ms,
    border-color 120ms;
}

.segmentButton:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.segmentButtonActive {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-accent-foreground);
}

.segmentButton:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.radioGroup {
  display: flex;
  gap: 0.75rem;
}

.radioLabel {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.radioLabel input:disabled + span {
  opacity: 0.4;
  cursor: not-allowed;
}

.checkboxLabel {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.checkboxLabel input:disabled {
  cursor: not-allowed;
}

.contextInput {
  width: 100%;
  min-height: 4rem;
  resize: vertical;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.875rem;
  font-family: inherit;
}

.contextInput:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

.textarea {
  width: 100%;
  min-height: 8rem;
  resize: vertical;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.875rem;
  font-family: inherit;
  line-height: 1.6;
}

.textarea:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.primaryButton {
  padding: 0.5rem 1.25rem;
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: var(--color-accent-foreground);
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: opacity 120ms;
}

.primaryButton:hover:not(:disabled) {
  opacity: 0.9;
}

.primaryButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondaryButton {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 120ms;
}

.secondaryButton:hover {
  background: var(--color-surface-hover);
}

.errorMessage {
  font-size: 0.875rem;
  color: var(--color-error, #e53e3e);
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-error, #e53e3e);
  background: color-mix(in srgb, var(--color-error, #e53e3e) 10%, transparent);
}

.hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.loadingText {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
```

- [ ] **Step 2: Create the dialog component**

```tsx
// src/components/workspace/leads/detail/lead-outreach-dialog/lead-outreach-dialog.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { OutreachChannel } from "@/common/constants/outreach/outreach-channels";
import {
  OutreachChannel as OutreachChannelConst,
  OUTREACH_CHANNEL_VALUES,
} from "@/common/constants/outreach/outreach-channels";
import type { OutreachProvider } from "@/common/constants/outreach/outreach-providers";
import { OutreachProvider as OutreachProviderConst } from "@/common/constants/outreach/outreach-providers";
import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";
import type { OutreachProvidersResultDto } from "@/common/contracts/outreach/outreach-providers-result.dto";
import type { LeadsDetailDictionary } from "@/i18n/dictionaries/workspace/leads";
import styles from "./lead-outreach-dialog.module.css";

type Props = {
  content: LeadsDetailDictionary;
  lead: LeadDetailDto;
  onClose: () => void;
};

type DialogPhase = "idle" | "loading" | "result" | "error";

const CHANNEL_LABELS: Record<
  OutreachChannel,
  keyof LeadsDetailDictionary["outreach"]
> = {
  linkedin: "channelLinkedin",
  instagram: "channelInstagram",
  whatsapp: "channelWhatsapp",
};

export function LeadOutreachDialog({ content, lead, onClose }: Props) {
  const t = content.outreach;
  const hasImprovements = Boolean(lead.improvements?.length);

  const [availableProviders, setAvailableProviders] =
    useState<OutreachProvidersResultDto | null>(null);
  const [provider, setProvider] = useState<OutreachProvider | null>(null);
  const [channel, setChannel] = useState<OutreachChannel>(
    OutreachChannelConst.Linkedin,
  );
  const [includeImprovements, setIncludeImprovements] =
    useState(hasImprovements);
  const [contextNote, setContextNote] = useState("");
  const [phase, setPhase] = useState<DialogPhase>("idle");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorKey, setErrorKey] = useState<
    "errorProviderUnavailable" | "errorGeneric"
  >("errorGeneric");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check provider availability on mount
  useEffect(() => {
    async function checkProviders() {
      try {
        const res = await fetch("/api/workspace/outreach/providers");
        if (!res.ok) throw new Error();
        const data: OutreachProvidersResultDto = await res.json();
        setAvailableProviders(data);
        // Pre-select: prefer Ollama, fall back to OpenAI
        if (data.ollama) setProvider(OutreachProviderConst.Ollama);
        else if (data.openai) setProvider(OutreachProviderConst.OpenAi);
      } catch {
        setAvailableProviders({ ollama: false, openai: false });
      }
    }
    void checkProviders();
  }, []);

  // Clean up copy timeout on unmount
  useEffect(
    () => () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    },
    [],
  );

  const noProviderAvailable =
    availableProviders !== null &&
    !availableProviders.ollama &&
    !availableProviders.openai;

  const isChecking = availableProviders === null;
  const canGenerate = !isChecking && !noProviderAvailable && provider !== null;

  async function handleGenerate() {
    if (!provider) return;
    setPhase("loading");
    try {
      const res = await fetch("/api/workspace/outreach/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          channel,
          provider,
          includeImprovements,
          contextNote: contextNote.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body?.error === "PROVIDER_UNAVAILABLE") {
          setErrorKey("errorProviderUnavailable");
        } else {
          setErrorKey("errorGeneric");
        }
        setPhase("error");
        return;
      }

      const data = await res.json();
      setGeneratedMessage(data.message ?? "");
      setPhase("result");
    } catch {
      setErrorKey("errorGeneric");
      setPhase("error");
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      setCopied(true);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard denied — silently ignore
    }
  }

  const isModelSelectorVisible =
    availableProviders !== null &&
    (availableProviders.ollama || availableProviders.openai);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="outreach-title"
    >
      <div className={styles.dialog}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title} id="outreach-title">
            {t.dialogTitle}
          </h2>
          <button
            aria-label={content.actions.closeAriaLabel}
            className={styles.closeButton}
            onClick={onClose}
            type="button"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
          </button>
        </div>

        {/* Model selector */}
        <div className={styles.section}>
          <span className={styles.label}>{t.modelLabel}</span>
          {isChecking && (
            <span className={styles.loadingText}>{t.modelChecking}</span>
          )}
          {isModelSelectorVisible && (
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="provider"
                  value={OutreachProviderConst.Ollama}
                  checked={provider === OutreachProviderConst.Ollama}
                  disabled={!availableProviders.ollama || phase === "loading"}
                  onChange={() => setProvider(OutreachProviderConst.Ollama)}
                />
                <span
                  title={
                    !availableProviders.ollama
                      ? t.modelOllamaUnavailable
                      : undefined
                  }
                >
                  {t.modelOllama}
                </span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="provider"
                  value={OutreachProviderConst.OpenAi}
                  checked={provider === OutreachProviderConst.OpenAi}
                  disabled={!availableProviders.openai || phase === "loading"}
                  onChange={() => setProvider(OutreachProviderConst.OpenAi)}
                />
                <span>{t.modelOpenAi}</span>
              </label>
            </div>
          )}
          {noProviderAvailable && (
            <p className={styles.errorMessage}>{t.noProviderAvailable}</p>
          )}
        </div>

        {/* Channel selector */}
        <div className={styles.section}>
          <span className={styles.label}>{t.channelLabel}</span>
          <div className={styles.segmentedGroup}>
            {OUTREACH_CHANNEL_VALUES.map((ch) => (
              <button
                key={ch}
                className={`${styles.segmentButton} ${ch === channel ? styles.segmentButtonActive : ""}`}
                disabled={phase === "loading"}
                onClick={() => setChannel(ch)}
                type="button"
              >
                {t[CHANNEL_LABELS[ch]]}
              </button>
            ))}
          </div>
          {channel === "whatsapp" && (
            <p className={styles.hint}>{t.whatsappLegalHint}</p>
          )}
        </div>

        {/* Improvements toggle */}
        <div className={styles.section}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={includeImprovements}
              disabled={!hasImprovements || phase === "loading"}
              onChange={(e) => setIncludeImprovements(e.target.checked)}
              title={!hasImprovements ? t.noImprovementsTooltip : undefined}
            />
            <span>{t.includeImprovements}</span>
          </label>
        </div>

        {/* Context note */}
        <div className={styles.section}>
          <label>
            <span className={styles.label}>{t.contextLabel}</span>
            <textarea
              className={styles.contextInput}
              disabled={phase === "loading"}
              maxLength={200}
              onChange={(e) => setContextNote(e.target.value)}
              placeholder={t.contextPlaceholder}
              rows={2}
              value={contextNote}
            />
          </label>
        </div>

        {/* Generated result */}
        {phase === "result" && (
          <div className={styles.section}>
            <textarea
              className={styles.textarea}
              onChange={(e) => setGeneratedMessage(e.target.value)}
              rows={6}
              value={generatedMessage}
            />
          </div>
        )}

        {/* Error state */}
        {phase === "error" && (
          <p className={styles.errorMessage}>{t[errorKey]}</p>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          {phase === "result" && (
            <button
              className={styles.secondaryButton}
              onClick={handleCopy}
              type="button"
            >
              {copied ? t.copiedButton : t.copyButton}
            </button>
          )}
          <button
            className={styles.primaryButton}
            disabled={!canGenerate || phase === "loading"}
            onClick={handleGenerate}
            type="button"
          >
            {phase === "loading"
              ? "…"
              : phase === "result"
                ? t.regenerateButton
                : t.generateButton}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: clean. Fix any type errors before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/components/workspace/leads/detail/lead-outreach-dialog/
git commit -m "feat(outreach): add LeadOutreachDialog component with all dialog states"
```

---

## Task 13: Integration — add button and dialog to LeadDetailPanel

**Files:**

- Modify: `src/components/workspace/leads/detail/lead-detail-panel/lead-detail-panel.tsx`

- [ ] **Step 1: Add state and imports to `lead-detail-panel.tsx`**

Add these imports at the top of the file (after the existing imports):

```tsx
import { useState } from "react";
import { faComment } from "@fortawesome/free-solid-svg-icons";
import { LeadOutreachDialog } from "../lead-outreach-dialog/lead-outreach-dialog";
```

Add state inside the `LeadDetailPanel` component function, after the existing variables:

```tsx
const [isOutreachOpen, setIsOutreachOpen] = useState(false);
```

- [ ] **Step 2: Add "Nachricht generieren" button to the header**

In `lead-detail-panel.tsx`, find the `<header className={styles.header}>` block. Add the new button after the existing `editIconLink` button:

```tsx
<button
  aria-label={content.outreach.buttonLabel}
  className={styles.outreachButton}
  onClick={() => setIsOutreachOpen(true)}
  title={content.outreach.buttonLabel}
  type="button"
>
  <FontAwesomeIcon aria-hidden="true" icon={faComment} />
</button>
```

- [ ] **Step 3: Render the dialog conditionally after the `<aside>` closing tag**

At the very end of the component return, after the closing `</aside>`, add:

```tsx
{
  isOutreachOpen && (
    <LeadOutreachDialog
      content={content}
      lead={lead}
      onClose={() => setIsOutreachOpen(false)}
    />
  );
}
```

- [ ] **Step 4: Add `.outreachButton` style to `lead-detail-panel.module.css`**

Open `lead-detail-panel.module.css` and add a style for the new button alongside the existing `.editIconLink`:

```css
.outreachButton {
  /* same visual treatment as .editIconLink */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
}

.outreachButton:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}
```

- [ ] **Step 5: Typecheck and lint**

```bash
npm run typecheck && npm run lint
```

Expected: clean. Fix any issues before continuing.

- [ ] **Step 6: Verify the full build passes**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 7: Start dev server and manually test the dialog**

```bash
npm run dev
```

Open a lead in the workspace. Verify:

1. "Nachricht generieren" button appears in the detail panel header
2. Clicking opens the dialog overlay
3. Provider check runs (spinner briefly, then radio buttons appear)
4. Channel selector works (3 buttons, active state visible)
5. Improvements checkbox is disabled when lead has no improvements
6. "Generieren" generates a message (requires Ollama running or OpenAI key set)
7. Generated message appears in editable textarea
8. "Kopieren" copies to clipboard and shows "Kopiert ✓" for 2 s
9. Changing channel and clicking "Neu generieren" replaces the message
10. Closing with × closes the dialog

- [ ] **Step 8: Commit**

```bash
git add src/components/workspace/leads/detail/lead-detail-panel/lead-detail-panel.tsx src/components/workspace/leads/detail/lead-detail-panel/lead-detail-panel.module.css
git commit -m "feat(outreach): integrate outreach dialog into LeadDetailPanel"
```

---

## Task 14: Run full test suite and verify build

- [ ] **Step 1: Run all unit tests**

```bash
npm run test
```

Expected: all tests pass, no regressions.

- [ ] **Step 2: Run typecheck and lint**

```bash
npm run typecheck && npm run lint
```

Expected: clean.

- [ ] **Step 3: Verify production build**

```bash
npm run build
```

Expected: build succeeds. Address any errors before marking complete.

- [ ] **Step 4: Final commit if any fixes were made**

```bash
git add -p
git commit -m "fix(outreach): address type and lint issues from full build"
```

---

## Self-Review Checklist

- [x] **OutreachChannel, OutreachProvider, OutreachErrorCode** — Task 2
- [x] **DTOs + result type** — Task 3
- [x] **Zod schema with tests** — Task 4
- [x] **Prompt service with DSGVO-safe fields + tests** — Task 5
- [x] **AI service: Ollama-first, OpenAI fallback, availability check + tests** — Task 6
- [x] **Command handler: DB fetch, prompt, AI call, error mapping + tests** — Task 7
- [x] **API error helper** — Task 8
- [x] **GET /providers route** — Task 9
- [x] **POST /generate route** — Task 10
- [x] **i18n keys (de + en)** — Task 11
- [x] **LeadOutreachDialog: provider check, channel selector, improvements toggle, context field, result textarea, copy, error state** — Task 12
- [x] **LeadDetailPanel integration** — Task 13
- [x] **Build verification** — Task 14
- [x] **WhatsApp legal hint** — Task 12 (in channel section)
- [x] **Default owner fallback ("Moritz")** — Task 7 command handler
- [x] **Provider pre-selection logic (Ollama first)** — Task 12 component
- [x] **No email/phone in prompt (DSGVO)** — enforced in prompt service, tested in Task 5
