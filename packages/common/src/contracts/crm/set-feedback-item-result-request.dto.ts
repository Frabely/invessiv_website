import type { FeedbackItemResult } from "../../constants/crm/feedback-item-results";

/** The team's outcome for one item; the customer sees it once the round is completed. */
export interface SetFeedbackItemResultRequestDto {
  /** Item version the client last read; a stale value answers with a 409 and the current item. */
  version: number;
  /** Outcome of the item; replaces any earlier one while the round is still being worked on. */
  result: FeedbackItemResult;
  /**
   * Plain-text reply to the customer; required for `not_implemented` and `additional_service`,
   * null or omitted for `implemented`.
   */
  resultNote?: string | null;
}
