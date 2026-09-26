import type { PortalTaskErrorCode } from "@invessiv/common/constants/portal/portal-task-error-codes";

/**
 * Completing is idempotent: a repeated request for an already completed task succeeds with
 * `alreadyDone`, so a double click or a retry never surfaces as an error.
 */
export type CompleteCustomerTaskResult =
  { ok: true; alreadyDone: boolean } | { ok: false; code: PortalTaskErrorCode };
