// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MessageSenderSide,
  MessageType,
} from "@invessiv/common/constants/crm/message-types";
import type { ConversationInboxItemDto } from "@invessiv/common/contracts/crm/conversation-inbox-item.dto";
import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
import { ConversationInboxFilter } from "@/common/constants/crm/conversation-inbox-filters";
import {
  getCrmFilesDictionary,
  getCrmMessagesDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { ConversationInbox } from "./conversation-inbox";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/client/crm/messages-api-service", () => ({
  messagesApiService: {
    getConversation: () => new Promise(() => {}),
    markRead: () => new Promise(() => {}),
  },
}));

const content = getCrmMessagesDictionary("de");
const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";

const item: ConversationInboxItemDto = {
  id: "conversation-1",
  customerId: CUSTOMER_ID,
  customerDisplayName: "Nordlicht GmbH",
  ownerMemberId: "member-1",
  ownerDisplayName: "Moritz",
  unreadCount: 2,
  lastMessageAt: "2026-09-25T10:00:00.000Z",
  lastMessage: {
    id: "message-1",
    conversationId: "conversation-1",
    type: MessageType.Text,
    body: null,
    attachments: [],
    metadata: null,
    senderSide: MessageSenderSide.Customer,
    senderDisplayName: "Anna",
    isOwn: false,
    createdAt: "2026-09-25T10:00:00.000Z",
    redactedAt: "2026-09-25T11:00:00.000Z",
  },
};

const selected: InternalConversationDto = {
  id: "conversation-1",
  customerId: CUSTOMER_ID,
  unreadCount: 0,
  lastMessageAt: null,
  messages: [],
  nextCursor: null,
  attachmentAccess: { pick: false, upload: false },
  ownership: {
    ownerMemberId: "member-1",
    ownerDisplayName: "Moritz",
    version: 1,
  },
};

function renderInbox(
  props: Partial<Parameters<typeof ConversationInbox>[0]> = {},
) {
  return render(
    <ConversationInbox
      basePath="/de/crm/messages"
      canRedact={false}
      canWriteSelected={false}
      cockpitHref={null}
      content={content}
      filesContent={getCrmFilesDictionary("de")}
      filter={ConversationInboxFilter.All}
      hasAnyConversation
      items={[item]}
      locale="de"
      ownerCandidates={[]}
      selected={null}
      selectedCustomerName={null}
      viewerMemberId="member-1"
      {...props}
    />,
  );
}

describe("ConversationInbox", () => {
  afterEach(cleanup);

  it("lists conversations with unread text and a redacted preview", () => {
    const { container } = renderInbox();

    const link = screen.getByRole("link", { name: /Nordlicht GmbH/ });
    expect(link).toHaveAttribute(
      "href",
      `/de/crm/messages?customer=${CUSTOMER_ID}`,
    );
    expect(link).toHaveTextContent("2 ungelesen");
    expect(link).toHaveTextContent(content.thread.redacted);
    expect(container.firstChild).toHaveAttribute("data-view", "list");
    expect(
      screen.getByRole("link", { name: content.inbox.filterAll }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("separates an empty inbox from an empty filter", () => {
    renderInbox({ items: [], hasAnyConversation: false });
    expect(screen.getByText(content.inbox.emptyTitle)).toBeVisible();
    cleanup();

    renderInbox({
      items: [],
      filter: ConversationInboxFilter.Mine,
    });
    expect(screen.getByText(content.inbox.emptyFilteredTitle)).toBeVisible();
    expect(
      screen.getByRole("link", { name: content.inbox.showAll }),
    ).toHaveAttribute("href", "/de/crm/messages");
  });

  it("opens the selected thread read-only and without owner change when rights are missing", () => {
    const { container } = renderInbox({
      selected,
      selectedCustomerName: "Nordlicht GmbH",
    });

    expect(container.firstChild).toHaveAttribute("data-view", "thread");
    expect(
      screen.getByRole("heading", { level: 2, name: "Nordlicht GmbH" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Nordlicht GmbH/ }),
    ).toHaveAttribute("aria-current", "true");
    expect(screen.getAllByText("Verantwortlich: Moritz")).toHaveLength(2);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(
      screen.getByRole("link", { name: content.inbox.backToList }),
    ).toHaveAttribute("href", "/de/crm/messages");
  });
});
