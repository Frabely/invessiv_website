import { expect, test } from "@playwright/test";

const LANDING_PATH = "/de/services/landing-page";
const PREVIEW_SELECTOR = "[data-testid='coaching-preview-browser']";

test("keeps the preview geometry stable across hydration", async ({
  browser,
}) => {
  const baseURL = test.info().project.use.baseURL as string;
  const viewport = { height: 1080, width: 1920 };
  const serverContext = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport,
  });
  const serverPage = await serverContext.newPage();
  await serverPage.goto(LANDING_PATH);
  const serverBox = await serverPage.locator(PREVIEW_SELECTOR).boundingBox();
  await serverContext.close();

  const hydratedContext = await browser.newContext({ baseURL, viewport });
  const hydratedPage = await hydratedContext.newPage();
  await hydratedPage.goto(LANDING_PATH);
  const firstRow = hydratedPage.locator("#solution button").first();
  await firstRow.click();
  await expect(firstRow).toHaveAttribute("aria-pressed", "true");
  await expect(
    hydratedPage.locator("[data-testid='coaching-preview-highlight-overlay']"),
  ).toHaveAttribute("data-active", "true");
  const hydratedBox = await hydratedPage
    .locator(PREVIEW_SELECTOR)
    .boundingBox();
  await hydratedContext.close();

  expect(serverBox).not.toBeNull();
  expect(hydratedBox).not.toBeNull();
  expect(hydratedBox?.width).toBeCloseTo(serverBox?.width ?? 0, 1);
  expect(hydratedBox?.height).toBeCloseTo(serverBox?.height ?? 0, 1);
});

test("keeps first highlight, focus, and persistent selection synchronized", async ({
  page,
}) => {
  const videoRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith(".mp4")) {
      videoRequests.push(request.url());
    }
  });
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto(LANDING_PATH);
  await page.getByRole("button", { name: "Ablehnen" }).click();

  const heroBox = await page.locator("#hero").boundingBox();
  const heroTrustBox = await page.locator("#hero p").last().boundingBox();
  const previewBox = await page.locator(PREVIEW_SELECTOR).boundingBox();
  const solutionBox = await page.locator("#solution").boundingBox();

  expect(videoRequests).toEqual([]);
  expect(heroBox).not.toBeNull();
  expect(heroTrustBox).not.toBeNull();
  expect(previewBox).not.toBeNull();
  expect(solutionBox).not.toBeNull();
  expect(previewBox?.x).toBeLessThan(15);
  expect(previewBox?.width).toBeGreaterThan(360);
  expect(previewBox?.y).toBeGreaterThan(
    (heroBox?.y ?? 0) + (heroBox?.height ?? 0),
  );
  expect(previewBox?.y).toBeLessThan(844);
  expect(previewBox?.y).toBeGreaterThan(
    (heroTrustBox?.y ?? 0) + (heroTrustBox?.height ?? 0) + 16,
  );
  expect((previewBox?.y ?? 0) + (previewBox?.height ?? 0)).toBeGreaterThan(844);
  expect((previewBox?.y ?? 0) + (previewBox?.height ?? 0)).toBeLessThan(934);
  expect((844 - (previewBox?.y ?? 0)) / (previewBox?.height ?? 1)).toBeCloseTo(
    0.75,
    1,
  );
  expect(solutionBox?.y).toBeGreaterThan(
    (previewBox?.y ?? 0) + (previewBox?.height ?? 0),
  );

  const formRow = page.locator("#solution button").last();
  await formRow.scrollIntoViewIfNeeded();
  await formRow.click();

  await expect(formRow).toHaveAttribute("aria-pressed", "true");
  await expect(formRow).toHaveAttribute("data-active", "true");
  await expect(formRow).toBeFocused();

  const initialDelta = await page.evaluate(() => {
    const anchor = document.querySelector<HTMLElement>(
      '[data-preview-anchor="form"]',
    );
    const ring = document.querySelector<HTMLElement>(
      '[data-testid="coaching-preview-highlight-ring"]',
    );

    if (!anchor || !ring) {
      return Number.POSITIVE_INFINITY;
    }

    const anchorRect = anchor.getBoundingClientRect();
    const ringRect = ring.getBoundingClientRect();
    const anchorCenter = anchorRect.top + anchorRect.height / 2;
    const ringCenter = ringRect.top + ringRect.height / 2;

    return Math.abs(anchorCenter - ringCenter);
  });

  expect(initialDelta).toBeLessThan(1);

  await formRow.hover();
  await page.mouse.move(0, 0);

  await expect(formRow).toBeFocused();
  await expect(formRow).toHaveAttribute("aria-pressed", "true");
  await expect(formRow).toHaveAttribute("data-active", "true");

  await page.locator("#hero").scrollIntoViewIfNeeded();
  await expect(
    page.locator("[data-testid='coaching-preview-highlight-overlay']"),
  ).toHaveAttribute("data-active", "false");

  const firstRow = page.locator("#solution button").first();
  await firstRow.scrollIntoViewIfNeeded();
  await firstRow.click();
  await expect(firstRow).toHaveAttribute("aria-pressed", "true");

  const headlineIsVisible = await page.evaluate(() => {
    const track = document
      .querySelector<HTMLElement>("[data-preview-page]")
      ?.parentElement?.getBoundingClientRect();
    const headline = document
      .querySelector<HTMLElement>('[data-preview-anchor="headline"]')
      ?.getBoundingClientRect();

    if (!track || !headline) {
      return false;
    }

    const visibleTop = Math.max(0, track.top);
    const visibleBottom = Math.min(window.innerHeight, track.bottom);
    const headlineCenter = headline.top + headline.height / 2;

    return headlineCenter >= visibleTop && headlineCenter <= visibleBottom;
  });

  expect(headlineIsVisible).toBe(true);
});

test("keeps one quarter of the mobile preview below a tall viewport", async ({
  page,
}) => {
  await page.setViewportSize({ height: 932, width: 430 });
  await page.goto(LANDING_PATH);

  const previewBox = await page.locator(PREVIEW_SELECTOR).boundingBox();
  const headerBox = await page.locator("header").first().boundingBox();
  const headingBox = await page.locator("#hero h1").boundingBox();
  const trustBox = await page.locator("#hero p").last().boundingBox();

  expect(previewBox).not.toBeNull();
  expect(headerBox).not.toBeNull();
  expect(headingBox).not.toBeNull();
  expect(trustBox).not.toBeNull();
  expect(
    (headingBox?.y ?? 0) - ((headerBox?.y ?? 0) + (headerBox?.height ?? 0)),
  ).toBeGreaterThan(48);
  expect(previewBox?.y).toBeGreaterThan(
    (trustBox?.y ?? 0) + (trustBox?.height ?? 0) + 16,
  );
  const visiblePreviewShare =
    (932 - (previewBox?.y ?? 0)) / (previewBox?.height ?? 1);

  expect(visiblePreviewShare).toBeGreaterThan(0.68);
  expect(visiblePreviewShare).toBeLessThan(0.73);
});
