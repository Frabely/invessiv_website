import "server-only";
import OpenAI from "openai";
import { z } from "zod";
import { type GeneratorTemplate } from "@/common/constants/generator/post/generator-templates";
import {
  LINKEDIN_POST_FALLBACK_HASHTAG,
  LINKEDIN_POST_OPENAI_SCHEMA_NAME,
  LINKEDIN_POST_REQUIRED_HASHTAG,
  LinkedInPostGeneratorErrorCode,
} from "@/common/constants/generator";
import type { Locale } from "@/config/i18n";
import type { LinkedInPostGeneratorRequestDto } from "@/common/contracts/generator/api/linkedin-post-generator-request";
import contentSchema from "../../../../../project-skills/linkedin-post-generator/references/content-schema.json";

export type OpenAIResponsesClient = Pick<OpenAI["responses"], "create">;

const GeneratedContentSchema = z
  .object({
    headlineHtml: z
      .string()
      .min(1)
      .max(200)
      .regex(/^([^<>]|<\/?em>)*$/u),
    headlinePlain: z
      .string()
      .min(1)
      .max(90)
      .regex(/^[^<>]*$/u),
    bodyVariant: z.union([z.literal("insight"), z.literal("bullets")]),
    insight: z.string().min(1).max(220).nullable(),
    bullets: z.array(z.string().min(1).max(120)).length(3).nullable(),
    highlight: z
      .string()
      .min(1)
      .max(160)
      .regex(/^[^<>]*$/u)
      .nullable(),
    kicker: z
      .string()
      .min(1)
      .max(32)
      .regex(/^[^<>]*$/u),
    caption: z.object({
      body: z
        .string()
        .min(1)
        .regex(/^[^\r]*$/u),
      hashtags: z
        .array(z.string().regex(/^[A-Za-z0-9À-ſ]+$/u))
        .min(3)
        .max(5),
    }),
  })
  .superRefine((value, context) => {
    if (value.bodyVariant === "bullets" && !value.bullets) {
      context.addIssue({
        code: "custom",
        message: "bullets_required",
        path: ["bullets"],
      });
    }
    if (value.bodyVariant === "insight" && !value.insight) {
      context.addIssue({
        code: "custom",
        message: "insight_required",
        path: ["insight"],
      });
    }
    if (value.caption.hashtags.at(-1) !== LINKEDIN_POST_REQUIRED_HASHTAG) {
      context.addIssue({
        code: "custom",
        message: "linkedin_hashtag_must_be_last",
        path: ["caption", "hashtags"],
      });
    }
  });

export type GeneratedContent = z.infer<typeof GeneratedContentSchema>;

const JsonObjectSchema = z.record(z.string(), z.unknown());
type JsonObject = z.infer<typeof JsonObjectSchema>;

const OpenAIErrorLikeSchema = z.object({
  code: z.unknown().optional(),
});

const OpenAITextContentSchema = z.looseObject({
  text: z.string().optional(),
});

const OpenAIOutputItemSchema = z.looseObject({
  content: z.array(OpenAITextContentSchema).optional(),
});

const OpenAIResponseSchema = z.looseObject({
  output: z.array(OpenAIOutputItemSchema).optional(),
  output_text: z.string().optional(),
});

export class LinkedInPostGenerationError extends Error {
  constructor(
    readonly code: LinkedInPostGeneratorErrorCode,
    readonly stage: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "LinkedInPostGenerationError";
  }
}

const PROMPT_LANGUAGE_BY_LOCALE: Record<Locale, string> = {
  de: "German",
  en: "English",
};

const PROMPT_TONE_BY_LOCALE: Record<
  Locale,
  Record<LinkedInPostGeneratorRequestDto["tone"], string>
> = {
  de: {
    sachlich: "sachlich / faktisch",
    persönlich: "persönlich / erfahrungsbasiert",
    provokativ: "provokativ / pointiert",
  },
  en: {
    sachlich: "factual / evidence-led",
    persönlich: "personal / experience-led",
    provokativ: "provocative / pointed-opinion",
  },
};

function createPrompt(
  request: LinkedInPostGeneratorRequestDto,
  template: GeneratorTemplate,
) {
  const language = PROMPT_LANGUAGE_BY_LOCALE[request.locale];
  const tone = PROMPT_TONE_BY_LOCALE[request.locale][request.tone];
  const bodyRule =
    template.bodyVariant === "bullets"
      ? 'Return bodyVariant "bullets" with exactly three concise bullets (6-14 words each) and insight null.'
      : 'Return bodyVariant "insight" with one concise free-text paragraph (<= 220 chars) and bullets null.';
  const highlightRule = template.supportsHighlight
    ? "Also return a short focal highlight line (highlight, <= 160 chars, plain text) that sharpens the point without repeating the headline."
    : "Return highlight null.";

  return [
    `Write one neutral, unbranded LinkedIn square-post concept in ${language}.`,
    `Output language is ${language}. Every generated field must be ${language}: headlineHtml, headlinePlain, kicker, insight, bullets, highlight, caption.body, and all hashtags except LinkedIn.`,
    `If the topic or role/industry is written in another language, translate and adapt the idea into natural ${language}. Do not mirror the input language.`,
    "Return only fields from the provided JSON schema.",
    "No Invessiv, no invessiv.com, no watermark, no unsupported promises, no emoji in the visual fields.",
    "headlineHtml may contain only <em> tags. headlinePlain must be the same headline without tags.",
    bodyRule,
    highlightRule,
    "Also return a short eyebrow label (kicker): 1-3 words, at most 32 characters, plain text, same language. It is a thematic category/rubric for the post derived from the topic AND the copy you generate. Never copy the role/industry value verbatim and never restate the headline.",
    `Tone of voice (steers register only, NOT the body form and NOT the language): ${tone}.`,
    "Caption first paragraph must stand alone and stay at or below 140 characters. Hashtags must end with LinkedIn.",
    `Topic: ${request.topic}`,
    `Role or industry (perspective only — do NOT print this verbatim anywhere): ${request.expertise}`,
  ].join("\n");
}

function adaptOpenAIContentSchema() {
  const parsedSchema = JsonObjectSchema.safeParse(contentSchema);
  if (!parsedSchema.success) {
    throw new LinkedInPostGenerationError(
      LinkedInPostGeneratorErrorCode.GeneratorSchemaInvalid,
      "schema_adapter",
      "content_schema_is_not_json_object",
      { cause: parsedSchema.error },
    );
  }

  const adaptedSchema = removeUnsupportedOpenAISchemaKeywords(
    parsedSchema.data,
  );
  const parsedAdaptedSchema = JsonObjectSchema.safeParse(adaptedSchema);
  if (!parsedAdaptedSchema.success) {
    throw new LinkedInPostGenerationError(
      LinkedInPostGeneratorErrorCode.GeneratorSchemaInvalid,
      "schema_adapter",
      "adapted_schema_is_not_json_object",
      { cause: parsedAdaptedSchema.error },
    );
  }

  return parsedAdaptedSchema.data;
}

let memoizedOpenAIContentSchema: JsonObject | null = null;

function createOpenAIContentSchema() {
  memoizedOpenAIContentSchema ??= adaptOpenAIContentSchema();
  return memoizedOpenAIContentSchema;
}

function removeUnsupportedOpenAISchemaKeywords(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => removeUnsupportedOpenAISchemaKeywords(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const next: JsonObject = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "allOf" || key === "contains") {
      continue;
    }
    next[key] = removeUnsupportedOpenAISchemaKeywords(child);
  }

  return next;
}

function extractOpenAIOutputText(response: unknown) {
  const parsedResponse = OpenAIResponseSchema.safeParse(response);
  if (!parsedResponse.success) {
    return null;
  }

  const directText = parsedResponse.data.output_text;
  if (typeof directText === "string" && directText.trim()) {
    return directText;
  }

  const output = parsedResponse.data.output;
  if (!output) {
    return null;
  }

  for (const item of output) {
    const content = item.content;
    if (!content) {
      continue;
    }
    for (const contentItem of content) {
      const text = contentItem.text;
      if (typeof text === "string" && text.trim()) {
        return text;
      }
    }
  }

  return null;
}

function mapOpenAIRequestError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "unknown_openai_error";
  const parsedError = OpenAIErrorLikeSchema.safeParse(error);
  const maybeCode = parsedError.success
    ? String(parsedError.data.code ?? "")
    : "";

  if (
    maybeCode === "invalid_json_schema" ||
    message.includes("Invalid schema")
  ) {
    return new LinkedInPostGenerationError(
      LinkedInPostGeneratorErrorCode.OpenAiSchemaError,
      "openai_request",
      message,
      { cause: error },
    );
  }

  return new LinkedInPostGenerationError(
    LinkedInPostGeneratorErrorCode.OpenAiRequestFailed,
    "openai_request",
    message,
    { cause: error },
  );
}

async function callOpenAI(
  client: OpenAIResponsesClient,
  request: LinkedInPostGeneratorRequestDto,
  model: string,
  template: GeneratorTemplate,
): Promise<GeneratedContent> {
  const openAIContentSchema = createOpenAIContentSchema();

  let response: unknown;
  try {
    response = await client.create({
      input: [
        {
          content: [
            {
              text: "You create high-quality LinkedIn post content for a visitor-owned, unbranded generator. Follow the requested output language exactly, even when the input topic or role is written in another language.",
              type: "input_text",
            },
          ],
          role: "system",
        },
        {
          content: [
            { text: createPrompt(request, template), type: "input_text" },
          ],
          role: "user",
        },
      ],
      model,
      text: {
        format: {
          name: LINKEDIN_POST_OPENAI_SCHEMA_NAME,
          schema: openAIContentSchema,
          strict: true,
          type: "json_schema",
        },
      },
    });
  } catch (error) {
    throw mapOpenAIRequestError(error);
  }

  const outputText = extractOpenAIOutputText(response);
  if (!outputText) {
    throw new LinkedInPostGenerationError(
      LinkedInPostGeneratorErrorCode.OpenAiEmptyOutput,
      "openai_response",
      "empty_output_text",
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(outputText);
  } catch (error) {
    throw new LinkedInPostGenerationError(
      LinkedInPostGeneratorErrorCode.OpenAiInvalidJson,
      "openai_response",
      "output_text_is_not_json",
      { cause: error },
    );
  }

  const parsedContent = GeneratedContentSchema.safeParse(
    normalizeGeneratedContent(parsedJson),
  );
  if (!parsedContent.success) {
    throw new LinkedInPostGenerationError(
      LinkedInPostGeneratorErrorCode.OpenAiInvalidContent,
      "openai_quality_gate",
      parsedContent.error.issues
        .map((issue) => `${issue.path.join(".") || "root"}:${issue.message}`)
        .join("; "),
      { cause: parsedContent.error },
    );
  }

  if (parsedContent.data.bodyVariant !== template.bodyVariant) {
    throw new LinkedInPostGenerationError(
      LinkedInPostGeneratorErrorCode.OpenAiInvalidContent,
      "openai_quality_gate",
      `body_variant_mismatch:expected_${template.bodyVariant}`,
    );
  }

  return parsedContent.data;
}

function normalizeGeneratedContent(value: unknown) {
  const parsedObject = JsonObjectSchema.safeParse(value);
  if (!parsedObject.success) {
    return value;
  }

  const caption = JsonObjectSchema.safeParse(parsedObject.data.caption);
  if (!caption.success) {
    return value;
  }

  const hashtags = z.array(z.string()).safeParse(caption.data.hashtags);
  if (!hashtags.success) {
    return value;
  }

  return {
    ...parsedObject.data,
    caption: {
      ...caption.data,
      hashtags: normalizeHashtags(hashtags.data),
    },
  };
}

function normalizeHashtags(hashtags: string[]) {
  const withoutLinkedIn = hashtags.filter(
    (hashtag) => hashtag !== LINKEDIN_POST_REQUIRED_HASHTAG,
  );
  const cappedHashtags = withoutLinkedIn.slice(0, 4);

  while (cappedHashtags.length < 2) {
    cappedHashtags.push(LINKEDIN_POST_FALLBACK_HASHTAG);
  }

  return [...cappedHashtags, LINKEDIN_POST_REQUIRED_HASHTAG];
}

export const linkedinPostOpenaiAdapterService = {
  callOpenAI,
} as const;
