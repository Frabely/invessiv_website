"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/react";
import { ConversionClickTracker } from "@/components/shared/analytics/conversion-click-tracker/conversion-click-tracker";
import { isSupportedLocale } from "@/config/i18n";

const SENSITIVE_ROUTE_PREFIXES = ["/api/", "/workspace"];
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

function pathnameWithoutLocale(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] && isSupportedLocale(segments[0])) {
    return `/${segments.slice(1).join("/")}`;
  }

  return pathname;
}

export function sanitizeAnalyticsUrl(rawUrl: string): string | null {
  const parsedUrl = new URL(rawUrl, window.location.origin);
  const routePathname = pathnameWithoutLocale(parsedUrl.pathname);
  if (
    SENSITIVE_ROUTE_PREFIXES.some((prefix) => routePathname.startsWith(prefix))
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
