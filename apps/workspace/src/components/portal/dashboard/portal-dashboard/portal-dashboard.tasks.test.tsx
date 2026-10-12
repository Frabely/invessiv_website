// @vitest-environment jsdom
import "@/test/portal/dashboard/portal-dashboard-mocks";
import "@testing-library/jest-dom/vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { PortalTaskErrorCode } from "@invessiv/common/constants/portal/portal-task-error-codes";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import { TASK_STATUS_BADGE_TONES } from "@/common/constants/crm/badges/task-status-badge-tones";
import { listVisiblePortalWidgets } from "@/common/patterns/portal/list-visible-portal-widgets";
import {
  getPortalCredentialsDictionary,
  getPortalFilesDictionary,
  getPortalHoursDictionary,
} from "@/i18n/dictionaries/portal";
import { PortalDashboard } from "./portal-dashboard";
import {
  setupPortalDashboardTests,
  portalDashboardTestContext,
} from "@/test/portal/dashboard/portal-dashboard-test-support";
const {
  mocks,
  content,
  messagesContent,
  CONVERSATION,
  TODAY,
  FILES,
  FULL_READ,
  serviceRequestsContent,
  customerTask,
  dto,
  renderDashboard,
  ourTasksWidget,
  ourTask,
  CAN_CREATE,
  customerTasksWidget,
} = portalDashboardTestContext();
setupPortalDashboardTests();
describe("PortalDashboard tasks", () => {
  it("omits both task widgets without the read permission", () => {
    renderDashboard({
      dashboard: dto(),
      permissions: new Set([
        Permission.PortalAccess,
        Permission.PortalProjectsRead,
      ]),
    });

    expect(
      screen.queryByRole("region", { name: /Needed from you/ }),
    ).toBeNull();
    expect(
      screen.queryByRole("region", { name: /What we're working on/ }),
    ).toBeNull();
  });
  it("confirms that nothing is needed when no customer task is open", () => {
    renderDashboard({ dashboard: dto({ customerTasks: [] }) });

    expect(
      within(customerTasksWidget()).getByText(
        content.widgets.customerTasks.empty,
      ),
    ).toBeInTheDocument();
  });
  it("ticks a task off immediately and announces it", async () => {
    mocks.completeTask.mockResolvedValue({ ok: true, alreadyDone: false });
    renderDashboard();

    const checkbox = within(customerTasksWidget()).getByRole("checkbox", {
      name: "Mark “Task a” as done",
    });
    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "“Task a” is done. Thank you.",
      ),
    );
    expect(mocks.completeTask).toHaveBeenCalledWith("customer-1", "a");
    expect(mocks.refresh).toHaveBeenCalled();
  });
  it("rolls the tick back and explains when saving fails", async () => {
    mocks.completeTask.mockResolvedValue({
      ok: false,
      code: PortalTaskErrorCode.Unavailable,
    });
    renderDashboard();

    const checkbox = within(customerTasksWidget()).getByRole("checkbox", {
      name: "Mark “Task a” as done",
    });
    fireEvent.click(checkbox);

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "“Task a” could not be saved. Please try again.",
      ),
    );
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toBeEnabled();
  });
  it("keeps recently completed tasks ticked below the open ones", () => {
    renderDashboard({
      dashboard: dto({
        customerTasks: [
          customerTask("a"),
          customerTask("b", {
            done: true,
            completedAt: "2026-09-25T10:00:00Z",
          }),
        ],
      }),
    });

    const widget = customerTasksWidget();
    expect(
      within(widget).getByText(content.widgets.customerTasks.recentlyDone),
    ).toBeInTheDocument();
    const boxes = within(widget).getAllByRole("checkbox");
    expect(boxes).toHaveLength(2);
    expect(boxes[0]).not.toBeChecked();
    expect(boxes[1]).toBeChecked();
  });
  it("takes an own tick back and announces it", async () => {
    mocks.reopenTask.mockResolvedValue({ ok: true, alreadyOpen: false });
    renderDashboard({
      dashboard: dto({
        customerTasks: [customerTask("b", { done: true, canReopen: true })],
      }),
    });

    const checkbox = within(customerTasksWidget()).getByRole("checkbox", {
      name: "Undo the tick on “Task b”",
    });
    fireEvent.click(checkbox);

    expect(checkbox).not.toBeChecked();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "“Task b” is open again.",
      ),
    );
    expect(mocks.reopenTask).toHaveBeenCalledWith("customer-1", "b");
    expect(mocks.completeTask).not.toHaveBeenCalled();
  });
  it("locks a tick the team set", () => {
    renderDashboard({
      dashboard: dto({
        customerTasks: [customerTask("b", { done: true, canReopen: false })],
      }),
    });

    expect(
      within(customerTasksWidget()).getByRole("checkbox", {
        name: "“Task b” is done",
      }),
    ).toBeDisabled();
  });
  it("lists completed tasks in the dialog without unfolding anything", () => {
    mocks.search.value = "widget=customerTasks";
    renderDashboard({
      dashboard: dto({
        customerTasks: [
          customerTask("a"),
          customerTask("b", { done: true, canReopen: true }),
        ],
      }),
    });

    const dialog = screen.getByRole("dialog", { name: "Needed from you" });
    expect(
      within(dialog).getByRole("heading", { name: "Done (1)" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Task b")).toBeInTheDocument();
    expect(dialog.querySelector("details")).toBeNull();
  });
  it("labels every team task state and keeps completed and declined work visible", () => {
    renderDashboard({
      dashboard: dto({
        ourTasks: [
          ourTask("x"),
          ourTask("y", {
            status: TaskStatus.InProgress,
            requestedByCustomer: true,
          }),
          ourTask("w", {
            status: TaskStatus.Done,
            done: true,
            completedAt: "2026-09-26T10:00:00.000Z",
            requestedByCustomer: true,
          }),
          ourTask("z", {
            status: TaskStatus.Cancelled,
            requestedByCustomer: true,
          }),
        ],
      }),
    });

    fireEvent.click(
      within(ourTasksWidget()).getByRole("button", { name: "Show more" }),
    );
    const items = within(ourTasksWidget()).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(within(items[0]!).getByText("Open")).toBeInTheDocument();
    expect(within(items[0]!).queryByText("from you")).toBeNull();
    expect(within(items[1]!).getByText("In progress")).toBeInTheDocument();
    expect(within(items[1]!).getByText("from you")).toBeInTheDocument();
    expect(within(items[2]!).getByText("Done")).toBeInTheDocument();
    expect(within(items[3]!).getByText("Declined")).toBeInTheDocument();
    expect(items[3]).toHaveAttribute("data-status", TaskStatus.Cancelled);
    for (const [item, status] of items
      .map((item) => item.getAttribute("data-status"))
      .entries()) {
      const badge = items[item]?.querySelector("[data-kind='status']");
      expect(badge).toHaveAttribute(
        "data-tone",
        TASK_STATUS_BADGE_TONES[status as TaskStatus],
      );
      expect(badge?.querySelector("svg")).toBeInTheDocument();
    }
  });
  it("offers no task request without the create right", () => {
    mocks.search.value = "widget=ourTasks";
    renderDashboard();

    expect(
      within(ourTasksWidget()).queryByRole("button", {
        name: "Create a task for us",
      }),
    ).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("creates a task for the selected project, closes and announces it", async () => {
    mocks.createTask.mockResolvedValue({ ok: true });
    mocks.search.value = "widget=ourTasks";
    renderDashboard({ dashboard: dto({ capabilities: CAN_CREATE }) });

    const dialog = screen.getByRole("dialog", { name: "Create a task for us" });
    fireEvent.change(within(dialog).getByLabelText(/What should we do/), {
      target: { value: "  Add opening hours  " },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Create task" }),
    );

    await waitFor(() =>
      expect(mocks.createTask).toHaveBeenCalledWith("customer-1", {
        projectId: "project-1",
        title: "Add opening hours",
        description: "",
        dueOn: null,
      }),
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "“Add opening hours” has reached us.",
      ),
    );
    expect(mocks.replace).toHaveBeenCalledWith("/en/portal/customer-1", {
      scroll: false,
    });
    expect(mocks.refresh).toHaveBeenCalled();
  });
  it("asks for a title and shows why the server refused", async () => {
    mocks.createTask.mockResolvedValue({
      ok: false,
      code: PortalTaskErrorCode.NoAssignee,
    });
    mocks.search.value = "widget=ourTasks";
    renderDashboard({ dashboard: dto({ capabilities: CAN_CREATE }) });
    const dialog = screen.getByRole("dialog", { name: "Create a task for us" });
    const submit = within(dialog).getByRole("button", { name: "Create task" });

    fireEvent.click(submit);
    expect(
      within(dialog).getByText(content.tasks.request.titleRequired),
    ).toBeInTheDocument();
    expect(mocks.createTask).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText(/What should we do/), {
      target: { value: "Add opening hours" },
    });
    fireEvent.click(submit);

    expect(
      await within(dialog).findByText(content.tasks.request.errors.no_assignee),
    ).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
  it("disables the checkboxes in the owner view and links to the CRM", () => {
    renderDashboard({
      dashboard: dto({
        capabilities: {
          canCompleteTasks: false,
          canCreateTasks: false,
          isOwnerView: true,
        },
      }),
      permissions: FULL_READ,
      cockpitHref: "/en/crm?cockpit=customer-1",
    });

    const widget = customerTasksWidget();
    const checkbox = within(widget).getByRole("checkbox");
    expect(checkbox).toBeDisabled();
    expect(checkbox).toHaveAccessibleDescription(/Complete in the CRM/);
    expect(
      within(widget).getByRole("link", { name: "Complete in the CRM" }),
    ).toHaveAttribute("href", "/en/crm?cockpit=customer-1");
  });
  it("shows a disabled checkbox without the completion right", () => {
    renderDashboard({
      dashboard: dto({
        capabilities: {
          canCompleteTasks: false,
          canCreateTasks: false,
          isOwnerView: false,
        },
      }),
    });

    expect(
      within(customerTasksWidget()).getByRole("checkbox", {
        name: "“Task a” is open",
      }),
    ).toBeDisabled();
  });
  it("opens the task dialog through the URL and closes it by removing the parameter", () => {
    const { rerender } = renderDashboard();

    fireEvent.click(
      within(customerTasksWidget()).getByRole("button", { name: /See all/ }),
    );
    expect(mocks.push).toHaveBeenCalledWith(
      "/en/portal/customer-1?widget=customerTasks",
      { scroll: false },
    );

    mocks.search.value = "widget=customerTasks";
    rerender(
      <PortalDashboard
        cockpitHref={null}
        content={content}
        conversation={CONVERSATION}
        customerId="customer-1"
        dashboard={dto()}
        credentialsContent={getPortalCredentialsDictionary("en")}
        filesHref="/en/portal/customer-1/files"
        filesOverview={FILES}
        locale="en"
        filesContent={getPortalFilesDictionary("en")}
        hoursContent={getPortalHoursDictionary("en")}
        messagesContent={messagesContent}
        onboarding={null}
        serviceRequestsContent={serviceRequestsContent}
        today={TODAY}
        viewerUserId="user-1"
        widgets={listVisiblePortalWidgets(
          FULL_READ,
          new Set([PortalWidgetKey.Project, PortalWidgetKey.CustomerTasks]),
        )}
      />,
    );
    const dialog = screen.getByRole("dialog", { name: "Needed from you" });
    expect(
      within(dialog).getByText(content.widgets.customerTasks.dialogDescription),
    ).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(mocks.replace).toHaveBeenCalledWith("/en/portal/customer-1", {
      scroll: false,
    });
  });
});
