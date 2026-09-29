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
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import {
  getPortalFilesDictionary,
  getPortalMessagesDictionary,
} from "@/i18n/dictionaries/portal";
import { PortalConversation } from "./portal-conversation";

const api = vi.hoisted(() => ({
  getConversation: vi.fn(),
  markRead: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/client/portal/portal-messages-api-service", () => ({
  portalMessagesApiService: api,
}));
const filesApi = vi.hoisted(() => ({
  listFiles: vi.fn(),
  getDownloadUrl: vi.fn(),
  uploadTransport: vi.fn(),
}));
vi.mock("@/client/portal/portal-files-api-service", () => ({
  portalFilesApiService: filesApi,
}));

const content = getPortalMessagesDictionary("de");
const CONVERSATION: PortalConversationDto = {
  id: "conversation-1",
  customerId: "customer-1",
  unreadCount: 0,
  lastMessageAt: null,
  messages: [],
  nextCursor: null,
  canWrite: true,
  attachmentAccess: { pick: false, upload: false },
};

function renderConversation(
  conversation: PortalConversationDto = CONVERSATION,
  cockpitHref: string | null = null,
) {
  return render(
    <PortalConversation
      active
      cockpitHref={cockpitHref}
      content={content}
      customerId="customer-1"
      initialConversation={conversation}
      locale="de"
      viewerUserId="user-1"
    />,
  );
}

describe("PortalConversation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    api.getConversation.mockReturnValue(new Promise(() => {}));
  });
  afterEach(cleanup);

  it("invites the customer to write in du-form", () => {
    renderConversation();

    expect(screen.getByText(content.thread.emptyTitle)).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: content.thread.inputLabel }),
    ).toBeVisible();
  });

  it("sends through the portal route and explains the hourly limit", async () => {
    api.sendMessage.mockResolvedValue({
      ok: false,
      code: MessageErrorCode.RateLimited,
    });
    renderConversation();

    const input = screen.getByRole("textbox", {
      name: content.thread.inputLabel,
    });
    fireEvent.change(input, { target: { value: "Hallo" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() =>
      expect(screen.getByText(content.states.rateLimited)).toHaveAttribute(
        "role",
        "alert",
      ),
    );
    expect(api.sendMessage).toHaveBeenCalledWith("customer-1", {
      body: "Hallo",
      clientMessageId: expect.any(String),
    });
    expect(
      screen.getByRole("button", { name: content.thread.retry }),
    ).toBeVisible();
  });

  it("attaches a visible file without any release step", async () => {
    const fileId = "44444444-4444-4444-8444-444444444444";
    filesApi.listFiles.mockResolvedValue({
      ok: true,
      value: {
        files: [
          {
            id: fileId,
            displayName: "logo.png",
            assetKind: AssetKind.Image,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 25,
      },
    });
    api.sendMessage.mockReturnValue(new Promise(() => {}));
    render(
      <PortalConversation
        active
        cockpitHref={null}
        content={content}
        customerId="customer-1"
        filesContent={getPortalFilesDictionary("de")}
        initialConversation={{
          ...CONVERSATION,
          attachmentAccess: { pick: true, upload: false },
        }}
        locale="de"
        viewerUserId="user-1"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: content.attachments.attach }),
    );
    fireEvent.click(
      await screen.findByRole("checkbox", { name: "logo.png anhängen" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.attachments.confirm }),
    );
    expect(filesApi.listFiles).toHaveBeenCalledWith("customer-1", null, 1);
    expect(screen.queryByRole("note")).toBeNull();
    fireEvent.click(
      await screen.findByRole("button", { name: content.thread.send }),
    );
    await waitFor(() =>
      expect(api.sendMessage).toHaveBeenCalledWith("customer-1", {
        body: "",
        clientMessageId: expect.any(String),
        attachmentFileIds: [fileId],
        releaseHiddenAttachments: false,
      }),
    );
  });

  it("offers no 📎 to the read-only owner view", () => {
    render(
      <PortalConversation
        active
        cockpitHref="/de/crm?cockpit=customer-1"
        content={content}
        customerId="customer-1"
        filesContent={getPortalFilesDictionary("de")}
        initialConversation={{ ...CONVERSATION, canWrite: false }}
        locale="de"
        viewerUserId="user-1"
      />,
    );
    expect(
      screen.queryByRole("button", { name: content.attachments.attach }),
    ).toBeNull();
  });

  it("shows no composer without write permission", () => {
    renderConversation({ ...CONVERSATION, canWrite: false });

    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("points the read-only owner view to the CRM", () => {
    renderConversation(
      { ...CONVERSATION, canWrite: false },
      "/de/crm?cockpit=customer-1",
    );

    expect(screen.queryByRole("textbox")).toBeNull();
    expect(
      screen.getByRole("link", { name: content.ownerView.link }),
    ).toHaveAttribute("href", "/de/crm?cockpit=customer-1");
  });
});
