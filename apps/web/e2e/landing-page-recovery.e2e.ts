import { expect, test } from "@playwright/test";

const LANDING_ROUTE_EXPECTATIONS = [
  {
    detailLinkLabel: "Mehr zu Landingpages",
    footerLinkLabel: "Landingpage erstellen lassen",
    localePath: "/de",
    pagePath: "/de/services/landing-page",
  },
  {
    detailLinkLabel: "More about landing pages",
    footerLinkLabel: "Get a landing page built",
    localePath: "/en",
    pagePath: "/en/services/landing-page",
  },
] as const;

test.describe("landing page recovery", () => {
  for (const expectation of LANDING_ROUTE_EXPECTATIONS) {
    test(`renders ${expectation.pagePath}`, async ({ page }) => {
      await page.goto(expectation.pagePath);

      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`${expectation.pagePath}$`),
      );
    });

    test(`home service and footer links point to ${expectation.pagePath}`, async ({
      page,
    }) => {
      await page.goto(expectation.localePath);

      const servicesSection = page.locator("#services");
      await servicesSection.scrollIntoViewIfNeeded();

      const landingCard = servicesSection.locator('[data-card-key="landing"]');
      const serviceDetailLink = landingCard.getByRole("link", {
        name: expectation.detailLinkLabel,
      });
      await expect(serviceDetailLink).toHaveAttribute(
        "href",
        expectation.pagePath,
      );

      await serviceDetailLink.click();
      await expect(page).toHaveURL(new RegExp(`${expectation.pagePath}$`));

      await page.goto(expectation.localePath);
      await expect(
        page
          .locator("#footer")
          .getByRole("link", { name: expectation.footerLinkLabel }),
      ).toHaveAttribute("href", expectation.pagePath);
    });
  }

  test("old landing URLs redirect permanently to the new service route", async ({
    request,
  }) => {
    const deResponse = await request.get("/de/landing", { maxRedirects: 0 });
    const enResponse = await request.get("/en/landing", { maxRedirects: 0 });

    expect(deResponse.status()).toBe(301);
    expect(deResponse.headers().location).toBe("/de/services/landing-page");
    expect(enResponse.status()).toBe(301);
    expect(enResponse.headers().location).toBe("/en/services/landing-page");
  });

  test("service overview fallbacks redirect permanently to the home services section", async ({
    request,
  }) => {
    const deResponse = await request.get("/de/services", { maxRedirects: 0 });
    const enResponse = await request.get("/en/services", { maxRedirects: 0 });

    expect(deResponse.status()).toBe(301);
    expect(deResponse.headers().location).toBe("/de#services");
    expect(enResponse.status()).toBe(301);
    expect(enResponse.headers().location).toBe("/en#services");
  });
});
