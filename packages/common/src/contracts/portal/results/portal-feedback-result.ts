import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { VersionConflictDto } from "@invessiv/common/contracts/concurrency/version-conflict.dto";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";

/** Result of every portal feedback command; a stale version carries the current round. */
export type PortalFeedbackResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      code: typeof PortalFeedbackErrorCode.ItemTextRequired;
      itemIds: string[];
    }
  | {
      ok: false;
      code: Exclude<
        PortalFeedbackErrorCode,
        typeof PortalFeedbackErrorCode.ItemTextRequired
      >;
    }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<PortalFeedbackRoundDto>;
    };
