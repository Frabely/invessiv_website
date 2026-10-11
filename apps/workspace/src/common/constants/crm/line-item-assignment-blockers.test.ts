import { describe, expect, it } from "vitest";

import {
  LINE_ITEM_ASSIGNMENT_BLOCKER_VALUES,
  LineItemAssignmentBlocker,
} from "@/common/constants/crm/line-item-assignment-blockers";

describe("LineItemAssignmentBlocker", () => {
  it("lists every blocker exactly once", () => {
    expect(LINE_ITEM_ASSIGNMENT_BLOCKER_VALUES).toEqual([
      "missing_hours_permission",
      "project_closed",
      "missing_project_permission",
      "project_approved",
      "limit_reached",
    ]);
    expect(LINE_ITEM_ASSIGNMENT_BLOCKER_VALUES).toEqual(
      Object.values(LineItemAssignmentBlocker),
    );
  });
});
