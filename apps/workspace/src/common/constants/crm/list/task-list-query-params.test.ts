import { describe, expect, it } from "vitest";

import {
  TASK_LIST_QUERY_PARAM_VALUES,
  TaskListQueryParam,
} from "@/common/constants/crm/list/task-list-query-params";

describe("TaskListQueryParam", () => {
  it("contains the exact parameters without duplicates", () => {
    expect(TASK_LIST_QUERY_PARAM_VALUES).toEqual([
      "page",
      "status",
      "side",
      "assignee",
      "customer",
      "project",
      "period",
      "search",
      "closedProjects",
    ]);
    expect(TASK_LIST_QUERY_PARAM_VALUES).toEqual(
      Object.values(TaskListQueryParam),
    );
    expect(new Set(TASK_LIST_QUERY_PARAM_VALUES).size).toBe(
      TASK_LIST_QUERY_PARAM_VALUES.length,
    );
  });
});
