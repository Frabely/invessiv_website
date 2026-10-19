import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { PortalFeedbackItemDto } from "@invessiv/common/contracts/portal/portal-feedback-item.dto";
import type { PortalFeedbackClientFailure } from "./portal-feedback-client-failure";

/**
 * An answer to a clarification as the client reads it. A stale version and a question that is no
 * longer open both carry the current item, so the point can show it without another request.
 */
export type PortalFeedbackItemClientResult =
  | {
      ok: true;
      /** Null only for a write grant without read access; the page reloads instead. */
      item: PortalFeedbackItemDto | null;
    }
  | {
      ok: false;
      code:
        | typeof ConcurrencyErrorCode.VersionConflict
        | typeof PortalFeedbackErrorCode.ClarificationNotOpen;
      current: PortalFeedbackItemDto;
    }
  | PortalFeedbackClientFailure;
