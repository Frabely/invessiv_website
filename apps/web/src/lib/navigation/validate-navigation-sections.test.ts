import { describe, expect, it } from "vitest";

import { validateNavigationSections } from "./validate-navigation-sections";

describe("validateNavigationSections", () => {
  it("reports complete mapping when each section has a nav anchor", () => {
    const result = validateNavigationSections({
      navigationHrefs: ["#problem", "#services", "#process"],
      sectionIds: ["problem", "services", "process"],
    });

    expect(result.hasCompleteMapping).toBe(true);
    expect(result.missingInSections).toEqual([]);
    expect(result.missingInNavigation).toEqual([]);
  });

  it("reports missing anchors and missing sections", () => {
    const result = validateNavigationSections({
      navigationHrefs: ["#problem", "#faq"],
      sectionIds: ["problem", "services"],
    });

    expect(result.hasCompleteMapping).toBe(false);
    expect(result.missingInSections).toEqual(["#faq"]);
    expect(result.missingInNavigation).toEqual(["#services"]);
  });
});
