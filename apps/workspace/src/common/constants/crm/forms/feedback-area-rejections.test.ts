import { describe, expect, it } from "vitest";

import {
  FEEDBACK_AREA_REJECTION_VALUES,
  FeedbackAreaRejection,
} from "./feedback-area-rejections";

describe("FeedbackAreaRejection", () => {
  it("contains the exact reasons without duplicates", () => {
    expect(FEEDBACK_AREA_REJECTION_VALUES).toEqual([
      "empty",
      "tooLong",
      "duplicate",
      "limitReached",
    ]);
    expect([...FEEDBACK_AREA_REJECTION_VALUES]).toEqual(
      Object.values(FeedbackAreaRejection),
    );
  });
});
