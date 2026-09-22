import { describe, expect, it } from "vitest";

import {
  MY_DUE_TASK_LIST_FILTERS,
  MY_DUE_TASKS_LIMIT,
} from "./my-due-task-list-filters";

describe("MY_DUE_TASK_LIST_FILTERS", () => {
  it("asks for the actor's own active tasks due up to a week ahead, first page", () => {
    expect(MY_DUE_TASK_LIST_FILTERS).toEqual({
      actionSide: null,
      assignee: "me",
      customerId: null,
      includeClosedProjects: false,
      page: 1,
      period: "due_soon",
      projectId: null,
      search: "",
      status: "active",
    });
    expect(MY_DUE_TASKS_LIMIT).toBe(10);
  });
});
