import "server-only";

import { MessageSenderSide } from "@invessiv/common/constants/crm/message-types";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import { messages } from "@invessiv/db/record-configuration";
import type { ConversationReader } from "./conversation-reader-types";

function isOwnMessage(
  row: typeof messages.$inferSelect,
  viewer: ConversationReader | null,
): boolean {
  if (!viewer) return false;
  return viewer.side === MessageSenderSide.Internal
    ? row.sender_member_id === viewer.memberId
    : row.sender_portal_membership_id === viewer.portalMembershipId;
}

/** `viewer` is null for the read-only owner view of the portal, which never owns a message. */
function toDto(
  row: typeof messages.$inferSelect,
  viewer: ConversationReader | null,
): MessageDto {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    type: row.type,
    body: row.redacted_at ? null : row.body,
    metadata: row.metadata,
    senderSide: row.sender_side,
    senderDisplayName: row.sender_display_name,
    isOwn: isOwnMessage(row, viewer),
    createdAt: row.created_at.toISOString(),
    redactedAt: row.redacted_at?.toISOString() ?? null,
  };
}

export const messageMappingService = { toDto } as const;
