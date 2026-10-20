import type { FeedbackItemResult } from "../../constants/crm/feedback-item-results";

/** The team's outcome for one item; the customer sees it once the round is completed. */
export interface SetFeedbackItemResultRequestDto {
  /** Item version the client last read; a stale value answers with a 409 and the current item. */
  version: number;
  /** One UUID per explicit action, preserved for transport retries; optional for older clients. */
  commandId?: string;
  /** Outcome while the round is editable; null resets an earlier result to pending. */
  result: FeedbackItemResult | null;
  /**
   * Plain-text reply to the customer; required for `not_implemented` and `additional_service`,
   * null or omitted for `implemented`; must be empty when resetting to pending.
   */
  resultNote?: string | null;
}
