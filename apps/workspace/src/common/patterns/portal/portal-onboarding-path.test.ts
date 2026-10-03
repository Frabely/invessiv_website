import { describe, expect, it } from "vitest";

import { PORTAL_ONBOARDING_REVIEW_SECTION } from "@/common/constants/portal/portal-onboarding-query-params";
import {
  buildPortalOnboardingPath,
  buildPortalOnboardingStepSearch,
} from "@/common/patterns/portal/portal-onboarding-path";

describe("buildPortalOnboardingPath", () => {
  it("builds a form, a step of it and a jump to a field", () => {
    const base = {
      locale: "de",
      customerId: "customer-1",
      formId: "form-1",
    } as const;

    expect(buildPortalOnboardingPath(base)).toBe(
      "/de/portal/customer-1/onboarding/form-1",
    );
    expect(
      buildPortalOnboardingPath({
        ...base,
        step: { section: "block-1" },
      }),
    ).toBe("/de/portal/customer-1/onboarding/form-1?section=block-1");
    expect(
      buildPortalOnboardingPath({
        ...base,
        step: { section: "block-1", fieldId: "field-1" },
      }),
    ).toBe(
      "/de/portal/customer-1/onboarding/form-1?section=block-1&field=field-1",
    );
  });

  it("encodes the ids as single path segments", () => {
    expect(
      buildPortalOnboardingPath({
        locale: "de",
        customerId: "a/b",
        formId: "c d",
      }),
    ).toBe("/de/portal/a%2Fb/onboarding/c%20d");
  });
});

describe("buildPortalOnboardingStepSearch", () => {
  it("is empty for the first step and ignores a field without a step", () => {
    expect(buildPortalOnboardingStepSearch({})).toBe("");
    expect(buildPortalOnboardingStepSearch({ fieldId: "field-1" })).toBe("");
  });

  it("addresses the review step", () => {
    expect(
      buildPortalOnboardingStepSearch({
        section: PORTAL_ONBOARDING_REVIEW_SECTION,
      }),
    ).toBe("?section=review");
  });
});
