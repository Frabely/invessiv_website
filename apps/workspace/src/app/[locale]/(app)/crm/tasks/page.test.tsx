// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { TaskListResult } from "@/common/contracts/crm/task-list-result";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";
import TasksPage from "./page";

const mocks = vi.hoisted(() => ({
  requireWorkspaceActor: vi.fn(),
  listTasks: vi.fn(),
  listTaskFilterOptions: vi.fn(),
  listWorkspaceMembers: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound called");
  },
}));
vi.mock("@/lib/auth/permissions", () => ({
  requireWorkspaceActor: mocks.requireWorkspaceActor,
}));
vi.mock(
  "@/server/workspace/crm/query-handler/list-tasks.query-handler",
  () => ({ listTasks: mocks.listTasks }),
);
vi.mock(
  "@/server/workspace/crm/query-handler/list-task-filter-options.query-handler",
  () => ({ listTaskFilterOptions: mocks.listTaskFilterOptions }),
);
vi.mock(
  "@/server/workspace/access/query-handler/list-workspace-members.query-handler",
  () => ({ listWorkspaceMembers: mocks.listWorkspaceMembers }),
);
vi.mock(
  "@/components/workspace/workspace-page-shell/workspace-page-shell",
  () => ({
    WorkspacePageShell: ({ children }: { children: React.ReactNode }) => (
      <main>{children}</main>
    ),
  }),
);
vi.mock(
  "@/components/workspace/crm/tasks/overview/tasks-overview-toolbar/tasks-overview-toolbar",
  () => ({
    TasksOverviewToolbar: ({
      hasActiveFilters,
      members,
    }: {
      hasActiveFilters: boolean;
      members: readonly { id: string }[];
    }) => (
      <div
        data-active={String(hasActiveFilters)}
        data-members={members.map((member) => member.id).join(",")}
        data-testid="toolbar"
      />
    ),
  }),
);
vi.mock(
  "@/components/workspace/crm/tasks/overview/tasks-overview-table/tasks-overview-table",
  () => ({
    TasksOverviewTable: ({
      writableProjectIds,
    }: {
      writableProjectIds: readonly string[];
    }) => (
      <div data-testid="table" data-writable={writableProjectIds.join(",")} />
    ),
  }),
);
vi.mock(
  "@/components/workspace/crm/tasks/overview/tasks-overview-empty-state/tasks-overview-empty-state",
  () => ({
    TasksOverviewEmptyState: ({ variant }: { variant: string }) => (
      <div data-testid="empty" data-variant={variant} />
    ),
  }),
);

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_PROJECT_ID = "44444444-4444-4444-8444-444444444444";

function listWith(...projectIds: string[]): TaskListResult {
  return {
    page: 1,
    perPage: 25,
    total: projectIds.length,
    rows: projectIds.map((projectId, index) => ({
      customerId: CUSTOMER_ID,
      customerDisplayName: "Nordlicht",
      projectTitle: "Relaunch",
      task: {
        id: `66666666-6666-4666-8666-66666666666${index}`,
        projectId,
        title: "Task",
        description: "",
        status: TaskStatus.Open,
        actionSide: TaskActionSide.Internal,
        visibleToCustomer: false,
        assigneeMemberId: "77777777-7777-4777-8777-777777777777",
        dueOn: null,
        completedAt: null,
        completedByMemberId: null,
        version: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    })),
  };
}

async function renderPage(searchParams: Record<string, string> = {}) {
  render(
    await TasksPage({
      params: Promise.resolve({ locale: "de" }),
      searchParams: Promise.resolve(searchParams),
    }),
  );
}

describe("TasksPage", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.requireWorkspaceActor.mockResolvedValue(
      workspaceActorWith([Permission.TasksRead]),
    );
    mocks.listTasks.mockResolvedValue(listWith(PROJECT_ID));
    mocks.listTaskFilterOptions.mockResolvedValue({
      customers: [],
      projects: [],
    });
    mocks.listWorkspaceMembers.mockResolvedValue([]);
  });
  afterEach(cleanup);

  it("answers 404 without task read access anywhere", async () => {
    mocks.requireWorkspaceActor.mockResolvedValue(
      workspaceActorWith([Permission.CustomersRead]),
    );

    await expect(renderPage()).rejects.toThrow("notFound called");
    expect(mocks.listTasks).not.toHaveBeenCalled();
  });

  it("opens for a grant bound to a single project", async () => {
    mocks.requireWorkspaceActor.mockResolvedValue({
      ...workspaceActorWith([]),
      projectPermissions: new Map([
        [
          PROJECT_ID,
          {
            customerId: CUSTOMER_ID,
            permissions: new Set([Permission.TasksRead]),
          },
        ],
      ]),
    });

    await renderPage();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Aufgaben",
    );
    expect(mocks.listTasks).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("link", { name: "Zurück zu den Kunden" }),
    ).not.toBeInTheDocument();
  });

  it("parses the URL into filters and decides the business day once", async () => {
    await renderPage({ assignee: "me", period: "overdue", status: "all" });

    const [filters, , today] = mocks.listTasks.mock.calls[0];
    expect(filters).toMatchObject({
      assignee: "me",
      period: "overdue",
      status: "all",
    });
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(screen.getByTestId("toolbar")).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  it("marks only projects the actor may write as writable", async () => {
    mocks.requireWorkspaceActor.mockResolvedValue({
      ...workspaceActorWith([Permission.TasksRead]),
      projectPermissions: new Map([
        [
          OTHER_PROJECT_ID,
          {
            customerId: CUSTOMER_ID,
            permissions: new Set([Permission.TasksWrite]),
          },
        ],
      ]),
    });
    mocks.listTasks.mockResolvedValue(listWith(PROJECT_ID, OTHER_PROJECT_ID));

    await renderPage();

    expect(screen.getByTestId("table")).toHaveAttribute(
      "data-writable",
      OTHER_PROJECT_ID,
    );
  });

  it("hands member names only to actors who may list members", async () => {
    mocks.listWorkspaceMembers.mockResolvedValue([
      { id: "m1", displayName: "Ada", active: true },
      { id: "m2", displayName: "Grace", active: false },
    ]);

    await renderPage();
    expect(screen.getByTestId("toolbar")).toHaveAttribute("data-members", "");
    expect(mocks.listWorkspaceMembers).not.toHaveBeenCalled();
    cleanup();

    mocks.requireWorkspaceActor.mockResolvedValue(
      workspaceActorWith([Permission.TasksRead, Permission.MembersRead]),
    );
    await renderPage();

    // Inactive members stay out of the filter options.
    expect(screen.getByTestId("toolbar")).toHaveAttribute("data-members", "m1");
  });

  it("tells the three empty states apart", async () => {
    mocks.listTasks.mockResolvedValue({ ...listWith(), total: 0 });

    await renderPage();
    expect(screen.getByTestId("empty")).toHaveAttribute(
      "data-variant",
      "empty",
    );
    cleanup();

    await renderPage({ search: "zzz" });
    expect(screen.getByTestId("empty")).toHaveAttribute(
      "data-variant",
      "no_results",
    );
    cleanup();

    await renderPage({ period: "overdue" });
    expect(screen.getByTestId("empty")).toHaveAttribute(
      "data-variant",
      "nothing_overdue",
    );
    expect(screen.queryByTestId("table")).not.toBeInTheDocument();
    cleanup();

    // "due soon" includes everything overdue, so an empty result here is the same good news.
    await renderPage({ period: "due_soon" });
    expect(screen.getByTestId("empty")).toHaveAttribute(
      "data-variant",
      "nothing_overdue",
    );
  });
});
