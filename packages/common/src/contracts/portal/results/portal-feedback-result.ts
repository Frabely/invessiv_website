import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { VersionConflictDto } from "@invessiv/common/contracts/concurrency/version-conflict.dto";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";

/** Portal command result; conflicts carry the round by default or the explicitly named entity. */
export type PortalFeedbackResult<T, TConflict = PortalFeedbackRoundDto> =
  | { ok: true; value: T }
  | {
      ok: false;
      code: typeof PortalFeedbackErrorCode.ClarificationNotOpen;
      current: TConflict;
    }
  | {
      ok: false;
      code: typeof PortalFeedbackErrorCode.ItemTextRequired;
      itemIds: string[];
    }
  | {
      ok: false;
      code: Exclude<
        PortalFeedbackErrorCode,
        | typeof PortalFeedbackErrorCode.ItemTextRequired
        | typeof PortalFeedbackErrorCode.ClarificationNotOpen
      >;
    }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<TConflict>;
    };
