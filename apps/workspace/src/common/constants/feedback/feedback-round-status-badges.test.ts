import { describe, expect, it } from "vitest";
import { FEEDBACK_ROUND_STATUS_VALUES } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { FEEDBACK_ROUND_STATUS_BADGES } from "./feedback-round-status-badges";

describe("FEEDBACK_ROUND_STATUS_BADGES", () => {
  it("covers every round status exactly once", () => {
    expect(Object.keys(FEEDBACK_ROUND_STATUS_BADGES)).toEqual([
      ...FEEDBACK_ROUND_STATUS_VALUES,
    ]);
  });
});
