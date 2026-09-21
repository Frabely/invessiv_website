import { describe, expect, it } from "vitest";

import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskListPeriod } from "@/common/constants/crm/list/task-list-periods";
import { TaskListStatusFilter } from "@/common/constants/crm/list/task-list-status-filters";
import { DEFAULT_TASK_LIST_FILTERS } from "@/common/defaults/crm/task-list-default-filters";
import { parseTaskListFilters } from "@/common/patterns/crm/task-list-search-params";
import {
  buildTaskListHref,
  buildTaskListQueryString,
  hasActiveTaskListFilters,
} from "@/lib/workspace/crm/task-list-query-string";

const BASE = "/en/crm/tasks";
const ID = "33333333-3333-4333-8333-333333333333";

describe("buildTaskListQueryString", () => {
  it("is empty for the defaults, so a plain overview has a plain address", () => {
    expect(buildTaskListQueryString(DEFAULT_TASK_LIST_FILTERS)).toBe("");
    expect(buildTaskListHref(BASE, DEFAULT_TASK_LIST_FILTERS)).toBe(BASE);
  });

  it("writes only what differs from the defaults", () => {
    const query = buildTaskListQueryString({
      ...DEFAULT_TASK_LIST_FILTERS,
      actionSide: TaskActionSide.Customer,
      assignee: "me",
      period: TaskListPeriod.Week,
      status: TaskListStatusFilter.All,
    });

    expect(new URLSearchParams(query).get("status")).toBe("all");
    expect(new URLSearchParams(query).get("side")).toBe("customer");
    expect(new URLSearchParams(query).get("assignee")).toBe("me");
    expect(new URLSearchParams(query).get("period")).toBe("week");
    expect(new URLSearchParams(query).has("page")).toBe(false);
    expect(new URLSearchParams(query).has("search")).toBe(false);
  });

  it("round-trips through the parser", () => {
    const filters = {
      ...DEFAULT_TASK_LIST_FILTERS,
      customerId: ID,
      includeClosedProjects: true,
      page: 2,
      projectId: ID,
      search: "logo & farben",
    };

    expect(
      parseTaskListFilters(
        Object.fromEntries(
          new URLSearchParams(buildTaskListQueryString(filters)),
        ),
      ),
    ).toEqual(filters);
  });
});

describe("hasActiveTaskListFilters", () => {
  it("does not count the page as a filter but every narrowing", () => {
    expect(hasActiveTaskListFilters(DEFAULT_TASK_LIST_FILTERS)).toBe(false);
    expect(
      hasActiveTaskListFilters({ ...DEFAULT_TASK_LIST_FILTERS, page: 4 }),
    ).toBe(false);
    expect(
      hasActiveTaskListFilters({ ...DEFAULT_TASK_LIST_FILTERS, search: "x" }),
    ).toBe(true);
    expect(
      hasActiveTaskListFilters({
        ...DEFAULT_TASK_LIST_FILTERS,
        status: TaskListStatusFilter.Done,
      }),
    ).toBe(true);
  });
});
