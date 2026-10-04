import type { PortalTaskErrorCode } from "@invessiv/common/constants/portal/portal-task-error-codes";

/**
 * Reopening is idempotent: a repeated request for a task that is open again succeeds with
 * `alreadyOpen`. A task the team completed answers `not_found`, like every other miss.
 */
export type ReopenCustomerTaskResult =
  { ok: true; alreadyOpen: boolean } | { ok: false; code: PortalTaskErrorCode };
