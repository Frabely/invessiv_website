import { describe, expect, it } from "vitest";

import {
  PORTAL_FEEDBACK_PAGE_STATE_VALUES,
  PortalFeedbackPageState,
} from "@/common/constants/portal/portal-feedback-page-states";

describe("PortalFeedbackPageState", () => {
  it("contains the exact states without duplicates", () => {
    expect(PORTAL_FEEDBACK_PAGE_STATE_VALUES).toEqual([
      "sheet",
      "open_read_only",
      "submitted",
      "discussion",
      "working",
      "none",
      "between",
      "approved",
      "exhausted",
    ]);
    expect([...PORTAL_FEEDBACK_PAGE_STATE_VALUES]).toEqual(
      Object.values(PortalFeedbackPageState),
    );
  });
});
