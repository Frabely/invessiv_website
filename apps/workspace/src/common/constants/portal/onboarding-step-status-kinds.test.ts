import { describe, expect, it } from "vitest";
import {
  ONBOARDING_STEP_STATUS_KIND_VALUES,
  OnboardingStepStatusKind,
} from "./onboarding-step-status-kinds";

describe("OnboardingStepStatusKind", () => {
  it("contains the exact values without duplicates", () => {
    expect(ONBOARDING_STEP_STATUS_KIND_VALUES).toEqual([
      "untouched",
      "incomplete",
      "complete",
      "attention",
    ]);
    expect([...ONBOARDING_STEP_STATUS_KIND_VALUES]).toEqual(
      Object.values(OnboardingStepStatusKind),
    );
  });
});
