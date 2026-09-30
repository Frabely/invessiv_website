import type { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";

/** `marked` is false when the round was read before or is still with the customer. */
export type MarkFeedbackRoundReadResult =
  | { ok: true; marked: boolean }
  | { ok: false; code: typeof FeedbackRoundErrorCode.RoundNotFound };
