import type { z } from "zod";
import type { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { VersionConflictDto } from "@invessiv/common/contracts/concurrency/version-conflict.dto";
import type { FeedbackRoundItemDto } from "@invessiv/common/contracts/crm/feedback-round-item.dto";

export type SetFeedbackItemResultResult =
  | { ok: true; item: FeedbackRoundItemDto }
  | {
      ok: false;
      code: typeof FeedbackRoundErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<FeedbackRoundItemDto>;
    }
  | {
      ok: false;
      code:
        | typeof FeedbackRoundErrorCode.ItemNotFound
        | typeof FeedbackRoundErrorCode.RoundLocked;
    };
