import { ProjectLineItemStatus } from "../project-line-item-statuses";

/**
 * Line items the form lists as booked services until completion. A rejected request was never
 * agreed on, so the customer is not asked to confirm it.
 */
export const ONBOARDING_VISIBLE_LINE_ITEM_STATUS_VALUES = [
  ProjectLineItemStatus.Requested,
  ProjectLineItemStatus.Approved,
  ProjectLineItemStatus.Planned,
  ProjectLineItemStatus.Confirmed,
] as const;
