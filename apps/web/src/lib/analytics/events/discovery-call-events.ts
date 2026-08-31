"use client";

import { trackConversionEvent } from "@/lib/analytics/conversion-events";

export function trackDiscoveryCallCalendarClick(analyticsLocation: string) {
  trackConversionEvent("calendar_click", {
    form_id: "discovery_call",
    location: analyticsLocation,
    target: "calendly",
    variant: "primary",
  });
}
