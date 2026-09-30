import type { InternalQueueFeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";

/** Inbox filters read from the URL; an unknown customer id simply matches nothing. */
export type FeedbackInboxFilters = {
  /** One status the team is on turn in; null shows all of them. */
  status: InternalQueueFeedbackRoundStatus | null;
  /** Only rounds nobody has opened since they were submitted. */
  unreadOnly: boolean;
  /** Rounds of one customer only. */
  customerId: string | null;
};
