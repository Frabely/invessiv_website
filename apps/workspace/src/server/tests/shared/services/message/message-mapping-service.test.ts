import { describe, expect, it, vi } from "vitest";
import {
  MessageSenderSide,
  MessageType,
} from "@invessiv/common/constants/crm/message-types";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { messages } from "@invessiv/db/record-configuration";
import type { MessageAttachmentRow } from "@/server/shared/services/message/message-attachment-types";
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

const attachment: MessageAttachmentRow = {
  messageId: row.id,
  position: 0,
  available: true,
  fileId: "77777777-7777-4777-8777-777777777777",
  displayName: "Brand guide",
  assetKind: AssetKind.Link,
  url: "https://example.com/guide",
};

describe("messageMappingService.toAttachmentDto", () => {
  it("maps a visible entry with name, kind and link target", () => {
    expect(messageMappingService.toAttachmentDto(attachment)).toEqual({
      position: 0,
      available: true,
      fileId: attachment.fileId,
      displayName: "Brand guide",
      assetKind: AssetKind.Link,
      url: "https://example.com/guide",
    });
  });

  it("reveals nothing but the position of an entry the viewer may not see", () => {
    expect(
      messageMappingService.toAttachmentDto({
        ...attachment,
        available: false,
      }),
    ).toEqual({
      position: 0,
      available: false,
      fileId: null,
      displayName: null,
      assetKind: null,
      url: null,
    });
  });
});

describe("messageMappingService.toDto", () => {
  it("maps the immutable row and computes ownership for a portal member", () => {
    expect(
      messageMappingService.toDto(row, {
        side: MessageSenderSide.Customer,
        portalMembershipId: "44444444-4444-4444-8444-444444444444",
      }),
    ).toEqual({
      id: row.id,
      conversationId: row.conversation_id,
      type: MessageType.Text,
      body: "Hello",
      attachments: [],
      metadata: null,
      senderSide: MessageSenderSide.Customer,
      senderDisplayName: "Anna Berger",
      isOwn: true,
      createdAt: "2026-09-24T09:15:00.000Z",
      redactedAt: null,
    });
  });

  it("never exposes a redacted body or its attachments", () => {
    const redactedAt = new Date("2026-09-25T12:00:00.000Z");
    expect(
      messageMappingService.toDto({ ...row, redacted_at: redactedAt }, null, [
        messageMappingService.toAttachmentDto(attachment),
      ]),
    ).toMatchObject({
      body: null,
      attachments: [],
      redactedAt: redactedAt.toISOString(),
      isOwn: false,
    });
  });

  it("keeps the attachments of a visible message in the given order", () => {
    const first = messageMappingService.toAttachmentDto(attachment);
    const second = messageMappingService.toAttachmentDto({
      ...attachment,
      position: 1,
    });
    expect(
      messageMappingService.toDto(row, null, [first, second]).attachments,
    ).toEqual([first, second]);
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
      ),
    ).toMatchObject({
      body: "phase.changed",
      metadata: { phase: "build" },
      isOwn: false,
    });
  });

  it("marks an internal member's own message and not another member's", () => {
    const internalRow = {
      ...row,
      sender_side: MessageSenderSide.Internal,
      sender_member_id: "55555555-5555-4555-8555-555555555555",
      sender_portal_membership_id: null,
    };
    expect(
      messageMappingService.toDto(internalRow, {
        side: MessageSenderSide.Internal,
        memberId: "55555555-5555-4555-8555-555555555555",
      }).isOwn,
    ).toBe(true);
    expect(
      messageMappingService.toDto(internalRow, {
        side: MessageSenderSide.Internal,
        memberId: "66666666-6666-4666-8666-666666666666",
      }).isOwn,
    ).toBe(false);
  });
});
