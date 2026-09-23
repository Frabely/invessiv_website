import { describe, expect, it } from "vitest";

import {
  OPEN_TASK_STATUS_VALUES,
  TASK_STATUS_VALUES,
  TaskStatus,
} from "@invessiv/common/constants/crm/task-statuses";

describe("TaskStatus", () => {
  it("lists every const value exactly once", () => {
    expect(TASK_STATUS_VALUES).toEqual([
      "open",
      "in_progress",
      "done",
      "cancelled",
    ]);
    expect(TASK_STATUS_VALUES).toEqual(Object.values(TaskStatus));
    expect(new Set(TASK_STATUS_VALUES).size).toBe(TASK_STATUS_VALUES.length);
  });

  it("treats only open and in progress as still demanding action", () => {
    expect(OPEN_TASK_STATUS_VALUES).toEqual(["open", "in_progress"]);
    for (const status of OPEN_TASK_STATUS_VALUES) {
      expect(TASK_STATUS_VALUES).toContain(status);
    }
  });
});
