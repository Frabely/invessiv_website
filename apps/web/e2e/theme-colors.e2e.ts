import { expect, test } from "@playwright/test";

const THEMES = [
  { name: "dark", green: "#8dc8a2" },
  { name: "light", green: "#28784e" },
];

const GRADIENT_PAGES = [
  "/de/services/landing-page",
  "/de/services/linkedin-post",
  "/de/references",
];

for (const theme of THEMES) {
  for (const route of GRADIENT_PAGES) {
    test(`shares the animated headline on ${route} in ${theme.name}`, async ({
      page,
    }) => {
      await page.addInitScript((name) => {
        localStorage.setItem("invessiv-theme", name);
      }, theme.name);
      for (const width of [1440, 360]) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await page.goto(route);
        await expect(page.locator("html")).toHaveAttribute(
          "data-theme",
          theme.name,
        );
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
        const headline = page.locator("h1 span");
        await expect(headline).toHaveCSS("background-clip", "text");
        await expect(headline).toHaveCSS("background-size", "180% 180%");
        await expect(headline).toHaveCSS("animation-duration", "5s");
        const position = await headline.evaluate(
          (element) => getComputedStyle(element).backgroundPosition,
        );
        await expect
          .poll(() =>
            headline.evaluate(
              (element) => getComputedStyle(element).backgroundPosition,
            ),
          )
          .not.toBe(position);
        await page.emulateMedia({ reducedMotion: "reduce" });
        await expect(headline).toHaveCSS("animation-name", "none");
        await expect(headline).toHaveCSS("background-clip", "text");
      }
    });
  }

  test(`clips the animated headline to its text and keeps a two-color process line in ${theme.name}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.addInitScript((name) => {
      localStorage.setItem("invessiv-theme", name);
    }, theme.name);
    await page.goto("/de");
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      theme.name,
    );

    const headline = page.locator("h1 span");
    await expect(headline).toHaveCSS("background-clip", "text");
    await expect(headline).toHaveCSS("background-size", "180% 180%");
    await expect(headline).toHaveCSS(
      "-webkit-text-fill-color",
      "rgba(0, 0, 0, 0)",
    );
    const position = await headline.evaluate(
      (element) => getComputedStyle(element).backgroundPosition,
    );
    await expect
      .poll(() =>
        headline.evaluate(
          (element) => getComputedStyle(element).backgroundPosition,
        ),
      )
      .not.toBe(position);

    const stops = page.locator("#processJourneyGradient stop");
    await expect(stops).toHaveCount(2);
    const start = await stops
      .first()
      .evaluate((element) => getComputedStyle(element).stopColor);
    const end = await stops
      .last()
      .evaluate((element) => getComputedStyle(element).stopColor);
    expect(end).not.toBe(start);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(headline).toHaveCSS("animation-name", "none");
    await expect(headline).toHaveCSS("background-clip", "text");
  });

  test(`propagates an action color change without recoloring the brand in ${theme.name}`, async ({
    page,
  }) => {
    await page.addInitScript((name) => {
      localStorage.setItem("invessiv-theme", name);
    }, theme.name);
    await page.goto("/de");
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      theme.name,
    );
    await page.addStyleTag({
      content:
        "* { transition: none !important; animation-play-state: paused !important; }",
    });

    const primary = page
      .locator("main section")
      .first()
      .getByRole("link")
      .first();
    const readContentColors = () =>
      page.evaluate(() => {
        const css = (selector: string) => {
          const element = document.querySelector(selector);
          if (!element) throw new Error(`Missing element: ${selector}`);
          return getComputedStyle(element);
        };
        return {
          headline: css("h1 span").backgroundImage,
          visitor: css('[data-author="visitor"] [class*="bubble"]')
            .backgroundColor,
          highlight: css('[data-emphasis="usp"]').color,
          selected: css('#services button[aria-pressed="true"]')
            .backgroundColor,
        };
      });
    const readActionColors = async () => {
      await page.mouse.move(0, 0);
      await primary.evaluate((element) => element.blur());
      const normal = await primary.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      await primary.hover();
      const hover = await primary.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      await page.mouse.down();
      const active = await primary.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      // Release outside the link so the color check never follows its CTA.
      await page.mouse.move(0, 0);
      await page.mouse.up();
      await primary.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(primary).toBeFocused();
      const focus = await primary.evaluate(
        (element) => getComputedStyle(element).outlineColor,
      );
      return { normal, hover, active, focus };
    };

    const beforeContent = await readContentColors();
    const beforeAction = await readActionColors();
    await page.evaluate((green) => {
      document.documentElement.style.setProperty("--color-action-base", green);
    }, theme.green);
    const afterAction = await readActionColors();
    const afterContent = await readContentColors();

    expect(afterAction.normal).not.toBe(beforeAction.normal);
    expect(afterAction.hover).not.toBe(beforeAction.hover);
    expect(afterAction.active).not.toBe(beforeAction.active);
    expect(afterAction.focus).not.toBe(beforeAction.focus);
    expect(afterAction.focus).toBe(afterAction.normal);
    expect(afterContent.selected).not.toBe(beforeContent.selected);
    expect(afterContent.headline).toBe(beforeContent.headline);
    expect(afterContent.visitor).toBe(beforeContent.visitor);
    expect(afterContent.highlight).toBe(beforeContent.highlight);
  });
}
