/**
 * Texts of the shared clarification thread. The CRM and the portal fill them from their own
 * dictionaries, so the component itself stays free of either side's wording.
 */
export type FeedbackClarificationThreadLabels = {
  /** Who asks and closes, e.g. "Our team". */
  team: string;
  /** Who answers, e.g. "Customer" in the CRM or "You" in the portal. */
  customer: string;
  /** "{name} on {date}" above every text. */
  byline: string;
  statusOpen: string;
  statusAnswered: string;
  statusClosed: string;
  /** Heading above the note of a clarification the team closed without an answer. */
  closeNote: string;
  /** Toggle for older finished clarifications, with `{count}`. */
  earlier: string;
  showMore: string;
  showLess: string;
};
