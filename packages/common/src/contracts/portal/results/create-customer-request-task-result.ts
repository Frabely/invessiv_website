import type { PortalTaskErrorCode } from "@invessiv/common/constants/portal/portal-task-error-codes";

/** The new task id stays on the server side of the route; the portal reloads its dashboard. */
export type CreateCustomerRequestTaskResult =
  { ok: true; taskId: string } | { ok: false; code: PortalTaskErrorCode };
