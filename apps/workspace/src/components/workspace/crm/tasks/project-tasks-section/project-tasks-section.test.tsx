// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
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
    expect(
      screen.getByRole("textbox", { name: content.quickCreate.label }),
    ).toBeInTheDocument();
  });

  it("shows no write action and a read-only explanation without write access", () => {
    renderSection({ canWrite: false });

    expect(
      screen.getByText(content.emptyReadOnly.description),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: content.section.addAction }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: content.quickCreate.label }),
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
    expect(screen.getByText("1 open")).toBeInTheDocument();
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

  it("creates a task on Enter, clears the field and announces it", async () => {
    mocks.createTask.mockResolvedValue({ ok: true, task: task() });
    renderSection();
    const input = screen.getByRole("textbox", {
      name: content.quickCreate.label,
    });

    fireEvent.change(input, { target: { value: "  Set up analytics  " } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    await waitFor(() => expect(mocks.createTask).toHaveBeenCalledTimes(1));
    expect(mocks.createTask).toHaveBeenCalledWith(
      PROJECT_ID,
      expect.objectContaining({
        title: "Set up analytics",
        actionSide: TaskActionSide.Internal,
        visibleToCustomer: false,
        assigneeMemberId: null,
      }),
    );
    await waitFor(() => expect(input).toHaveValue(""));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Task “Set up analytics” added.",
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("validates a required quick-create title and keeps the text when the request fails", async () => {
    renderSection();
    const input = screen.getByRole("textbox", {
      name: content.quickCreate.label,
    });

    fireEvent.submit(input.closest("form") as HTMLFormElement);
    expect(mocks.createTask).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a task title.")).toBeInTheDocument();

    mocks.createTask.mockResolvedValue({
      ok: false,
      code: TaskErrorCode.Internal,
    });
    fireEvent.change(input, { target: { value: "Keep me" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.quickCreate.error,
    );
    expect(input).toHaveValue("Keep me");
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

  it("opens the edit dialog from the task title", () => {
    renderSection({ tasks: [task()] });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit task “Provide hosting access”",
      }),
    );

    expect(
      screen.getByRole("dialog", { name: content.form.title.edit }),
    ).toBeInTheDocument();
  });
});
