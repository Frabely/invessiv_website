import { describe, expect, it } from "vitest";

import { FAQ_SECTION_ID } from "@/config/navigation/home";
import { getHomeSections } from "@/i18n/dictionaries/marketing/home";
import { createMarketingStructuredData } from "./marketing-structured-data";

const faqItems = [
  {
    question: "Was kostet ein Projekt?",
    answer: "Der Preis hängt vom Umfang ab und wird vorab gemeinsam geklärt.",
  },
  {
    question: "Wem gehört die Website danach?",
    answer: "Dir. Alle Zugänge laufen auf deinen Namen.",
  },
];

describe("marketing-structured-data", () => {
  it("keeps the homepage graph focused on the Invessiv brand", () => {
    const data = createMarketingStructuredData(
      "de",
      "Invessiv entwickelt Landingpages, Webseiten und Interne Tools.",
      faqItems,
    );

    const organization = data["@graph"].find(
      (entry) => entry["@type"] === "Organization",
    );
    const website = data["@graph"].find(
      (entry) => entry["@type"] === "WebSite",
    );
    const service = data["@graph"].find(
      (entry) => entry["@type"] === "Service",
    );
    const serialized = JSON.stringify(data);

    expect(organization).toMatchObject({
      "@type": "Organization",
      name: "Invessiv",
    });
    expect(organization).toHaveProperty("sameAs");
    expect(website).toMatchObject({
      "@type": "WebSite",
      name: "Invessiv",
    });
    expect(service).toMatchObject({
      "@type": "Service",
      serviceType: "Webdesign für KMU und Dienstleister",
    });
    expect(serialized).not.toContain("Moritz Hecht");
  });

  it.each(["de", "en"] as const)(
    "publishes the %s Q&A section as a FAQPage",
    (locale) => {
      const data = createMarketingStructuredData(locale, "…", faqItems);

      const faqPage = data["@graph"].find(
        (entry) => entry["@type"] === "FAQPage",
      );

      expect(faqPage).toMatchObject({
        "@id": expect.stringContaining(`/${locale}#${FAQ_SECTION_ID}`),
        inLanguage: locale,
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      });
    },
  );

  it.each(["de", "en"] as const)(
    "answers the %s FAQ schema with the copy the page actually renders",
    (locale) => {
      const faqSection = getHomeSections(locale).find(
        (section) => section.id === FAQ_SECTION_ID,
      );

      if (!faqSection) {
        throw new Error("Expected FAQ section to be available.");
      }

      const data = createMarketingStructuredData(
        locale,
        "…",
        faqSection.qnaItems,
      );
      const faqPage = data["@graph"].find(
        (entry) => entry["@type"] === "FAQPage",
      );

      expect(faqPage?.mainEntity).toHaveLength(faqSection.qnaItems.length);
      expect(faqPage?.mainEntity?.map((entry) => entry.name)).toEqual(
        faqSection.qnaItems.map((item) => item.question),
      );
    },
  );
});
