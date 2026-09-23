import { describe, expect, it } from "vitest";

import {
  TASK_LIST_PERIOD_VALUES,
  TaskListPeriod,
} from "@/common/constants/crm/list/task-list-periods";

describe("TaskListPeriod", () => {
  it("contains the exact periods without duplicates", () => {
    expect(TASK_LIST_PERIOD_VALUES).toEqual([
      "all",
      "overdue",
      "today",
      "week",
      "due_soon",
    ]);
    expect(TASK_LIST_PERIOD_VALUES).toEqual(Object.values(TaskListPeriod));
    expect(new Set(TASK_LIST_PERIOD_VALUES).size).toBe(
      TASK_LIST_PERIOD_VALUES.length,
    );
  });
});
