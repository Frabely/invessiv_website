import { describe, expect, it } from "vitest";
import { FeedbackClarificationStatus as S } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import { findOpenFeedbackClarification } from "./find-open-feedback-clarification";

describe("findOpenFeedbackClarification", () => {
  it("returns the open question and keeps its own shape", () => {
    const open = { id: "b", status: S.Open };
    expect(
      findOpenFeedbackClarification([
        { id: "a", status: S.Answered },
        open,
        { id: "c", status: S.Closed },
      ]),
    ).toBe(open);
  });

  it("finds nothing when every question is finished", () => {
    expect(
      findOpenFeedbackClarification([
        { id: "a", status: S.Answered },
        { id: "b", status: S.Closed },
      ]),
    ).toBeUndefined();
    expect(findOpenFeedbackClarification([])).toBeUndefined();
  });
});
