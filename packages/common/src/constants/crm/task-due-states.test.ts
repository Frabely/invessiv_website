import { describe, expect, it } from "vitest";

import { TASK_DUE_SOON_WINDOW_DAYS, TaskDueState } from "./task-due-states";

describe("TaskDueState", () => {
  it("contains the exact states without duplicates", () => {
    expect(Object.values(TaskDueState)).toEqual([
      "overdue",
      "due_soon",
      "none",
    ]);
    expect(new Set(Object.values(TaskDueState)).size).toBe(3);
  });

  it("looks seven days ahead for tasks that are due soon", () => {
    expect(TASK_DUE_SOON_WINDOW_DAYS).toBe(7);
  });
});
