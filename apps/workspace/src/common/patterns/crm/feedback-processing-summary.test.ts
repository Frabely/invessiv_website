import { describe, expect, it } from "vitest";
import { FeedbackClarificationStatus as S } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import { FeedbackItemResult as R } from "@invessiv/common/constants/crm/feedback-item-results";
import { summarizeFeedbackProcessing } from "./feedback-processing-summary";

describe("summarizeFeedbackProcessing", () => {
  it("counts done, pending and open questions per item", () => {
    expect(
      summarizeFeedbackProcessing([
        { result: R.Implemented, clarifications: [] },
        { result: R.NotImplemented, clarifications: [{ status: S.Answered }] },
        { result: null, clarifications: [{ status: S.Closed }] },
        { result: null, clarifications: [{ status: S.Open }] },
      ]),
    ).toEqual({ done: 2, pending: 1, clarifications: 1, total: 4 });
  });

  it("never counts an item with an open question as done", () => {
    expect(
      summarizeFeedbackProcessing([
        { result: R.Implemented, clarifications: [{ status: S.Open }] },
      ]),
    ).toEqual({ done: 0, pending: 0, clarifications: 1, total: 1 });
  });
});
