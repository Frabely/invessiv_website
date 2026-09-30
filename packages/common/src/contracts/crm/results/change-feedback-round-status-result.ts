import type { z } from "zod";
import type { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { VersionConflictDto } from "@invessiv/common/contracts/concurrency/version-conflict.dto";
import type { FeedbackRoundDto } from "@invessiv/common/contracts/crm/feedback-round.dto";

export type ChangeFeedbackRoundStatusResult =
  | { ok: true; round: FeedbackRoundDto }
  | {
      ok: false;
      code: typeof FeedbackRoundErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<FeedbackRoundDto>;
    }
  | {
      ok: false;
      code:
        | typeof FeedbackRoundErrorCode.RoundNotFound
        | typeof FeedbackRoundErrorCode.InvalidTransition
        | typeof FeedbackRoundErrorCode.ResultsIncomplete;
    };
