"use client";

import { useEffect, useRef } from "react";

import { type ConversionEventName } from "@/common/constants/analytics/conversion-event-names";
import { type LandingFunnelSectionId } from "@/config/navigation/landing";
import { trackConversionEvent } from "@/lib/analytics/conversion-events";

export function useSectionFunnelTracking(
  eventName: ConversionEventName,
  sectionIds: readonly LandingFunnelSectionId[],
  enabled = true,
) {
  const trackedRef = useRef<Set<string> | null>(null);
  if (trackedRef.current === null) {
    trackedRef.current = new Set();
  }

  useEffect(() => {
    if (!enabled || !("IntersectionObserver" in window)) {
      return;
    }

    const tracked = trackedRef.current;
    if (tracked === null) {
      return;
    }

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          const id = entry.target.id;
          if (tracked.has(id)) {
            continue;
          }

          tracked.add(id);
          trackConversionEvent(eventName, { location: id });
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 0.01 },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [enabled, eventName, sectionIds]);
}
