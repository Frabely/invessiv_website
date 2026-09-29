import "server-only";

import type { ConversationAttachmentAccessDto } from "@invessiv/common/contracts/crm/conversation-attachment-access.dto";
import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";

function toPortalDto(
  conversation: ConversationDto,
  canWrite: boolean,
  attachmentAccess: ConversationAttachmentAccessDto,
): PortalConversationDto {
  return { ...conversation, canWrite, attachmentAccess };
}

export const portalConversationMappingService = { toPortalDto } as const;
