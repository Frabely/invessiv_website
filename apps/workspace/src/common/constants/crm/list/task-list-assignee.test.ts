import { describe, expect, it } from "vitest";

import {
  TASK_LIST_ASSIGNEE_ME,
  TASK_LIST_PAGE_SIZE,
} from "@/common/constants/crm/list/task-list-assignee";

describe("task list constants", () => {
  it("keeps the assignee shortcut distinct from any member id and a sensible page size", () => {
    expect(TASK_LIST_ASSIGNEE_ME).toBe("me");
    expect(TASK_LIST_ASSIGNEE_ME).not.toMatch(/^[0-9a-f-]{36}$/);
    expect(TASK_LIST_PAGE_SIZE).toBe(25);
  });
});
