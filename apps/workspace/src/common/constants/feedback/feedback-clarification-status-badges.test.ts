import { describe, expect, it } from "vitest";
import { FEEDBACK_CLARIFICATION_STATUS_VALUES } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import { FEEDBACK_CLARIFICATION_STATUS_BADGES } from "./feedback-clarification-status-badges";

describe("FEEDBACK_CLARIFICATION_STATUS_BADGES", () => {
  it("covers every clarification status exactly once", () => {
    expect(Object.keys(FEEDBACK_CLARIFICATION_STATUS_BADGES)).toEqual([
      ...FEEDBACK_CLARIFICATION_STATUS_VALUES,
    ]);
  });
});
