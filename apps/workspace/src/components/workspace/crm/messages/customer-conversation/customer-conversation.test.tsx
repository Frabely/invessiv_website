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
import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";
import {
  MessageSenderSide,
  MessageType,
} from "@invessiv/common/constants/crm/message-types";
import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import { MESSAGE_PENDING_STORAGE_KEY_PREFIX } from "@/common/constants/crm/message-draft-storage";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import {
  getCrmFilesDictionary,
  getCrmMessagesDictionary,
} from "@/i18n/dictionaries/workspace/crm";
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
const filesApi = vi.hoisted(() => ({
  listFiles: vi.fn(),
  getDownloadUrl: vi.fn(),
  uploadTransport: vi.fn(),
}));
vi.mock("@/client/crm/files-api-service", () => ({
  filesApiService: filesApi,
}));

const customerId = "11111111-1111-4111-8111-111111111111";
const conversationId = "conversation-1";
const content = getCrmMessagesDictionary("en");
const conversation: InternalConversationDto = {
  id: conversationId,
  customerId,
  unreadCount: 0,
  lastMessageAt: null,
  messages: [],
  nextCursor: null,
  attachmentAccess: { pick: false, upload: false },
  ownership: {
    ownerMemberId: "member-a",
    ownerDisplayName: "Alice",
    version: 1,
  },
};

function renderConversation(
  viewerMemberId: string,
  initialConversation: InternalConversationDto = conversation,
  canRedact = false,
) {
  return render(
    <CustomerConversation
      active
      canRedact={canRedact}
      canWrite
      content={content}
      customerId={customerId}
      initialConversation={initialConversation}
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
        conversationId,
        type: MessageType.Text,
        body: "Please review the draft",
        attachments: [],
        metadata: null,
        senderSide: MessageSenderSide.Internal,
        senderDisplayName: "Alice",
        isOwn: true,
        createdAt: new Date().toISOString(),
        redactedAt: null,
      },
    });
    fireEvent.click(screen.getByRole("button", { name: content.thread.retry }));
    const firstSend = api.sendMessage.mock.calls[0][0];
    const retrySend = api.sendMessage.mock.calls[1][0];
    expect(retrySend.clientMessageId).toBe(firstSend.clientMessageId);
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

  it("marks only the displayed message as read", async () => {
    const message: MessageDto = {
      id: "22222222-2222-4222-8222-222222222222",
      conversationId,
      type: MessageType.Text,
      body: "Visible customer message",
      attachments: [],
      metadata: null,
      senderSide: MessageSenderSide.Customer,
      senderDisplayName: "Customer",
      isOwn: false,
      createdAt: "2026-09-26T10:00:00.000Z",
      redactedAt: null,
    };
    api.markRead.mockResolvedValue({ ok: true, value: true });
    renderConversation("member-a", {
      ...conversation,
      unreadCount: 1,
      messages: [message],
    });
    await waitFor(() =>
      expect(api.markRead).toHaveBeenCalledWith(customerId, message.id),
    );
  });

  it("replaces a redacted older message without waiting for its page to reload", async () => {
    const oldMessage: MessageDto = {
      id: "33333333-3333-4333-8333-333333333333",
      conversationId,
      type: MessageType.Text,
      body: "Sensitive older text",
      attachments: [],
      metadata: null,
      senderSide: MessageSenderSide.Customer,
      senderDisplayName: "Customer",
      isOwn: false,
      createdAt: "2026-09-25T10:00:00.000Z",
      redactedAt: null,
    };
    const latest = { ...conversation, nextCursor: "older" };
    api.getConversation.mockImplementation(
      async (_id: string, cursor: string | null) => ({
        ok: true,
        value: cursor
          ? { ...latest, messages: [oldMessage], nextCursor: null }
          : latest,
      }),
    );
    api.redactMessage.mockResolvedValue({
      ok: true,
      value: {
        ...oldMessage,
        body: null,
        redactedAt: new Date().toISOString(),
      },
    });
    renderConversation("member-a", latest, true);
    fireEvent.click(
      await screen.findByRole("button", { name: content.thread.loadOlder }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: content.thread.redact }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.redaction.confirm }),
    );
    await waitFor(() =>
      expect(api.redactMessage).toHaveBeenCalledWith(oldMessage.id),
    );
    await expect(
      api.redactMessage.mock.results[0].value,
    ).resolves.toMatchObject({ ok: true });
    await waitFor(() => expect(api.getConversation).toHaveBeenCalledTimes(3));
    await waitFor(() =>
      expect(screen.queryByText("Sensitive older text")).toBeNull(),
    );
    expect(screen.getByText(content.thread.redacted)).toBeVisible();
  });

  it("offers no attachments without file texts", () => {
    renderConversation("member-a", {
      ...conversation,
      attachmentAccess: { pick: true, upload: true },
    });
    expect(
      screen.queryByRole("button", { name: content.attachments.attach }),
    ).toBeNull();
  });

  it("shows the release notice for an internal file and confirms it on send", async () => {
    const fileId = "44444444-4444-4444-8444-444444444444";
    filesApi.listFiles.mockResolvedValue({
      ok: true,
      value: {
        files: [
          {
            id: fileId,
            displayName: "offer.pdf",
            assetKind: AssetKind.Document,
            visibleToCustomer: false,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 25,
      },
    });
    render(
      <CustomerConversation
        active
        canRedact={false}
        canWrite
        content={content}
        customerId={customerId}
        filesContent={getCrmFilesDictionary("en")}
        initialConversation={{
          ...conversation,
          attachmentAccess: { pick: true, upload: false },
        }}
        locale="en"
        viewerMemberId="member-a"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: content.attachments.attach }),
    );
    fireEvent.click(
      await screen.findByRole("checkbox", { name: "Attach offer.pdf" }),
    );
    expect(screen.getByText(content.attachments.internalBadge)).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: content.attachments.confirm }),
    );

    expect(await screen.findByRole("note")).toHaveTextContent(
      content.attachments.releaseNoticeOne,
    );
    fireEvent.click(screen.getByRole("button", { name: content.thread.send }));
    await waitFor(() =>
      expect(api.sendMessage).toHaveBeenCalledWith(
        customerId,
        expect.objectContaining({
          body: "",
          attachmentFileIds: [fileId],
          releaseHiddenAttachments: true,
        }),
      ),
    );
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("downloads an uploaded attachment through the CRM file endpoint", async () => {
    filesApi.getDownloadUrl.mockResolvedValue({
      ok: false,
      code: FileApiErrorCode.NotFound,
    });
    const withAttachment: InternalConversationDto = {
      ...conversation,
      messages: [
        {
          id: "55555555-5555-4555-8555-555555555555",
          conversationId,
          type: MessageType.Text,
          body: "",
          attachments: [
            {
              position: 0,
              available: true,
              fileId: "file-1",
              displayName: "offer.pdf",
              assetKind: AssetKind.Document,
              url: null,
            },
          ],
          metadata: null,
          senderSide: MessageSenderSide.Customer,
          senderDisplayName: "Customer",
          isOwn: false,
          createdAt: "2026-09-26T10:00:00.000Z",
          redactedAt: null,
        },
      ],
    };
    render(
      <CustomerConversation
        active
        canRedact={false}
        canWrite
        content={content}
        customerId={customerId}
        filesContent={getCrmFilesDictionary("en")}
        initialConversation={withAttachment}
        locale="en"
        viewerMemberId="member-a"
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Download offer.pdf" }),
    );
    await waitFor(() =>
      expect(filesApi.getDownloadUrl).toHaveBeenCalledWith(
        "file-1",
        StorageDisposition.Attachment,
      ),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.attachments.downloadError,
    );
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
