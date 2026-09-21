import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";
import { buildTasksViewModel } from "@/lib/workspace/crm/tasks-view-model";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  listCustomerTasks: vi.fn(),
  listWorkspaceMembers: vi.fn(),
}));

vi.mock(
  "@/server/workspace/crm/query-handler/list-customer-tasks.query-handler",
  () => ({ listCustomerTasks: mocks.listCustomerTasks }),
);
vi.mock(
  "@/server/workspace/access/query-handler/list-workspace-members.query-handler",
  () => ({ listWorkspaceMembers: mocks.listWorkspaceMembers }),
);

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_A = "33333333-3333-4333-8333-333333333333";
const PROJECT_B = "44444444-4444-4444-8444-444444444444";

const projects = [
  { id: PROJECT_A, title: "A", project: null },
  { id: PROJECT_B, title: "B", project: null },
] as unknown as CockpitProjectDto[];

describe("buildTasksViewModel", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.listCustomerTasks.mockResolvedValue([{ id: "task-1" }]);
    mocks.listWorkspaceMembers.mockResolvedValue([
      { id: "m1", displayName: "Ada", active: true, primaryEmail: "a@x.test" },
    ]);
  });

  it("returns null without reading anything when no project is readable", async () => {
    const result = await buildTasksViewModel({
      actor: workspaceActorWith([Permission.TasksWrite]),
      customerId: CUSTOMER_ID,
      projects,
    });

    expect(result).toBeNull();
    expect(mocks.listCustomerTasks).not.toHaveBeenCalled();
  });

  it("lists readable and writable projects and the business day", async () => {
    const result = await buildTasksViewModel({
      actor: workspaceActorWith([Permission.TasksRead, Permission.TasksWrite]),
      customerId: CUSTOMER_ID,
      projects,
    });

    expect(result).toMatchObject({
      tasks: [{ id: "task-1" }],
      readableProjectIds: [PROJECT_A, PROJECT_B],
      writableProjectIds: [PROJECT_A, PROJECT_B],
    });
    expect(result?.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("keeps a read-only project out of the writable ids", async () => {
    const actor = {
      ...workspaceActorWith([]),
      customerPermissions: new Map(),
      projectPermissions: new Map([
        [
          PROJECT_A,
          {
            customerId: CUSTOMER_ID,
            permissions: new Set([Permission.TasksRead]),
          },
        ],
        [
          PROJECT_B,
          {
            customerId: CUSTOMER_ID,
            permissions: new Set([Permission.TasksRead, Permission.TasksWrite]),
          },
        ],
      ]),
    };

    const result = await buildTasksViewModel({
      actor,
      customerId: CUSTOMER_ID,
      projects,
    });

    expect(result?.readableProjectIds).toEqual([PROJECT_A, PROJECT_B]);
    expect(result?.writableProjectIds).toEqual([PROJECT_B]);
  });

  it("hands out member names only to actors who may list members", async () => {
    const withMembers = await buildTasksViewModel({
      actor: workspaceActorWith([Permission.TasksRead, Permission.MembersRead]),
      customerId: CUSTOMER_ID,
      projects,
    });
    const withoutMembers = await buildTasksViewModel({
      actor: workspaceActorWith([Permission.TasksRead]),
      customerId: CUSTOMER_ID,
      projects,
    });

    expect(withMembers?.members).toEqual([
      { id: "m1", displayName: "Ada", active: true },
    ]);
    expect(withoutMembers?.members).toEqual([]);
  });
});
