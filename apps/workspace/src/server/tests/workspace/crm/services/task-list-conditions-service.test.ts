import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskListPeriod } from "@/common/constants/crm/list/task-list-periods";
import { TaskListStatusFilter } from "@/common/constants/crm/list/task-list-status-filters";
import { DEFAULT_TASK_LIST_FILTERS } from "@/common/defaults/crm/task-list-default-filters";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";
import { taskListConditionsService } from "@/server/workspace/crm/services/task-list-conditions-service";

vi.mock("server-only", () => ({}));

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const MEMBER_ID = "77777777-7777-4777-8777-777777777777";
const TODAY = "2026-09-21";

function render(
  overrides: Partial<typeof DEFAULT_TASK_LIST_FILTERS> = {},
  actor = workspaceActorWith([Permission.TasksRead]),
) {
  const condition = taskListConditionsService.build(
    { ...DEFAULT_TASK_LIST_FILTERS, ...overrides },
    actor,
    TODAY,
  );
  if (!condition) throw new Error("expected a condition");
  return new PgDialect().sqlToQuery(condition);
}

describe("taskListConditionsService.build", () => {
  it("shows what still demands action and hides closed projects and archived customers by default", () => {
    const { sql, params } = render();

    expect(sql).toContain(`"tasks"."status" in`);
    expect(params).toEqual(
      expect.arrayContaining(["open", "in_progress", "archived"]),
    );
    expect(sql).toContain(`"projects"."status" not in`);
    expect(sql).toContain(`"customers"."status" not in`);
  });

  it("includes closed projects only when asked", () => {
    const { sql } = render({ includeClosedProjects: true });

    expect(sql).not.toContain(`"projects"."status" not in`);
    expect(sql).not.toContain(`"customers"."status" not in`);
  });

  it("filters one exact status, or none for all", () => {
    expect(render({ status: TaskListStatusFilter.Done }).params).toContain(
      "done",
    );
    expect(render({ status: TaskListStatusFilter.All }).sql).not.toContain(
      `"tasks"."status" =`,
    );
  });

  it("resolves the assignee shortcut to the acting member", () => {
    const actor = workspaceActorWith([Permission.TasksRead]);

    expect(render({ assignee: "me" }, actor).params).toContain(
      actor.workspaceMemberId,
    );
    expect(render({ assignee: MEMBER_ID }).params).toContain(MEMBER_ID);
  });

  it("narrows by side, customer and project", () => {
    const { params } = render({
      actionSide: TaskActionSide.Customer,
      customerId: CUSTOMER_ID,
      projectId: PROJECT_ID,
    });

    expect(params).toEqual(
      expect.arrayContaining(["customer", CUSTOMER_ID, PROJECT_ID]),
    );
  });

  it("mirrors the due-state rules: only still-open tasks, with today decided by the caller", () => {
    const overdue = render({
      period: TaskListPeriod.Overdue,
      status: TaskListStatusFilter.All,
    });
    expect(overdue.sql).toContain(`"tasks"."due_on" <`);
    expect(overdue.params).toContain(TODAY);
    expect(overdue.params).toEqual(
      expect.arrayContaining(["open", "in_progress"]),
    );

    const week = render({ period: TaskListPeriod.Week });
    expect(week.params).toEqual(expect.arrayContaining([TODAY, "2026-09-28"]));

    const dueSoon = render({ period: TaskListPeriod.DueSoon });
    expect(dueSoon.sql).toContain(`"tasks"."due_on" <=`);
    expect(dueSoon.params).toContain("2026-09-28");
    expect(dueSoon.params).not.toContain(TODAY);
  });

  it("searches the title case-insensitively and escapes wildcards", () => {
    const { sql, params } = render({ search: "50%_off\\" });

    expect(sql).toContain(`"tasks"."title" ilike`);
    expect(params).toContain("%50\\%\\_off\\\\%");
  });

  it("never lets a filter widen the access scope of a bound actor", () => {
    const actor = {
      ...workspaceActorWith([]),
      customerPermissions: new Map([
        [CUSTOMER_ID, new Set([Permission.TasksRead])],
      ]),
    };

    const { sql, params } = render({ customerId: PROJECT_ID }, actor);

    // The bound customer stays in the condition next to whatever the filter asked for.
    expect(sql).toContain(`"projects"."customer_id" in`);
    expect(params).toContain(CUSTOMER_ID);
    expect(params).toContain(PROJECT_ID);
  });

  it("denies everything to an actor without any read scope", () => {
    const actor = workspaceActorWith([]);

    const { sql } = render({}, actor);

    // Drizzle renders an empty IN list as a constant false, so no row can match.
    expect(sql.startsWith("(false and")).toBe(true);
  });
});
