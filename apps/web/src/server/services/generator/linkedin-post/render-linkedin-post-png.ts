import "server-only";
import { type Browser, chromium } from "playwright";
import { POST_SIZE_PX, RENDER_TIMEOUT_MS } from "@/common/constants/generator";

/**
 * Renders the canonical post HTML to a 1080x1080 PNG via a warm Chromium pool.
 * The browser is launched once and reused across requests (launching per
 * request would blow the render budget). Rendering is best-effort: callers
 * treat a thrown error as "no server PNG available" and fall back gracefully.
 */

let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserPromise) {
    const existing = await browserPromise.catch(() => null);
    if (existing && existing.isConnected()) {
      return existing;
    }
    browserPromise = null;
  }

  browserPromise = chromium.launch({ args: ["--no-sandbox"] });
  return browserPromise;
}

export async function renderLinkedInPostPng(html: string): Promise<Buffer> {
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
