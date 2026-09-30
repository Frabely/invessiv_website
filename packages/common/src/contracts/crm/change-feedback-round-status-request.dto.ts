import type { InternalFeedbackRoundTargetStatus } from "../../constants/crm/feedback-round-statuses";

/** A status step the team takes on a running round; allowed only along `FEEDBACK_ROUND_TRANSITIONS`. */
export interface ChangeFeedbackRoundStatusRequestDto {
  /** Round version the client last read; a stale value answers with a 409 and the current round. */
  version: number;
  /** Target status; `open` hands the round back to the customer. */
  to: InternalFeedbackRoundTargetStatus;
  /**
   * Plain-text note shown to the customer. Optional for `in_discussion`, required for `open`,
   * refused for every other target.
   */
  customerNotice?: string | null;
}
