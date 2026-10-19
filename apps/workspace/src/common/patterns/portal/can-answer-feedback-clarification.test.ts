import { describe, expect, it } from "vitest";
import { FeedbackClarificationStatus as C } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import {
  FEEDBACK_ROUND_STATUS_VALUES,
  FeedbackRoundStatus as R,
} from "@invessiv/common/constants/crm/feedback-round-statuses";
import { canAnswerFeedbackClarification } from "./can-answer-feedback-clarification";

describe("canAnswerFeedbackClarification", () => {
  it.each([R.Submitted, R.InDiscussion, R.InProgress])(
    "offers the answer on an open question in %s",
    (status) => {
      expect(canAnswerFeedbackClarification(true, status, C.Open)).toBe(true);
    },
  );

  it.each([R.Open, R.Completed, R.Approved])(
    "never offers it in %s",
    (status) => {
      expect(canAnswerFeedbackClarification(true, status, C.Open)).toBe(false);
    },
  );

  it("needs the submit right and an open question", () => {
    for (const status of FEEDBACK_ROUND_STATUS_VALUES) {
      expect(canAnswerFeedbackClarification(false, status, C.Open)).toBe(false);
      expect(canAnswerFeedbackClarification(true, status, C.Answered)).toBe(
        false,
      );
      expect(canAnswerFeedbackClarification(true, status, C.Closed)).toBe(
        false,
      );
    }
  });
});
