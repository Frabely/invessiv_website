import { describe, expect, it } from "vitest";

import { FeedbackOpenDialog } from "@/common/constants/portal/feedback-open-dialog";

describe("FeedbackOpenDialog", () => {
  it("contains the exact dialog kinds without duplicates", () => {
    expect(FeedbackOpenDialog).toEqual({
      Submit: "submit",
      Approve: "approve",
    });
    expect(new Set(Object.values(FeedbackOpenDialog)).size).toBe(
      Object.values(FeedbackOpenDialog).length,
    );
  });
});
