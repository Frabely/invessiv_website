import { describe, expect, it } from "vitest";

import { PRIMARY_NAVIGATION } from "@/config/navigation/home";
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
