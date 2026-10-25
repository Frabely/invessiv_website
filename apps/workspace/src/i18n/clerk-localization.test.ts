import { describe, expect, it } from "vitest";
import { deDE, enUS } from "@clerk/localizations";
import { getClerkLocalization } from "./clerk-localization";

describe("account localization", () => {
  it("overrides the German address without dropping untranslated nested defaults", () => {
    const localization = getClerkLocalization("de");
    expect(localization.userProfile?.navbar?.description).toBe(
      "Verwalte deine Kontoinformationen.",
    );
    expect(localization.userProfile?.navbar?.title).toBe(
      deDE.userProfile?.navbar?.title,
    );
    expect(localization.userButton?.action__manageAccount).toBe(
      deDE.userButton?.action__manageAccount,
    );
    expect(deDE.userProfile?.navbar?.description).toContain("Sie");
  });

  it("keeps the English account copy and interpolation placeholders", () => {
    const localization = getClerkLocalization("en");
    expect(localization.userProfile?.navbar?.description).toBe(
      enUS.userProfile?.navbar?.description,
    );
    expect(
      getClerkLocalization("de").userProfile?.emailAddressPage?.emailCode
        ?.formSubtitle,
    ).toContain("{{identifier}}");
  });

  it("uses informal German throughout supported account and reverification screens", () => {
    const { userProfile, userButton, reverification } =
      getClerkLocalization("de");
    expect(
      JSON.stringify({ userProfile, userButton, reverification }),
    ).not.toMatch(/\b(?:Sie|Ihnen|Ihr(?:e|en|em|er|es)?)\b/);
  });
});
