import type { z } from "zod";
import type { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import type { FeedbackHandOverBlocker } from "@invessiv/common/constants/crm/feedback-hand-over-blockers";
import type { FeedbackRoundDto } from "@invessiv/common/contracts/crm/feedback-round.dto";
import type { FeedbackRoundSummaryDto } from "@invessiv/common/contracts/crm/feedback-round-summary.dto";

/** A second handover of the same round (double click) sees the round that is already running. */
export type HandOverFeedbackRoundResult =
  | { ok: true; round: FeedbackRoundDto }
  | {
      ok: false;
      code: typeof FeedbackRoundErrorCode.RoundAlreadyActive;
      activeRound: FeedbackRoundSummaryDto;
    }
  | {
      ok: false;
      code: typeof FeedbackRoundErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | {
      ok: false;
      code:
        | Exclude<
            FeedbackHandOverBlocker,
            typeof FeedbackRoundErrorCode.RoundAlreadyActive
          >
        | typeof FeedbackRoundErrorCode.ProjectNotFound;
    };
