export const FunnelInsightKind = {
  Drop: "drop",
  Conversion: "conversion",
} as const;

export type FunnelInsightKind =
  (typeof FunnelInsightKind)[keyof typeof FunnelInsightKind];
