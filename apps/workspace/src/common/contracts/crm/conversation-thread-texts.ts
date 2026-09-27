import type { MessageThreadLabels } from "@invessiv/common/contracts/ui/message-thread-labels";
import type { MessageThreadStatusLabels } from "@invessiv/common/contracts/ui/message-thread-status-labels";
import type { SystemMessageTexts } from "./system-message-texts";
import type { ThreadNoticeTexts } from "./thread-notice-texts";

/** Everything a conversation view shows; the CRM and the portal each fill it from their dictionary. */
export type ConversationThreadTexts = SystemMessageTexts & {
  thread: MessageThreadLabels;
  states: MessageThreadStatusLabels & ThreadNoticeTexts;
};
