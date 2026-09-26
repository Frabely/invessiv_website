import type { ConversationInboxFilter } from "@/common/constants/crm/conversation-inbox-filters";

/** Inbox state read from the URL; an unknown customer id simply selects nothing. */
export type ConversationInboxRequest = {
  /** Selected customer whose conversation is shown next to the list. */
  customerId: string | null;
  /** Everything or only the conversations the viewer is responsible for. */
  filter: ConversationInboxFilter;
};
