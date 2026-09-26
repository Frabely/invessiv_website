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
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import {
  MessageSenderSide,
  MessageType,
} from "@invessiv/common/constants/crm/message-types";
import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
import {
  MESSAGE_DRAFT_STORAGE_KEY_PREFIX,
  MESSAGE_PENDING_STORAGE_KEY_PREFIX,
} from "@/common/constants/crm/message-draft-storage";
import { getCrmMessagesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { CustomerConversation } from "./customer-conversation";

const api = vi.hoisted(() => ({
  getConversation: vi.fn(),
  markRead: vi.fn(),
  sendMessage: vi.fn(),
  redactMessage: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/client/crm/messages-api-service", () => ({
  messagesApiService: api,
}));

const customerId = "11111111-1111-4111-8111-111111111111";
const content = getCrmMessagesDictionary("en");
const conversation: InternalConversationDto = {
  id: "conversation-1",
  customerId,
  unreadCount: 0,
  lastMessageAt: null,
  messages: [],
  nextCursor: null,
  ownerMemberId: "member-a",
  ownerDisplayName: "Alice",
  version: 1,
  canRedact: false,
};

function renderConversation(viewerMemberId: string) {
  return render(
    <CustomerConversation
      active
      canWrite
      content={content}
      customerId={customerId}
      initialConversation={conversation}
      locale="en"
      viewerMemberId={viewerMemberId}
    />,
  );
}

describe("CustomerConversation pending storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    api.getConversation.mockReturnValue(new Promise(() => {}));
    api.sendMessage.mockResolvedValue({
      ok: false,
      code: MessageErrorCode.Internal,
    });
  });
  afterEach(cleanup);

  it("restores a failed send after reload and keeps it private to its member", async () => {
    renderConversation("member-a");
    fireEvent.change(
      screen.getByRole("textbox", { name: content.thread.inputLabel }),
      {
        target: { value: "Please review the draft" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: content.thread.send }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: content.thread.retry }),
      ).toBeVisible(),
    );
    const pendingKey = `${MESSAGE_PENDING_STORAGE_KEY_PREFIX}member-a:${customerId}`;
    await waitFor(() =>
      expect(window.localStorage.getItem(pendingKey)).toContain(
        "Please review the draft",
      ),
    );
    cleanup();

    renderConversation("member-a");
    expect(
      await screen.findByRole("button", { name: content.thread.retry }),
    ).toBeVisible();
    expect(screen.getByText("Please review the draft")).toBeVisible();
    api.sendMessage.mockResolvedValueOnce({
      ok: true,
      value: {
        id: "message-1",
        conversationId: conversation.id,
        type: MessageType.Text,
        body: "Please review the draft",
        metadata: null,
        senderSide: MessageSenderSide.Internal,
        senderDisplayName: "Alice",
        isOwn: true,
        createdAt: new Date().toISOString(),
        redactedAt: null,
      },
    });
    fireEvent.click(screen.getByRole("button", { name: content.thread.retry }));
    await waitFor(() =>
      expect(window.localStorage.getItem(pendingKey)).toBeNull(),
    );
    cleanup();

    renderConversation("member-b");
    expect(screen.queryByText("Please review the draft")).toBeNull();
    expect(
      screen.queryByRole("button", { name: content.thread.retry }),
    ).toBeNull();
  });

  it("does not display an unowned legacy draft after an account switch", () => {
    window.localStorage.setItem(
      `${MESSAGE_DRAFT_STORAGE_KEY_PREFIX}${customerId}`,
      "Private legacy draft",
    );

    renderConversation("member-b");

    expect(
      screen.getByRole("textbox", { name: content.thread.inputLabel }),
    ).toHaveValue("");
    expect(
      window.localStorage.getItem(
        `${MESSAGE_DRAFT_STORAGE_KEY_PREFIX}${customerId}`,
      ),
    ).toBeNull();
  });

  it("isolates unsent drafts by member", () => {
    renderConversation("member-a");
    fireEvent.change(
      screen.getByRole("textbox", { name: content.thread.inputLabel }),
      {
        target: { value: "Only Alice should see this" },
      },
    );
    cleanup();

    renderConversation("member-b");
    expect(
      screen.getByRole("textbox", { name: content.thread.inputLabel }),
    ).toHaveValue("");
    cleanup();

    renderConversation("member-a");
    expect(
      screen.getByRole("textbox", { name: content.thread.inputLabel }),
    ).toHaveValue("Only Alice should see this");
  });
});
