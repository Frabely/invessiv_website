"use client";

import { useEffect } from "react";

import { AnalyticsEventName } from "@/common/constants/analytics/analytics-event-name";
import type { AnalyticsPage } from "@/common/constants/analytics/analytics-page";
import { ANALYTICS_PAGE_ENGAGED_MS } from "@/common/constants/analytics/analytics-tracking-config";
import { trackAnalyticsEvent } from "@/lib/analytics/track-analytics-event";

export function usePageEngagementTracking(page: AnalyticsPage) {
  useEffect(() => {
    let remainingMs = ANALYTICS_PAGE_ENGAGED_MS;
    let startedAt: number | null = null;
    let timer: number | undefined;
    let hasTracked = false;

    const complete = () => {
      if (hasTracked) {
        return;
      }
      hasTracked = true;
      remainingMs = 0;
      startedAt = null;
      window.clearTimeout(timer);
      trackAnalyticsEvent(AnalyticsEventName.PageEngaged, { page });
    };

    const pause = () => {
      if (startedAt === null) {
        return;
      }
      remainingMs = Math.max(0, remainingMs - (performance.now() - startedAt));
      startedAt = null;
      window.clearTimeout(timer);
    };

    const resume = () => {
      if (startedAt !== null || hasTracked) {
        return;
      }
      if (remainingMs <= 0) {
        complete();
        return;
      }
      startedAt = performance.now();
      timer = window.setTimeout(complete, remainingMs);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resume();
      } else {
        pause();
      }
    };

    if (document.visibilityState === "visible") {
      resume();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [page]);
}
