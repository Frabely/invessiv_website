import { expect, test } from "@playwright/test";

type LocaleExpectation = {
  detailLinkLabel: string;
  imprintPageTitle: string;
  imprintHref: "/de/imprint" | "/en/imprint";
  heading: string;
  htmlLang: "de" | "en";
  landingServiceHref: "/de/services/landing-page" | "/en/services/landing-page";
  localePath: "/de" | "/en";
  growthChip: string;
  intentChips: string[];
  landingChip: string;
  maintenanceTitle: string;
  navAriaLabel: string;
  privacyPageTitle: string;
  privacyHref: "/de/privacy" | "/en/privacy";
  webAppTeaser: string;
  webTitle: string;
  recommendedBadge: string;
  skipLinkLabel: string;
  termsHref: "/de/terms" | "/en/terms";
};

const LOCALE_EXPECTATIONS: LocaleExpectation[] = [
  {
    localePath: "/de",
    htmlLang: "de",
    landingServiceHref: "/de/services/landing-page",
    imprintHref: "/de/imprint",
    imprintPageTitle: "Impressum",
    heading: "Was hast du mit deiner Website vor?",
    detailLinkLabel: "Mehr zu Landingpages",
    growthChip: "Ein umfangreiches Webprojekt umsetzen",
    intentChips: [
      "Ein Angebot gezielt verkaufen",
      "Professionell online auftreten",
      "Ein umfangreiches Webprojekt umsetzen",
    ],
    landingChip: "Ein Angebot gezielt verkaufen",
    maintenanceTitle: "Wartung & Support",
    recommendedBadge: "Empfohlen für dich",
    webAppTeaser:
      "Ausbaubar Richtung Web-App: Login, Kundenbereich, eigenes Backend",
    navAriaLabel: "Hauptnavigation",
    privacyPageTitle: "Datenschutzerklärung",
    privacyHref: "/de/privacy",
    skipLinkLabel: "Direkt zum Hauptinhalt springen",
    termsHref: "/de/terms",
    webTitle: "Business Website",
  },
  {
    localePath: "/en",
    htmlLang: "en",
    landingServiceHref: "/en/services/landing-page",
    imprintHref: "/en/imprint",
    imprintPageTitle: "Legal Notice",
    heading: "What are you planning for your website?",
    detailLinkLabel: "More about landing pages",
    growthChip: "Bring an extensive web project to life",
    intentChips: [
      "Sell one offer with clear focus",
      "Build a professional online presence",
      "Bring an extensive web project to life",
    ],
    landingChip: "Sell one offer with clear focus",
    maintenanceTitle: "Maintenance & support",
    recommendedBadge: "Recommended for you",
    webAppTeaser:
      "Extendable toward a web app: login, client area, own backend",
    navAriaLabel: "Primary navigation",
    privacyPageTitle: "Privacy Policy",
    privacyHref: "/en/privacy",
    skipLinkLabel: "Skip to main content",
    termsHref: "/en/terms",
    webTitle: "Business Website",
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
    expect(html).toContain('property="og:image"');
    expect(html).toContain('name="twitter:image"');
    expect(html).toContain("/og/landing.png");
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
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`${expectations.localePath}$`),
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /\/og\/landing\.png$/,
    );
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
      "content",
      /\/og\/landing\.png$/,
    );
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
    await expect(
      servicesSection.locator('[data-service-card="true"]'),
    ).toHaveCount(1);
    await expect(
      servicesSection.locator('[data-card-key="landing"]'),
    ).toBeVisible();
    await expect(
      servicesSection.locator('[data-card-key="process"]'),
    ).toHaveCount(0);
    await expect(
      servicesSection.getByRole("group").getByRole("button"),
    ).toHaveText(expectations.intentChips);
    await expect(
      servicesSection.getByText(expectations.maintenanceTitle, { exact: true }),
    ).toHaveCount(0);
    await expect(
      servicesSection.getByRole("button", { name: expectations.growthChip }),
    ).toBeVisible();
    await servicesSection
      .getByRole("button", { name: expectations.growthChip })
      .click();
    await expect(
      servicesSection
        .locator('[data-card-key="web"]')
        .getByText(expectations.webTitle, { exact: true }),
    ).toBeVisible();
    await expect(
      servicesSection
        .locator('[data-card-key="web"]')
        .getByText(expectations.webAppTeaser, { exact: true }),
    ).toBeVisible();
    await servicesSection
      .getByRole("button", { name: expectations.landingChip })
      .click();
    await expect(
      servicesSection.locator('[data-card-key="landing"]'),
    ).toBeVisible();
    await expect(
      servicesSection.getByText(expectations.recommendedBadge, { exact: true }),
    ).toBeVisible();

    const landingCard = servicesSection
      .locator('[data-card-key="landing"]')
      .first();
    await expect(
      landingCard.getByRole("link", { name: expectations.detailLinkLabel }),
    ).toHaveAttribute("href", expectations.landingServiceHref);

    const missingAnchorTargets = await page.evaluate((localePath) => {
      const uniqueTargets = [
        ...new Set(
          Array.from(
            document.querySelectorAll(
              `a[href^="#"], a[href^="${localePath}#"]`,
            ),
          )
            .map((anchor) => anchor.getAttribute("href"))
            .filter((href): href is string => Boolean(href)),
        ),
      ];

      return uniqueTargets.filter((href) => {
        const target = href.startsWith(localePath)
          ? href.slice(localePath.length)
          : href;
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
        Math.max(
          pageOverflow.bodyScrollWidth,
          pageOverflow.documentScrollWidth,
        ),
      ).toBeLessThanOrEqual(pageOverflow.innerWidth + 1);

      if (viewport.width === 390) {
        await page.locator(".site-header__mobile-menu > summary").click();

        const mobileMenu = page.locator(".site-header__mobile-menu[open] ul");
        await expect(mobileMenu).toBeVisible();
        await expect(mobileMenu.getByRole("link").first()).toBeVisible();

        const mobileHeaderLayout = await page.evaluate(() => {
          const header = document.querySelector<HTMLElement>(".site-header");
          const brand = document.querySelector<HTMLElement>(
            ".site-header__brand",
          );
          const menu = document.querySelector<HTMLElement>(
            ".site-header__mobile-menu[open] ul",
          );

          if (!(header && brand && menu)) {
            throw new Error("Expected mobile header, brand, and menu to exist");
          }

          const headerRect = header.getBoundingClientRect();
          const menuRect = menu.getBoundingClientRect();
          const brandStyle = window.getComputedStyle(brand);

          return {
            brandOpacity: Number(brandStyle.opacity),
            brandPointerEvents: brandStyle.pointerEvents,
            headerBottom: Math.round(headerRect.bottom),
            menuTop: Math.round(menuRect.top),
          };
        });

        expect(mobileHeaderLayout.brandOpacity).toBeGreaterThan(0.95);
        expect(mobileHeaderLayout.brandPointerEvents).not.toBe("none");
        expect(mobileHeaderLayout.menuTop).toBeGreaterThanOrEqual(
          mobileHeaderLayout.headerBottom,
        );

        const menuOverflow = await mobileMenu.evaluate((menu) => ({
          clientWidth: menu.clientWidth,
          scrollWidth: menu.scrollWidth,
        }));

        expect(menuOverflow.scrollWidth).toBeLessThanOrEqual(
          menuOverflow.clientWidth + 1,
        );

        await mobileMenu.getByRole("link").first().click();
        await expect(
          page.locator(".site-header__mobile-menu[open] ul"),
        ).toHaveCount(0);
      }
    }
  });

  test(`legal pages keep skip link targets, links, and mobile overflow stable for ${expectations.localePath}`, async ({
    page,
  }) => {
    const legalPages = [
      {
        href: expectations.imprintHref,
        title: expectations.imprintPageTitle,
      },
      {
        href: expectations.privacyHref,
        title: expectations.privacyPageTitle,
      },
    ];

    for (const legalPage of legalPages) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(legalPage.href);

      await expect(page.locator("html")).toHaveAttribute(
        "lang",
        expectations.htmlLang,
      );
      await expect(page.locator("h1")).toHaveText(legalPage.title);
      await expect(page.locator("#main-content")).toBeVisible();
      await expect(
        page.locator(`#footer a[href="${expectations.imprintHref}"]`).first(),
      ).toBeVisible();
      await expect(
        page.locator(`#footer a[href="${expectations.privacyHref}"]`).first(),
      ).toBeVisible();
      await expect(
        page.locator(`#footer a[href="${expectations.termsHref}"]`).first(),
      ).toBeVisible();

      await page.keyboard.press("Tab");
      const skipLink = page.locator(".skip-link");
      await expect(skipLink).toBeFocused();
      await expect(skipLink).toHaveText(expectations.skipLinkLabel);
      await skipLink.press("Enter");
      await expect(page.locator("#main-content")).toBeFocused();

      await page.locator(".site-header__mobile-menu > summary").click();
      const mobileMenu = page.locator(".site-header__mobile-menu[open] ul");
      await expect(mobileMenu).toBeVisible();
      await expect(mobileMenu.getByRole("link").first()).toBeVisible();

      const pageOverflow = await page.evaluate(() => ({
        bodyScrollWidth: document.body.scrollWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));

      expect(
        Math.max(
          pageOverflow.bodyScrollWidth,
          pageOverflow.documentScrollWidth,
        ),
      ).toBeLessThanOrEqual(pageOverflow.innerWidth + 1);
    }
  });
}
