import {
  ANALYTICS_ALLOWED_UTM_PARAMS,
  ANALYTICS_UTM_VALUE_PATTERN,
} from "@/common/constants/analytics/analytics-tracking-config";
import { isSupportedLocale } from "@/config/i18n";

const SENSITIVE_ROUTE_PREFIXES = ["/api/"];
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

function isAllowedUtmParam(key: string): boolean {
  return ANALYTICS_ALLOWED_UTM_PARAMS.some((param) => param === key);
}

function createAllowedUtmSearch(searchParams: URLSearchParams): string {
  const allowedParams = new URLSearchParams();

  for (const [key, value] of searchParams) {
    const normalizedValue = value.trim().toLowerCase();
    if (
      isAllowedUtmParam(key) &&
      ANALYTICS_UTM_VALUE_PATTERN.test(normalizedValue)
    ) {
      allowedParams.set(key, normalizedValue);
    }
  }

  return allowedParams.toString();
}

export function sanitizeAnalyticsUrl(
  rawUrl: string,
  origin: string,
): string | null {
  const parsedUrl = new URL(rawUrl, origin);
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

  parsedUrl.search = createAllowedUtmSearch(parsedUrl.searchParams);
  parsedUrl.hash = "";
  return parsedUrl.toString();
}
