import { describe, expect, it } from "vitest";

import { LANDING_NAVIGATION } from "@/config/navigation/landing";
import { getLandingHeaderContent } from "@/i18n/dictionaries/landing/header";
import { getLandingFooterContent } from ".";

describe("landing footer dictionary", () => {
  it.each(["de", "en"] as const)(
    "keeps the %s footer menu aligned with the landing header navigation",
    (locale) => {
      const header = getLandingHeaderContent(locale);
      const footer = getLandingFooterContent(locale);
      const menuColumn = footer.columns[0];

      expect(menuColumn.links.map((link) => link.href)).toEqual(
        LANDING_NAVIGATION.map((item) => item.href),
      );
      expect(menuColumn.links.map((link) => link.label)).toEqual(
        LANDING_NAVIGATION.map((item) => header.labelsByHref[item.href]),
      );
    },
  );

  it("keeps a secondary homepage link in the landing footer", () => {
    expect(
      getLandingFooterContent("de")
        .columns.flatMap((column) => column.links)
        .find((link) => link.href === "/de"),
    ).toEqual({
      href: "/de",
      label: "Mehr über Invessiv",
    });
    expect(
      getLandingFooterContent("en")
        .columns.flatMap((column) => column.links)
        .find((link) => link.href === "/en"),
    ).toEqual({
      href: "/en",
      label: "More about Invessiv",
    });
  });
});
