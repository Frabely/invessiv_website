"use client";

import { Analytics } from "@vercel/analytics/next";
import { AnalyticsClickTracker } from "@/components/shared/analytics/analytics-click-tracker/analytics-click-tracker";
import { handleAnalyticsBeforeSend } from "@/lib/analytics/analytics-before-send";

export function VercelAnalytics() {
  return (
    <>
      <Analytics beforeSend={handleAnalyticsBeforeSend} />
      <AnalyticsClickTracker />
    </>
  );
}
