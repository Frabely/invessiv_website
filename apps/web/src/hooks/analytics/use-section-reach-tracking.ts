"use client";

import { useEffect, useRef } from "react";

import { AnalyticsEventName } from "@/common/constants/analytics/analytics-event-name";
import type { AnalyticsPage } from "@/common/constants/analytics/analytics-page";
import {
  ANALYTICS_SECTION_REACH_DWELL_MS,
  ANALYTICS_SECTION_REACH_ROOT_MARGIN,
} from "@/common/constants/analytics/analytics-tracking-config";
import { trackAnalyticsEvent } from "@/lib/analytics/track-analytics-event";

const SECTION_ID_SEPARATOR = "|";
const FULLY_VISIBLE_RATIO = 0.99;

export function useSectionReachTracking(
  page: AnalyticsPage,
  sectionIds: readonly string[],
) {
  // Survives effect re-runs, so a re-render can never report a section twice per page view.
  const trackedRef = useRef<{ ids: Set<string>; page: AnalyticsPage }>({
    ids: new Set(),
    page,
  });
  const sectionKey = sectionIds.join(SECTION_ID_SEPARATOR);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    if (trackedRef.current.page !== page) {
      trackedRef.current = { ids: new Set(), page };
    }
    const trackedIds = trackedRef.current.ids;

    const elements = sectionKey
      .split(SECTION_ID_SEPARATOR)
      .filter((id) => !trackedIds.has(id))
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) {
      return;
    }

    // Tall sections count once they fill the upper viewport band; short sections at the
    // page end can never reach that band, so a fully visible section counts as well.
    const inBandIds = new Set<string>();
    const fullyVisibleIds = new Set<string>();
    const timers = new Map<string, number>();

    const isVisible = (id: string) =>
      inBandIds.has(id) || fullyVisibleIds.has(id);

    const clearTimer = (id: string) => {
      const timer = timers.get(id);
      if (timer !== undefined) {
        window.clearTimeout(timer);
        timers.delete(id);
      }
    };

    const markReached = (id: string) => {
      trackedIds.add(id);
      trackAnalyticsEvent(AnalyticsEventName.SectionReached, {
        page,
        section: id,
      });
      const element = document.getElementById(id);
      if (element) {
        bandObserver.unobserve(element);
        fullObserver.unobserve(element);
      }
    };

    const syncTimer = (id: string) => {
      if (trackedIds.has(id)) {
        return;
      }
      if (!isVisible(id) || document.visibilityState !== "visible") {
        clearTimer(id);
        return;
      }
      if (timers.has(id)) {
        return;
      }
      timers.set(
        id,
        window.setTimeout(() => {
          timers.delete(id);
          if (isVisible(id) && document.visibilityState === "visible") {
            markReached(id);
          }
        }, ANALYTICS_SECTION_REACH_DWELL_MS),
      );
    };

    const bandObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) {
            inBandIds.add(id);
          } else {
            inBandIds.delete(id);
          }
          syncTimer(id);
        }
      },
      { rootMargin: ANALYTICS_SECTION_REACH_ROOT_MARGIN, threshold: 0 },
    );

    const fullObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.intersectionRatio >= FULLY_VISIBLE_RATIO) {
            fullyVisibleIds.add(id);
          } else {
            fullyVisibleIds.delete(id);
          }
          syncTimer(id);
        }
      },
      { threshold: FULLY_VISIBLE_RATIO },
    );

    const handleVisibilityChange = () => {
      for (const element of elements) {
        syncTimer(element.id);
      }
    };

    for (const element of elements) {
      bandObserver.observe(element);
      fullObserver.observe(element);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      bandObserver.disconnect();
      fullObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, [page, sectionKey]);
}
