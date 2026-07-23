export const DashboardRangeKind = {
  Bounded: "bounded",
  All: "all",
} as const;

export type DashboardRangeKind =
  (typeof DashboardRangeKind)[keyof typeof DashboardRangeKind];
