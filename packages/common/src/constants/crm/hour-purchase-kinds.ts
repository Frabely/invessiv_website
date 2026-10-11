export const HourPurchaseKind = {
  Purchase: "purchase",
  Correction: "correction",
} as const;

export type HourPurchaseKind =
  (typeof HourPurchaseKind)[keyof typeof HourPurchaseKind];

export const HOUR_PURCHASE_KIND_VALUES = [
  HourPurchaseKind.Purchase,
  HourPurchaseKind.Correction,
] as const;
