import "server-only";

import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";

function toPortalDto(
  conversation: ConversationDto,
  canWrite: boolean,
): PortalConversationDto {
  return { ...conversation, canWrite };
}

export const portalConversationMappingService = { toPortalDto } as const;
