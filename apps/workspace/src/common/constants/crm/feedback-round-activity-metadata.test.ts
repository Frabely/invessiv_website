import { describe, expect, it } from "vitest";

import {
  FEEDBACK_ROUND_ACTIVITY_ENTITY,
  FEEDBACK_ROUND_ACTIVITY_STATUS_FIELD,
} from "@/common/constants/crm/feedback-round-activity-metadata";

describe("feedback round activity metadata", () => {
  it("names the entity and the only tracked field", () => {
    expect(FEEDBACK_ROUND_ACTIVITY_ENTITY).toBe("feedback_round");
    expect(FEEDBACK_ROUND_ACTIVITY_STATUS_FIELD).toBe("status");
  });
});
