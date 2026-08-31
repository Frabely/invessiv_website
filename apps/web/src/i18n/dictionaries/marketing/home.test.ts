import { describe, expect, it } from "vitest";

import { FAQ_SECTION_ID, PRIMARY_NAVIGATION } from "@/config/navigation/home";
import { getSiteHeaderUiContent } from "./site-header-ui";
import { getHomeSections } from "./home";
import { getHomeUiContent } from "./home-ui";

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
      const { navColumn } = footerSection;

      expect(navColumn.links.map((link) => link.href)).toEqual(
        PRIMARY_NAVIGATION.map((item) => item.href),
      );
      expect(navColumn.links.map((link) => link.label)).toEqual(
        PRIMARY_NAVIGATION.map((item) => header.labelsByHref[item.href]),
      );
    },
  );

  it.each(["de", "en"] as const)(
    "keeps the %s FAQ focused on the most likely first questions",
    (locale) => {
      const faqSection = getHomeSections(locale).find(
        (section) => section.id === FAQ_SECTION_ID,
      );

      if (!faqSection) {
        throw new Error("Expected FAQ section to be available.");
      }

      const expectedQuestionsByLocale = {
        de: [
          "Wem gehört die Website danach?",
          "Was kostet ein Projekt?",
          "Wie läuft der Projektstart ab?",
        ],
        en: [
          "Who owns the website afterwards?",
          "What does a project cost?",
          "How does project kickoff work?",
        ],
      } as const;

      expect(
        faqSection.qnaItems.slice(0, 3).map((item) => item.question),
      ).toEqual(expectedQuestionsByLocale[locale]);

      expect(faqSection.qnaItems.every((item) => item.link === undefined)).toBe(
        true,
      );
    },
  );

  it("keeps the DE and EN Q&A conversation in sync", () => {
    const getFaqSection = (locale: "de" | "en") => {
      const faqSection = getHomeSections(locale).find(
        (section) => section.id === FAQ_SECTION_ID,
      );

      if (!faqSection) {
        throw new Error("Expected FAQ section to be available.");
      }

      return faqSection;
    };

    const deFaq = getFaqSection("de");
    const enFaq = getFaqSection("en");

    expect(deFaq.qnaItems).toHaveLength(enFaq.qnaItems.length);
    expect(deFaq.qnaItems.map((item) => Boolean(item.link))).toEqual(
      enFaq.qnaItems.map((item) => Boolean(item.link)),
    );

    [deFaq, enFaq].forEach((faqSection) => {
      expect(faqSection.qnaIntro.primary).toMatch(/\S/);
      expect(faqSection.qnaIntro.secondary).toMatch(/\S/);
      expect(faqSection.qnaAvatarAlt).toMatch(/\S/);
      expect(
        faqSection.qnaItems.map((item) => [item.question, item.answer]),
      ).toEqual(
        faqSection.qnaItems.map(() => [
          expect.stringMatching(/\S/),
          expect.stringMatching(/\S/),
        ]),
      );
    });
  });

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
    "keeps %s service selection aligned with the primary service order",
    (locale) => {
      const servicesSection = getHomeSections(locale).find(
        (section) => section.id === "services",
      );

      if (!servicesSection) {
        throw new Error("Expected services section to be available.");
      }

      const ui = getHomeUiContent(locale);

      expect(
        ui.servicesIntentOptions.map((option) => option.serviceKey),
      ).toEqual(["landing", "upgrade", "web"]);
      expect(
        servicesSection.serviceCards
          .filter((card) =>
            ui.servicesIntentOptions.some(
              (option) => option.serviceKey === card.key,
            ),
          )
          .map((card) => card.key),
      ).toEqual(["landing", "upgrade", "web"]);
      expect(
        servicesSection.serviceCards.find((card) => card.key === "process"),
      ).toBeUndefined();
      expect(
        servicesSection.serviceCards.find((card) => card.key === "upgrade")
          ?.iconSrc,
      ).toBe("/services/compact-site.svg");
      expect(
        servicesSection.serviceCards.find((card) => card.key === "landing")
          ?.iconSrc,
      ).toBe("/services/landing-page.svg");
      expect(
        servicesSection.serviceCards.find((card) => card.key === "web")
          ?.iconSrc,
      ).toBe("/services/business-website.svg");
    },
  );

  it.each(["de", "en"] as const)(
    "keeps every %s service card supported by a short description",
    (locale) => {
      const servicesSection = getHomeSections(locale).find(
        (section) => section.id === "services",
      );

      if (!servicesSection) {
        throw new Error("Expected services section to be available.");
      }

      expect(
        servicesSection.serviceCards.map((card) => [
          card.key,
          card.description,
        ]),
      ).toEqual(
        servicesSection.serviceCards.map((card) => [
          card.key,
          expect.stringMatching(/\S/),
        ]),
      );
    },
  );

  it.each([
    ["de", ["1–2 Wochen", "2–4 Wochen", "ab 4 Wochen"]],
    ["en", ["1–2 weeks", "2–4 weeks", "from 4 weeks"]],
  ] as const)(
    "keeps the %s package timeframes progressive",
    (locale, timeframes) => {
      const servicesSection = getHomeSections(locale).find(
        (section) => section.id === "services",
      );

      if (!servicesSection) {
        throw new Error("Expected services section to be available.");
      }

      expect(
        ["landing", "upgrade", "web"].map(
          (key) =>
            servicesSection.serviceCards.find((card) => card.key === key)
              ?.delivery,
        ),
      ).toEqual(timeframes);
    },
  );

  it("keeps DE and EN home UI dictionary keys aligned", () => {
    const deKeys = Object.keys(getHomeUiContent("de")).sort();
    const enKeys = Object.keys(getHomeUiContent("en")).sort();

    expect(deKeys).toEqual(enKeys);
  });

  it.each(["de", "en"] as const)(
    "keeps the %s USP chat complete with filled messages",
    (locale) => {
      const uspContent = getHomeUiContent(locale).uspContent;

      expect(uspContent.messages).toHaveLength(8);
      expect(uspContent.messages.map((message) => message.text)).toEqual(
        uspContent.messages.map(() => expect.stringMatching(/\S/)),
      );

      const messageWordCounts = uspContent.messages.map(
        (message) => message.text.trim().split(/\s+/).length,
      );

      expect(Math.max(...messageWordCounts)).toBeLessThanOrEqual(35);
      expect(
        messageWordCounts.reduce((total, wordCount) => total + wordCount, 0),
      ).toBeLessThanOrEqual(190);
    },
  );

  it("keeps the USP chat author sequence aligned between DE and EN", () => {
    const deAuthors = getHomeUiContent("de").uspContent.messages.map(
      (message) => message.author,
    );
    const enAuthors = getHomeUiContent("en").uspContent.messages.map(
      (message) => message.author,
    );

    expect(deAuthors).toEqual([
      "visitor",
      "owner",
      "visitor",
      "owner",
      "visitor",
      "owner",
      "visitor",
      "owner",
    ]);
    expect(deAuthors).toEqual(enAuthors);
  });

  it.each([
    [
      "de",
      [
        "Webdesign mit echter Softwareentwicklung",
        "10 Jahren",
        "3 Jahre davon professionell",
        "etwa seit einem Jahr",
        "echtem Code",
        "individuelles Design",
        "ohne starre Vorlagen",
        "schnelle Ladezeiten",
        "mit deinem Geschäft wachsen",
        "immer direkt mit mir",
        "24 Stunden",
        "nach dem Launch",
        "Technische Themen erkläre ich verständlich",
        "was du nicht brauchst",
      ],
    ],
    [
      "en",
      [
        "web design with real software development",
        "10 years",
        "3 years professionally",
        "past year",
        "real code",
        "custom design",
        "without fixed templates",
        "fast load times",
        "as your business grows",
        "always speak directly with me",
        "24 hours",
        "after launch",
        "explain technical topics clearly",
        "what you don't need",
      ],
    ],
  ] as const)("keeps every core USP in the natural %s chat", (locale, usps) => {
    const chatCopy = getHomeUiContent(locale)
      .uspContent.messages.map((message) => message.text)
      .join(" ");

    usps.forEach((usp) => expect(chatCopy).toContain(usp));
    expect(
      `${chatCopy} ${getHomeUiContent(locale).uspContent.replyCtaLabel}`,
    ).not.toMatch(/[—–-]/);
  });

  it("positions the hero around personal web design from Chemnitz in both locales", () => {
    const deHero = getHomeSections("de").find(
      (section) => section.id === "hero",
    );
    const enHero = getHomeSections("en").find(
      (section) => section.id === "hero",
    );

    expect(deHero).toEqual({
      id: "hero",
      title: "Websites, die Vertrauen schaffen und Dir Anfragen bringen.",
      description:
        "Ich bin Moritz Hecht und entwickle verkaufspsychologisch durchdachte Websites, die dein Angebot verständlich vermitteln und Interessenten gezielt zur Anfrage führen.",
    });
    expect(getHomeUiContent("de")).toMatchObject({
      heroPrimaryCta: "Kostenloses Erstgespräch anfragen",
      heroSecondaryCta: "Leistungen ansehen",
      heroTag: "WEBDESIGN AUS CHEMNITZ UND UMGEBUNG",
      heroTrustChips: [
        "Direkter Ansprechpartner",
        "Softwareentwicklungs-Background",
      ],
      heroVisualAriaLabel:
        "Moritz Hecht, persönlicher Ansprechpartner für Webdesign aus Chemnitz",
    });

    expect(enHero).toEqual({
      id: "hero",
      title: "Websites that build trust and bring you inquiries.",
      description:
        "I’m Moritz Hecht, and I create conversion-focused websites that communicate your offer clearly and guide prospects toward an inquiry.",
    });
    expect(getHomeUiContent("en")).toMatchObject({
      heroPrimaryCta: "Request a free consultation",
      heroSecondaryCta: "Explore services",
      heroTag: "WEB DESIGN · CHEMNITZ & REGION",
      heroTrustChips: [
        "Direct point of contact",
        "Software development background",
      ],
      heroVisualAriaLabel:
        "Moritz Hecht, your personal web design contact in Chemnitz",
    });
  });

  it.each(["de", "en"] as const)(
    "keeps the %s references section free of rating and source claims",
    (locale) => {
      const referencesSection = getHomeSections(locale).find(
        (section) => section.id === "references",
      );

      if (!referencesSection) {
        throw new Error("Expected references section to be available.");
      }

      const sectionCopy = referencesSection.referenceEntries
        .flatMap((entry) => [entry.authorName, entry.quote, entry.role])
        .join(" ");

      expect(sectionCopy).not.toContain("★");
      expect(sectionCopy).not.toContain("?");
      expect(sectionCopy.toLowerCase()).not.toContain("google");
    },
  );

  it.each(["de", "en"] as const)(
    "starts every %s process outcome with an uppercase letter",
    (locale) => {
      const processSection = getHomeSections(locale).find(
        (section) => section.id === "process",
      );

      if (!processSection) {
        throw new Error("Expected process section to be available.");
      }

      processSection.processSteps.forEach((step) => {
        const result = step.result.split(":")[1]?.trim() ?? "";
        expect(result).toMatch(/^\p{Lu}/u);
      });
    },
  );

  it("keeps the revised German process effort concrete", () => {
    const processSection = getHomeSections("de").find(
      (section) => section.id === "process",
    );

    if (!processSection) {
      throw new Error("Expected process section to be available.");
    }

    expect(processSection.processSteps.map((step) => step.effort)).toEqual([
      "Aufwand: ca. 15 Min",
      "Aufwand: 60–90 Min",
      "Aufwand: Bilder, Texte & Zugangsdaten übergeben",
      "Aufwand: Keiner – Ich arbeite",
      "Aufwand: Je nach Umfang deiner Änderungswünsche",
      "Aufwand: Ein letzter gemeinsamer Check",
    ]);
  });

  it.each([
    ["de", "Projekt im Detail ansehen"],
    ["en", "View project details"],
  ] as const)(
    "keeps the %s reference entries ordered with detail-link copy",
    (locale, expectedLinkLabel) => {
      const referencesSection = getHomeSections(locale).find(
        (section) => section.id === "references",
      );

      if (!referencesSection) {
        throw new Error("Expected references section to be available.");
      }

      expect(
        referencesSection.referenceEntries.map((entry) => entry.imageKey),
      ).toEqual(["allmacher", "kolja"]);
      expect(
        referencesSection.referenceEntries.map((entry) => entry.linkLabel),
      ).toEqual([expectedLinkLabel, expectedLinkLabel]);
    },
  );
});
