export const ServiceRequestStatus = {
  Requested: "requested",
  Offered: "offered",
  Accepted: "accepted",
  Declined: "declined",
  Withdrawn: "withdrawn",
} as const;
export type ServiceRequestStatus =
  (typeof ServiceRequestStatus)[keyof typeof ServiceRequestStatus];
export const SERVICE_REQUEST_STATUS_VALUES = [
  ServiceRequestStatus.Requested,
  ServiceRequestStatus.Offered,
  ServiceRequestStatus.Accepted,
  ServiceRequestStatus.Declined,
  ServiceRequestStatus.Withdrawn,
] as const;
export const OPEN_SERVICE_REQUEST_STATUS_VALUES = [
  ServiceRequestStatus.Requested,
  ServiceRequestStatus.Offered,
] as const;
