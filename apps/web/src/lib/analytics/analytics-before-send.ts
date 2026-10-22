import type { BeforeSendEvent } from "@vercel/analytics";

import {
  isAnalyticsOptedOut,
  syncAnalyticsOptOutFromUrl,
} from "@/lib/analytics/analytics-opt-out";
import { sanitizeAnalyticsUrl } from "@/lib/analytics/analytics-url";

export function handleAnalyticsBeforeSend(
  event: BeforeSendEvent,
): BeforeSendEvent | null {
  const parsedUrl = new URL(event.url, window.location.origin);
  syncAnalyticsOptOutFromUrl(parsedUrl.search);
  if (isAnalyticsOptedOut()) {
    return null;
  }

  const sanitizedUrl = sanitizeAnalyticsUrl(event.url, window.location.origin);
  if (!sanitizedUrl) {
    return null;
  }

  return {
    ...event,
    url: sanitizedUrl,
  };
}
