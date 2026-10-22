"use client";

import { useEffect } from "react";

import { ANALYTICS_DATA_ATTRIBUTE } from "@/common/constants/analytics/analytics-tracking-config";
import {
  isAnalyticsEventName,
  parseAnalyticsPayloadAttribute,
} from "@/common/patterns/analytics/analytics-properties";
import { trackAnalyticsProperties } from "@/lib/analytics/track-analytics-event";

export function AnalyticsClickTracker() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const trackedElement = target.closest<HTMLElement>(
        `[${ANALYTICS_DATA_ATTRIBUTE.Event}]`,
      );
      if (!trackedElement) {
        return;
      }

      const eventName =
        trackedElement.getAttribute(ANALYTICS_DATA_ATTRIBUTE.Event) ??
        undefined;
      if (!isAnalyticsEventName(eventName)) {
        return;
      }

      const properties = parseAnalyticsPayloadAttribute(
        trackedElement.getAttribute(ANALYTICS_DATA_ATTRIBUTE.Payload) ??
          undefined,
      );
      if (!properties) {
        return;
      }

      trackAnalyticsProperties(eventName, properties);
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
