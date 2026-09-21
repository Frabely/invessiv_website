/** Lifecycle of a service request attached to one project. Only confirmed items are revenue-bearing. */
export const ProjectLineItemStatus = {
  Requested: "requested",
  Approved: "approved",
  Planned: "planned",
  Confirmed: "confirmed",
  Rejected: "rejected",
} as const;

export type ProjectLineItemStatus =
  (typeof ProjectLineItemStatus)[keyof typeof ProjectLineItemStatus];

export const PROJECT_LINE_ITEM_STATUS_VALUES = [
  ProjectLineItemStatus.Requested,
  ProjectLineItemStatus.Approved,
  ProjectLineItemStatus.Planned,
  ProjectLineItemStatus.Confirmed,
  ProjectLineItemStatus.Rejected,
] as const;
