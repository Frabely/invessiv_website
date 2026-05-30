import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GENERATOR_TEMPLATES } from "@/common/constants/generator/generator-templates";
import type { Locale } from "@/config/i18n";
import { escapeHtml } from "@/server/services/mail/templates/template-utils";
import type { LinkedInPostGeneratorPostDto } from "@/common/contracts/generator";

/**
 * Canonical renderer for the generated LinkedIn post. Loads the structural
 * skeleton chosen for the run (templates/templates-manifest.json) and
 * substitutes the bracket placeholders. This is the single source of truth for
 * the visual — the server PNG render, the mail attachment, and the on-page
 * preview all consume the HTML produced here, so they can never drift apart.
 *
 * `post.headlineHtml` is expected to be already sanitized by the generator
 * service (only <em> pairs preserved). All other user-provided strings are
 * HTML-escaped here at substitution time.
 *
 * Path assumption: `process.cwd()` in Next.js API routes returns the app root
 * (the directory containing `next.config.ts`, i.e. `apps/web/`). This holds
 * when `next dev` / `next build` is invoked from `apps/web/`, which is the
 * project convention. `next.config.ts` `outputFileTracingIncludes` ensures the
 * templates are bundled into standalone output.
 */

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

export function renderLinkedInPostHtml(
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
    .replaceAll("[EXPERTISE]", escapeHtml(post.expertiseDisplay))
    .replaceAll("[HEADLINE]", post.headlineHtml)
    .replaceAll("[BODY_CONTENT]", buildBodyContent(post))
    .replaceAll("[HIGHLIGHT_BLOCK]", buildHighlightBlock(post));
}
