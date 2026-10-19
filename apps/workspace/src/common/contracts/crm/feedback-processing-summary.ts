/** How far the team is with the items of one round, counted from each item's processing state. */
export type FeedbackProcessingSummary = {
  /** Items with a result and no open question. */
  done: number;
  /** Items with neither a result nor an open question. */
  pending: number;
  /** Items waiting on an open question. */
  clarifications: number;
  total: number;
};
