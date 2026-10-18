import { describe, expect, it } from "vitest";

import {
  FEEDBACK_NOTICE_TONE_VALUES,
  FeedbackNoticeTone,
} from "@/common/constants/portal/feedback-notice-tones";

describe("FeedbackNoticeTone", () => {
  it("contains the exact tones without duplicates", () => {
    expect(FeedbackNoticeTone).toEqual({
      Info: "info",
      Warm: "warm",
      Success: "success",
      Neutral: "neutral",
    });
    expect(new Set(FEEDBACK_NOTICE_TONE_VALUES).size).toBe(
      Object.values(FeedbackNoticeTone).length,
    );
  });
});
