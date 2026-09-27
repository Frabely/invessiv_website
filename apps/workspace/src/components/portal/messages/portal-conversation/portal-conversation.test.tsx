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
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";
import { getPortalMessagesDictionary } from "@/i18n/dictionaries/portal";
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

const content = getPortalMessagesDictionary("de");
const CONVERSATION: PortalConversationDto = {
  id: "conversation-1",
  customerId: "customer-1",
  unreadCount: 0,
  lastMessageAt: null,
  messages: [],
  nextCursor: null,
  canWrite: true,
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
