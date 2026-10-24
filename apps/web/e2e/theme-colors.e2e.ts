import { expect, test } from "@playwright/test";

const THEMES = [
  { name: "dark", green: "#8dc8a2" },
  { name: "light", green: "#28784e" },
];

for (const theme of THEMES) {
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
