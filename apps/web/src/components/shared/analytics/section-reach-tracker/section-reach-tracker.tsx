"use client";

import type { AnalyticsPage } from "@/common/constants/analytics/analytics-page";
import { usePageEngagementTracking } from "@/hooks/analytics/use-page-engagement-tracking";
import { useSectionReachTracking } from "@/hooks/analytics/use-section-reach-tracking";

export type SectionReachTrackerProps = {
  page: AnalyticsPage;
  sectionIds: readonly string[];
};

export function SectionReachTracker({
  page,
  sectionIds,
}: SectionReachTrackerProps) {
  useSectionReachTracking(page, sectionIds);
  usePageEngagementTracking(page);
  return null;
}
