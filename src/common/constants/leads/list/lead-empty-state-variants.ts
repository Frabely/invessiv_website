export const LeadsEmptyStateVariant = {
  Empty: "empty",
  Filtered: "filtered",
} as const;

export type LeadsEmptyStateVariant =
  (typeof LeadsEmptyStateVariant)[keyof typeof LeadsEmptyStateVariant];
