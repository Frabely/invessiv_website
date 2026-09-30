import { describe, expect, it } from "vitest";
import { FEEDBACK_ITEM_RESULT_VALUES } from "@invessiv/common/constants/crm/feedback-item-results";
import { FEEDBACK_ITEM_RESULT_BADGES } from "./feedback-item-result-badges";

describe("FEEDBACK_ITEM_RESULT_BADGES", () => {
  it("covers every item result exactly once", () => {
    expect(Object.keys(FEEDBACK_ITEM_RESULT_BADGES)).toEqual([
      ...FEEDBACK_ITEM_RESULT_VALUES,
    ]);
  });
});
