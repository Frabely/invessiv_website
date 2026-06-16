"use client";

import { LANDING_PAGE_SECTION_VIEW_EVENT } from "@/common/constants/analytics/conversion-event-names";
import { LANDING_FUNNEL_SECTION_IDS } from "@/config/navigation/landing";
import { useSectionFunnelTracking } from "@/hooks/analytics/use-section-funnel-tracking";

export function LandingFunnelTracker() {
  useSectionFunnelTracking(
    LANDING_PAGE_SECTION_VIEW_EVENT,
    LANDING_FUNNEL_SECTION_IDS,
  );
  return null;
}
