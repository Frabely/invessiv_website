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

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { TaskDueState } from "@invessiv/common/constants/crm/task-due-states";
import { PortalTaskErrorCode } from "@invessiv/common/constants/portal/portal-task-error-codes";
import type { PortalCustomerTaskDto } from "@invessiv/common/contracts/portal/portal-customer-task.dto";
import type { PortalDashboardDto } from "@invessiv/common/contracts/portal/portal-dashboard.dto";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import { listVisiblePortalWidgets } from "@/common/patterns/portal/list-visible-portal-widgets";
import { getPortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { PortalDashboard } from "./portal-dashboard";

const mocks = vi.hoisted(() => ({
  completeTask: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  search: { value: "" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/portal/customer-1",
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
    refresh: mocks.refresh,
  }),
  useSearchParams: () => new URLSearchParams(mocks.search.value),
}));
vi.mock("@/client/portal/portal-tasks-api-service", () => ({
  portalTasksApiService: { completeTask: mocks.completeTask },
}));

const content = getPortalDashboardDictionary("en");
const TODAY = "2026-09-26";
const FULL_READ = new Set([
  Permission.PortalAccess,
  Permission.PortalProjectsRead,
  Permission.PortalTasksRead,
  Permission.PortalTasksComplete,
]);

function customerTask(
  id: string,
  overrides: Partial<PortalCustomerTaskDto> = {},
): PortalCustomerTaskDto {
  return {
    id,
    projectId: "project-1",
    projectTitle: "Relaunch",
    title: `Task ${id}`,
    description: null,
    dueOn: null,
    dueState: TaskDueState.None,
    done: false,
    completedAt: null,
    version: 1,
    ...overrides,
  };
}

function dto(overrides: Partial<PortalDashboardDto> = {}): PortalDashboardDto {
  return {
    customer: { displayName: "Nordlicht Coaching" },
    contact: { displayName: "Anna Example", email: "anna@example.test" },
    projects: [
      {
        id: "project-1",
        title: "Relaunch",
        status: ProjectStatus.Active,
        processSteps: ["Design", "Build", "Launch"],
        currentProcessStep: "Build",
        nextStep: { label: "First version", dueOn: "2026-10-16" },
        previewUrl: "https://preview.example.test",
        projectLead: null,
      },
    ],
    completedProjects: [],
    customerTasks: [customerTask("a")],
    ourTasks: [],
    capabilities: { canCompleteTasks: true, isOwnerView: false },
    ...overrides,
  };
}

function renderDashboard(
  dashboard: PortalDashboardDto = dto(),
  permissions: ReadonlySet<Permission> = FULL_READ,
  cockpitHref: string | null = null,
) {
  const keys = new Set<PortalWidgetKey>([
    PortalWidgetKey.Project,
    PortalWidgetKey.CustomerTasks,
    PortalWidgetKey.OurTasks,
    PortalWidgetKey.Contact,
  ]);
  return render(
    <PortalDashboard
      cockpitHref={cockpitHref}
      content={content}
      customerId="customer-1"
      dashboard={dashboard}
      locale="en"
      today={TODAY}
      widgets={listVisiblePortalWidgets(permissions, keys)}
    />,
  );
}

function customerTasksWidget() {
  return screen.getByRole("region", { name: /Needed from you/ });
}

describe("PortalDashboard", () => {
  beforeEach(() => {
    // jsdom has no layout, so the process track cannot scroll its current step into view.
    Element.prototype.scrollIntoView = vi.fn();
    Object.values(mocks).forEach((mock) => {
      if (typeof mock === "function") mock.mockReset();
    });
    mocks.search.value = "";
  });
  afterEach(cleanup);

  it("renders the project with its step, next step and preview link", () => {
    renderDashboard();

    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("First version")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open preview/ })).toHaveAttribute(
      "href",
      "https://preview.example.test",
    );
  });

  it("marks every mock widget as coming soon", () => {
    renderDashboard();

    for (const title of [
      content.widgets.onboarding.title,
      content.widgets.feedback.title,
      content.widgets.hours.title,
      content.widgets.files.title,
      content.widgets.serviceRequest.title,
    ]) {
      const widget = screen.getByRole("region", { name: title });
      expect(widget).toHaveAttribute("data-mock", "true");
      expect(within(widget).getByText(content.mock.badge)).toBeInTheDocument();
    }
  });

  it("omits both task widgets without the read permission", () => {
    renderDashboard(
      dto(),
      new Set([Permission.PortalAccess, Permission.PortalProjectsRead]),
    );

    expect(
      screen.queryByRole("region", { name: /Needed from you/ }),
    ).toBeNull();
    expect(
      screen.queryByRole("region", { name: /What we're working on/ }),
    ).toBeNull();
  });

  it("confirms that nothing is needed when no customer task is open", () => {
    renderDashboard(dto({ customerTasks: [] }));

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

  it("disables the checkboxes in the owner view and links to the CRM", () => {
    renderDashboard(
      dto({ capabilities: { canCompleteTasks: false, isOwnerView: true } }),
      FULL_READ,
      "/en/crm?cockpit=customer-1",
    );

    const widget = customerTasksWidget();
    const checkbox = within(widget).getByRole("checkbox");
    expect(checkbox).toBeDisabled();
    expect(checkbox).toHaveAccessibleDescription(/Complete in the CRM/);
    expect(
      within(widget).getByRole("link", { name: "Complete in the CRM" }),
    ).toHaveAttribute("href", "/en/crm?cockpit=customer-1");
  });

  it("shows a disabled checkbox without the completion right", () => {
    renderDashboard(
      dto({ capabilities: { canCompleteTasks: false, isOwnerView: false } }),
    );

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
        customerId="customer-1"
        dashboard={dto()}
        locale="en"
        today={TODAY}
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

  it("ignores a dialog parameter for a widget the reader cannot see", () => {
    mocks.search.value = "widget=customerTasks";
    renderDashboard(
      dto(),
      new Set([Permission.PortalAccess, Permission.PortalProjectsRead]),
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("switches projects through the URL and falls back to the first one", () => {
    const projects = [
      dto().projects[0]!,
      {
        ...dto().projects[0]!,
        id: "project-2",
        title: "Shop",
        status: ProjectStatus.Planned,
      },
    ];
    mocks.search.value = "project=foreign";
    renderDashboard(dto({ projects }));

    expect(screen.getByRole("tab", { name: "Relaunch" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.click(screen.getByRole("tab", { name: /Shop/ }));
    expect(mocks.replace).toHaveBeenCalledWith(
      "/en/portal/customer-1?project=project-2",
      { scroll: false },
    );
  });

  it("shows the friendly empty state for a customer without projects", () => {
    renderDashboard(dto({ projects: [] }));

    expect(
      screen.getByRole("heading", {
        name: content.widgets.project.emptyTitle,
      }),
    ).toBeInTheDocument();
  });

  it("opens the persistent chat dock without a dashboard widget", () => {
    renderDashboard();

    expect(screen.queryByRole("region", { name: "Messages" })).toBeNull();
    const trigger = screen.getByRole("button", { name: content.chat.expand });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});
