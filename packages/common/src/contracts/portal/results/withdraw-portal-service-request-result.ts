import type { PortalServiceRequestErrorCode } from "../../../constants/portal/portal-service-request-error-codes";

/** `alreadyWithdrawn` marks a repeated call that wrote nothing. */
export type WithdrawPortalServiceRequestResult =
  | { ok: true; alreadyWithdrawn: boolean }
  | { ok: false; code: PortalServiceRequestErrorCode };
