import { describe, expect, it } from "vitest";

import { OnboardingStepStatusKind as K } from "@/common/constants/portal/onboarding-step-status-kinds";
import { onboardingStepProgress } from "@/common/patterns/portal/onboarding-step-progress";

const away = { current: false, invalid: false, left: false };
const open = { current: true, invalid: false, left: false };

function block(
  answered: number,
  total: number,
  answeredRequired: number,
  totalRequired: number,
) {
  return { answered, total, answeredRequired, totalRequired };
}

describe("onboardingStepProgress", () => {
  it.each([
    ["untouched with required answers", block(0, 10, 0, 3), away, K.Untouched],
    [
      "started, required still missing, open",
      block(3, 10, 1, 3),
      open,
      K.Incomplete,
    ],
    [
      "started, required still missing, left",
      block(3, 10, 1, 3),
      away,
      K.Attention,
    ],
    ["required done, optional open", block(3, 10, 3, 3), away, K.Incomplete],
    ["everything answered", block(10, 10, 3, 3), away, K.Complete],
    [
      "untouched without required answers",
      block(0, 4, 0, 0),
      away,
      K.Untouched,
    ],
    ["nothing to fill in", block(0, 0, 0, 0), away, K.Untouched],
    [
      "visited and left empty",
      block(0, 10, 0, 3),
      { ...away, left: true },
      K.Attention,
    ],
    [
      "reopened empty",
      block(0, 10, 0, 3),
      { ...open, left: true },
      K.Untouched,
    ],
    [
      "visited without required answers",
      block(0, 4, 0, 0),
      { ...away, left: true },
      K.Untouched,
    ],
  ])("shows a block that is %s as %s", (_name, progress, flags, expected) => {
    expect(onboardingStepProgress(progress, flags).kind).toBe(expected);
  });

  it("fills by the answered share of all visible questions", () => {
    expect(onboardingStepProgress(block(3, 10, 0, 0), away).ratio).toBe(0.3);
    expect(onboardingStepProgress(block(0, 0, 0, 0), away).ratio).toBe(0);
  });

  it("is valid as soon as no required answer is missing, however little is filled in", () => {
    expect(onboardingStepProgress(block(3, 10, 3, 3), away).valid).toBe(true);
    expect(onboardingStepProgress(block(0, 4, 0, 0), away).valid).toBe(true);
    expect(onboardingStepProgress(block(0, 10, 0, 3), away).valid).toBe(false);
  });

  it("calls for attention on an invalid input, even in the open and otherwise complete block", () => {
    const status = onboardingStepProgress(block(10, 10, 3, 3), {
      current: true,
      invalid: true,
      left: false,
    });
    expect(status).toMatchObject({ kind: K.Attention, valid: false });
  });
});
