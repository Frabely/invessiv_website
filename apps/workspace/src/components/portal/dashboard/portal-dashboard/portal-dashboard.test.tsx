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
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { TaskDueState } from "@invessiv/common/constants/crm/task-due-states";
import { PortalTaskErrorCode } from "@invessiv/common/constants/portal/portal-task-error-codes";
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";
import type { PortalCustomerTaskDto } from "@invessiv/common/contracts/portal/portal-customer-task.dto";
import type { PortalOurTaskDto } from "@invessiv/common/contracts/portal/portal-our-task.dto";
import type { PortalDashboardDto } from "@invessiv/common/contracts/portal/portal-dashboard.dto";
import type { PortalFilesOverviewDto } from "@invessiv/common/contracts/portal/portal-files-overview.dto";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { UploadExtension } from "@invessiv/common/constants/files/upload-extension";
import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import { listVisiblePortalWidgets } from "@/common/patterns/portal/list-visible-portal-widgets";
import {
  getPortalDashboardDictionary,
  getPortalFilesDictionary,
  getPortalMessagesDictionary,
} from "@/i18n/dictionaries/portal";
import { PortalDashboard } from "./portal-dashboard";

const mocks = vi.hoisted(() => ({
  completeTask: vi.fn(),
  reopenTask: vi.fn(),
  createTask: vi.fn(),
  getConversation: vi.fn(),
  markRead: vi.fn(),
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
  portalTasksApiService: {
    completeTask: mocks.completeTask,
    reopenTask: mocks.reopenTask,
    createTask: mocks.createTask,
  },
}));
vi.mock("@/client/portal/portal-messages-api-service", () => ({
  portalMessagesApiService: {
    getConversation: mocks.getConversation,
    markRead: mocks.markRead,
    sendMessage: vi.fn(),
  },
}));

const content = getPortalDashboardDictionary("en");
const messagesContent = getPortalMessagesDictionary("en");
const CONVERSATION: PortalConversationDto = {
  id: "conversation-1",
  customerId: "customer-1",
  unreadCount: 2,
  lastMessageAt: null,
  messages: [
    {
      id: "message-1",
      conversationId: "conversation-1",
      type: "text",
      body: "First update",
      attachments: [],
      metadata: null,
      senderSide: "internal",
      senderDisplayName: "Team",
      isOwn: false,
      createdAt: "2026-09-26T10:00:00.000Z",
      redactedAt: null,
    },
    {
      id: "message-2",
      conversationId: "conversation-1",
      type: "text",
      body: "Second update",
      attachments: [],
      metadata: null,
      senderSide: "internal",
      senderDisplayName: "Team",
      isOwn: false,
      createdAt: "2026-09-26T10:01:00.000Z",
      redactedAt: null,
    },
  ],
  nextCursor: null,
  canWrite: true,
  attachmentAccess: { pick: false, upload: false },
};
const TODAY = "2026-09-26";
// The widget's accessible name also carries its entry count.
const FILES_WIDGET_NAME = new RegExp("^" + content.widgets.files.title);
const FILES: PortalFilesOverviewDto = {
  fromUs: {
    files: [
      {
        id: "file-1",
        projectId: null,
        projectTitle: null,
        source: FileSource.Upload,
        assetKind: AssetKind.Document,
        displayName: "Offer.pdf",
        note: null,
        origin: PortalFileOrigin.FromUs,
        extension: UploadExtension.Pdf,
        sizeBytes: 2048,
        url: null,
        createdAt: "2026-09-25T10:00:00.000Z",
      },
    ],
    total: 4,
    page: 1,
    pageSize: 3,
  },
  fromYou: { files: [], total: 0, page: 1, pageSize: 3 },
};
const FULL_READ = new Set([
  Permission.PortalAccess,
  Permission.PortalProjectsRead,
  Permission.PortalTasksRead,
  Permission.PortalTasksComplete,
  Permission.PortalFilesRead,
  Permission.PortalOnboardingRead,
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
    canReopen: false,
    ...overrides,
  };
}

function dto(overrides: Partial<PortalDashboardDto> = {}): PortalDashboardDto {
  return {
    customer: { displayName: "Nordlicht Coaching" },
    contact: {
      displayName: "Anna Example",
      email: "anna@example.test",
      booking: null,
    },
    selectedProjectId: "project-1",
    project: {
      id: "project-1",
      title: "Relaunch",
      status: ProjectStatus.Active,
      processSteps: ["Design", "Build", "Launch"],
      currentProcessStep: "Build",
      feedbackRoundPositions: [1, 2],
      roundProgress: {
        activeRoundNumber: null,
        completedRoundNumber: null,
        approvedRoundNumber: null,
      },
      nextStep: { label: "First version", dueOn: "2026-10-16" },
      previewUrl: "https://preview.example.test",
      projectLead: null,
    },
    completedProjects: [],
    customerTasks: [customerTask("a")],
    ourTasks: [],
    feedback: null,
    capabilities: {
      canCompleteTasks: true,
      canCreateTasks: false,
      isOwnerView: false,
    },
    ...overrides,
  };
}

function renderDashboard(
  dashboard: PortalDashboardDto = dto(),
  permissions: ReadonlySet<Permission> = FULL_READ,
  cockpitHref: string | null = null,
  conversation: PortalConversationDto | null = CONVERSATION,
  filesOverview: PortalFilesOverviewDto | null = FILES,
  onboarding: PortalOnboardingFormSummaryDto | null = null,
) {
  const keys = new Set<PortalWidgetKey>([
    PortalWidgetKey.Project,
    PortalWidgetKey.CustomerTasks,
    PortalWidgetKey.OurTasks,
    PortalWidgetKey.Contact,
  ]);
  if (onboarding) keys.add(PortalWidgetKey.Onboarding);
  return render(
    <PortalDashboard
      cockpitHref={cockpitHref}
      content={content}
      conversation={conversation}
      customerId="customer-1"
      dashboard={dashboard}
      filesHref="/en/portal/customer-1/files"
      filesOverview={filesOverview}
      locale="en"
      filesContent={getPortalFilesDictionary("en")}
      messagesContent={messagesContent}
      onboarding={onboarding}
      today={TODAY}
      viewerUserId="user-1"
      widgets={listVisiblePortalWidgets(permissions, keys)}
    />,
  );
}

function ourTasksWidget() {
  return screen.getByRole("region", {
    name: new RegExp(content.widgets.ourTasks.title),
  });
}

function ourTask(
  id: string,
  overrides: Partial<PortalOurTaskDto> = {},
): PortalOurTaskDto {
  return {
    id,
    projectId: "project-1",
    projectTitle: "Relaunch",
    title: `Our task ${id}`,
    description: null,
    dueOn: null,
    dueState: TaskDueState.None,
    done: false,
    completedAt: null,
    requestedByCustomer: false,
    rejected: false,
    ...overrides,
  };
}

const CAN_CREATE = {
  canCompleteTasks: true,
  canCreateTasks: true,
  isOwnerView: false,
};

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

    expect(screen.getByText("Step 3 of 5")).toBeInTheDocument();
    expect(screen.getByText("First version")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open preview/ })).toHaveAttribute(
      "href",
      "https://preview.example.test",
    );
  });

  it("shows each feedback round at its own place in the project track", () => {
    renderDashboard();

    const track = screen.getByRole("list", { name: "Project progress" });
    expect(
      [...track.querySelectorAll("li")].map((item) => item.textContent),
    ).toEqual([
      "Design",
      "Feedback round 1",
      "Build",
      "Feedback round 2",
      "Launch",
    ]);
  });

  it("shows the onboarding of the company with its progress and the way into the form", () => {
    renderDashboard(undefined, undefined, null, CONVERSATION, FILES, {
      id: "form-1",
      projectId: "project-1",
      projectTitle: "Relaunch",
      status: OnboardingFormStatus.Open,
      progress: { answeredRequired: 1, totalRequired: 4, ratio: 0.25 },
      submittedAt: null,
      completedAt: null,
      canEdit: true,
    });

    const widget = screen.getByRole("region", {
      name: content.widgets.onboarding.title,
    });
    expect(widget).not.toHaveAttribute("data-mock", "true");
    expect(
      within(widget).getByRole("link", {
        name: "Continue the onboarding for Relaunch",
      }),
    ).toHaveAttribute(
      "href",
      "/en/portal/customer-1/onboarding/form-1?project=project-1",
    );
  });

  it("has no onboarding widget while the company has no form", () => {
    renderDashboard();

    expect(
      screen.queryByRole("region", { name: content.widgets.onboarding.title }),
    ).toBeNull();
  });

  it("marks every mock widget as coming soon", () => {
    renderDashboard();

    for (const title of [
      content.widgets.hours.title,
      content.widgets.serviceRequest.title,
    ]) {
      const widget = screen.getByRole("region", { name: title });
      expect(widget).toHaveAttribute("data-mock", "true");
      expect(within(widget).getByText(content.mock.badge)).toBeInTheDocument();
    }
  });

  it("marks the running round as the current step of the track", () => {
    const base = dto();
    renderDashboard(
      dto({
        project: {
          ...base.project!,
          currentProcessStep: "Design",
          roundProgress: {
            activeRoundNumber: 1,
            completedRoundNumber: null,
            approvedRoundNumber: null,
          },
        },
      }),
    );

    const track = screen.getByRole("list", { name: "Project progress" });
    expect(track.querySelector('[aria-current="step"]')).toHaveTextContent(
      "Feedback round 1",
    );
  });

  it("shows whose turn it is and links to the feedback page", () => {
    renderDashboard(
      dto({
        feedback: {
          projectId: "project-1",
          projectTitle: "Relaunch",
          roundNumber: 1,
          status: FeedbackRoundStatus.Open,
          dueOn: "2026-10-14",
          approvedAt: null,
          included: 2,
          used: 1,
        },
      }),
      new Set([...FULL_READ, Permission.PortalFeedbackRead]),
    );

    const widget = screen.getByRole("region", {
      name: content.widgets.feedback.title,
    });
    expect(widget).not.toHaveAttribute("data-mock", "true");
    expect(within(widget).getByText("Round 1 of 2")).toBeInTheDocument();
    expect(
      within(widget).getByText(content.widgets.feedback.turn.open),
    ).toBeInTheDocument();
    expect(
      within(widget).getByRole("link", { name: "Give feedback on Relaunch" }),
    ).toHaveAttribute(
      "href",
      "/en/portal/customer-1/projects/project-1/feedback?project=project-1",
    );
    expect(
      screen.getByRole("link", { name: content.widgets.feedback.projectLink }),
    ).toHaveAttribute(
      "href",
      "/en/portal/customer-1/projects/project-1/feedback?project=project-1",
    );
  });

  it("asks for the approval after the last round", () => {
    renderDashboard(
      dto({
        feedback: {
          projectId: "project-1",
          projectTitle: "Relaunch",
          roundNumber: 2,
          status: FeedbackRoundStatus.Completed,
          dueOn: null,
          approvedAt: null,
          included: 2,
          used: 2,
        },
      }),
      new Set([...FULL_READ, Permission.PortalFeedbackRead]),
    );

    const widget = screen.getByRole("region", {
      name: content.widgets.feedback.title,
    });
    expect(
      within(widget).getByText(content.widgets.feedback.turn.approvalDue),
    ).toBeInTheDocument();
    expect(
      within(widget).getByRole("link", { name: "Approve Relaunch" }),
    ).toHaveAttribute("data-primary", "true");
  });

  it("dates the approval once the project is approved", () => {
    renderDashboard(
      dto({
        feedback: {
          projectId: "project-1",
          projectTitle: "Relaunch",
          roundNumber: 1,
          status: FeedbackRoundStatus.Approved,
          dueOn: null,
          approvedAt: "2026-09-25T09:00:00.000Z",
          included: 2,
          used: 1,
        },
      }),
      new Set([...FULL_READ, Permission.PortalFeedbackRead]),
    );

    const widget = screen.getByRole("region", {
      name: content.widgets.feedback.title,
    });
    expect(within(widget).getByText(/^Approved on /)).toBeInTheDocument();
    expect(
      within(widget).getByRole("link", { name: "View feedback on Relaunch" }),
    ).toBeInTheDocument();
  });

  it("explains the feedback area while the project has no round steps", () => {
    renderDashboard(
      dto({ feedback: null }),
      new Set([...FULL_READ, Permission.PortalFeedbackRead]),
    );

    expect(
      screen.getByText(content.widgets.feedback.emptyTitle),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: content.widgets.feedback.projectLink,
      }),
    ).not.toBeInTheDocument();
  });

  it("renders no feedback widget without portal.feedback.read", () => {
    renderDashboard(dto({ feedback: null }));

    expect(
      screen.queryByRole("region", { name: content.widgets.feedback.title }),
    ).not.toBeInTheDocument();
  });

  it("shows the newest released files and links to the files page", () => {
    renderDashboard();

    const widget = screen.getByRole("region", { name: FILES_WIDGET_NAME });
    expect(widget).not.toHaveAttribute("data-mock", "true");
    expect(within(widget).getByText("Offer.pdf")).toBeInTheDocument();
    expect(within(widget).getByText("and 3 more")).toBeInTheDocument();
    expect(
      within(widget).getByRole("link", { name: content.widgets.files.all }),
    ).toHaveAttribute("href", "/en/portal/customer-1/files");

    fireEvent.click(
      within(widget).getByRole("tab", { name: content.widgets.files.fromYou }),
    );
    expect(
      within(widget).getByText(content.widgets.files.emptyFromYou),
    ).toBeInTheDocument();
  });

  it("keeps the files page reachable when the preview is unavailable", () => {
    renderDashboard(dto(), FULL_READ, null, null, null);
    const widget = screen.getByRole("region", { name: FILES_WIDGET_NAME });
    expect(
      within(widget).getByRole("link", { name: content.widgets.files.all }),
    ).toHaveAttribute("href", "/en/portal/customer-1/files");
    expect(within(widget).queryByRole("tab")).not.toBeInTheDocument();
    expect(within(widget).getByRole("status")).toHaveTextContent(
      content.widgets.files.previewUnavailable,
    );
  });

  it("omits the files widget without portal.files.read", () => {
    renderDashboard(
      dto(),
      new Set([Permission.PortalAccess, Permission.PortalProjectsRead]),
      null,
      CONVERSATION,
      null,
    );

    expect(
      screen.queryByRole("region", { name: FILES_WIDGET_NAME }),
    ).toBeNull();
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

  it("keeps recently completed tasks ticked below the open ones", () => {
    renderDashboard(
      dto({
        customerTasks: [
          customerTask("a"),
          customerTask("b", {
            done: true,
            completedAt: "2026-09-25T10:00:00Z",
          }),
        ],
      }),
    );

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
    renderDashboard(
      dto({
        customerTasks: [customerTask("b", { done: true, canReopen: true })],
      }),
    );

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
    renderDashboard(
      dto({
        customerTasks: [customerTask("b", { done: true, canReopen: false })],
      }),
    );

    expect(
      within(customerTasksWidget()).getByRole("checkbox", {
        name: "“Task b” is done",
      }),
    ).toBeDisabled();
  });

  it("lists completed tasks in the dialog without unfolding anything", () => {
    mocks.search.value = "widget=customerTasks";
    renderDashboard(
      dto({
        customerTasks: [
          customerTask("a"),
          customerTask("b", { done: true, canReopen: true }),
        ],
      }),
    );

    const dialog = screen.getByRole("dialog", { name: "Needed from you" });
    expect(
      within(dialog).getByRole("heading", { name: "Done (1)" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Task b")).toBeInTheDocument();
    expect(dialog.querySelector("details")).toBeNull();
  });

  it("marks own requests and keeps a declined one visible", () => {
    renderDashboard(
      dto({
        ourTasks: [
          ourTask("x"),
          ourTask("y", { requestedByCustomer: true }),
          ourTask("z", { requestedByCustomer: true, rejected: true }),
        ],
      }),
    );

    const items = within(ourTasksWidget()).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(within(items[0]!).queryByText("from you")).toBeNull();
    expect(within(items[1]!).getByText("from you")).toBeInTheDocument();
    expect(within(items[2]!).getByText("Declined")).toBeInTheDocument();
    expect(items[2]).toHaveAttribute("data-rejected", "true");
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

  it("opens the request dialog through the URL", () => {
    renderDashboard(dto({ capabilities: CAN_CREATE }));

    fireEvent.click(
      within(ourTasksWidget()).getByRole("button", {
        name: "Create a task for us",
      }),
    );

    expect(mocks.push).toHaveBeenCalledWith(
      "/en/portal/customer-1?widget=ourTasks",
      { scroll: false },
    );
  });

  it("creates a task for the selected project, closes and announces it", async () => {
    mocks.createTask.mockResolvedValue({ ok: true });
    mocks.search.value = "widget=ourTasks";
    renderDashboard(dto({ capabilities: CAN_CREATE }));

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
    renderDashboard(dto({ capabilities: CAN_CREATE }));
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

  it("points the owner view to the CRM instead of the request button", () => {
    renderDashboard(
      dto({
        capabilities: {
          canCompleteTasks: false,
          canCreateTasks: false,
          isOwnerView: true,
        },
      }),
      FULL_READ,
      "/en/crm?cockpit=customer-1",
    );

    expect(
      within(ourTasksWidget()).getByRole("link", { name: "Create in the CRM" }),
    ).toHaveAttribute("href", "/en/crm?cockpit=customer-1");
  });

  it("disables the checkboxes in the owner view and links to the CRM", () => {
    renderDashboard(
      dto({
        capabilities: {
          canCompleteTasks: false,
          canCreateTasks: false,
          isOwnerView: true,
        },
      }),
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
      dto({
        capabilities: {
          canCompleteTasks: false,
          canCreateTasks: false,
          isOwnerView: false,
        },
      }),
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
        conversation={CONVERSATION}
        customerId="customer-1"
        dashboard={dto()}
        filesHref="/en/portal/customer-1/files"
        filesOverview={FILES}
        locale="en"
        filesContent={getPortalFilesDictionary("en")}
        messagesContent={messagesContent}
        onboarding={null}
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

  it("ignores a dialog parameter for a widget the reader cannot see", () => {
    mocks.search.value = "widget=customerTasks";
    renderDashboard(
      dto(),
      new Set([Permission.PortalAccess, Permission.PortalProjectsRead]),
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the server-selected project without a widget tab", () => {
    const project = {
      ...dto().project!,
      id: "project-2",
      title: "Shop",
      status: ProjectStatus.Planned,
    };
    renderDashboard(
      dto({ project }),
      FULL_READ,
      null,
      CONVERSATION,
      FILES,
      null,
    );

    expect(screen.getByText("Shop")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Relaunch|Shop/ })).toBeNull();
  });

  it("shows the friendly empty state for a customer without projects", () => {
    renderDashboard(dto({ project: null }));

    expect(
      screen.getByRole("heading", {
        name: content.widgets.project.emptyTitle,
      }),
    ).toBeInTheDocument();
  });

  it("shows unread messages on the dock rail and marks them read when opened", async () => {
    mocks.getConversation.mockResolvedValue({ ok: true, value: CONVERSATION });
    mocks.markRead.mockResolvedValue({ ok: true, value: true });
    renderDashboard();

    expect(screen.queryByRole("region", { name: "Messages" })).toBeNull();
    const trigger = screen.getByRole("button", {
      name: `${content.chat.expand} (2 unread)`,
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(mocks.markRead).not.toHaveBeenCalled();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("log", { name: messagesContent.thread.logLabel }),
    ).toBeVisible();
    await waitFor(() =>
      expect(mocks.markRead).toHaveBeenCalledWith("customer-1", "message-2"),
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("marks only the newest visible incoming message when an own message is newer", async () => {
    const conversation: PortalConversationDto = {
      ...CONVERSATION,
      messages: [
        CONVERSATION.messages[0]!,
        {
          ...CONVERSATION.messages[1]!,
          senderSide: "customer",
          isOwn: true,
        },
      ],
    };
    mocks.getConversation.mockResolvedValue({ ok: true, value: conversation });
    mocks.markRead.mockResolvedValue({ ok: true, value: true });
    renderDashboard(dto(), FULL_READ, null, conversation);

    fireEvent.click(
      screen.getByRole("button", { name: `${content.chat.expand} (2 unread)` }),
    );

    await waitFor(() =>
      expect(mocks.markRead).toHaveBeenCalledWith("customer-1", "message-1"),
    );
  });

  it("renders no chat dock without message read permission", () => {
    renderDashboard(dto(), FULL_READ, null, null);

    expect(
      screen.queryByRole("button", { name: content.chat.expand }),
    ).toBeNull();
  });
});
