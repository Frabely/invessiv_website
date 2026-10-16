import { describe, expect, it } from "vitest";

import {
  FEEDBACK_ROUND_STEP_KIND_VALUES,
  FeedbackRoundStepKind,
} from "@/common/constants/portal/feedback-round-step-kinds";

describe("FeedbackRoundStepKind", () => {
  it("contains the exact step kinds without duplicates", () => {
    expect(FeedbackRoundStepKind).toEqual({
      Round: "round",
      Upcoming: "upcoming",
      Expired: "expired",
    });
    expect(new Set(FEEDBACK_ROUND_STEP_KIND_VALUES).size).toBe(
      Object.values(FeedbackRoundStepKind).length,
    );
  });
});
