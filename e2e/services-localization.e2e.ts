import { expect, test } from "@playwright/test";

type LocaleExpectation = {
  aiTitle: string;
  detailsLabel: string;
  imprintHref: "/de/imprint" | "/en/imprint";
  heading: string;
  htmlLang: "de" | "en";
  localePath: "/de" | "/en";
  navAriaLabel: string;
  oneTimeLabel: string;
  privacyHref: "/de/privacy" | "/en/privacy";
  recommendedBadge: string;
  skipLinkLabel: string;
  termsHref: "/de/terms" | "/en/terms";
};

const LOCALE_EXPECTATIONS: LocaleExpectation[] = [
  {
    localePath: "/de",
    htmlLang: "de",
    imprintHref: "/de/imprint",
    heading: "Angebote & Einstiegspreise",
    aiTitle: "KI-Templates & Agents",
    detailsLabel: "Mehr Infos",
    oneTimeLabel: "einmalig",
    recommendedBadge: "Empfohlen",
    navAriaLabel: "Hauptnavigation",
    privacyHref: "/de/privacy",
    skipLinkLabel: "Direkt zum Hauptinhalt springen",
    termsHref: "/de/terms",
  },
  {
    localePath: "/en",
    htmlLang: "en",
    imprintHref: "/en/imprint",
    heading: "Offers & Starting Prices",
    aiTitle: "AI templates & agents",
    detailsLabel: "More details",
    oneTimeLabel: "one-time",
    recommendedBadge: "Recommended",
    navAriaLabel: "Primary navigation",
    privacyHref: "/en/privacy",
    skipLinkLabel: "Skip to main content",
    termsHref: "/en/terms",
  },
];

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
];

test("root permanently redirects to /de", async ({ request }) => {
  const response = await request.get("/", { maxRedirects: 0 });

  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/de");
});

for (const expectations of LOCALE_EXPECTATIONS) {
  test(`server metadata is correct for ${expectations.localePath}`, async ({
    request,
  }) => {
    const response = await request.get(expectations.localePath);
    const html = await response.text();

    expect(response.ok()).toBeTruthy();
    expect(html).toContain(`lang="${expectations.htmlLang}"`);
    expect(html).toContain('rel="canonical"');
    expect(html).toContain("property=\"og:image\"");
    expect(html).toContain("name=\"twitter:image\"");
    expect(html).toContain("/opengraph-image");
    expect(html).toContain('name="description"');
  });

  test(`services section, metadata, and links are correct for ${expectations.localePath}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(expectations.localePath);

    await expect(page.locator("html")).toHaveAttribute(
      "lang",
      expectations.htmlLang,
    );
    await expect(
      page.getByRole("navigation", { name: expectations.navAriaLabel }),
    ).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page.locator('link[rel="canonical"]'),
    ).toHaveAttribute("href", new RegExp(`${expectations.localePath}$`));
    await expect(
      page.locator('meta[property="og:image"]'),
    ).toHaveAttribute("content", /opengraph-image/);
    await expect(
      page.locator('meta[name="twitter:image"]'),
    ).toHaveAttribute("content", /opengraph-image/);
    await expect(
      page.locator(`#footer a[href="${expectations.imprintHref}"]`).first(),
    ).toBeVisible();
    await expect(
      page.locator(`#footer a[href="${expectations.privacyHref}"]`).first(),
    ).toBeVisible();
    await expect(
      page.locator(`#footer a[href="${expectations.termsHref}"]`).first(),
    ).toBeVisible();

    const servicesSection = page.locator("#services");
    await servicesSection.scrollIntoViewIfNeeded();

    await expect(servicesSection.getByRole("heading", { level: 2 })).toHaveText(
      expectations.heading,
    );
    await expect(servicesSection.locator(".services-card")).toHaveCount(6);
    await expect(
      servicesSection.getByRole("heading", { name: expectations.aiTitle }),
    ).toBeVisible();
    await expect(
      servicesSection.locator(".services-price-meta").first(),
    ).toHaveText(expectations.oneTimeLabel);
    await expect(
      servicesSection.getByText(expectations.recommendedBadge, { exact: true }),
    ).toBeVisible();

    const landingCard = servicesSection.locator(".services-card").first();
    await landingCard
      .getByRole("button", { name: expectations.detailsLabel })
      .click();

    await expect(landingCard.locator('a[href="#contact"]').first()).toBeVisible();
    await expect(landingCard.locator('a[href="#faq"]').first()).toBeVisible();

    const missingAnchorTargets = await page.evaluate((localePath) => {
      const uniqueTargets = [
        ...new Set(
          Array.from(
            document.querySelectorAll(`a[href^="#"], a[href^="${localePath}#"]`),
          )
            .map((anchor) => anchor.getAttribute("href"))
            .filter((href): href is string => Boolean(href)),
        ),
      ];

      return uniqueTargets.filter((href) => {
        const target = href.startsWith(localePath) ? href.slice(localePath.length) : href;
        return Boolean(target) && !document.querySelector(target);
      });
    }, expectations.localePath);

    expect(missingAnchorTargets).toEqual([]);
  });

  test(`skip link, mobile menu, and overflow checks pass for ${expectations.localePath}`, async ({
    page,
  }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto(expectations.localePath);

      if (viewport.width === 390) {
        await page.keyboard.press("Tab");
        const skipLink = page.locator(".skip-link");
        await expect(skipLink).toBeFocused();
        await expect(skipLink).toHaveText(expectations.skipLinkLabel);
      }

      const pageOverflow = await page.evaluate(() => {
        return {
          bodyScrollWidth: document.body.scrollWidth,
          documentScrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        };
      });

      expect(
        Math.max(pageOverflow.bodyScrollWidth, pageOverflow.documentScrollWidth),
      ).toBeLessThanOrEqual(pageOverflow.innerWidth + 1);

      if (viewport.width === 390) {
        await page.locator(".site-header__mobile-menu > summary").click();

        const mobileMenu = page.locator(".site-header__mobile-menu[open] ul");
        await expect(mobileMenu).toBeVisible();
        await expect(mobileMenu.getByRole("link").first()).toBeVisible();

        const menuOverflow = await mobileMenu.evaluate((menu) => ({
          clientWidth: menu.clientWidth,
          scrollWidth: menu.scrollWidth,
        }));

        expect(menuOverflow.scrollWidth).toBeLessThanOrEqual(
          menuOverflow.clientWidth + 1,
        );

        await mobileMenu.getByRole("link").first().click();
        await expect(page.locator(".site-header__mobile-menu[open] ul")).toHaveCount(0);
      }
    }
  });
}
