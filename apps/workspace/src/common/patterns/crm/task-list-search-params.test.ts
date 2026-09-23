import { describe, expect, it } from "vitest";

import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskListPeriod } from "@/common/constants/crm/list/task-list-periods";
import { TaskListStatusFilter } from "@/common/constants/crm/list/task-list-status-filters";
import { DEFAULT_TASK_LIST_FILTERS } from "@/common/defaults/crm/task-list-default-filters";
import { parseTaskListFilters } from "@/common/patterns/crm/task-list-search-params";

const ID = "33333333-3333-4333-8333-333333333333";

describe("parseTaskListFilters", () => {
  it("returns the neutral defaults for an empty URL", () => {
    expect(parseTaskListFilters({})).toEqual(DEFAULT_TASK_LIST_FILTERS);
  });

  it("reads every known filter", () => {
    expect(
      parseTaskListFilters({
        assignee: "me",
        closedProjects: "true",
        customer: ID,
        page: "3",
        period: "overdue",
        project: ID,
        search: "  logo  ",
        side: "customer",
        status: "done",
      }),
    ).toEqual({
      actionSide: TaskActionSide.Customer,
      assignee: "me",
      customerId: ID,
      includeClosedProjects: true,
      page: 3,
      period: TaskListPeriod.Overdue,
      projectId: ID,
      search: "logo",
      status: TaskListStatusFilter.Done,
    });
  });

  it("accepts a member id as the assignee", () => {
    expect(parseTaskListFilters({ assignee: ID }).assignee).toBe(ID);
  });

  it("drops unknown or malformed values instead of passing them on", () => {
    expect(
      parseTaskListFilters({
        assignee: "somebody",
        customer: "not-a-uuid",
        page: "-2",
        period: "next-year",
        project: "1; drop table",
        side: "partner",
        status: "blocked",
      }),
    ).toEqual(DEFAULT_TASK_LIST_FILTERS);
  });

  it("ignores repeated parameters and clamps the search length", () => {
    expect(parseTaskListFilters({ status: ["done", "open"] }).status).toBe(
      TaskListStatusFilter.Active,
    );
    expect(
      parseTaskListFilters({ search: "x".repeat(500) }).search,
    ).toHaveLength(100);
  });
});
