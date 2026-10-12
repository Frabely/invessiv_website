export const ServiceRequestInboxQueryParam = {
  Filter: "filter",
  Page: "page",
  Request: "serviceRequest",
  Action: "serviceRequestAction",
} as const;
export const ServiceRequestInboxFilter = { Open: "open", All: "all" } as const;
export type ServiceRequestInboxFilter =
  (typeof ServiceRequestInboxFilter)[keyof typeof ServiceRequestInboxFilter];
export const ServiceRequestDialogAction = {
  Accept: "accept",
  Decline: "decline",
} as const;
export type ServiceRequestDialogAction =
  (typeof ServiceRequestDialogAction)[keyof typeof ServiceRequestDialogAction];
