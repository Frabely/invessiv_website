// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";
import { DueTasksModule } from "./due-tasks-module";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ listMyDueTasks: vi.fn() }));

vi.mock(
  "@/server/workspace/crm/query-handler/list-my-due-tasks.query-handler",
  () => ({ listMyDueTasks: mocks.listMyDueTasks }),
);

const CUSTOMER_NAME = "Nordlicht GmbH";

const ROW = {
  customerId: "11111111-1111-4111-8111-111111111111",
  customerDisplayName: CUSTOMER_NAME,
  projectTitle: "Relaunch",
  task: {
    id: "22222222-2222-4222-8222-222222222222",
    projectId: "33333333-3333-4333-8333-333333333333",
    title: "Freigabe einholen",
    description: "",
    status: TaskStatus.Open,
    actionSide: TaskActionSide.Internal,
    visibleToCustomer: false,
    assigneeMemberId: "member-actor-uuid",
    dueOn: "2020-01-01",
    completedAt: null,
    completedByMemberId: null,
    version: 1,
    createdAt: "2020-01-01T00:00:00.000Z",
    updatedAt: "2020-01-01T00:00:00.000Z",
  },
};

describe("DueTasksModule", () => {
  beforeEach(() => {
    mocks.listMyDueTasks.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders nothing and reads nothing without a task grant", async () => {
    const actor = workspaceActorWith([Permission.DashboardRead]);

    await expect(DueTasksModule({ actor, locale: "de" })).resolves.toBeNull();
    expect(mocks.listMyDueTasks).not.toHaveBeenCalled();
  });

  it("renders nothing when no task is due", async () => {
    mocks.listMyDueTasks.mockResolvedValue([]);

    await expect(
      DueTasksModule({ actor: workspaceActorWith(), locale: "de" }),
    ).resolves.toBeNull();
    expect(mocks.listMyDueTasks).toHaveBeenCalledTimes(1);
  });

  it("renders nothing and logs without personal data when the read fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.listMyDueTasks.mockRejectedValue(
      new Error(`connection lost while reading ${CUSTOMER_NAME}`),
    );

    await expect(
      DueTasksModule({ actor: workspaceActorWith(), locale: "de" }),
    ).resolves.toBeNull();
    expect(consoleError).toHaveBeenCalledWith(
      "[dashboard] due tasks could not be loaded",
      { errorName: "Error" },
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      CUSTOMER_NAME,
    );
  });

  it("renders the due tasks and links the overview filtered to own due tasks", async () => {
    mocks.listMyDueTasks.mockResolvedValue([ROW]);

    render(await DueTasksModule({ actor: workspaceActorWith(), locale: "en" }));

    expect(screen.getByText("Freigabe einholen")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Open all your due tasks/ }),
    ).toHaveAttribute("href", "/en/crm/tasks?assignee=me&period=due_soon");
  });
});
