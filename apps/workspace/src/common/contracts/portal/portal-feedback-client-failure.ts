import type { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";

/** A refused portal feedback command as the client reads it. */
export type PortalFeedbackClientFailure =
  | {
      ok: false;
      code: typeof PortalFeedbackErrorCode.ItemTextRequired;
      /** Items the server found without text, so the sheet can mark exactly them. */
      itemIds: string[];
    }
  | {
      ok: false;
      code: Exclude<
        PortalFeedbackErrorCode,
        typeof PortalFeedbackErrorCode.ItemTextRequired
      >;
    };
