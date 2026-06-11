import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GENERATOR_TEMPLATES } from "@/common/constants/generator/post/generator-templates";
import { POST_SIZE_PX, RENDER_TIMEOUT_MS } from "@/common/constants/generator";
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
 * Renders the canonical post HTML to a 1080x1080 PNG via a warm Chromium pool.
 * The browser is launched once and reused across requests (launching per
 * request would blow the render budget). Rendering is best-effort: callers
 * treat a thrown error as "no server PNG available" and fall back gracefully.
 */

type PostRenderBrowser = {
  isConnected: () => boolean;
  newContext: (options: {
    deviceScaleFactor: number;
    viewport: { height: number; width: number };
  }) => Promise<{
    close: () => Promise<void>;
    newPage: () => Promise<{
      evaluate: <T>(callback: () => T | Promise<T>) => Promise<T>;
      screenshot: (options: {
        clip: { height: number; width: number; x: number; y: number };
        type: "png";
      }) => Promise<Buffer>;
      setContent: (
        html: string,
        options: { timeout: number; waitUntil: "load" },
      ) => Promise<void>;
    }>;
  }>;
};

type PuppeteerBrowser = {
  connected: boolean;
  newPage: () => Promise<{
    close: () => Promise<void>;
    evaluate: <T>(callback: () => T | Promise<T>) => Promise<T>;
    screenshot: (options: {
      clip: { height: number; width: number; x: number; y: number };
      type: "png";
    }) => Promise<Buffer | Uint8Array>;
    setContent: (
      html: string,
      options: { timeout: number; waitUntil: "load" },
    ) => Promise<void>;
    setViewport: (viewport: {
      deviceScaleFactor: number;
      height: number;
      width: number;
    }) => Promise<void>;
  }>;
};

let browserPromise: Promise<PostRenderBrowser> | null = null;

function isVercelRuntime() {
  return Boolean(process.env.VERCEL);
}

async function createVercelBrowser(): Promise<PostRenderBrowser> {
  const { default: chromium } = await import("@sparticuz/chromium");
  const { default: puppeteer } = await import("puppeteer-core");

  const browser = (await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: "shell",
  })) as PuppeteerBrowser;

  return {
    isConnected: () => browser.connected,
    async newContext({ deviceScaleFactor, viewport }) {
      const page = await browser.newPage();
      await page.setViewport({
        deviceScaleFactor,
        height: viewport.height,
        width: viewport.width,
      });

      return {
        close: () => page.close(),
        newPage: async () => ({
          evaluate: page.evaluate.bind(page),
          screenshot: async (options) => {
            const screenshot = await page.screenshot(options);
            return Buffer.from(screenshot);
          },
          setContent: page.setContent.bind(page),
        }),
      };
    },
  };
}

async function createLocalBrowser(): Promise<PostRenderBrowser> {
  const { chromium } = await import("playwright");
  return chromium.launch({ args: ["--no-sandbox"] });
}

async function getBrowser(): Promise<PostRenderBrowser> {
  if (browserPromise) {
    const existing = await browserPromise.catch(() => null);
    if (existing && existing.isConnected()) {
      return existing;
    }
    browserPromise = null;
  }

  browserPromise = isVercelRuntime()
    ? createVercelBrowser()
    : createLocalBrowser();
  return browserPromise;
}

async function renderLinkedInPostPng(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    deviceScaleFactor: 1,
    viewport: { height: POST_SIZE_PX, width: POST_SIZE_PX },
  });

  try {
    const page = await context.newPage();
    await page.setContent(html, {
      timeout: RENDER_TIMEOUT_MS,
      waitUntil: "load",
    });

    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    return await page.screenshot({
      clip: { height: POST_SIZE_PX, width: POST_SIZE_PX, x: 0, y: 0 },
      type: "png",
    });
  } finally {
    await context.close();
  }
}

export const linkedinPostRenderService = {
  renderLinkedInPostHtml,
  renderLinkedInPostPng,
} as const;
