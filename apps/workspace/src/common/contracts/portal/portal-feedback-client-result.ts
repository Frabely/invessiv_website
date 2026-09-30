import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import type { PortalFeedbackClientFailure } from "./portal-feedback-client-failure";

/** Save, submit and approval answer with the round; a stale version carries the current one. */
export type PortalFeedbackRoundClientResult =
  | { ok: true; round: PortalFeedbackRoundDto }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: PortalFeedbackRoundDto;
    }
  | PortalFeedbackClientFailure;
