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
  test(`uses the shared CTA gradient for action links in ${theme.name}`, async ({
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

    const selectors = [
      '[class*="usp-section"][class*="replyLabel"]',
      '[class*="usp-section"][class*="replySend"]',
      'a[class*="service-action-cta"] [class*="text-cta"][class*="label"]',
      'a[class*="service-action-cta"] [class*="text-cta"][class*="arrow"]',
      '[class*="reference-teaser"][class*="link"] [class*="text-cta"][class*="label"]',
      '[class*="qna-contact-cta"][class*="link"] [class*="text-cta"][class*="label"]',
      '[class*="contact-consent-field"][class*="link"] [class*="text-cta"][class*="label"]',
    ];
    const readGradients = () =>
      page.evaluate(
        (items) =>
          items.map((selector) => {
            const element = document.querySelector(selector);
            if (!element) throw new Error(`Missing action: ${selector}`);
            return getComputedStyle(element).backgroundImage;
          }),
        selectors,
      );
    const before = await readGradients();
    for (const gradient of before)
      expect(gradient).toContain("linear-gradient");

    await page.evaluate(() => {
      document.documentElement.style.setProperty(
        "--color-highlight-base",
        "#b386b3",
      );
    });
    expect(await readGradients()).toEqual(before);
    await page.evaluate((green) => {
      document.documentElement.style.setProperty("--color-action-base", green);
    }, theme.green);
    const after = await readGradients();
    after.forEach((gradient, index) =>
      expect(gradient).not.toBe(before[index]),
    );

    const privacy = page
      .locator('a[class*="contact-consent-field"][class*="link"]')
      .first();
    await privacy.focus();
    await expect(privacy).toHaveCSS("outline-style", "solid");
    await expect(privacy).toHaveCSS("outline-width", "2px");
    for (const width of [1440, 360]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }

    const choices = page.locator(
      '[class*="services-section"][class*="serviceChip"][aria-pressed]',
    );
    await expect(choices).toHaveCount(3);
    await page.mouse.move(0, 0);
    const selectedChoice = page.locator(
      '[class*="services-section"][aria-pressed="true"]',
    );
    await expect(selectedChoice).toHaveCSS(
      "background-image",
      /linear-gradient/,
    );
    for (const choice of await choices.all()) {
      await choice.hover();
      await expect(choice).toHaveCSS("background-image", /linear-gradient/);
    }

    await page.goto("/de/references");
    const markers = page.locator(
      '[class*="references-hero"][class*="keyword"]',
    );
    await expect(markers).toHaveCount(3);
    for (const marker of await markers.all()) {
      await expect(marker).toHaveCSS("background-image", /linear-gradient/);
      await expect(marker).toHaveCSS("background-repeat", "no-repeat");
    }
  });

  test(`updates informational highlights without changing actions in ${theme.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.addInitScript((name) => {
      localStorage.setItem("invessiv-theme", name);
    }, theme.name);
    await page.goto("/de");
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      theme.name,
    );

    const readColors = () =>
      page.evaluate(() => {
        const css = (selector: string, pseudo?: string) => {
          const element = document.querySelector(selector);
          if (!element) throw new Error(`Missing element: ${selector}`);
          return getComputedStyle(element, pseudo);
        };
        return {
          highlights: {
            trustLabel: css("#hero ul li span").color,
            trustIcon: css("#hero ul li svg").color,
            problemIcon: css('[class*="problem-section"][class*="iconWell"]')
              .color,
            problemIconSurface: css(
              '[class*="problem-section"][class*="iconWell"]',
            ).backgroundColor,
            problemResolution: css(
              '[class*="problem-section"][class*="resolution"]',
            ).color,
            serviceIcon: css('#services [role="img"]').color,
            serviceGlyph: css('#services [class*="iconImageMask"]')
              .backgroundColor,
            serviceTimeGlyph: css('#services [class*="timeIconImage"]')
              .backgroundColor,
            serviceDivider: css('#services [class*="sectionDivider"]')
              .backgroundColor,
            serviceAsideDivider: css("#services aside", "::before")
              .backgroundColor,
            serviceDot: css('#services [class*="titleDot"]').color,
            serviceBullet: css('#services [class*="bulletList"] li', "::before")
              .backgroundColor,
          },
          action: css("#hero a").backgroundImage,
          selection: css('#services button[aria-pressed="true"]')
            .backgroundColor,
        };
      });

    const before = await readColors();
    await page.evaluate(() => {
      document.documentElement.style.setProperty(
        "--color-highlight-base",
        "#bd9ad7",
      );
    });
    const after = await readColors();
    for (const key of Object.keys(before.highlights)) {
      expect(
        Object.entries(after.highlights).find(([name]) => name === key)?.[1],
      ).not.toBe(
        Object.entries(before.highlights).find(([name]) => name === key)?.[1],
      );
    }
    expect(after.action).toBe(before.action);
    expect(after.selection).toBe(before.selection);
  });

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
        await expect(headline).not.toHaveCSS("background-image", "none");
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
    await expect(headline).not.toHaveCSS("background-image", "none");
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

  test(`keeps the headline painted when newer palette variables are unavailable in ${theme.name}`, async ({
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
    await page.evaluate(() => {
      document.documentElement.style.setProperty(
        "--color-brand-primary-muted",
        "initial",
      );
      document.documentElement.style.setProperty(
        "--color-brand-secondary",
        "initial",
      );
    });
    const headline = page.locator("h1 span");
    await expect(headline).not.toHaveCSS("background-image", "none");
    await expect(headline).toHaveCSS("background-clip", "text");
    await expect(headline).not.toHaveCSS("color", "rgba(0, 0, 0, 0)");
    await expect(headline).toBeVisible();
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
    await expect(page.locator("header img").first()).toHaveAttribute(
      "src",
      "/brand/invessiv-logo-mehr-abstand.svg",
    );
    await expect(page.locator("footer img").first()).toHaveAttribute(
      "src",
      "/brand/invessiv-logo-mehr-abstand.svg",
    );
    const readContentColors = () =>
      page.evaluate(() => {
        const css = (selector: string) => {
          const element = document.querySelector(selector);
          if (!element) throw new Error(`Missing element: ${selector}`);
          return getComputedStyle(element);
        };
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas context unavailable");
        context.fillStyle = css('[data-emphasis="usp"]').color;
        context.fillRect(0, 0, 1, 1);
        const highlightRgb = Array.from(context.getImageData(0, 0, 1, 1).data);
        return {
          headline: css("h1 span").backgroundImage,
          visitor: css('[data-author="visitor"] [class*="bubble"]')
            .backgroundColor,
          highlight: css('[data-emphasis="usp"]').color,
          highlightRgb,
          selected: css('#services button[aria-pressed="true"]')
            .backgroundColor,
        };
      });
    const readActionColors = async () => {
      const readBackground = () =>
        primary.evaluate((element) => {
          const css = getComputedStyle(element);
          return { color: css.backgroundColor, image: css.backgroundImage };
        });
      await page.mouse.move(0, 0);
      await primary.evaluate((element) => element.blur());
      const normal = await readBackground();
      await primary.hover();
      const hover = await readBackground();
      await page.mouse.down();
      const active = await readBackground();
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
    expect(beforeContent.highlightRgb[2]).toBeGreaterThan(
      beforeContent.highlightRgb[0],
    );
    const beforeAction = await readActionColors();
    await page.evaluate((green) => {
      document.documentElement.style.setProperty("--color-action-base", green);
    }, theme.green);
    const afterAction = await readActionColors();
    const afterContent = await readContentColors();

    for (const state of ["normal", "hover", "active"] as const) {
      expect(beforeAction[state].image).toContain("linear-gradient");
      expect(afterAction[state].color).not.toBe(beforeAction[state].color);
      expect(afterAction[state].image).not.toBe(beforeAction[state].image);
    }
    expect(afterAction.focus).not.toBe(beforeAction.focus);
    expect(afterAction.focus).toBe(afterAction.normal.color);
    expect(afterContent.selected).not.toBe(beforeContent.selected);
    expect(afterContent.headline).toBe(beforeContent.headline);
    expect(afterContent.visitor).toBe(beforeContent.visitor);
    expect(afterContent.highlight).toBe(beforeContent.highlight);
  });
}
