import "server-only";

import { MessageSenderSide } from "@invessiv/common/constants/crm/message-types";
import type { MessageAttachmentDto } from "@invessiv/common/contracts/crm/message-attachment.dto";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import { messages } from "@invessiv/db/record-configuration";
import type { ConversationReader } from "./conversation-reader-types";
import type { MessageAttachmentRow } from "./message-attachment-types";

function isOwnMessage(
  row: typeof messages.$inferSelect,
  viewer: ConversationReader | null,
): boolean {
  if (!viewer) return false;
  return viewer.side === MessageSenderSide.Internal
    ? row.sender_member_id === viewer.memberId
    : row.sender_portal_membership_id === viewer.portalMembershipId;
}

/** An entry the viewer may no longer see keeps only its position; nothing reveals what it was. */
function toAttachmentDto(row: MessageAttachmentRow): MessageAttachmentDto {
  if (!row.available)
    return {
      position: row.position,
      available: false,
      fileId: null,
      displayName: null,
      assetKind: null,
      url: null,
    };
  return {
    position: row.position,
    available: true,
    fileId: row.fileId,
    displayName: row.displayName,
    assetKind: row.assetKind,
    url: row.url,
  };
}

/**
 * `viewer` is null for the read-only owner view of the portal, which never owns a message. A
 * redacted message drops its attachments together with its text.
 */
function toDto(
  row: typeof messages.$inferSelect,
  viewer: ConversationReader | null,
  attachments: readonly MessageAttachmentDto[] = [],
): MessageDto {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    type: row.type,
    body: row.redacted_at ? null : row.body,
    attachments: row.redacted_at ? [] : [...attachments],
    metadata: row.metadata,
    senderSide: row.sender_side,
    senderDisplayName: row.sender_display_name,
    isOwn: isOwnMessage(row, viewer),
    createdAt: row.created_at.toISOString(),
    redactedAt: row.redacted_at?.toISOString() ?? null,
  };
}

export const messageMappingService = { toAttachmentDto, toDto } as const;
