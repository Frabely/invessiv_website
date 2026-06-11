import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { LinkedInPostGeneratorPostDto } from "@/common/contracts/generator";
import { GENERATOR_TEMPLATES } from "@/common/constants/generator/post/generator-templates";
import type { Locale } from "@/config/i18n";
import { escapeHtml } from "@/server/services/mail/templates/template-utils";

const TEMPLATES_DIR = join(
  process.cwd(),
  "project-skills",
  "linkedin-post-generator",
  "templates",
);

const templateCache = new Map<string, string>();

function loadTemplate(fileName: string) {
  const cached = templateCache.get(fileName);
  if (cached) {
    return cached;
  }

  const html = readFileSync(join(TEMPLATES_DIR, fileName), "utf8");
  templateCache.set(fileName, html);
  return html;
}

function resolveTemplateFile(templateId: string) {
  const template = GENERATOR_TEMPLATES.find((item) => item.id === templateId);
  if (!template) {
    throw new Error(`unknown_template:${templateId}`);
  }
  return template.file;
}

function buildBodyContent(post: LinkedInPostGeneratorPostDto) {
  if (post.bodyVariant === "bullets" && post.bullets) {
    const items = post.bullets
      .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
      .join("");
    return `<ul class="post__bullets">${items}</ul>`;
  }

  return `<p class="post__insight">${escapeHtml(post.insight ?? "")}</p>`;
}

function buildHighlightBlock(post: LinkedInPostGeneratorPostDto) {
  if (!post.highlight) {
    return "";
  }
  return `<p class="post__highlight">${escapeHtml(post.highlight)}</p>`;
}

function renderLinkedInPostHtml(
  post: LinkedInPostGeneratorPostDto,
  locale: Locale,
) {
  const skeleton = loadTemplate(resolveTemplateFile(post.template.id));

  return skeleton
    .replaceAll("[LOCALE]", locale)
    .replaceAll("[BG_START]", post.colorPair.primary)
    .replaceAll("[BG_END]", post.colorPair.secondary)
    .replaceAll("[TEXT]", post.colorPair.text)
    .replaceAll("[ACCENT]", post.colorPair.accent)
    .replaceAll("[KICKER]", escapeHtml(post.kicker))
    .replaceAll("[HEADLINE]", post.headlineHtml)
    .replaceAll("[BODY_CONTENT]", buildBodyContent(post))
    .replaceAll("[HIGHLIGHT_BLOCK]", buildHighlightBlock(post));
}

export const linkedinPostHtmlRenderService = {
  renderLinkedInPostHtml,
} as const;
