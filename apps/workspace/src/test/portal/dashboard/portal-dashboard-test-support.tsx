import "./portal-dashboard-mocks";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { TaskDueState } from "@invessiv/common/constants/crm/task-due-states";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";
import type { PortalCustomerTaskDto } from "@invessiv/common/contracts/portal/portal-customer-task.dto";
import type { PortalOurTaskDto } from "@invessiv/common/contracts/portal/portal-our-task.dto";
import type { PortalDashboardDto } from "@invessiv/common/contracts/portal/portal-dashboard.dto";
import type { PortalFilesOverviewDto } from "@invessiv/common/contracts/portal/portal-files-overview.dto";
import type { PortalHoursDto } from "@invessiv/common/contracts/portal/portal-hours.dto";

import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { UploadExtension } from "@invessiv/common/constants/files/upload-extension";
import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import { listVisiblePortalWidgets } from "@/common/patterns/portal/list-visible-portal-widgets";
import {
  getPortalDashboardDictionary,
  getPortalCredentialsDictionary,
  getPortalFilesDictionary,
  getPortalHoursDictionary,
  getPortalMessagesDictionary,
  getPortalServiceRequestsDictionary,
} from "@/i18n/dictionaries/portal";
import { PortalDashboard } from "@/components/portal/dashboard/portal-dashboard/portal-dashboard";
import type { PortalDashboardTestOptions } from "@/common/contracts/testing/portal-dashboard-test-options";
import {
  portalServices,
  requestableService,
  serviceRequest,
} from "@/test/fixtures/portal/portal-service-request-fixtures";
import { portalDashboardMocks } from "./portal-dashboard-mocks";
const mocks = portalDashboardMocks();

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

const HOURS_READ = new Set([...FULL_READ, Permission.PortalHoursRead]);
const SERVICES_READ = new Set([...FULL_READ, Permission.PortalServicesRead]);
const serviceRequestsContent = getPortalServiceRequestsDictionary("en");
const SERVICES = portalServices({
  services: [
    requestableService({
      description: "One more page in your existing layout.",
    }),
  ],
});
const OPEN_REQUEST = serviceRequest({
  status: ServiceRequestStatus.Offered,
  canWithdraw: false,
});
const HOURS: PortalHoursDto = {
  balance: {
    purchasedMinutes: 600,
    usedMinutes: 510,
    remainingMinutes: 90,
    unassignedMinutes: 0,
  },
  projects: [
    {
      projectId: "project-1",
      title: "Relaunch",
      allocatedMinutes: 300,
      usedMinutes: 150,
      remainingMinutes: 150,
    },
  ],
  earlierProjects: null,
  purchases: [],
  canReadEntries: true,
};

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

function renderDashboard({
  dashboard = dto(),
  permissions = FULL_READ,
  cockpitHref = null,
  conversation = CONVERSATION,
  filesOverview = FILES,
  onboarding = null,
  credentials = null,
  hours = null,
  services = null,
}: PortalDashboardTestOptions = {}) {
  const keys = new Set<PortalWidgetKey>([
    PortalWidgetKey.Project,
    PortalWidgetKey.CustomerTasks,
    PortalWidgetKey.OurTasks,
    PortalWidgetKey.Contact,
  ]);
  if (onboarding) keys.add(PortalWidgetKey.Onboarding);
  if (hours) keys.add(PortalWidgetKey.Hours);
  return render(
    <PortalDashboard
      cockpitHref={cockpitHref}
      content={content}
      conversation={conversation}
      credentials={credentials}
      hours={hours}
      credentialsContent={getPortalCredentialsDictionary("en")}
      customerId="customer-1"
      dashboard={dashboard}
      filesHref="/en/portal/customer-1/files"
      filesOverview={filesOverview}
      locale="en"
      filesContent={getPortalFilesDictionary("en")}
      hoursContent={getPortalHoursDictionary("en")}
      messagesContent={messagesContent}
      onboarding={onboarding}
      serviceRequestsContent={serviceRequestsContent}
      services={services}
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
    status: TaskStatus.Open,
    requestedByCustomer: false,
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

export function setupPortalDashboardTests() {
  beforeEach(() => {
    // jsdom has no layout, so the process track cannot scroll its current step into view.
    Element.prototype.scrollIntoView = vi.fn();
    Object.values(mocks).forEach((mock) => {
      if (typeof mock === "function") mock.mockReset();
    });
    mocks.search.value = "";
  });
  afterEach(cleanup);
}
export function portalDashboardTestContext() {
  return {
    mocks,
    content,
    messagesContent,
    CONVERSATION,
    TODAY,
    FILES_WIDGET_NAME,
    FILES,
    FULL_READ,
    HOURS_READ,
    SERVICES_READ,
    serviceRequestsContent,
    SERVICES,
    OPEN_REQUEST,
    HOURS,
    customerTask,
    dto,
    renderDashboard,
    ourTasksWidget,
    ourTask,
    CAN_CREATE,
    customerTasksWidget,
  };
}
