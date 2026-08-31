import { describe, expect, it } from "vitest";

import { getLandingFaqContent } from "@/i18n/dictionaries/landing/faq";
import { getLandingMetaContent } from "@/i18n/dictionaries/landing/meta";
import { getLandingPricingContent } from "@/i18n/dictionaries/landing/pricing";
import { getLandingStructuredDataContent } from "@/i18n/dictionaries/landing/structured-data";
import { SITE_URL } from "@/lib/site-metadata";
import { createLandingStructuredData } from "./landing-structured-data";
import { createMarketingStructuredData } from "./marketing-structured-data";

function graphEntry<T extends string>(
  data: ReturnType<typeof createLandingStructuredData>,
  type: T,
) {
  return data["@graph"].find((entry) => entry["@type"] === type);
}

describe("landing-structured-data", () => {
  it("creates the expected graph types for the landing detail page", () => {
    const data = createLandingStructuredData("de");

    expect(data["@graph"].map((entry) => entry["@type"])).toEqual([
      "Organization",
      "Service",
      "FAQPage",
      "BreadcrumbList",
    ]);
  });

  it("uses pricing and FAQ dictionaries instead of drifting hardcoded values", () => {
    const locale = "de";
    const data = createLandingStructuredData(locale);
    const pricing = getLandingPricingContent(locale);
    const faq = getLandingFaqContent(locale);
    const service = graphEntry(data, "Service");
    const faqPage = graphEntry(data, "FAQPage");

    expect(service?.offers).toMatchObject({
      name: pricing.card.planTitle,
      deliveryLeadTime: {
        minValue: 5,
        maxValue: 10,
        unitCode: "DAY",
      },
    });
    expect(faqPage?.mainEntity).toHaveLength(faq.items.length);
  });

  it("omits any price from the offer", () => {
    for (const locale of ["de", "en"] as const) {
      const offers = graphEntry(
        createLandingStructuredData(locale),
        "Service",
      )?.offers;

      expect(offers).toBeDefined();
      expect(offers).not.toHaveProperty("price");
      expect(offers).not.toHaveProperty("priceRange");
      expect(offers).not.toHaveProperty("priceCurrency");
      expect(offers).not.toHaveProperty("priceSpecification");
      expect(JSON.stringify(offers)).not.toMatch(/\d{3,}/);
    }
  });

  it("reuses the homepage organization id", () => {
    const landingOrganization = graphEntry(
      createLandingStructuredData("de"),
      "Organization",
    );
    const marketingOrganization = createMarketingStructuredData(
      "de",
      "Invessiv entwickelt Webseiten und digitale Lösungen.",
      [],
    )["@graph"].find((entry) => entry["@type"] === "Organization");

    expect(landingOrganization?.["@id"]).toBe(marketingOrganization?.["@id"]);
  });

  it("localizes service and offer fields", () => {
    const deData = createLandingStructuredData("de");
    const enData = createLandingStructuredData("en");
    const deService = graphEntry(deData, "Service");
    const enService = graphEntry(enData, "Service");
    const deStructuredData = getLandingStructuredDataContent("de");
    const enStructuredData = getLandingStructuredDataContent("en");

    if (!deService?.offers || !enService?.offers) {
      throw new Error("Expected localized service offers to be available.");
    }

    expect(deService?.name).toBe(deStructuredData.service.name);
    expect(enService?.name).toBe(enStructuredData.service.name);
    expect(deService?.description).toBe(
      getLandingMetaContent("de").description,
    );
    expect(enService?.description).toBe(
      getLandingMetaContent("en").description,
    );
    expect(deService?.audience).not.toEqual(enService?.audience);
    expect(deService?.offers.name).toBe(
      getLandingPricingContent("de").card.planTitle,
    );
    expect(enService?.offers.name).toBe(
      getLandingPricingContent("en").card.planTitle,
    );
    expect(deService?.offers.name).not.toBe(enService?.offers.name);
  });

  it("keeps private owner names out of the output", () => {
    const serialized = JSON.stringify(createLandingStructuredData("de"));

    expect(serialized).not.toContain("Moritz Hecht");
  });

  it("points breadcrumb position 2 to the home services section", () => {
    const data = createLandingStructuredData("de");
    const breadcrumb = graphEntry(data, "BreadcrumbList");

    if (!breadcrumb?.itemListElement) {
      throw new Error("Expected landing breadcrumb items to be available.");
    }

    expect(breadcrumb?.itemListElement[1]).toMatchObject({
      position: 2,
      item: `${SITE_URL}/de#services`,
    });
    expect(breadcrumb?.itemListElement[1].item).not.toBe(
      `${SITE_URL}/de/services`,
    );
  });
});
