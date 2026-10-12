/** Path segments of the portal service request routes below `/api/portal/[customerId]`. */
export const PortalServiceRequestApiPath = {
  ServiceRequests: "service-requests",
  Withdraw: "withdraw",
} as const;

export type PortalServiceRequestApiPath =
  (typeof PortalServiceRequestApiPath)[keyof typeof PortalServiceRequestApiPath];
