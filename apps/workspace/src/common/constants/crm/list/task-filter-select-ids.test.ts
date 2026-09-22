import { describe, expect, it } from "vitest";

import {
  TASK_FILTER_SELECT_ID_VALUES,
  TaskFilterSelectId,
} from "@/common/constants/crm/list/task-filter-select-ids";

describe("TaskFilterSelectId", () => {
  it("contains the exact ids without duplicates", () => {
    expect(TASK_FILTER_SELECT_ID_VALUES).toEqual([
      "tasks-status-filter",
      "tasks-period-filter",
      "tasks-side-filter",
      "tasks-assignee-filter",
      "tasks-customer-filter",
      "tasks-project-filter",
    ]);
    expect([...TASK_FILTER_SELECT_ID_VALUES]).toEqual(
      Object.values(TaskFilterSelectId),
    );
    expect(new Set(TASK_FILTER_SELECT_ID_VALUES).size).toBe(
      TASK_FILTER_SELECT_ID_VALUES.length,
    );
  });
});
