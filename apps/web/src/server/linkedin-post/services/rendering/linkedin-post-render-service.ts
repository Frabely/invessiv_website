import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GENERATOR_TEMPLATES } from "@/common/constants/generator/post/generator-templates";
import { POST_SIZE_PX } from "@/common/constants/generator";
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

/**
 * Renders the canonical post to a 1080x1080 PNG without a browser. The server
 * path deliberately uses SVG + Resvg instead of Chromium/Playwright/Puppeteer
 * so Vercel deployments do not depend on a bundled browser binary.
 */

type SvgTextLine = {
  text: string;
  x: number;
  y: number;
  size: number;
  fill: string;
  weight?: number;
  anchor?: "start" | "middle";
};

function escapeSvg(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapText(value: string, maxChars: number, maxLines: number) {
  const words = value.trim().split(/\s+/u).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }
    current = word;

    if (lines.length >= maxLines) {
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  return lines;
}

function renderTextLine(line: SvgTextLine) {
  return `<text x="${line.x}" y="${line.y}" fill="${line.fill}" font-family="Arial, Helvetica, sans-serif" font-size="${line.size}" font-weight="${line.weight ?? 500}" letter-spacing="0" text-anchor="${line.anchor ?? "start"}">${escapeSvg(line.text)}</text>`;
}

function renderWrappedText({
  anchor,
  fill,
  lineHeight,
  lines,
  size,
  weight,
  x,
  y,
}: {
  anchor?: "start" | "middle";
  fill: string;
  lineHeight: number;
  lines: string[];
  size: number;
  weight?: number;
  x: number;
  y: number;
}) {
  return lines
    .map((line, index) =>
      renderTextLine({
        anchor,
        fill,
        size,
        text: line,
        weight,
        x,
        y: y + index * lineHeight,
      }),
    )
    .join("");
}

function renderBullets(
  post: LinkedInPostGeneratorPostDto,
  x: number,
  y: number,
) {
  return (post.bullets ?? [])
    .slice(0, 3)
    .map((bullet, index) => {
      const itemY = y + index * 112;
      const lines = wrapText(bullet, 34, 2);
      return `
        <circle cx="${x}" cy="${itemY - 12}" r="17" fill="${post.colorPair.accent}" opacity="0.95" />
        <path d="M${x - 7} ${itemY - 12} L${x - 1} ${itemY - 5} L${x + 10} ${itemY - 20}" fill="none" stroke="#101010" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        ${renderWrappedText({
          fill: post.colorPair.text,
          lineHeight: 36,
          lines,
          size: 30,
          weight: 680,
          x: x + 44,
          y: itemY,
        })}
      `;
    })
    .join("");
}

function renderBaseSvg(post: LinkedInPostGeneratorPostDto, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${POST_SIZE_PX}" height="${POST_SIZE_PX}" viewBox="0 0 ${POST_SIZE_PX} ${POST_SIZE_PX}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${post.colorPair.primary}" />
        <stop offset="100%" stop-color="${post.colorPair.secondary}" />
      </linearGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="26" stdDeviation="32" flood-color="#000000" flood-opacity="0.28" />
      </filter>
    </defs>
    <rect width="${POST_SIZE_PX}" height="${POST_SIZE_PX}" fill="url(#bg)" />
    <circle cx="920" cy="120" r="210" fill="${post.colorPair.accent}" opacity="0.16" />
    <circle cx="80" cy="980" r="260" fill="${post.colorPair.accent}" opacity="0.1" />
    ${body}
  </svg>`;
}

function renderEditorialCenterSvg(post: LinkedInPostGeneratorPostDto) {
  const headline = wrapText(post.headlinePlain, 18, 3);
  const insight = wrapText(post.insight ?? post.highlight ?? "", 42, 3);

  return renderBaseSvg(
    post,
    `
      <rect x="128" y="142" width="824" height="796" rx="34" fill="rgba(255,255,255,0.09)" filter="url(#softShadow)" />
      <rect x="214" y="222" width="652" height="4" rx="2" fill="${post.colorPair.accent}" />
      ${renderTextLine({
        anchor: "middle",
        fill: post.colorPair.accent,
        size: 28,
        text: post.kicker.toUpperCase(),
        weight: 760,
        x: 540,
        y: 292,
      })}
      ${renderWrappedText({
        anchor: "middle",
        fill: post.colorPair.text,
        lineHeight: 96,
        lines: headline,
        size: 78,
        weight: 820,
        x: 540,
        y: 420,
      })}
      ${renderWrappedText({
        anchor: "middle",
        fill: post.colorPair.text,
        lineHeight: 42,
        lines: insight,
        size: 32,
        weight: 540,
        x: 540,
        y: 735,
      })}
      ${
        post.highlight
          ? renderTextLine({
              anchor: "middle",
              fill: post.colorPair.accent,
              size: 30,
              text: post.highlight,
              weight: 760,
              x: 540,
              y: 850,
            })
          : ""
      }
    `,
  );
}

function renderLeftRailSvg(post: LinkedInPostGeneratorPostDto) {
  const headline = wrapText(post.headlinePlain, 19, 4);
  const insight = wrapText(post.insight ?? post.highlight ?? "", 34, 3);

  return renderBaseSvg(
    post,
    `
      <rect x="90" y="96" width="18" height="888" rx="9" fill="${post.colorPair.accent}" />
      ${renderTextLine({
        fill: post.colorPair.accent,
        size: 30,
        text: post.kicker.toUpperCase(),
        weight: 780,
        x: 170,
        y: 185,
      })}
      ${renderWrappedText({
        fill: post.colorPair.text,
        lineHeight: 88,
        lines: headline,
        size: 72,
        weight: 820,
        x: 170,
        y: 318,
      })}
      <rect x="170" y="730" width="704" height="158" rx="28" fill="rgba(255,255,255,0.1)" />
      ${renderWrappedText({
        fill: post.colorPair.text,
        lineHeight: 38,
        lines: insight,
        size: 30,
        weight: 560,
        x: 214,
        y: 790,
      })}
      ${
        post.highlight
          ? renderTextLine({
              fill: post.colorPair.accent,
              size: 28,
              text: post.highlight,
              weight: 760,
              x: 214,
              y: 910,
            })
          : ""
      }
    `,
  );
}

function renderStatementSvg(post: LinkedInPostGeneratorPostDto) {
  const headline = wrapText(post.headlinePlain, 16, 4);
  const insight = wrapText(post.insight ?? "", 36, 2);

  return renderBaseSvg(
    post,
    `
      ${renderTextLine({
        anchor: "middle",
        fill: post.colorPair.accent,
        size: 30,
        text: post.kicker.toUpperCase(),
        weight: 780,
        x: 540,
        y: 190,
      })}
      ${renderWrappedText({
        anchor: "middle",
        fill: post.colorPair.text,
        lineHeight: 102,
        lines: headline,
        size: 84,
        weight: 850,
        x: 540,
        y: 350,
      })}
      <rect x="332" y="765" width="416" height="5" rx="3" fill="${post.colorPair.accent}" />
      ${renderWrappedText({
        anchor: "middle",
        fill: post.colorPair.text,
        lineHeight: 40,
        lines: insight,
        size: 30,
        weight: 540,
        x: 540,
        y: 845,
      })}
    `,
  );
}

function renderBulletStackSvg(post: LinkedInPostGeneratorPostDto) {
  const headline = wrapText(post.headlinePlain, 19, 3);

  return renderBaseSvg(
    post,
    `
      ${renderTextLine({
        fill: post.colorPair.accent,
        size: 28,
        text: post.kicker.toUpperCase(),
        weight: 780,
        x: 120,
        y: 152,
      })}
      ${renderWrappedText({
        fill: post.colorPair.text,
        lineHeight: 78,
        lines: headline,
        size: 64,
        weight: 830,
        x: 120,
        y: 272,
      })}
      <rect x="112" y="570" width="856" height="360" rx="34" fill="rgba(255,255,255,0.1)" filter="url(#softShadow)" />
      ${renderBullets(post, 172, 654)}
    `,
  );
}

function renderIndexChecklistSvg(post: LinkedInPostGeneratorPostDto) {
  const headline = wrapText(post.headlinePlain, 20, 3);
  const bullets = (post.bullets ?? []).slice(0, 3);

  return renderBaseSvg(
    post,
    `
      ${renderTextLine({
        fill: post.colorPair.accent,
        size: 28,
        text: post.kicker.toUpperCase(),
        weight: 780,
        x: 118,
        y: 150,
      })}
      ${renderWrappedText({
        fill: post.colorPair.text,
        lineHeight: 76,
        lines: headline,
        size: 62,
        weight: 830,
        x: 118,
        y: 270,
      })}
      ${bullets
        .map((bullet, index) => {
          const y = 588 + index * 118;
          return `
            <text x="126" y="${y}" fill="${post.colorPair.accent}" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="840">0${index + 1}</text>
            ${renderWrappedText({
              fill: post.colorPair.text,
              lineHeight: 34,
              lines: wrapText(bullet, 38, 2),
              size: 29,
              weight: 650,
              x: 220,
              y,
            })}
          `;
        })
        .join("")}
    `,
  );
}

function renderLinkedInPostSvg(post: LinkedInPostGeneratorPostDto) {
  switch (post.template.id) {
    case "left-rail":
      return renderLeftRailSvg(post);
    case "statement":
      return renderStatementSvg(post);
    case "bullet-stack":
      return renderBulletStackSvg(post);
    case "index-checklist":
      return renderIndexChecklistSvg(post);
    case "editorial-center":
    default:
      return renderEditorialCenterSvg(post);
  }
}

async function renderLinkedInPostPng(
  post: LinkedInPostGeneratorPostDto,
): Promise<Buffer> {
  const { Resvg } = await import("@resvg/resvg-js");
  const svg = renderLinkedInPostSvg(post);
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: POST_SIZE_PX,
    },
    font: {
      loadSystemFonts: true,
    },
  });
  return Buffer.from(resvg.render().asPng());
}

export const linkedinPostRenderService = {
  renderLinkedInPostHtml,
  renderLinkedInPostPng,
  renderLinkedInPostSvg,
} as const;
