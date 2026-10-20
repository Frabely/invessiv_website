import type { $ZodIssue } from "zod/v4/core";
import type { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { VersionConflictDto } from "@invessiv/common/contracts/concurrency/version-conflict.dto";
import type { FeedbackRoundItemDto } from "@invessiv/common/contracts/crm/feedback-round-item.dto";

/** Common item response envelope; each command supplies its own business failures. */
export type FeedbackItemCommandResult<TFailure> =
  | { ok: true; item: FeedbackRoundItemDto }
  | {
      ok: false;
      code: typeof FeedbackRoundErrorCode.ValidationError;
      errors: $ZodIssue[];
    }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<FeedbackRoundItemDto>;
    }
  | TFailure;
