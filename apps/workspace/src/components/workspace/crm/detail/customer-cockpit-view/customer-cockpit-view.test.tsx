// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import {
  getCrmAccessDictionary,
  getCrmCockpitDictionary,
  getCrmFilesDictionary,
  getCrmMessagesDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import {
  MessageSenderSide,
  MessageType,
} from "@invessiv/common/constants/crm/message-types";
import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
import { getSettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import {
  customerDetailFixture,
  taskFixture,
} from "@/server/tests/workspace/crm/support/crm-fixtures";
import { CustomerCockpitView } from "./customer-cockpit-view";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/crm",
  useRouter: () => ({ refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const filesApiMocks = vi.hoisted(() => ({ listFiles: vi.fn() }));
vi.mock("@/client/crm/files-api-service", () => ({
  filesApiService: filesApiMocks,
}));

const messagesApiMocks = vi.hoisted(() => ({
  getConversation: vi.fn(),
  markRead: vi.fn(),
  sendMessage: vi.fn(),
  redactMessage: vi.fn(),
  updateOwner: vi.fn(),
}));
vi.mock("@/client/crm/messages-api-service", () => ({
  messagesApiService: messagesApiMocks,
}));

describe("CustomerCockpitView", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    messagesApiMocks.getConversation.mockReturnValue(new Promise(() => {}));
    messagesApiMocks.markRead.mockReturnValue(new Promise(() => {}));
  });

  it("replaces the files placeholder with the real section only when files are readable", async () => {
    filesApiMocks.listFiles.mockResolvedValue({
      ok: true,
      value: { files: [], total: 0, page: 1, pageSize: 25 },
    });
    const content = getCrmCockpitDictionary("en");
    const filesContent = getCrmFilesDictionary("en");
    const none = { customerWide: false, projectIds: [] };
    const { rerender } = render(
      <CustomerCockpitView
        viewerMemberId="member-1"
        content={content}
        customer={customerDetailFixture()}
        locale="en"
      />,
    );
    expect(
      screen.queryByRole("heading", { name: filesContent.section.title }),
    ).toBeNull();
    rerender(
      <CustomerCockpitView
        viewerMemberId="member-1"
        content={content}
        customer={customerDetailFixture()}
        files={{
          projects: [],
          read: { customerWide: true, projectIds: [] },
          write: none,
          remove: none,
          members: [],
        }}
        filesContent={filesContent}
        locale="en"
      />,
    );
    expect(
      screen.getByRole("heading", { name: filesContent.section.title }),
    ).toBeVisible();
    expect(await screen.findByText(filesContent.empty.title)).toBeVisible();
  });

  it("renders the empty projects state without a dialog shell", () => {
    const customer = customerDetailFixture();
    const content = getCrmCockpitDictionary("en");

    render(
      <CustomerCockpitView
        viewerMemberId="member-1"
        content={content}
        locale="en"
        customer={customer}
        projects={[]}
      />,
    );

    expect(screen.getAllByText(content.projects.empty)).toHaveLength(1);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Access" })).toBeNull();
  });

  it("names the customer once when the surrounding dialog already does", () => {
    const customer = customerDetailFixture();
    const content = getCrmCockpitDictionary("en");
    const { rerender } = render(
      <CustomerCockpitView
        viewerMemberId="member-1"
        content={content}
        customer={customer}
        locale="en"
      />,
    );
    expect(
      screen.getByRole("heading", { name: customer.displayName }),
    ).toBeVisible();

    rerender(
      <CustomerCockpitView
        viewerMemberId="member-1"
        content={content}
        customer={customer}
        locale="en"
        showHeading={false}
      />,
    );
    expect(
      screen.queryByRole("heading", { name: customer.displayName }),
    ).toBeNull();
    const statusBadge = screen
      .getByText(content.status[customer.status])
      .closest('[data-kind="status"]');
    expect(statusBadge).toHaveAttribute("data-tone", "success");
    expect(statusBadge?.querySelector("svg")).toHaveAttribute(
      "data-icon",
      "circle-check",
    );
  });

  it("shows the portal entry only to the workspace owner", () => {
    const customer = customerDetailFixture();
    const content = getCrmCockpitDictionary("en");
    const { rerender } = render(
      <CustomerCockpitView
        viewerMemberId="member-1"
        content={content}
        customer={customer}
        locale="en"
        isWorkspaceOwner={false}
        portalHref="/en/portal/customer-1"
      />,
    );

    expect(
      screen.queryByRole("link", { name: content.portal.view }),
    ).not.toBeInTheDocument();

    rerender(
      <CustomerCockpitView
        viewerMemberId="member-1"
        content={content}
        customer={customer}
        locale="en"
        isWorkspaceOwner
        portalHref="/en/portal/customer-1"
      />,
    );
    expect(
      screen.getByRole("link", { name: content.portal.view }),
    ).toHaveAttribute("href", "/en/portal/customer-1");
  });

  it("shows real key figures only with data and roadmap figures without numbers", () => {
    const customer = customerDetailFixture();
    const content = getCrmCockpitDictionary("en");
    const { rerender } = render(
      <CustomerCockpitView
        viewerMemberId="member-1"
        content={content}
        customer={customer}
        locale="en"
      />,
    );
    const figures = () =>
      screen.getByRole("list", { name: content.kpis.label });

    expect(figures()).not.toHaveTextContent(content.kpis.openTasks);
    expect(figures()).toHaveTextContent(content.kpis.hoursLeft);
    expect(figures()).toHaveTextContent(content.kpis.openFeedback);
    expect(figures()).not.toHaveTextContent(/\d/);

    rerender(
      <CustomerCockpitView
        viewerMemberId="member-1"
        content={content}
        customer={customer}
        locale="en"
        tasks={{
          tasks: [
            taskFixture({ status: TaskStatus.Open, dueOn: "2026-09-01" }),
            taskFixture({ status: TaskStatus.InProgress, dueOn: null }),
            taskFixture({ status: TaskStatus.Done, dueOn: "2026-09-01" }),
          ],
          readableProjectIds: [],
          writableProjectIds: [],
          members: [],
          today: "2026-09-25",
        }}
      />,
    );
    expect(figures()).toHaveTextContent(content.kpis.openTasks);
    expect(figures()).toHaveTextContent(
      content.kpis.overdueTasks.replace("{count}", "1"),
    );
  });

  it("offers future customer areas as placeholders and hides the chat without chat.read", () => {
    const content = getCrmCockpitDictionary("de");
    render(
      <CustomerCockpitView
        viewerMemberId="member-1"
        content={content}
        customer={customerDetailFixture()}
        locale="de"
      />,
    );

    for (const section of Object.values(content.futureSections)) {
      expect(
        screen.getByRole("heading", { name: section.title }),
      ).toBeVisible();
    }
    expect(
      screen.queryByRole("button", { name: content.chat.expand }),
    ).toBeNull();
  });

  describe("customer chat dock", () => {
    function conversation(
      overrides: Partial<InternalConversationDto> = {},
    ): InternalConversationDto {
      return {
        id: "conversation-1",
        customerId: customerDetailFixture().id,
        unreadCount: 0,
        lastMessageAt: "2026-09-25T10:00:00.000Z",
        messages: [
          {
            id: "message-1",
            conversationId: "conversation-1",
            type: MessageType.Text,
            body: "Wann kommt der Entwurf?",
            attachments: [],
            metadata: null,
            senderSide: MessageSenderSide.Customer,
            senderDisplayName: "Anna Berger",
            isOwn: false,
            createdAt: "2026-09-25T10:00:00.000Z",
            redactedAt: null,
          },
        ],
        nextCursor: null,
        attachmentAccess: { pick: false, upload: false },
        ownership: {
          ownerMemberId: "member-1",
          ownerDisplayName: "Moritz",
          version: 1,
        },
        ...overrides,
      };
    }

    function renderDock(
      props: Partial<Parameters<typeof CustomerCockpitView>[0]> = {},
    ) {
      const content = getCrmCockpitDictionary("de");
      render(
        <CustomerCockpitView
          viewerMemberId="member-1"
          content={content}
          conversation={conversation()}
          customer={customerDetailFixture()}
          locale="de"
          messagesContent={getCrmMessagesDictionary("de")}
          {...props}
        />,
      );
      fireEvent.click(
        screen.getByRole("button", { name: content.chat.expand }),
      );
      return content;
    }

    it("shows the real thread, the read-along notice and a composer with chat.write", () => {
      const content = renderDock({ canWriteConversation: true });

      expect(screen.getByText(content.chat.readAlong)).toBeVisible();
      expect(screen.getByText("Wann kommt der Entwurf?")).toBeVisible();
      expect(
        screen.getByRole("textbox", {
          name: getCrmMessagesDictionary("de").thread.inputLabel,
        }),
      ).toBeVisible();
      expect(messagesApiMocks.getConversation).toHaveBeenCalled();
    });

    it("stays readable without chat.write and offers no edit or delete", () => {
      renderDock({ canWriteConversation: false });

      expect(screen.getByText("Wann kommt der Entwurf?")).toBeVisible();
      expect(screen.queryByRole("textbox")).toBeNull();
      expect(
        screen.queryByRole("button", { name: /bearbeiten|löschen/i }),
      ).toBeNull();
      expect(screen.queryByRole("button", { name: "Ausblenden" })).toBeNull();
    });

    it("offers hiding only with chat.redact", () => {
      renderDock({ canRedactConversation: true });

      expect(screen.getByRole("button", { name: "Ausblenden" })).toBeVisible();
    });

    it("badges unread messages and marks them read on opening", () => {
      const content = getCrmCockpitDictionary("de");
      render(
        <CustomerCockpitView
          viewerMemberId="member-1"
          content={content}
          conversation={conversation({ unreadCount: 2 })}
          customer={customerDetailFixture()}
          locale="de"
          messagesContent={getCrmMessagesDictionary("de")}
        />,
      );
      expect(screen.getByText("2 ungelesen")).toBeInTheDocument();
      expect(messagesApiMocks.markRead).not.toHaveBeenCalled();

      fireEvent.click(
        screen.getByRole("button", {
          name: `${content.chat.expand} (2 ungelesen)`,
        }),
      );
      expect(messagesApiMocks.markRead).toHaveBeenCalledWith(
        customerDetailFixture().id,
        "message-1",
      );
    });
  });

  it("shows an actionable observation until the owner has access", async () => {
    const customer = customerDetailFixture();
    const content = getCrmCockpitDictionary("de");
    const member: WorkspaceMemberDto = {
      id: customer.ownerMemberId ?? "member-owner",
      userId: "user-1",
      displayName: customer.ownerDisplayName ?? "Owner",
      primaryEmail: "owner@example.test",
      active: true,
      isOwner: false,
      hasActiveRole: true,
      accessScopeCount: 0,
      roles: [],
      version: 1,
      createdAt: "2026-09-19T10:00:00.000Z",
    };
    const props = {
      accessContent: getCrmAccessDictionary("de"),
      accessMembers: [member],
      accessProjects: [],
      accessRoles: [],
      accessScopes: [],
      content,
      customer,
      customerOwnerMemberId: member.id,
      locale: "de" as const,
      viewerMemberId: "member-1",
      permissionsContent: getSettingsPermissionsDictionary("de"),
      projects: [],
      rolesHref: "/de/settings?tab=roles",
    };
    const { rerender } = render(
      <CustomerCockpitView {...props} customerOwnerHasAccess={false} />,
    );

    fireEvent.click(
      screen.getAllByRole("button", {
        name: content.ownerAccess.grantAccess,
      })[0],
    );
    expect(await screen.findByRole("dialog")).toBeVisible();

    rerender(<CustomerCockpitView {...props} customerOwnerHasAccess />);
    expect(screen.queryByText(content.ownerAccess.observation)).toBeNull();
  });
});
