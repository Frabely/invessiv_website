import type { KpiTrend } from "@/common/constants/dashboard/kpi-trend";

export type KpiDelta = {
  deltaPercent: number | null;
  trend: KpiTrend;
};
