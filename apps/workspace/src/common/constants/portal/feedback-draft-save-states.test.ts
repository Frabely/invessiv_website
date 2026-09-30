import { describe, expect, it } from "vitest";

import {
  FEEDBACK_DRAFT_SAVE_STATE_VALUES,
  FeedbackDraftSaveState,
} from "@/common/constants/portal/feedback-draft-save-states";

describe("FeedbackDraftSaveState", () => {
  it("contains the exact states without duplicates", () => {
    expect(FEEDBACK_DRAFT_SAVE_STATE_VALUES).toEqual([
      "idle",
      "unsaved",
      "saving",
      "saved",
      "failed",
      "conflict",
    ]);
    expect([...FEEDBACK_DRAFT_SAVE_STATE_VALUES]).toEqual(
      Object.values(FeedbackDraftSaveState),
    );
  });
});
