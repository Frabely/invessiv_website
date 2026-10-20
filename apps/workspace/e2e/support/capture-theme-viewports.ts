import { expect, type Page, type TestInfo } from "@playwright/test";

/** Screenshots are visual-review artifacts; horizontal overflow is asserted on every view. */
export async function captureThemeViewports(
  page: Page,
  testInfo: TestInfo,
  artifactName: string,
  prepareAction?: () => Promise<void>,
) {
  const originalTheme = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    colorScheme: document.documentElement.style.colorScheme,
  }));
  const originalViewport = page.viewportSize();
  try {
    for (const theme of ["dark", "light"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
        // Match next-themes: native dialogs and controls also use the selected color scheme.
        document.documentElement.style.colorScheme = value;
      }, theme);
      for (const viewport of [
        { width: 1440, height: 1000 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(viewport);
        await prepareAction?.();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
        await page.screenshot({
          animations: "disabled",
          path: testInfo.outputPath(
            `${artifactName}-${theme}-${viewport.width}.png`,
          ),
        });
      }
    }
  } finally {
    await page.evaluate(({ theme, colorScheme }) => {
      if (theme === undefined) delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = colorScheme;
    }, originalTheme);
    if (originalViewport) await page.setViewportSize(originalViewport);
  }
}
