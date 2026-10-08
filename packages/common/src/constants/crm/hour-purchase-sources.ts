/** Where a purchase row came from. Later folders add their own source through an additive migration. */
export const HourPurchaseSource = {
  Manual: "manual",
} as const;

export type HourPurchaseSource =
  (typeof HourPurchaseSource)[keyof typeof HourPurchaseSource];

export const HOUR_PURCHASE_SOURCE_VALUES = [HourPurchaseSource.Manual] as const;
