import { describe, expect, it } from "vitest";

import {
  TASK_ACTIVITY_ENTITY,
  TaskActivityField,
} from "@/common/constants/crm/task-activity-metadata";

describe("task activity metadata", () => {
  it("names the entity and exactly the tracked fields, never free text", () => {
    expect(TASK_ACTIVITY_ENTITY).toBe("task");
    expect(Object.values(TaskActivityField)).toEqual([
      "assignee_member_id",
      "action_side",
      "visible_to_customer",
    ]);
  });
});
