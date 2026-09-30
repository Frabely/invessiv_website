import type { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";

/**
 * Result of a handover as the dialog needs it. A second handover of the same round (double click,
 * second tab) answers with the id of the running round, so the dialog can open it instead.
 */
export type HandOverFeedbackRoundClientResult =
  | { ok: true; roundId: string }
  | {
      ok: false;
      code: typeof FeedbackRoundErrorCode.RoundAlreadyActive;
      activeRoundId: string;
    }
  | { ok: false; code: FeedbackRoundErrorCode };
