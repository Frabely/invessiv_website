/** Snapshot of the round the member opened; a delayed request must not mark a later submission read. */
export type MarkFeedbackRoundReadRequestDto = {
  /** Round version observed in the detail view; submission and return steps advance this token. */
  version: number;
};
