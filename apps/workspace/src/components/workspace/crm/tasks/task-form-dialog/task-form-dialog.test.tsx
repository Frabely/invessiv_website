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
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import { getCrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { TaskFormDialog } from "./task-form-dialog";

const mocks = vi.hoisted(() => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/crm/tasks-api-service", () => ({
  tasksApiService: {
    createTask: mocks.createTask,
    updateTask: mocks.updateTask,
  },
}));

const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const MEMBER_ID = "77777777-7777-4777-8777-777777777777";
const OTHER_MEMBER_ID = "88888888-8888-4888-8888-888888888888";
const content = getCrmTasksDictionary("en");
const members = [
  { id: MEMBER_ID, displayName: "Ada Lovelace", active: true },
  { id: OTHER_MEMBER_ID, displayName: "Grace Hopper", active: true },
];

const EXISTING: TaskDto = {
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
  completedByCustomer: false,
  version: 4,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function renderDialog(task: TaskDto | null, onClose = vi.fn()) {
  render(
    <TaskFormDialog
      content={content}
      members={members}
      onCloseAction={onClose}
      projectId={PROJECT_ID}
      task={task}
    />,
  );
  return onClose;
}

function submit() {
  fireEvent.click(
    screen.getByRole("button", {
      name: /^(Add task|Save)$/,
    }),
  );
}

describe("TaskFormDialog", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });
  afterEach(cleanup);

  it("blocks an empty title with a field error and sends nothing", () => {
    renderDialog(null);

    submit();

    expect(
      screen.getByText(content.form.validation.TITLE_REQUIRED),
    ).toBeInTheDocument();
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it("creates a task for the project with the entered values", async () => {
    mocks.createTask.mockResolvedValue({ ok: true, task: EXISTING });
    const onClose = renderDialog(null);

    fireEvent.change(screen.getByRole("textbox", { name: /Title/ }), {
      target: { value: "  Clarify logo  " },
    });
    const dueField = screen.getByLabelText(content.form.fields.dueOn);
    // A due day is picked from a calendar, never typed as free text.
    expect(dueField).toHaveAttribute("type", "date");
    fireEvent.change(dueField, { target: { value: "2026-10-01" } });
    submit();

    await waitFor(() => expect(mocks.createTask).toHaveBeenCalledTimes(1));
    expect(mocks.createTask).toHaveBeenCalledWith(
      PROJECT_ID,
      expect.objectContaining({
        title: "Clarify logo",
        actionSide: TaskActionSide.Internal,
        visibleToCustomer: false,
        assigneeMemberId: null,
        dueOn: "2026-10-01",
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("switches visibility on and locks it while the customer is up next", () => {
    renderDialog(null);
    const visible = screen.getByRole("checkbox", {
      name: content.form.fields.visibleToCustomer,
    });
    expect(visible).not.toBeChecked();
    expect(visible).toBeEnabled();

    fireEvent.click(
      screen.getByRole("button", { name: content.form.fields.actionSide }),
    );
    fireEvent.click(
      screen.getByRole("option", { name: content.actionSide.customer }),
    );

    expect(visible).toBeChecked();
    expect(visible).toBeDisabled();
    expect(
      screen.getByText(content.form.hints.visibleForced),
    ).toBeInTheDocument();
  });

  it("edits with the version it read and keeps the current assignee", async () => {
    mocks.updateTask.mockResolvedValue({ ok: true, task: EXISTING });
    renderDialog(EXISTING);

    fireEvent.change(screen.getByRole("textbox", { name: /Title/ }), {
      target: { value: "Renamed" },
    });
    submit();

    await waitFor(() => expect(mocks.updateTask).toHaveBeenCalledTimes(1));
    expect(mocks.updateTask).toHaveBeenCalledWith(
      EXISTING.id,
      expect.objectContaining({
        title: "Renamed",
        assigneeMemberId: MEMBER_ID,
        version: 4,
      }),
    );
  });

  it("keeps the input and shows the current state on a version conflict", async () => {
    mocks.updateTask.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: { ...EXISTING, title: "Changed elsewhere", version: 5 },
    });
    const onClose = renderDialog(EXISTING);

    fireEvent.change(screen.getByRole("textbox", { name: /Title/ }), {
      target: { value: "My edit" },
    });
    submit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.form.conflict.message,
    );
    expect(screen.getByText("Current state: Changed elsewhere")).toBeVisible();
    expect(screen.getByRole("textbox", { name: /Title/ })).toHaveValue(
      "My edit",
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows the message of a known failure and stays open", async () => {
    mocks.createTask.mockResolvedValue({
      ok: false,
      code: TaskErrorCode.AssigneeNotActive,
    });
    const onClose = renderDialog(null);

    fireEvent.change(screen.getByRole("textbox", { name: /Title/ }), {
      target: { value: "Something" },
    });
    submit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.form.errors.ASSIGNEE_NOT_ACTIVE,
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("leaves the assignee field out when no members were handed over", () => {
    render(
      <TaskFormDialog
        content={content}
        members={[]}
        onCloseAction={vi.fn()}
        projectId={PROJECT_ID}
        task={null}
      />,
    );

    expect(
      screen.queryByText(content.form.fields.assigneeMemberId),
    ).not.toBeInTheDocument();
  });
});
