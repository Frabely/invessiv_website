import { describe, expect, it, vi } from "vitest";
import {
  MessageSenderSide,
  MessageType,
} from "@invessiv/common/constants/crm/message-types";
import { messages } from "@invessiv/db/record-configuration";
import { messageMappingService } from "@/server/shared/services/message/message-mapping-service";

vi.mock("server-only", () => ({}));

const row: typeof messages.$inferSelect = {
  id: "11111111-1111-4111-8111-111111111111",
  conversation_id: "22222222-2222-4222-8222-222222222222",
  client_message_id: null,
  customer_id: "33333333-3333-4333-8333-333333333333",
  type: MessageType.Text,
  body: "Hello",
  metadata: null,
  sender_side: MessageSenderSide.Customer,
  sender_member_id: null,
  sender_portal_membership_id: "44444444-4444-4444-8444-444444444444",
  sender_display_name: "Anna Berger",
  created_at: new Date("2026-09-24T09:15:00.000Z"),
  redacted_at: null,
  redacted_by_member_id: null,
};

describe("messageMappingService.toDto", () => {
  it("maps the immutable row and computes ownership for a portal member", () => {
    expect(
      messageMappingService.toDto(row, null, row.sender_portal_membership_id),
    ).toEqual({
      id: row.id,
      conversationId: row.conversation_id,
      type: MessageType.Text,
      body: "Hello",
      metadata: null,
      senderSide: MessageSenderSide.Customer,
      senderDisplayName: "Anna Berger",
      isOwn: true,
      createdAt: "2026-09-24T09:15:00.000Z",
      redactedAt: null,
    });
  });

  it("never exposes a redacted body even if a stale row still contains it", () => {
    const redactedAt = new Date("2026-09-25T12:00:00.000Z");
    expect(
      messageMappingService.toDto(
        { ...row, redacted_at: redactedAt },
        null,
        null,
      ),
    ).toMatchObject({
      body: null,
      redactedAt: redactedAt.toISOString(),
      isOwn: false,
    });
  });

  it("maps a system event key and parameters", () => {
    expect(
      messageMappingService.toDto(
        {
          ...row,
          type: MessageType.System,
          body: "phase.changed",
          metadata: { phase: "build" },
          sender_side: MessageSenderSide.System,
          sender_portal_membership_id: null,
          sender_display_name: "System",
        },
        null,
        null,
      ),
    ).toMatchObject({
      body: "phase.changed",
      metadata: { phase: "build" },
      isOwn: false,
    });
  });
});
