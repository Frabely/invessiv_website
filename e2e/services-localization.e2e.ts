import { expect, test } from "@playwright/test";

type LocaleExpectation = {
  aiTitle: string;
  detailsLabel: string;
  heading: string;
  localePath: "/de" | "/en";
  oneTimeLabel: string;
  primaryCta: string;
  questionLinkLabel: string;
  recommendedBadge: string;
};

const LOCALE_EXPECTATIONS: LocaleExpectation[] = [
  {
    localePath: "/de",
    heading: "Leistungen & Preise",
    aiTitle: "KI-Templates & Agents",
    detailsLabel: "Mehr Infos",
    primaryCta: "Projekt anfragen",
    questionLinkLabel: "Fragen?",
    oneTimeLabel: "einmalig",
    recommendedBadge: "Empfohlen",
  },
  {
    localePath: "/en",
    heading: "Services & Pricing",
    aiTitle: "AI templates & agents",
    detailsLabel: "More details",
    primaryCta: "Request project",
    questionLinkLabel: "Questions?",
    oneTimeLabel: "one-time",
    recommendedBadge: "Recommended",
  },
];

for (const expectations of LOCALE_EXPECTATIONS) {
  test(`services section is localized for ${expectations.localePath}`, async ({
    page,
  }) => {
    await page.goto(expectations.localePath);

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

    const projectCta = landingCard.getByRole("link", {
      name: expectations.primaryCta,
    });
    const questionLink = landingCard.getByRole("link", {
      name: expectations.questionLinkLabel,
    });

    await expect(projectCta).toHaveAttribute("href", "#contact");
    await expect(questionLink).toHaveAttribute("href", "#faq");
  });
}
