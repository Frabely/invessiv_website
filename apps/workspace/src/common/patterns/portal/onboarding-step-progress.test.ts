import { describe, expect, it } from "vitest";

import { ProcessStepProgress as P } from "@invessiv/common/constants/ui/process-step-progress";
import { onboardingStepProgress } from "@/common/patterns/portal/onboarding-step-progress";

describe("onboardingStepProgress", () => {
  it.each([
    [{ answeredRequired: 0, totalRequired: 3 }, false, P.Empty],
    [{ answeredRequired: 0, totalRequired: 3 }, true, P.Partial],
    [{ answeredRequired: 1, totalRequired: 3 }, true, P.Partial],
    [{ answeredRequired: 3, totalRequired: 3 }, true, P.Complete],
    [{ answeredRequired: 0, totalRequired: 0 }, false, P.Empty],
    [{ answeredRequired: 0, totalRequired: 0 }, true, P.Complete],
  ])("shows %o with answers=%s as %s", (progress, hasAnswer, expected) => {
    expect(onboardingStepProgress(progress, hasAnswer)).toBe(expected);
  });
});
