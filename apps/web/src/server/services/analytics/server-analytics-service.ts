import "server-only";
import { track } from "@vercel/analytics/server";
import { headers } from "next/headers";
import { after } from "next/server";

import { AnalyticsEventName } from "@/common/constants/analytics/analytics-event-name";
import type { LeadCreatedPayload } from "@/common/contracts/analytics/analytics-event-payloads";
import { sanitizeAnalyticsProperties } from "@/common/patterns/analytics/analytics-properties";
import { sanitizeAnalyticsUrl } from "@/lib/analytics/analytics-url";

const SERVER_ANALYTICS_LOG_PREFIX = "[server-analytics]";

type AnalyticsRequestHeaders = Record<string, string>;

// Vercel needs user agent and IP to attribute the event to the visitor's daily hash;
// the sanitized referer attributes it to the page. Cookies are deliberately not forwarded.
function pickAnalyticsHeaders(
  requestHeaders: Headers,
): AnalyticsRequestHeaders {
  const analyticsHeaders: AnalyticsRequestHeaders = {};
  const userAgent = requestHeaders.get("user-agent");
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const referer = requestHeaders.get("referer");
  const sanitizedReferer = referer
    ? sanitizeAnalyticsUrl(referer, referer)
    : null;

  if (userAgent) {
    analyticsHeaders["user-agent"] = userAgent;
  }
  if (forwardedFor) {
    analyticsHeaders["x-forwarded-for"] = forwardedFor;
  }
  if (sanitizedReferer) {
    analyticsHeaders.referer = sanitizedReferer;
  }
  return analyticsHeaders;
}

async function sendLeadCreated(
  payload: LeadCreatedPayload,
  requestHeaders?: Headers,
) {
  try {
    await track(
      AnalyticsEventName.LeadCreated,
      sanitizeAnalyticsProperties(payload),
      requestHeaders
        ? { headers: pickAnalyticsHeaders(requestHeaders) }
        : undefined,
    );
  } catch (error) {
    console.error(`${SERVER_ANALYTICS_LOG_PREFIX} lead_created failed`, {
      error,
    });
  }
}

// Runs after the response is sent so analytics can never delay or fail a lead.
function trackLeadCreated(payload: LeadCreatedPayload) {
  try {
    after(async () => {
      const requestHeaders = await headers().catch(() => undefined);
      await sendLeadCreated(payload, requestHeaders);
    });
  } catch {
    // Outside a request scope (e.g. scripts/tests) there is no `after` queue.
    void sendLeadCreated(payload);
  }
}

export const serverAnalyticsService = {
  sendLeadCreated,
  trackLeadCreated,
} as const;
