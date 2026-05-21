import { KpiTrend } from "@/common/constants/dashboard/kpi-trend";
import type { KpiDelta } from "@/common/contracts/dashboard/kpi-delta";

const PERCENT_DECIMAL_PLACES = 1;
const ROUND_FACTOR = 10 ** PERCENT_DECIMAL_PLACES;

export function calculateKpiDelta(current: number, previous: number): KpiDelta {
  if (previous === 0) {
    if (current > 0) {
      return { deltaPercent: null, trend: KpiTrend.Up };
    }
    if (current < 0) {
      return { deltaPercent: null, trend: KpiTrend.Down };
    }
    return { deltaPercent: null, trend: KpiTrend.Flat };
  }

  const rawPercent = ((current - previous) / previous) * 100;
  const deltaPercent = Math.round(rawPercent * ROUND_FACTOR) / ROUND_FACTOR;

  if (current === previous) {
    return { deltaPercent: 0, trend: KpiTrend.Flat };
  }

  return {
    deltaPercent,
    trend: current > previous ? KpiTrend.Up : KpiTrend.Down,
  };
}
