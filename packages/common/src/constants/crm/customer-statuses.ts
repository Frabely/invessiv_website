export const CustomerStatus = {
  Active: "active",
  Paused: "paused",
  Archived: "archived",
} as const;

export type CustomerStatus =
  (typeof CustomerStatus)[keyof typeof CustomerStatus];

export const CUSTOMER_STATUS_VALUES = [
  CustomerStatus.Active,
  CustomerStatus.Paused,
  CustomerStatus.Archived,
] as const;

/** Statuses visible in lists by default. Archived rows are shown only on request. */
export const CUSTOMER_ACTIVE_STATUS_VALUES = [
  CustomerStatus.Active,
  CustomerStatus.Paused,
] as const;
