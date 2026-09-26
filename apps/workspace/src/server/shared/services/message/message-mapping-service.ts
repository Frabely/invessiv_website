import "server-only";

import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import { messages } from "@invessiv/db/record-configuration";

function toDto(
  row: typeof messages.$inferSelect,
  ownMemberId: string | null,
  ownPortalMembershipId: string | null,
): MessageDto {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    type: row.type,
    body: row.redacted_at ? null : row.body,
    metadata: row.metadata,
    senderSide: row.sender_side,
    senderDisplayName: row.sender_display_name,
    isOwn:
      (ownMemberId !== null && row.sender_member_id === ownMemberId) ||
      (ownPortalMembershipId !== null &&
        row.sender_portal_membership_id === ownPortalMembershipId),
    createdAt: row.created_at.toISOString(),
    redactedAt: row.redacted_at?.toISOString() ?? null,
  };
}

export const messageMappingService = { toDto } as const;
