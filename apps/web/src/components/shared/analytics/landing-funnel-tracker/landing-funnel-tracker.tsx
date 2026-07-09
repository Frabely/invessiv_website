"use client";

import { LANDING_PAGE_SECTION_VIEW_EVENT } from "@/common/constants/analytics/conversion-event-names";
import {
  LANDING_GATED_FUNNEL_SECTION_IDS,
  LANDING_HERO_FUNNEL_SECTION_IDS,
} from "@/config/navigation/landing";
import { useHeroZoomTrackingGate } from "@/hooks/analytics/use-hero-zoom-tracking-gate";
import { useSectionFunnelTracking } from "@/hooks/analytics/use-section-funnel-tracking";

export function LandingFunnelTracker() {
  const zoomHandoffReleased = useHeroZoomTrackingGate();

  useSectionFunnelTracking(
    LANDING_PAGE_SECTION_VIEW_EVENT,
    LANDING_HERO_FUNNEL_SECTION_IDS,
  );
  useSectionFunnelTracking(
    LANDING_PAGE_SECTION_VIEW_EVENT,
    LANDING_GATED_FUNNEL_SECTION_IDS,
    zoomHandoffReleased,
  );

  return null;
}
