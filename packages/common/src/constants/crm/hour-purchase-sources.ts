/** Where a purchase row came from. Later folders add their own source through an additive migration. */
export const HourPurchaseSource = {
  Manual: "manual",
  /** Credited together with a project line item of kind `hours`; never typed in on its own. */
  ProjectLineItem: "project_line_item",
} as const;

export type HourPurchaseSource =
  (typeof HourPurchaseSource)[keyof typeof HourPurchaseSource];

export const HOUR_PURCHASE_SOURCE_VALUES = [
  HourPurchaseSource.Manual,
  HourPurchaseSource.ProjectLineItem,
] as const;
