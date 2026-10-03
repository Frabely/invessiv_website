// @vitest-environment jsdom
import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import type { PortalDashboardDto } from "@invessiv/common/contracts/portal/portal-dashboard.dto";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import type { PortalDashboardProps } from "@/components/portal/dashboard/portal-dashboard/portal-dashboard";
import PortalCustomerPage, { generateMetadata } from "./page";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  requirePortalReader: vi.fn(),
  getPortalDashboard: vi.fn(),
  getPortalConversation: vi.fn(),
  listPortalFiles: vi.fn(),
  getPortalOnboardingWidgetForm: vi.fn(),
  getPortalOnboardingCall: vi.fn(),
  dashboardProps: vi.fn(),
}));

vi.mock(
  "@/server/portal/query-handler/get-portal-onboarding-call.query-handler",
  () => ({ getPortalOnboardingCall: mocks.getPortalOnboardingCall }),
);

vi.mock(
  "@/server/portal/query-handler/get-portal-onboarding-widget-form.query-handler",
  () => ({
    getPortalOnboardingWidgetForm: mocks.getPortalOnboardingWidgetForm,
  }),
);

vi.mock(
  "@/server/portal/query-handler/list-portal-files.query-handler",
  () => ({ listPortalFiles: mocks.listPortalFiles }),
);

vi.mock("@/server/portal/auth/require-portal-reader", () => ({
  requirePortalReader: mocks.requirePortalReader,
}));
vi.mock(
  "@/server/portal/query-handler/get-portal-dashboard.query-handler",
  () => ({ getPortalDashboard: mocks.getPortalDashboard }),
);
vi.mock(
  "@/server/portal/query-handler/get-portal-conversation.query-handler",
  () => ({ getPortalConversation: mocks.getPortalConversation }),
);
vi.mock(
  "@/components/portal/dashboard/portal-dashboard/portal-dashboard",
  () => ({
    PortalDashboard: (props: PortalDashboardProps) => {
      mocks.dashboardProps(props);
      return <div data-testid="dashboard" />;
    },
  }),
);

const ACTOR = {
  userId: "user-uuid-1",
  membershipId: "membership-uuid-1",
  customerId: "customer-1",
  personId: "person-uuid-1",
  permissions: new Set([Permission.PortalAccess, Permission.PortalTasksRead]),
  projectPermissions: new Map(),
};

function dashboard(
  overrides: Partial<PortalDashboardDto> = {},
): PortalDashboardDto {
  return {
    customer: { displayName: "Nordlicht Coaching" },
    contact: null,
    projects: [],
    completedProjects: [],
    customerTasks: [],
    ourTasks: [],
    feedback: null,
    capabilities: { canCompleteTasks: false, isOwnerView: false },
    ...overrides,
  };
}

async function renderPage(customerId = "customer-1", project?: string) {
  render(
    await PortalCustomerPage({
      params: Promise.resolve({ locale: "de", customerId }),
      searchParams: Promise.resolve(project ? { project } : {}),
    }),
  );
  return mocks.dashboardProps.mock.calls.at(-1)![0] as PortalDashboardProps;
}

describe("PortalCustomerPage", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.requirePortalReader.mockResolvedValue(ACTOR);
    mocks.getPortalDashboard.mockResolvedValue(dashboard());
    mocks.getPortalConversation.mockResolvedValue({
      ok: false,
      code: MessageErrorCode.NotFound,
    });
    mocks.listPortalFiles.mockResolvedValue({
      ok: false,
      code: FileApiErrorCode.NotFound,
    });
    mocks.getPortalOnboardingWidgetForm.mockResolvedValue(null);
  });

  afterEach(cleanup);

  it("passes the newest files of both tabs and the files page link", async () => {
    const page = { files: [], total: 0, page: 1, pageSize: 3 };
    mocks.listPortalFiles.mockResolvedValue({ ok: true, value: page });

    const props = await renderPage();

    expect(mocks.listPortalFiles).toHaveBeenCalledWith(ACTOR, {
      origin: PortalFileOrigin.FromUs,
      pageSize: 3,
      projectId: undefined,
    });
    expect(mocks.listPortalFiles).toHaveBeenCalledWith(ACTOR, {
      origin: PortalFileOrigin.FromYou,
      pageSize: 3,
      projectId: undefined,
    });
    expect(props.filesOverview).toEqual({ fromUs: page, fromYou: page });
    expect(props.filesHref).toBe("/de/portal/customer-1/files");
    expect(mocks.getPortalOnboardingWidgetForm).not.toHaveBeenCalled();
  });

  it("uses the selected project for files and onboarding", async () => {
    const project = {
      id: "project-1",
    } as PortalDashboardDto["projects"][number];
    mocks.getPortalDashboard.mockResolvedValue(
      dashboard({
        projects: [project, { ...project, id: "project-2" }],
      }),
    );
    mocks.getPortalOnboardingWidgetForm.mockResolvedValue({
      id: "form-2",
      projectId: "project-2",
    });
    const props = await renderPage("customer-1", "project-2");
    expect(mocks.getPortalDashboard).toHaveBeenCalledWith(
      ACTOR,
      expect.any(String),
      "project-2",
    );
    expect(mocks.listPortalFiles).toHaveBeenCalledWith(
      ACTOR,
      expect.objectContaining({ projectId: "project-2" }),
    );
    expect(mocks.getPortalOnboardingWidgetForm).toHaveBeenCalledWith(
      ACTOR,
      "project-2",
    );
    expect(props.onboarding).toEqual({
      id: "form-2",
      projectId: "project-2",
    });
    expect(props.filesHref).toBe(
      "/de/portal/customer-1/files?project=project-2",
    );
  });

  it("falls back to the first permitted project for a foreign id", async () => {
    const project = {
      id: "project-1",
    } as PortalDashboardDto["projects"][number];
    mocks.getPortalDashboard.mockResolvedValue(
      dashboard({ projects: [project] }),
    );
    const props = await renderPage("customer-1", "foreign-project");
    expect(mocks.listPortalFiles).toHaveBeenCalledWith(
      ACTOR,
      expect.objectContaining({ projectId: "project-1" }),
    );
    expect(mocks.getPortalOnboardingWidgetForm).toHaveBeenCalledWith(
      ACTOR,
      "project-1",
    );
    expect(props.selectedProjectId).toBe("project-1");
  });

  it("shows the onboarding widget only to a reader with the right and a form", async () => {
    const form = {
      id: "form-1",
      projectId: "project-1",
      projectTitle: "Relaunch",
    };
    mocks.getPortalDashboard.mockResolvedValue(
      dashboard({
        projects: [
          { id: "project-1" } as PortalDashboardDto["projects"][number],
        ],
      }),
    );
    mocks.getPortalOnboardingWidgetForm.mockResolvedValue(form);
    mocks.getPortalOnboardingCall.mockResolvedValue({ booking: null });

    const blind = await renderPage();
    expect(blind.widgets.map((entry) => entry.key)).not.toContain(
      PortalWidgetKey.Onboarding,
    );

    mocks.requirePortalReader.mockResolvedValue({
      ...ACTOR,
      permissions: new Set([
        Permission.PortalAccess,
        Permission.PortalOnboardingRead,
      ]),
    });
    const reader = await renderPage();
    expect(mocks.getPortalOnboardingWidgetForm).toHaveBeenLastCalledWith(
      expect.objectContaining({ customerId: "customer-1" }),
      "project-1",
    );
    expect(reader.onboarding).toEqual(form);
    // Whether the call of the widget's form is due is the server's answer, passed on as it is.
    expect(mocks.getPortalOnboardingCall).toHaveBeenLastCalledWith(
      expect.objectContaining({ customerId: "customer-1" }),
      "form-1",
    );
    expect(reader.onboardingCall).toEqual({ booking: null });
    expect(reader.widgets.map((entry) => entry.key)).toContain(
      PortalWidgetKey.Onboarding,
    );

    mocks.getPortalOnboardingWidgetForm.mockResolvedValue(null);
    mocks.getPortalOnboardingCall.mockClear();
    const empty = await renderPage();
    expect(mocks.getPortalOnboardingCall).not.toHaveBeenCalled();
    expect(empty.onboardingCall).toBeNull();
    expect(empty.widgets.map((entry) => entry.key)).not.toContain(
      PortalWidgetKey.Onboarding,
    );
  });

  it("hides the files overview when the reader may not read files", async () => {
    const props = await renderPage();

    expect(props.filesOverview).toBeNull();
  });

  it("renders a visually hidden heading with the company name", async () => {
    await renderPage();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Übersicht – Nordlicht Coaching",
      }),
    ).toBeInTheDocument();
  });

  it("passes only widgets the reader may see and that have content", async () => {
    const props = await renderPage();
    const keys = props.widgets.map((entry) => entry.key);

    expect(keys).toContain(PortalWidgetKey.CustomerTasks);
    expect(keys).not.toContain(PortalWidgetKey.Project);
    expect(keys).not.toContain(PortalWidgetKey.Contact);
    expect(keys).not.toContain(PortalWidgetKey.CompletedProjects);
    expect(props.cockpitHref).toBeNull();
  });

  it("gives the owner view a cockpit link for disabled actions", async () => {
    mocks.getPortalDashboard.mockResolvedValue(
      dashboard({
        capabilities: { canCompleteTasks: false, isOwnerView: true },
      }),
    );

    const props = await renderPage();

    expect(props.cockpitHref).toBe("/de/crm?cockpit=customer-1");
  });

  it("passes the conversation and the viewer for the chat dock", async () => {
    const conversation = {
      id: "conversation-1",
      customerId: "customer-1",
      unreadCount: 1,
      lastMessageAt: null,
      messages: [],
      nextCursor: null,
      canWrite: true,
    };
    mocks.getPortalConversation.mockResolvedValue({ ok: true, conversation });

    const props = await renderPage();

    expect(mocks.getPortalConversation).toHaveBeenCalledWith(ACTOR, null);
    expect(props.conversation).toBe(conversation);
    expect(props.viewerUserId).toBe(ACTOR.userId);
  });

  it("normalizes the customerId case before resolving the reader", async () => {
    await renderPage("CUSTOMER-1");

    expect(mocks.requirePortalReader).toHaveBeenCalledWith("de", "customer-1");
  });

  it("returns localized no-index metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", customerId: "customer-1" }),
    });

    expect(metadata.title).toBe("Overview | Invessiv");
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("returns empty metadata for an unsupported locale instead of throwing", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "fr", customerId: "customer-1" }),
    });

    expect(metadata).toEqual({});
  });
});
