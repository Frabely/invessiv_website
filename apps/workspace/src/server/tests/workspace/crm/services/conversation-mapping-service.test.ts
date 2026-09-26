import { describe, expect, it, vi } from "vitest";
import {
  MessageSenderSide,
  MessageType,
} from "@invessiv/common/constants/crm/message-types";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import { conversations } from "@invessiv/db/record-configuration";
import { conversationMappingService } from "@/server/shared/services/message/conversation-mapping-service";

vi.mock("server-only", () => ({}));

const row: typeof conversations.$inferSelect = {
  id: "11111111-1111-4111-8111-111111111111",
  customer_id: "22222222-2222-4222-8222-222222222222",
  project_id: null,
  owner_member_id: "33333333-3333-4333-8333-333333333333",
  version: 3,
  last_message_at: new Date("2026-09-24T10:00:00.000Z"),
  internal_notified_at: null,
  created_at: new Date("2026-09-20T10:00:00.000Z"),
  updated_at: new Date("2026-09-24T10:00:00.000Z"),
};

const lastMessage: MessageDto = {
  id: "44444444-4444-4444-8444-444444444444",
  conversationId: row.id,
  type: MessageType.Text,
  body: "Hello",
  metadata: null,
  senderSide: MessageSenderSide.Customer,
  senderDisplayName: "Anna Berger",
  isOwn: false,
  createdAt: "2026-09-24T10:00:00.000Z",
  redactedAt: null,
};

describe("conversationMappingService", () => {
  it("maps the internal view with owner, version and redaction capability", () => {
    expect(
      conversationMappingService.toInternalDto(
        row,
        "Moritz",
        2,
        { messages: [lastMessage], nextCursor: null },
        true,
      ),
    ).toEqual({
      id: row.id,
      customerId: row.customer_id,
      unreadCount: 2,
      lastMessageAt: "2026-09-24T10:00:00.000Z",
      messages: [lastMessage],
      nextCursor: null,
      ownerMemberId: row.owner_member_id,
      ownerDisplayName: "Moritz",
      version: 3,
      canRedact: true,
    });
  });

  it("maps an inbox row with preview and names", () => {
    expect(
      conversationMappingService.toInboxItemDto(
        row,
        { customerDisplayName: "Nordlicht GmbH", ownerDisplayName: "Moritz" },
        1,
        lastMessage,
      ),
    ).toEqual({
      id: row.id,
      customerId: row.customer_id,
      customerDisplayName: "Nordlicht GmbH",
      ownerMemberId: row.owner_member_id,
      ownerDisplayName: "Moritz",
      unreadCount: 1,
      lastMessageAt: "2026-09-24T10:00:00.000Z",
      lastMessage,
    });
  });

  it("keeps an empty conversation without timestamp and preview", () => {
    const item = conversationMappingService.toInboxItemDto(
      { ...row, last_message_at: null },
      { customerDisplayName: "Nordlicht GmbH", ownerDisplayName: "Moritz" },
      0,
      null,
    );
    expect(item.lastMessageAt).toBeNull();
    expect(item.lastMessage).toBeNull();
  });
});
