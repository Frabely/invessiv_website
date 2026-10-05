import { describe, expect, it } from "vitest";
import {
  ONBOARDING_FIELD_SPAN_VALUES,
  OnboardingFieldSpan,
} from "./onboarding-field-spans";

describe("OnboardingFieldSpan", () => {
  it("contains the exact values without duplicates", () => {
    expect(ONBOARDING_FIELD_SPAN_VALUES).toEqual(["narrow", "wide", "full"]);
    expect([...ONBOARDING_FIELD_SPAN_VALUES]).toEqual(
      Object.values(OnboardingFieldSpan),
    );
  });
});
