import { beforeEach, describe, expect, it, vi } from "vitest";

import { TaskListPeriod } from "@/common/constants/crm/list/task-list-periods";
import { listMyDueTasks } from "@/server/workspace/crm/query-handler/list-my-due-tasks.query-handler";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  database: { name: "database" },
  where: { name: "where" },
  build: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: () => mocks.database,
}));
vi.mock("@/server/workspace/crm/services/task-list-conditions-service", () => ({
  taskListConditionsService: { build: mocks.build },
}));
vi.mock("@/server/workspace/crm/services/task-list-rows-service", () => ({
  taskListRowsService: { select: mocks.select },
}));

describe("listMyDueTasks", () => {
  const actor = workspaceActorWith();

  beforeEach(() => {
    mocks.build.mockReset().mockReturnValue(mocks.where);
    mocks.select.mockReset().mockResolvedValue([]);
  });

  it("narrows to the actor's own open tasks that are overdue or due within a week", async () => {
    await listMyDueTasks(actor, "2026-09-21");

    expect(mocks.build).toHaveBeenCalledWith(
      expect.objectContaining({
        assignee: "me",
        period: TaskListPeriod.DueSoon,
        status: "active",
      }),
      actor,
      "2026-09-21",
    );
  });

  it("reads the first ten rows in one query without a count", async () => {
    await listMyDueTasks(actor, "2026-09-21");

    expect(mocks.select).toHaveBeenCalledTimes(1);
    expect(mocks.select).toHaveBeenCalledWith(mocks.database, mocks.where, {
      limit: 10,
      offset: 0,
    });
  });
});
