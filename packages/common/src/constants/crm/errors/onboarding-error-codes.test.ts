import { describe, expect, it } from "vitest";
import {
  ONBOARDING_ERROR_CODE_VALUES,
  OnboardingErrorCode,
} from "@invessiv/common/constants/crm/errors/onboarding-error-codes";

describe("ONBOARDING_ERROR_CODE_VALUES", () => {
  it("contains exactly the values of the const object", () => {
    expect([...ONBOARDING_ERROR_CODE_VALUES]).toEqual(
      Object.values(OnboardingErrorCode),
    );
  });

  it("names the release that waits for acknowledged warnings", () => {
    expect(OnboardingErrorCode.ReleaseWarnings).toBe(
      "ONBOARDING_RELEASE_WARNINGS",
    );
  });

  it("contains no duplicates", () => {
    expect(new Set(ONBOARDING_ERROR_CODE_VALUES).size).toBe(
      ONBOARDING_ERROR_CODE_VALUES.length,
    );
  });
});
