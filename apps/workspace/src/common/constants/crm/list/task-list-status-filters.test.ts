import { describe, expect, it } from "vitest";

import {
  TASK_LIST_STATUS_FILTER_VALUES,
  TaskListStatusFilter,
} from "@/common/constants/crm/list/task-list-status-filters";

describe("TaskListStatusFilter", () => {
  it("contains the exact filters without duplicates", () => {
    expect(TASK_LIST_STATUS_FILTER_VALUES).toEqual([
      "active",
      "open",
      "in_progress",
      "done",
      "cancelled",
      "all",
    ]);
    expect(TASK_LIST_STATUS_FILTER_VALUES).toEqual(
      Object.values(TaskListStatusFilter),
    );
    expect(new Set(TASK_LIST_STATUS_FILTER_VALUES).size).toBe(
      TASK_LIST_STATUS_FILTER_VALUES.length,
    );
  });
});
