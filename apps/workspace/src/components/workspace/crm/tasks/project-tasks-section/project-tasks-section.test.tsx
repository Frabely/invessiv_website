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
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import { getCrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ProjectTasksSection } from "./project-tasks-section";

const mocks = vi.hoisted(() => ({
  changeTaskStatus: vi.fn(),
  createTask: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/crm/tasks-api-service", () => ({
  tasksApiService: {
    changeTaskStatus: mocks.changeTaskStatus,
    createTask: mocks.createTask,
  },
}));

const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const MEMBER_ID = "77777777-7777-4777-8777-777777777777";
const TODAY = "2026-09-21";
const content = getCrmTasksDictionary("en");

function task(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: "66666666-6666-4666-8666-666666666666",
    projectId: PROJECT_ID,
    title: "Provide hosting access",
    description: "",
    status: TaskStatus.Open,
    actionSide: TaskActionSide.Internal,
    visibleToCustomer: false,
    assigneeMemberId: MEMBER_ID,
    dueOn: null,
    completedAt: null,
    completedByMemberId: null,
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderSection(
  props: Partial<Parameters<typeof ProjectTasksSection>[0]> = {},
) {
  return render(
    <ProjectTasksSection
      canWrite
      content={content}
      locale="en"
      members={[{ id: MEMBER_ID, displayName: "Ada Lovelace", active: true }]}
      projectId={PROJECT_ID}
      tasks={[]}
      today={TODAY}
      {...props}
    />,
  );
}

describe("ProjectTasksSection", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });
  afterEach(cleanup);

  it("explains what the area is for and offers to add a task when writing is allowed", () => {
    renderSection();

    expect(screen.getByText(content.empty.description)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: content.section.addAction }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("starts open and folds away the body while the header keeps the add action", () => {
    renderSection({ tasks: [task()] });

    const toggle = screen.getByRole("button", {
      name: content.section.collapseLabel,
    });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Provide hosting access")).toBeInTheDocument();

    fireEvent.click(toggle);

    expect(screen.queryByText("Provide hosting access")).toBeNull();
    expect(
      screen.getByRole("button", { name: content.section.expandLabel }),
    ).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(
      screen.getByRole("button", { name: content.section.addAction }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows no write action and a read-only explanation without write access", () => {
    renderSection({ canWrite: false });

    expect(
      screen.getByText(content.emptyReadOnly.description),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: content.section.addAction }),
    ).not.toBeInTheDocument();
  });

  it("lists open tasks with who is up next, visibility, overdue text and the assignee", () => {
    renderSection({
      tasks: [
        task({
          actionSide: TaskActionSide.Customer,
          visibleToCustomer: true,
          dueOn: "2026-09-18",
        }),
      ],
    });

    expect(screen.getByText("Provide hosting access")).toBeInTheDocument();
    expect(screen.getByText(content.actionSide.customer)).toBeInTheDocument();
    expect(screen.getByText(content.visibility.visible)).toBeInTheDocument();
    expect(screen.getByText("Overdue for 3 days")).toBeInTheDocument();
    expect(screen.getByText("Assignee: Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("AL")).toBeInTheDocument();
    expect(screen.getByText("1 open")).toBeInTheDocument();
  });

  it("explains who is acting and whether an undated task is visible to the customer", () => {
    renderSection({ tasks: [task()] });

    expect(screen.getByText(content.actionSide.internal)).toBeInTheDocument();
    expect(screen.queryByText(content.due.none)).not.toBeInTheDocument();
    expect(screen.getByText(content.visibility.hidden)).toBeInTheDocument();
  });

  it("leaves the assignee out when no member names were handed over", () => {
    renderSection({ members: [], tasks: [task()] });

    expect(screen.queryByText(/^Assignee:/)).not.toBeInTheDocument();
  });

  it("folds closed tasks away until asked", () => {
    renderSection({
      tasks: [
        task(),
        task({
          id: "88888888-8888-4888-8888-888888888888",
          status: TaskStatus.Done,
          title: "Old finished task",
        }),
      ],
    });

    expect(screen.queryByText("Old finished task")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show 1 closed" }));

    expect(screen.getByText("Old finished task")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: content.section.hideClosed }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("creates a task through the dialog behind the header action", async () => {
    mocks.createTask.mockResolvedValue({ ok: true, task: task() });
    renderSection();

    fireEvent.click(
      screen.getByRole("button", { name: content.section.addAction }),
    );
    const dialog = screen.getByRole("dialog", {
      name: content.form.title.create,
    });
    fireEvent.change(
      within(dialog).getByRole("textbox", {
        name: new RegExp(content.form.fields.title),
      }),
      { target: { value: "Set up analytics" } },
    );
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: content.form.buttons.submitCreate,
      }),
    );

    await waitFor(() =>
      expect(mocks.createTask).toHaveBeenCalledWith(
        PROJECT_ID,
        expect.objectContaining({ title: "Set up analytics" }),
      ),
    );
  });

  it("changes the status from the row, announces it and refreshes", async () => {
    mocks.changeTaskStatus.mockResolvedValue({
      ok: true,
      task: task({ status: TaskStatus.Done, version: 2 }),
    });
    renderSection({ tasks: [task()] });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Status of “Provide hosting access”: Open",
      }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: content.status.done }));

    await waitFor(() =>
      expect(mocks.changeTaskStatus).toHaveBeenCalledWith(
        "66666666-6666-4666-8666-666666666666",
        { status: TaskStatus.Done, version: 1 },
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "“Provide hosting access” is now done.",
      ),
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("puts the old status back and says so when the change fails", async () => {
    mocks.changeTaskStatus.mockResolvedValue({
      ok: false,
      code: TaskErrorCode.Internal,
    });
    renderSection({ tasks: [task()] });
    const trigger = screen.getByRole("button", {
      name: "Status of “Provide hosting access”: Open",
    });

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("option", { name: content.status.done }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "The status of “Provide hosting access” could not be changed.",
      ),
    );
    expect(trigger).toHaveTextContent(content.status.open);
  });

  it("shows a status without a control for a reader", () => {
    renderSection({ canWrite: false, tasks: [task()] });

    expect(
      screen.queryByRole("button", {
        name: "Status of “Provide hosting access”",
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(content.status.open)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Edit task “Provide hosting access”",
      }),
    ).not.toBeInTheDocument();
  });

  it("opens the edit dialog from the task details, not only the title", () => {
    renderSection({ tasks: [task({ visibleToCustomer: true })] });

    fireEvent.click(screen.getByText(content.visibility.visible));

    expect(
      screen.getByRole("dialog", { name: content.form.title.edit }),
    ).toBeInTheDocument();
  });
});
