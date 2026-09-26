// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { ConversationInboxItemDto } from "@invessiv/common/contracts/crm/conversation-inbox-item.dto";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";
import MessagesPage from "./page";

const mocks = vi.hoisted(() => ({
  requireWorkspaceActor: vi.fn(),
  listConversations: vi.fn(),
  getCustomerConversation: vi.fn(),
  listConversationOwnerCandidates: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound called");
  },
}));
vi.mock("@/lib/auth/permissions", () => ({
  requireWorkspaceActor: mocks.requireWorkspaceActor,
}));
vi.mock(
  "@/server/workspace/crm/query-handler/list-conversations.query-handler",
  () => ({ listConversations: mocks.listConversations }),
);
vi.mock(
  "@/server/workspace/crm/query-handler/get-customer-conversation.query-handler",
  () => ({ getCustomerConversation: mocks.getCustomerConversation }),
);
vi.mock(
  "@/server/workspace/crm/query-handler/list-conversation-owner-candidates.query-handler",
  () => ({
    listConversationOwnerCandidates: mocks.listConversationOwnerCandidates,
  }),
);
vi.mock(
  "@/components/workspace/workspace-page-shell/workspace-page-shell",
  () => ({
    WorkspacePageShell: ({ children }: { children: React.ReactNode }) => (
      <main>{children}</main>
    ),
  }),
);
vi.mock(
  "@/components/workspace/crm/messages/conversation-inbox/conversation-inbox",
  () => ({
    ConversationInbox: ({
      canWriteSelected,
      cockpitHref,
      items,
      selected,
    }: {
      canWriteSelected: boolean;
      cockpitHref: string | null;
      items: readonly ConversationInboxItemDto[];
      selected: { customerId: string } | null;
    }) => (
      <div
        data-cockpit={cockpitHref ?? ""}
        data-items={items.map((item) => item.customerId).join(",")}
        data-selected={selected?.customerId ?? ""}
        data-testid="inbox"
        data-writable={String(canWriteSelected)}
      />
    ),
  }),
);

const CUSTOMER_A = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_B = "22222222-2222-4222-8222-222222222222";

function item(
  customerId: string,
  ownerMemberId: string,
): ConversationInboxItemDto {
  return {
    id: `conversation-${customerId}`,
    customerId,
    customerDisplayName: customerId,
    ownerMemberId,
    ownerDisplayName: "Owner",
    unreadCount: 0,
    lastMessageAt: null,
    lastMessage: null,
  };
}

async function renderPage(
  actor: WorkspaceActor,
  searchParams: Record<string, string> = {},
) {
  mocks.requireWorkspaceActor.mockResolvedValue(actor);
  render(
    await MessagesPage({
      params: Promise.resolve({ locale: "de" }),
      searchParams: Promise.resolve(searchParams),
    }),
  );
  return screen.getByTestId("inbox");
}

describe("MessagesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCustomerConversation.mockImplementation(async (customerId) => ({
      customerId,
    }));
    mocks.listConversationOwnerCandidates.mockResolvedValue([]);
  });
  afterEach(cleanup);

  it("is not found without chat.read anywhere", async () => {
    await expect(renderPage(workspaceActorWith([]))).rejects.toThrow(
      "notFound called",
    );
    expect(mocks.listConversations).not.toHaveBeenCalled();
  });

  it("filters to own conversations and opens only listed customers", async () => {
    const actor = workspaceActorWith([Permission.ChatRead]);
    mocks.listConversations.mockResolvedValue([
      item(CUSTOMER_A, actor.workspaceMemberId),
      item(CUSTOMER_B, "someone-else"),
    ]);

    const inbox = await renderPage(actor, {
      filter: "mine",
      customer: "33333333-3333-4333-8333-333333333333",
    });

    expect(inbox).toHaveAttribute("data-items", CUSTOMER_A);
    expect(inbox).toHaveAttribute("data-selected", "");
    expect(mocks.getCustomerConversation).not.toHaveBeenCalled();
  });

  it("does not open a conversation excluded by the mine filter", async () => {
    const actor = workspaceActorWith([Permission.ChatRead]);
    mocks.listConversations.mockResolvedValue([
      item(CUSTOMER_A, actor.workspaceMemberId),
      item(CUSTOMER_B, "someone-else"),
    ]);

    const inbox = await renderPage(actor, {
      filter: "mine",
      customer: CUSTOMER_B,
    });

    expect(inbox).toHaveAttribute("data-items", CUSTOMER_A);
    expect(inbox).toHaveAttribute("data-selected", "");
    expect(mocks.getCustomerConversation).not.toHaveBeenCalled();
  });

  it("passes write access and the customer link only with the matching rights", async () => {
    const actor: WorkspaceActor = {
      ...workspaceActorWith([]),
      customerPermissions: new Map([
        [CUSTOMER_A, new Set([Permission.ChatRead])],
      ]),
    };
    mocks.listConversations.mockResolvedValue([item(CUSTOMER_A, "x")]);

    const inbox = await renderPage(actor, { customer: CUSTOMER_A });

    expect(inbox).toHaveAttribute("data-selected", CUSTOMER_A);
    expect(inbox).toHaveAttribute("data-writable", "false");
    expect(inbox).toHaveAttribute("data-cockpit", "");
  });
});
