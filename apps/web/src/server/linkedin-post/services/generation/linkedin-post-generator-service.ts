import "server-only";
import OpenAI from "openai";
import { GENERATOR_COLOR_PAIRS } from "@/common/constants/generator/generator-color-pairs";
import {
  GENERATOR_TEMPLATE_AUTO,
  GENERATOR_TEMPLATES,
  type GeneratorTemplate,
} from "@/common/constants/generator/generator-templates";
import {
  LINKEDIN_POST_DOWNLOAD_FILENAME_FALLBACK,
  LinkedInPostGeneratorErrorCode,
} from "@/common/constants/generator";
import { getServerEnv } from "@/server/config/env";
import { linkedinPostRenderService } from "../rendering/linkedin-post-render-service";
import {
  BRAND_COLLISION_PATTERN,
  PROMPT_INJECTION_PATTERN,
} from "@/common/patterns/linkedin-post-generator-patterns";
import type { LinkedInPostGeneratorRequestDto } from "@/common/contracts/generator/linkedin-post-generator-request";
import {
  type GeneratedContent,
  LinkedInPostGenerationError,
  linkedinPostOpenaiAdapterService,
  type OpenAIResponsesClient,
} from "./linkedin-post-openai-adapter-service";
import type {
  LinkedInPostGeneratorColorPairDto,
  LinkedInPostGeneratorPostDto,
  LinkedInPostGeneratorSuccessResponseDto,
  LinkedInPostGeneratorTemplateDto,
} from "@/common/contracts/generator";
import type { Locale } from "@/config/i18n";

function normalizeInput(value: string) {
  return value.trim().normalize("NFC");
}

const DEFAULT_AUTHOR_NAME_BY_LOCALE: Record<Locale, string> = {
  de: "Dein Name",
  en: "Your name",
};

function assertSafeInput(request: LinkedInPostGeneratorRequestDto) {
  const input = `${request.topic}\n${request.expertise}`;
  if (BRAND_COLLISION_PATTERN.test(input)) {
    throw new LinkedInPostGenerationError(
      LinkedInPostGeneratorErrorCode.UnsafeInput,
      "input_safety",
      "brand_collision",
    );
  }
  if (PROMPT_INJECTION_PATTERN.test(input)) {
    throw new LinkedInPostGenerationError(
      LinkedInPostGeneratorErrorCode.UnsafeInput,
      "input_safety",
      "prompt_injection",
    );
  }
}

function resolveColorPair(
  colorPairId: string,
): LinkedInPostGeneratorColorPairDto {
  const index =
    colorPairId === "auto"
      ? Math.floor(Math.random() * GENERATOR_COLOR_PAIRS.length)
      : GENERATOR_COLOR_PAIRS.findIndex((pair) => pair.id === colorPairId);
  const selected = GENERATOR_COLOR_PAIRS[index];

  if (!selected) {
    throw new Error("invalid_color_pair");
  }

  return {
    accent: selected.accent,
    id: selected.id,
    index,
    primary: selected.primary,
    secondary: selected.secondary,
    text: selected.text,
  };
}

type ResolvedTemplate = {
  template: GeneratorTemplate;
  index: number;
  source: "selected" | "random";
};

/**
 * Picks the structural skeleton for this run. A concrete templateId is binding;
 * otherwise (or with the `auto` sentinel) a uniform random template is chosen.
 * Selection is deliberately decoupled from tone — the template, not the tone,
 * dictates the body form (insight vs. bullets).
 */
function resolveTemplate(templateId?: string): ResolvedTemplate {
  if (templateId && templateId !== GENERATOR_TEMPLATE_AUTO) {
    const index = GENERATOR_TEMPLATES.findIndex((t) => t.id === templateId);
    if (index < 0) {
      throw new Error("invalid_template");
    }
    return { index, source: "selected", template: GENERATOR_TEMPLATES[index] };
  }

  const index = Math.floor(Math.random() * GENERATOR_TEMPLATES.length);
  return { index, source: "random", template: GENERATOR_TEMPLATES[index] };
}

function stripTags(value: string) {
  return value.replace(/<[^>]*>/gu, "");
}

function sanitizeHeadlineHtml(value: string) {
  const temporaryOpen = "__EM_OPEN__";
  const temporaryClose = "__EM_CLOSE__";
  return value
    .replaceAll("<em>", temporaryOpen)
    .replaceAll("</em>", temporaryClose)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll(temporaryOpen, "<em>")
    .replaceAll(temporaryClose, "</em>");
}

function buildCaption(content: GeneratedContent) {
  const hashtags = content.caption.hashtags
    .map((hashtag) => `#${hashtag}`)
    .join(" ");
  return `${content.caption.body.trim()}\n\n${hashtags}`;
}

function createDownloadFileName(topic: string) {
  const slug =
    topic
      .toLowerCase()
      .normalize("NFC")
      .replaceAll("ä", "ae")
      .replaceAll("ö", "oe")
      .replaceAll("ü", "ue")
      .replaceAll("ß", "ss")
      .normalize("NFD")
      .replace(/[̀-ͯ]/gu, "")
      .replace(/[\s_]+/gu, "-")
      .replace(/[^a-z0-9-]/gu, "")
      .replace(/-+/gu, "-")
      .replace(/^-|-$/gu, "")
      .slice(0, 40)
      .replace(/-$/u, "") || LINKEDIN_POST_DOWNLOAD_FILENAME_FALLBACK;

  return `${slug}.png`;
}

type GenerateLinkedInPostOptions = {
  /** Pins the structural template (e.g. for Codex runs / tests). Random when omitted. */
  templateId?: string;
};

/** Service-internal result — extends the shared DTO with previewHtml which is
 *  specific to the web app's rendering pipeline. The route handler assembles
 *  imageDataUrl (from Playwright) and returns both to the client. */
type GenerateLinkedInPostResult = LinkedInPostGeneratorSuccessResponseDto & {
  previewHtml: string;
};

async function generateLinkedInPost(
  rawRequest: LinkedInPostGeneratorRequestDto,
  client?: OpenAIResponsesClient,
  options?: GenerateLinkedInPostOptions,
): Promise<GenerateLinkedInPostResult> {
  const request = {
    ...rawRequest,
    displayName: normalizeInput(rawRequest.displayName),
    expertise: normalizeInput(rawRequest.expertise),
    topic: normalizeInput(rawRequest.topic),
  };
  assertSafeInput(request);

  const env = getServerEnv();
  const openAiClient =
    client ??
    new OpenAI({
      apiKey: env.openAiApiKey ?? undefined,
    }).responses;

  if (!env.openAiApiKey && !client) {
    throw new LinkedInPostGenerationError(
      LinkedInPostGeneratorErrorCode.OpenAiApiKeyMissing,
      "server_config",
      "openai_api_key_missing",
    );
  }

  const resolvedTemplate = resolveTemplate(options?.templateId);
  const generated = await linkedinPostOpenaiAdapterService.callOpenAI(
    openAiClient,
    request,
    env.openAiModel,
    resolvedTemplate.template,
  );

  const colorPair = resolveColorPair(request.colorPairId);
  const authorName =
    request.displayName ||
    DEFAULT_AUTHOR_NAME_BY_LOCALE[request.locale] ||
    DEFAULT_AUTHOR_NAME_BY_LOCALE.de;
  const template: LinkedInPostGeneratorTemplateDto = {
    bodyVariant: resolvedTemplate.template.bodyVariant,
    id: resolvedTemplate.template.id,
    index: resolvedTemplate.index,
  };
  const post: LinkedInPostGeneratorPostDto = {
    bodyVariant: generated.bodyVariant,
    bullets: generated.bodyVariant === "bullets" ? generated.bullets : null,
    authorName: authorName.slice(0, 80),
    colorPair,
    // Generated thematic eyebrow for the post image (not the raw role/industry).
    kicker: generated.kicker,
    // Raw role/industry — only feeds the simulated LinkedIn author subtitle.
    expertiseDisplay: request.expertise.slice(0, 60),
    headlineHtml: sanitizeHeadlineHtml(generated.headlineHtml),
    headlinePlain: generated.headlinePlain || stripTags(generated.headlineHtml),
    highlight: resolvedTemplate.template.supportsHighlight
      ? generated.highlight
      : null,
    insight: generated.bodyVariant === "insight" ? generated.insight : null,
    template,
  };

  return {
    caption: buildCaption(generated),
    downloadFileName: createDownloadFileName(request.topic),
    ok: true,
    post,
    previewHtml: linkedinPostRenderService.renderLinkedInPostHtml(
      post,
      request.locale,
    ),
  };
}

export const linkedinPostGeneratorService = {
  generateLinkedInPost,
} as const;
