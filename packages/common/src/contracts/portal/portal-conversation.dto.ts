import type { ConversationAttachmentAccessDto } from "../crm/conversation-attachment-access.dto";
import type { ConversationDto } from "../crm/conversation.dto";

export interface PortalConversationDto extends ConversationDto {
  /**
   * True only for a customer contact with `portal.messages.write`; the owner view never writes.
   * Hides the composer only — the send route checks the permission again.
   */
  canWrite: boolean;
  /** Needs `canWrite` plus `portal.files.read` (pick) or `portal.files.write` (upload). */
  attachmentAccess: ConversationAttachmentAccessDto;
}
