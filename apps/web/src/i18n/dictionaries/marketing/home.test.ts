import { describe, expect, it } from "vitest";

import { PRIMARY_NAVIGATION } from "@/config/navigation/home";
import { SITE_ROUTES } from "@/config/routes";
import { getSiteHeaderUiContent } from "./site-header-ui";
import { getHomeSections } from "./home";

describe("home dictionary", () => {
  it.each(["de", "en"] as const)(
    "keeps the %s footer menu aligned with the primary header navigation",
    (locale) => {
      const footerSection = getHomeSections(locale).find(
        (section) => section.id === "footer",
      );

      if (!footerSection) {
        throw new Error("Expected footer section to be available.");
      }

      const header = getSiteHeaderUiContent(locale);
      const menuColumn = footerSection.footerColumns[0];

      expect(menuColumn.links.map((link) => link.href)).toEqual(
        PRIMARY_NAVIGATION.map((item) => item.href),
      );
      expect(menuColumn.links.map((link) => link.label)).toEqual(
        PRIMARY_NAVIGATION.map((item) => header.labelsByHref[item.href]),
      );
    },
  );

  it.each([
    ["de", "/de/services/landing-page", "Landingpage erstellen lassen"],
    ["en", "/en/services/landing-page", "Get a landing page built"],
  ] as const)(
    "localizes the %s footer service link",
    (locale, expectedHref, expectedLabel) => {
      const footerSection = getHomeSections(locale).find(
        (section) => section.id === "footer",
      );

      if (!footerSection) {
        throw new Error("Expected footer section to be available.");
      }

      const serviceLink = footerSection.footerColumns
        .flatMap((column) => column.links)
        .find((link) => link.label === expectedLabel);

      expect(serviceLink?.href).toBe(expectedHref);
    },
  );

  it.each([
    ["de", "/de/services/landing-page"],
    ["en", "/en/services/landing-page"],
  ] as const)(
    "localizes the %s Q&A landing detail link",
    (locale, expectedHref) => {
      const faqSection = getHomeSections(locale).find(
        (section) => section.id === "faq",
      );

      if (!faqSection) {
        throw new Error("Expected FAQ section to be available.");
      }

      const kickoffItem = faqSection.qnaItems[0];

      expect(kickoffItem.link?.href).toBe(expectedHref);
      expect(
        kickoffItem.link?.href.endsWith(SITE_ROUTES.LANDING_PAGE_SERVICE),
      ).toBe(true);
    },
  );

  it.each(["de", "en"] as const)(
    "keeps the %s landing service card concise because the detail page carries the depth",
    (locale) => {
      const servicesSection = getHomeSections(locale).find(
        (section) => section.id === "services",
      );

      if (!servicesSection) {
        throw new Error("Expected services section to be available.");
      }

      const landingCard = servicesSection.serviceCards.find(
        (card) => card.key === "landing",
      );

      expect(landingCard?.included).toHaveLength(3);
      expect(landingCard?.details).toBeUndefined();
    },
  );

  it.each(["de", "en"] as const)(
    "keeps the %s proof summary copy readable",
    (locale) => {
      const proofSection = getHomeSections(locale).find(
        (section) => section.id === "proof",
      );

      if (!proofSection) {
        throw new Error("Expected proof section to be available.");
      }

      expect(proofSection.summaryPoints[0]).toContain("★");
      expect(proofSection.summaryPoints[0]).not.toContain("?");
    },
  );
});
