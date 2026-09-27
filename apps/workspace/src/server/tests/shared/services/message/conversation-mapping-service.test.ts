import { describe, expect, it, vi } from "vitest";
import { conversations } from "@invessiv/db/record-configuration";
import { conversationMappingService } from "@/server/shared/services/message/conversation-mapping-service";

vi.mock("server-only", () => ({}));

const row: typeof conversations.$inferSelect = {
  id: "11111111-1111-4111-8111-111111111111",
  customer_id: "22222222-2222-4222-8222-222222222222",
  project_id: null,
  owner_member_id: "33333333-3333-4333-8333-333333333333",
  version: 1,
  last_message_at: null,
  internal_notified_at: null,
  created_at: new Date("2026-09-20T10:00:00.000Z"),
  updated_at: new Date("2026-09-20T10:00:00.000Z"),
};

describe("conversationMappingService.toConversationDto", () => {
  it("maps an existing conversation with its page and unread count", () => {
    expect(
      conversationMappingService.toConversationDto(
        { ...row, last_message_at: new Date("2026-09-24T10:00:00.000Z") },
        row.customer_id,
        2,
        { messages: [], nextCursor: "older" },
      ),
    ).toEqual({
      id: row.id,
      customerId: row.customer_id,
      unreadCount: 2,
      lastMessageAt: "2026-09-24T10:00:00.000Z",
      messages: [],
      nextCursor: "older",
    });
  });

  it("describes a customer without messages as an empty thread without id", () => {
    expect(
      conversationMappingService.toConversationDto(null, row.customer_id, 5, {
        messages: [],
        nextCursor: "ignored",
      }),
    ).toEqual({
      id: null,
      customerId: row.customer_id,
      unreadCount: 0,
      lastMessageAt: null,
      messages: [],
      nextCursor: null,
    });
  });
});
