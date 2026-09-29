import type {
  MessageSenderSide,
  MessageType,
} from "../../constants/crm/message-types";
import type { MessageAttachmentDto } from "./message-attachment.dto";

export interface MessageDto {
  /** Stable identifier used for cursor pagination and redaction. */
  id: string;
  /** Conversation that owns this immutable message. */
  conversationId: string;
  /** Text was written by a person; system records contain an event key. */
  type: MessageType;
  /** Null only after owner redaction; system messages use a dictionary key; empty with attachments only. */
  body: string | null;
  /** In send order; empty after redaction and in list previews that do not load them. */
  attachments: MessageAttachmentDto[];
  /** Parameters for a system event, absent for ordinary messages. */
  metadata: Record<string, string> | null;
  /** Origin of the message, independent of the viewer. */
  senderSide: MessageSenderSide;
  /** Snapshot of the name at send time. */
  senderDisplayName: string;
  /** Whether the sender is the current viewer. */
  isOwn: boolean;
  /** Database timestamp used with id for stable pagination. */
  createdAt: string;
  /** Null until the owner has hidden unlawful content. */
  redactedAt: string | null;
}
