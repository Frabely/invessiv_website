import type { KpiTrend } from "@/common/constants/dashboard/kpi-trend";

export type KpiCardComparison = {
  trend: KpiTrend;
  formattedDelta: string;
  description: string;
};
