import { describe, expect, it } from "vitest";
import { ONBOARDING_REVIEW_BADGES } from "./onboarding-review-badges";

describe("ONBOARDING_REVIEW_BADGES", () => {
  it("assigns distinct icons and the intended tones to all review filters", () => {
    expect(
      Object.fromEntries(
        Object.entries(ONBOARDING_REVIEW_BADGES).map(([status, badge]) => [
          status,
          { icon: badge.icon.iconName, tone: badge.tone },
        ]),
      ),
    ).toEqual({
      all: { icon: "layer-group", tone: "neutral" },
      pending: { icon: "clock", tone: "warning" },
      complete: { icon: "circle-check", tone: "success" },
      clarification: { icon: "circle-question", tone: "info" },
    });
  });
});
