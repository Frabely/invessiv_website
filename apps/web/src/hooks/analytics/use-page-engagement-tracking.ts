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

    const pause = () => {
      if (startedAt === null) {
        return;
      }
      remainingMs -= Date.now() - startedAt;
      startedAt = null;
      window.clearTimeout(timer);
    };

    const resume = () => {
      if (startedAt !== null || remainingMs <= 0) {
        return;
      }
      startedAt = Date.now();
      timer = window.setTimeout(() => {
        remainingMs = 0;
        startedAt = null;
        trackAnalyticsEvent(AnalyticsEventName.PageEngaged, { page });
      }, remainingMs);
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
