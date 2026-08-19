import { expect, test } from "@playwright/test";

const LANDING_PATH = "/de/services/landing-page";
const PREVIEW_SELECTOR = "[data-testid='coaching-preview-browser']";
const POINTER_ROW_SELECTOR = "#solution li > button";

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
  const firstRow = hydratedPage.locator(POINTER_ROW_SELECTOR).first();
  await firstRow.hover();
  await expect(firstRow).toHaveAttribute("data-active", "true");
  await expect(firstRow).not.toHaveAttribute("aria-expanded", /.*/);
  await expect(
    hydratedPage.locator("[data-testid='coaching-preview-highlight-overlay']"),
  ).toHaveAttribute("data-active", "true");
  const secondRow = hydratedPage.locator(POINTER_ROW_SELECTOR).nth(1);
  await secondRow.hover();
  await expect(firstRow).toHaveAttribute("data-active", "false");
  await expect(secondRow).toHaveAttribute("data-active", "true");
  await secondRow.click();
  await expect(secondRow).not.toHaveAttribute("aria-expanded", /.*/);
  await expect(secondRow).toHaveAttribute("data-active", "true");
  await hydratedPage.mouse.move(0, 0);
  await expect(secondRow).toHaveAttribute("data-active", "true");
  await expect(
    hydratedPage.locator("[data-testid='coaching-preview-highlight-overlay']"),
  ).toHaveAttribute("data-active", "true");
  await secondRow.evaluate((element) => (element as HTMLElement).blur());
  await expect(secondRow).toHaveAttribute("data-active", "false");
  await secondRow.hover();
  await expect(secondRow).toHaveAttribute("data-active", "true");
  const hydratedBox = await hydratedPage
    .locator(PREVIEW_SELECTOR)
    .boundingBox();

  expect(serverBox).not.toBeNull();
  expect(hydratedBox).not.toBeNull();
  expect(hydratedBox?.width).toBeCloseTo(serverBox?.width ?? 0, 1);
  expect(hydratedBox?.height).toBeCloseTo(serverBox?.height ?? 0, 1);

  await hydratedPage.evaluate(() => window.scrollTo({ top: 0 }));
  await expect(secondRow).toHaveAttribute("data-active", "false");
  await expect(
    hydratedPage.locator("[data-testid='coaching-preview-highlight-overlay']"),
  ).toHaveAttribute("data-active", "false");
  await hydratedContext.close();
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
  const preview = page.locator(PREVIEW_SELECTOR);
  const previewBox = await preview.boundingBox();
  const solutionBox = await page.locator("#solution").boundingBox();

  expect(videoRequests).toEqual([]);
  expect(heroBox).not.toBeNull();
  expect(heroTrustBox).not.toBeNull();
  expect(previewBox).toBeNull();
  expect(solutionBox).not.toBeNull();
  expect(solutionBox?.y).toBeGreaterThan(
    (heroTrustBox?.y ?? 0) + (heroTrustBox?.height ?? 0),
  );

  const formRow = page.locator("#solution button").last();
  await formRow.scrollIntoViewIfNeeded();
  await formRow.click();

  await expect(formRow).toHaveAttribute("aria-expanded", "true");
  await expect(formRow).toHaveAttribute("data-active", "true");
  await expect(formRow).toBeFocused();
  await expect(preview).toBeVisible();
  await expect(page.locator(PREVIEW_SELECTOR)).toHaveCount(1);
  const controlledPanelId = await formRow.getAttribute("aria-controls");
  expect(controlledPanelId).not.toBeNull();
  await expect(
    page.locator(`#${controlledPanelId} ${PREVIEW_SELECTOR}`),
  ).toHaveCount(1);

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
  await expect(formRow).toHaveAttribute("aria-expanded", "true");
  await expect(formRow).toHaveAttribute("data-active", "true");

  const track = page.locator("[data-preview-page]").locator("..");
  const panBeforePageScroll = await track.evaluate((element) =>
    (element as HTMLElement).style.getPropertyValue("--preview-pan"),
  );

  await page.locator("#hero").scrollIntoViewIfNeeded();
  await expect(
    page.locator("[data-testid='coaching-preview-highlight-overlay']"),
  ).toHaveAttribute("data-active", "true");
  await expect(formRow).toHaveAttribute("data-active", "true");
  await expect
    .poll(() =>
      track.evaluate((element) =>
        (element as HTMLElement).style.getPropertyValue("--preview-pan"),
      ),
    )
    .toBe(panBeforePageScroll);

  const firstRow = page.locator("#solution button").first();
  await firstRow.scrollIntoViewIfNeeded();
  await firstRow.click();
  await expect(firstRow).toHaveAttribute("aria-expanded", "true");

  await expect
    .poll(() =>
      page.evaluate(() => {
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
      }),
    )
    .toBe(true);
});

test("reveals one mobile preview directly below the selected row", async ({
  page,
}) => {
  await page.setViewportSize({ height: 932, width: 430 });
  await page.goto(LANDING_PATH);
  const rejectCookies = page.getByRole("button", { name: "Ablehnen" });
  if (await rejectCookies.isVisible()) {
    await rejectCookies.click();
  }

  const preview = page.locator(PREVIEW_SELECTOR);
  expect(await preview.boundingBox()).toBeNull();

  const firstRow = page.locator("#solution li > button").first();
  await firstRow.scrollIntoViewIfNeeded();
  await firstRow.click();
  await expect(firstRow).toHaveAttribute("aria-expanded", "true");
  await expect(preview).toBeVisible();
  await expect(page.locator(PREVIEW_SELECTOR)).toHaveCount(1);

  const rowBox = await firstRow.boundingBox();
  const revealedPreviewBox = await preview.boundingBox();
  expect(rowBox).not.toBeNull();
  expect(revealedPreviewBox).not.toBeNull();
  expect(revealedPreviewBox?.y).toBeGreaterThanOrEqual(
    (rowBox?.y ?? 0) + (rowBox?.height ?? 0),
  );
  const controlledPanelId = await firstRow.getAttribute("aria-controls");
  expect(controlledPanelId).not.toBeNull();
  await expect(page.locator(`#${controlledPanelId}`)).toBeVisible();
});
