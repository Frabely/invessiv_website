import type { HoursProjectUsage } from "./hours-project-usage";

/** Distribution of purchased hours, preserving outstanding project allocations and overruns. */
export type HoursBreakdown = HoursProjectUsage & {
  /** Every purchase row, corrections included. */
  purchasedMinutes: number;
  /** Purchased and not assigned to any project. */
  freeMinutes: number;
};
