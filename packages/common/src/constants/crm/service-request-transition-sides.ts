export const ServiceRequestTransitionSide = {
  Internal: "internal",
  Customer: "customer",
} as const;
export type ServiceRequestTransitionSide =
  (typeof ServiceRequestTransitionSide)[keyof typeof ServiceRequestTransitionSide];
export const SERVICE_REQUEST_TRANSITION_SIDE_VALUES = [
  ServiceRequestTransitionSide.Internal,
  ServiceRequestTransitionSide.Customer,
] as const;
