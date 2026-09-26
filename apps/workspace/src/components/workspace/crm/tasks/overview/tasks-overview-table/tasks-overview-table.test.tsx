// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TaskErrorCode } from "@invessiv/common/constants/crm/errors/task-error-codes";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { TaskListResult } from "@/common/contracts/crm/task-list-result";
import { getCrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { TasksOverviewTable } from "./tasks-overview-table";

const mocks = vi.hoisted(() => ({
  changeTaskStatus: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/crm/tasks-api-service", () => ({
  tasksApiService: { changeTaskStatus: mocks.changeTaskStatus },
}));

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const WRITABLE_PROJECT = "33333333-3333-4333-8333-333333333333";
const READ_ONLY_PROJECT = "44444444-4444-4444-8444-444444444444";
const MEMBER_ID = "77777777-7777-4777-8777-777777777777";
const content = getCrmTasksDictionary("en");

function taskRow(projectId: string, title: string, dueOn: string | null) {
  return {
    customerId: CUSTOMER_ID,
    customerDisplayName: "Nordlicht GmbH",
    projectTitle: "Relaunch",
    task: {
      id: `id-${title}`,
      projectId,
      title,
      description: "",
      status: TaskStatus.Open,
      actionSide: TaskActionSide.Customer,
      visibleToCustomer: true,
      assigneeMemberId: MEMBER_ID,
      dueOn,
      completedAt: null,
      completedByMemberId: null,
      completedByCustomer: false,
      version: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  };
}

const LIST: TaskListResult = {
  page: 1,
  perPage: 25,
  total: 2,
  rows: [
    taskRow(WRITABLE_PROJECT, "Send logo", "2026-09-18"),
    taskRow(READ_ONLY_PROJECT, "Approve texts", null),
  ],
};

function renderTable(list: TaskListResult = LIST) {
  render(
    <TasksOverviewTable
      basePath="/en/crm/tasks"
      content={content}
      crmPath="/en/crm"
      list={list}
      locale="en"
      members={[{ id: MEMBER_ID, displayName: "Ada Lovelace", active: true }]}
      queryString=""
      today="2026-09-21"
      writableProjectIds={[WRITABLE_PROJECT]}
    />,
  );
}

describe("TasksOverviewTable", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });
  afterEach(cleanup);

  it("names the customer and project of every task and links into the customer file", () => {
    renderTable();

    const row = screen.getByRole("row", { name: /Send logo/ });
    expect(within(row).getByText("Relaunch")).toBeInTheDocument();
    expect(
      within(row).getByRole("link", {
        name: "Open the customer file of “Nordlicht GmbH”",
      }),
    ).toHaveAttribute("href", `/en/crm?cockpit=${CUSTOMER_ID}`);
  });

  it("shows overdue as text, who is up next and the assignee", () => {
    renderTable();

    const row = screen.getByRole("row", { name: /Send logo/ });
    expect(within(row).getByText("Overdue for 3 days")).toBeInTheDocument();
    expect(
      within(row).getByText(content.actionSide.customer),
    ).toBeInTheDocument();
    expect(within(row).getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("keeps project and visibility in their own table cells", () => {
    renderTable();

    const row = screen.getByRole("row", { name: /Send logo/ });
    expect(within(row).getByText("Relaunch")).toBeInTheDocument();
    expect(
      within(row).getByText(content.visibility.visible),
    ).toBeInTheDocument();
  });

  it("does not render a dead customer link without customer access", () => {
    render(
      <TasksOverviewTable
        basePath="/en/crm/tasks"
        content={content}
        list={LIST}
        locale="en"
        members={[]}
        queryString=""
        today="2026-09-21"
        writableProjectIds={[]}
      />,
    );

    expect(screen.queryByRole("link", { name: /customer file/ })).toBeNull();
    expect(screen.getAllByText("Nordlicht GmbH")).not.toHaveLength(0);
  });

  it("gives a status control only to tasks of writable projects", () => {
    renderTable();

    expect(
      screen.getByRole("button", { name: "Status of “Send logo”: Open" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Status of “Approve texts”" }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("row", { name: /Approve texts/ })).getByText(
        content.status.open,
      ),
    ).toBeInTheDocument();
  });

  it("changes the status in the row, announces it and refreshes", async () => {
    mocks.changeTaskStatus.mockResolvedValue({ ok: true });
    renderTable();

    fireEvent.click(
      screen.getByRole("button", { name: "Status of “Send logo”: Open" }),
    );
    fireEvent.click(screen.getByRole("option", { name: content.status.done }));

    await waitFor(() =>
      expect(mocks.changeTaskStatus).toHaveBeenCalledWith("id-Send logo", {
        status: TaskStatus.Done,
        version: 1,
      }),
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "“Send logo” is now done.",
      ),
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("puts the status back and says so when the change fails", async () => {
    mocks.changeTaskStatus.mockResolvedValue({
      ok: false,
      code: TaskErrorCode.Internal,
    });
    renderTable();
    const trigger = screen.getByRole("button", {
      name: "Status of “Send logo”: Open",
    });

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("option", { name: content.status.done }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "The status of “Send logo” could not be changed.",
      ),
    );
    expect(trigger).toHaveTextContent(content.status.open);
  });

  it("shows a dash instead of an assignee when no names were handed over", () => {
    render(
      <TasksOverviewTable
        basePath="/en/crm/tasks"
        content={content}
        crmPath="/en/crm"
        list={LIST}
        locale="en"
        members={[]}
        queryString=""
        today="2026-09-21"
        writableProjectIds={[]}
      />,
    );

    expect(
      within(screen.getByRole("row", { name: /Send logo/ })).getByText(
        content.overview.noAssignee,
      ),
    ).toBeInTheDocument();
  });
});
