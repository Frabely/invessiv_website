import { describe, expect, it } from "vitest";

import {
  TASK_ACTION_SIDE_VALUES,
  TaskActionSide,
} from "@invessiv/common/constants/crm/task-action-sides";

describe("TaskActionSide", () => {
  it("lists every const value exactly once", () => {
    expect(TASK_ACTION_SIDE_VALUES).toEqual(["internal", "customer"]);
    expect(TASK_ACTION_SIDE_VALUES).toEqual(Object.values(TaskActionSide));
    expect(new Set(TASK_ACTION_SIDE_VALUES).size).toBe(
      TASK_ACTION_SIDE_VALUES.length,
    );
  });
});
