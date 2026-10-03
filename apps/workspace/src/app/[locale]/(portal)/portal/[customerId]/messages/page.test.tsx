// @vitest-environment jsdom
import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";

import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";
import type { PortalMessagesViewProps } from "@/components/portal/messages/portal-messages-view/portal-messages-view";
import PortalMessagesPage, { generateMetadata, viewport } from "./page";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  requirePortalReader: vi.fn(),
  getPortalConversation: vi.fn(),
  listPortalCurrentProjects: vi.fn(),
  isPortalOwnerView: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  viewProps: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/server/portal/auth/require-portal-reader", () => ({
  requirePortalReader: mocks.requirePortalReader,
}));
vi.mock("@/server/portal/auth/portal-owner-view", () => ({
  isPortalOwnerView: mocks.isPortalOwnerView,
}));
vi.mock(
  "@/server/portal/query-handler/get-portal-conversation.query-handler",
  () => ({ getPortalConversation: mocks.getPortalConversation }),
);
vi.mock(
  "@/server/portal/query-handler/list-portal-current-projects.query-handler",
  () => ({
    listPortalCurrentProjects: mocks.listPortalCurrentProjects,
  }),
);
vi.mock(
  "@/components/portal/messages/portal-messages-view/portal-messages-view",
  () => ({
    PortalMessagesView: (props: PortalMessagesViewProps) => {
      mocks.viewProps(props);
      return <div data-testid="messages" />;
    },
  }),
);

const READER = {
  userId: "user-uuid-1",
  membershipId: "membership-uuid-1",
  customerId: "customer-1",
  personId: "person-uuid-1",
  permissions: new Set([Permission.PortalMessagesRead]),
  projectPermissions: new Map(),
};

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

async function renderPage(customerId = "customer-1") {
  render(
    await PortalMessagesPage({
      params: Promise.resolve({ locale: "de", customerId }),
    }),
  );
  return mocks.viewProps.mock.calls.at(-1)![0] as PortalMessagesViewProps;
}

describe("PortalMessagesPage", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockClear());
    mocks.requirePortalReader.mockResolvedValue(READER);
    mocks.getPortalConversation.mockResolvedValue({
      ok: true,
      conversation: CONVERSATION,
    });
    mocks.isPortalOwnerView.mockReturnValue(false);
    mocks.listPortalCurrentProjects.mockResolvedValue([]);
  });

  afterEach(cleanup);

  it("loads the conversation of the resolved reader only", async () => {
    const props = await renderPage("CUSTOMER-1");

    expect(mocks.requirePortalReader).toHaveBeenCalledWith("de", "customer-1");
    expect(mocks.getPortalConversation).toHaveBeenCalledWith(READER, null);
    expect(props.conversation).toBe(CONVERSATION);
    expect(props.customerId).toBe(READER.customerId);
    expect(props.viewerUserId).toBe(READER.userId);
    expect(props.cockpitHref).toBeNull();
  });

  it("answers 404 when the reader may not read messages", async () => {
    mocks.getPortalConversation.mockResolvedValue({
      ok: false,
      code: MessageErrorCode.NotFound,
    });

    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.viewProps).not.toHaveBeenCalled();
  });

  it("links the owner view to the CRM", async () => {
    mocks.isPortalOwnerView.mockReturnValue(true);

    const props = await renderPage();

    expect(props.cockpitHref).toBe("/de/crm?cockpit=customer-1");
  });

  it("keeps the composer above the on-screen keyboard", () => {
    expect(viewport.interactiveWidget).toBe("resizes-content");
  });

  it("returns localized no-index metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", customerId: "customer-1" }),
    });

    expect(metadata.title).toBe("Messages | Invessiv");
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });
});
