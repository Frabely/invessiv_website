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
      {
        description: "Invessiv entwickelt Websites und Landingpages.",
        serviceName: "Webdesign und Landingpages aus Chemnitz",
        serviceType: "Webdesign, Landingpages und Website-Betreuung",
      },
      faqItems,
    );

    const organization = data["@graph"].find(
      (entry) => entry["@type"] === "Organization",
    );
    const website = data["@graph"].find(
      (entry) => entry["@type"] === "WebSite",
    );
    const person = data["@graph"].find((entry) => entry["@type"] === "Person");
    const service = data["@graph"].find(
      (entry) => entry["@type"] === "Service",
    );

    expect(organization).toMatchObject({
      "@type": "Organization",
      name: "Invessiv",
      legalName: "Invessiv – Inhaber Moritz Hecht",
      founder: {
        "@id": "https://www.invessiv.com#moritz-hecht",
      },
    });
    expect(organization).toHaveProperty("sameAs");
    expect(organization?.sameAs).toEqual([
      "https://www.linkedin.com/company/invessiv/",
      "https://www.instagram.com/invessiv/",
    ]);
    expect(person).toMatchObject({
      "@type": "Person",
      "@id": "https://www.invessiv.com#moritz-hecht",
      name: "Moritz Hecht",
      url: "https://www.invessiv.com/de",
      image: "https://www.invessiv.com/assets/moritz-hecht.jpeg",
      sameAs: ["https://www.linkedin.com/in/moritz-hecht-4a5200235/"],
      worksFor: {
        "@id": "https://www.invessiv.com#organization",
      },
    });
    expect(website).toMatchObject({
      "@type": "WebSite",
      name: "Invessiv",
      alternateName: "invessiv.com",
    });
    expect(service).toMatchObject({
      "@type": "Service",
      "@id": "https://www.invessiv.com/de#webdesign-service",
      name: "Webdesign und Landingpages aus Chemnitz",
      url: "https://www.invessiv.com/de",
      serviceType: "Webdesign, Landingpages und Website-Betreuung",
      areaServed: [
        {
          "@type": "City",
          name: "Chemnitz",
        },
        {
          "@type": "Country",
          name: "Deutschland",
        },
      ],
      description: "Invessiv entwickelt Websites und Landingpages.",
    });
  });

  it.each(["de", "en"] as const)(
    "publishes the %s Q&A section as a FAQPage",
    (locale) => {
      const data = createMarketingStructuredData(
        locale,
        {
          description: "…",
          serviceName: "…",
          serviceType: "…",
        },
        faqItems,
      );

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
        {
          description: "…",
          serviceName: "…",
          serviceType: "…",
        },
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
