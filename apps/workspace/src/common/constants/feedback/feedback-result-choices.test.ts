import { describe, expect, it } from "vitest";
import { FEEDBACK_ITEM_RESULT_VALUES } from "@invessiv/common/constants/crm/feedback-item-results";
import {
  FEEDBACK_RESULT_CHOICE_VALUES,
  FeedbackResultChoice,
} from "./feedback-result-choices";

describe("FeedbackResultChoice", () => {
  it("offers pending in front of every item result, without duplicates", () => {
    expect([...FEEDBACK_RESULT_CHOICE_VALUES]).toEqual([
      "pending",
      ...FEEDBACK_ITEM_RESULT_VALUES,
    ]);
    expect([...FEEDBACK_RESULT_CHOICE_VALUES]).toEqual(
      Object.values(FeedbackResultChoice),
    );
  });
});
