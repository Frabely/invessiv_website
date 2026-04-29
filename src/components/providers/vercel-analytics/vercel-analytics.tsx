"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/react";
import { ConversionClickTracker } from "@/components/shared/analytics/conversion-click-tracker/conversion-click-tracker";

const SENSITIVE_ROUTE_PREFIXES = ["/api/", "/admin", "/dashboard", "/preview"];
const SENSITIVE_QUERY_PARTS = [
  "token",
  "email",
  "phone",
  "code",
  "otp",
  "password",
  "auth",
  "session",
  "sig",
  "signature",
];

export function sanitizeAnalyticsUrl(rawUrl: string): string | null {
  const parsedUrl = new URL(rawUrl, window.location.origin);
  if (
    SENSITIVE_ROUTE_PREFIXES.some((prefix) =>
      parsedUrl.pathname.startsWith(prefix),
    )
  ) {
    return null;
  }

  const hasSensitiveQueryKey = Array.from(parsedUrl.searchParams.keys()).some(
    (key) =>
      SENSITIVE_QUERY_PARTS.some((part) => key.toLowerCase().includes(part)),
  );
  if (hasSensitiveQueryKey) {
    return null;
  }

  parsedUrl.search = "";
  parsedUrl.hash = "";
  return parsedUrl.toString();
}

export function handleBeforeSend(
  event: BeforeSendEvent,
): BeforeSendEvent | null {
  const sanitizedUrl = sanitizeAnalyticsUrl(event.url);
  if (!sanitizedUrl) {
    return null;
  }
  return {
    ...event,
    url: sanitizedUrl,
  };
}

export function VercelAnalytics() {
  return (
    <>
      <Analytics beforeSend={handleBeforeSend} />
      <ConversionClickTracker />
    </>
  );
}
