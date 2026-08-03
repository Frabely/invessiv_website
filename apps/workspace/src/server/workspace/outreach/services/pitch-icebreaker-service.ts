import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { PITCH_AUDIENCE_VALUES } from "@invessiv/common/constants/leads/outreach/lead-pitch-audiences";
import { LeadPitchErrorCode } from "@invessiv/common/constants/leads/outreach/lead-pitch-error-codes";
import { OutreachChatRole } from "@invessiv/common/constants/leads/outreach/lead-outreach-message-roles";
import { OutreachOpenAi } from "@invessiv/common/constants/leads/outreach/lead-outreach-openai";
import type {
  PitchIcebreakerInput,
  PitchIcebreakerResult,
} from "@/server/workspace/outreach/pitch-icebreaker-types";

const SKILL_FILE_PATH = path.join(
  process.cwd(),
  "local-skills",
  "invessiv-pitch-skill",
  "SKILL.md",
);

const RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "pitch_icebreaker",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["salutationName", "audience", "icebreaker"],
      properties: {
        salutationName: { type: "string" },
        audience: { type: "string", enum: [...PITCH_AUDIENCE_VALUES] },
        icebreaker: { type: "string" },
      },
    },
  },
} as const;

const ICEBREAKER_TEMPERATURE = 0.95;

let cachedSkillMarkdown: Promise<string> | null = null;

function readProviderStatus(error: unknown): number | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }

  return null;
}

function readProviderCode(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return null;
}

function classifyProviderError(error: unknown): LeadPitchErrorCode {
  const status = readProviderStatus(error);

  if (status === 401 || status === 403) {
    return LeadPitchErrorCode.AuthenticationFailed;
  }

  if (status === 404) {
    return LeadPitchErrorCode.ModelUnavailable;
  }

  if (status === 429) {
    return LeadPitchErrorCode.ProviderRateLimited;
  }

  if (status === 400 || status === 422) {
    return LeadPitchErrorCode.ProviderRejected;
  }

  return LeadPitchErrorCode.ProviderUnavailable;
}

function getModel(): string {
  return process.env.OPENAI_MODEL ?? OutreachOpenAi.DefaultModel;
}

async function loadSkillMarkdown(): Promise<string> {
  if (!cachedSkillMarkdown) {
    cachedSkillMarkdown = readFile(SKILL_FILE_PATH, "utf8");
  }

  try {
    return (await cachedSkillMarkdown).trim();
  } catch {
    cachedSkillMarkdown = null;
    throw new Error(LeadPitchErrorCode.TemplateInvalid);
  }
}

function buildUserPrompt(input: PitchIcebreakerInput): string {
  const context = {
    channel: input.channel,
    icebreakerMaxChars: input.icebreakerBudget,
    lead: {
      displayName: input.lead.displayName,
      firstName: input.lead.firstName,
      companyName: input.lead.companyName,
      categoryLabel: input.lead.category?.labelKey ?? null,
    },
    profile: {
      handle: input.snapshot.handle,
      displayName: input.snapshot.displayName,
      biography: input.snapshot.biography,
      headline: input.snapshot.headline,
      category: input.snapshot.category,
      followerCount: input.snapshot.followerCount,
      isVerified: input.snapshot.isVerified,
      posts: input.snapshot.posts,
    },
    alreadyUsedIcebreakers: input.usedIcebreakers,
  };

  return [
    "Nutze ausschließlich die folgenden Profildaten als inhaltliche Quelle.",
    `Der Icebreaker darf höchstens ${input.icebreakerBudget} Zeichen lang sein.`,
    input.usedIcebreakers.length > 0
      ? "Die unter alreadyUsedIcebreakers gelisteten Formulierungen wurden bereits verwendet. Greife einen anderen Aspekt des Profils auf."
      : "",
    "Antworte ausschließlich mit dem JSON-Objekt.",
    "",
    "```json",
    JSON.stringify(context, null, 2),
    "```",
  ]
    .filter((line) => line.length > 0 || line === "")
    .join("\n");
}

function parseResult(raw: string, model: string): PitchIcebreakerResult | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }

  const candidate = parsed as Record<string, unknown>;
  const salutationName = candidate.salutationName;
  const audience = candidate.audience;
  const icebreaker = candidate.icebreaker;

  if (
    typeof salutationName !== "string" ||
    typeof icebreaker !== "string" ||
    typeof audience !== "string" ||
    !PITCH_AUDIENCE_VALUES.some((value) => value === audience)
  ) {
    return null;
  }

  return {
    salutationName: salutationName.trim(),
    audience: audience as PitchIcebreakerResult["audience"],
    icebreaker: icebreaker.trim(),
    model,
  };
}

async function generate(
  input: PitchIcebreakerInput,
): Promise<PitchIcebreakerResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = getModel();
  const systemPrompt = await loadSkillMarkdown();
  const client = new OpenAI({ apiKey });

  let rawText: string | null | undefined;
  try {
    const response = await client.chat.completions.create({
      model,
      temperature: ICEBREAKER_TEMPERATURE,
      response_format: RESPONSE_FORMAT,
      messages: [
        { role: OutreachChatRole.System, content: systemPrompt },
        { role: OutreachChatRole.User, content: buildUserPrompt(input) },
      ],
    });

    rawText = response.choices[0]?.message?.content;
  } catch (error) {
    const code = classifyProviderError(error);
    console.warn("[pitch-icebreaker] OpenAI request failed", {
      stage: "provider_request",
      status: readProviderStatus(error),
      providerCode: readProviderCode(error),
      code,
    });
    throw new Error(code);
  }

  if (typeof rawText !== "string" || rawText.trim().length === 0) {
    throw new Error(LeadPitchErrorCode.ProviderInvalidResponse);
  }

  const result = parseResult(rawText, model);
  if (!result) {
    throw new Error(LeadPitchErrorCode.ProviderInvalidResponse);
  }

  return result;
}

export const pitchIcebreakerService = {
  generate,
  loadSkillMarkdown,
} as const;
