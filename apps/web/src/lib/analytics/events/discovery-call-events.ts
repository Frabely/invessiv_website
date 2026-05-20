"use client";

import { trackConversionEvent } from "@/lib/analytics/conversion-events";

export function trackDiscoveryCallCalendarClick() {
  trackConversionEvent("calendar_click", {
    form_id: "discovery_call",
    location: "contact",
    target: "calendly",
    variant: "primary",
  });
}
