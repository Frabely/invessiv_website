import type { MessageSenderSide } from "@invessiv/common/constants/crm/message-types";

/** Who reads or writes: an internal member or a customer contact, never both and never neither. */
export type ConversationReader =
  | { side: typeof MessageSenderSide.Internal; memberId: string }
  | { side: typeof MessageSenderSide.Customer; portalMembershipId: string };
