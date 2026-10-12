import type { PortalServiceRequestErrorCode } from "../../../constants/portal/portal-service-request-error-codes";

/** The id stays on the server side of the route; the portal reloads its dashboard. */
export type CreatePortalServiceRequestResult =
  | { ok: true; requestId: string }
  | { ok: false; code: PortalServiceRequestErrorCode };
