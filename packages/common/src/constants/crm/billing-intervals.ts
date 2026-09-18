export const BillingInterval = {
  Monthly: "monthly",
  Yearly: "yearly",
} as const;

export type BillingInterval =
  (typeof BillingInterval)[keyof typeof BillingInterval];

export const BILLING_INTERVAL_VALUES = [
  BillingInterval.Monthly,
  BillingInterval.Yearly,
] as const;
