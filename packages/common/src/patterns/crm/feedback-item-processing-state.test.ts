import { describe, expect, it } from "vitest";
import {
  FeedbackClarificationStatus as S,
  FEEDBACK_CLARIFICATION_STATUS_VALUES,
} from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import { FeedbackItemProcessingState as P } from "@invessiv/common/constants/crm/feedback-item-processing-states";
import { getFeedbackItemProcessingState } from "./feedback-item-processing-state";

describe("feedback item processing state", () => {
  it("keeps the clarification status catalog explicit and unique", () => {
    expect(S).toEqual({ Open: "open", Answered: "answered", Closed: "closed" });
    expect(FEEDBACK_CLARIFICATION_STATUS_VALUES).toEqual(Object.values(S));
    expect(new Set(FEEDBACK_CLARIFICATION_STATUS_VALUES).size).toBe(3);
    expect(P).toEqual({
      Clarification: "clarification",
      Pending: "pending",
      ...FeedbackItemResult,
    });
    expect(new Set(Object.values(P)).size).toBe(Object.values(P).length);
  });
  it("prefers an open question even over an inconsistent stored result", () => {
    for (const result of [null, ...Object.values(FeedbackItemResult)]) {
      expect(
        getFeedbackItemProcessingState({
          result,
          clarifications: [{ status: S.Answered }, { status: S.Open }],
        }),
      ).toBe(P.Clarification);
    }
  });
  it("returns the result or pending after the question has ended", () => {
    for (const result of [null, ...Object.values(FeedbackItemResult)]) {
      expect(
        getFeedbackItemProcessingState({
          result,
          clarifications: [{ status: S.Answered }, { status: S.Closed }],
        }),
      ).toBe(result ?? P.Pending);
      expect(
        getFeedbackItemProcessingState({ result, clarifications: [] }),
      ).toBe(result ?? P.Pending);
    }
  });
});
