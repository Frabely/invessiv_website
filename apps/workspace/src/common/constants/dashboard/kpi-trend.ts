export const KpiTrend = {
  Up: "up",
  Down: "down",
  Flat: "flat",
} as const;

export type KpiTrend = (typeof KpiTrend)[keyof typeof KpiTrend];

export const KPI_TREND_VALUES = [
  KpiTrend.Up,
  KpiTrend.Down,
  KpiTrend.Flat,
] as const;
