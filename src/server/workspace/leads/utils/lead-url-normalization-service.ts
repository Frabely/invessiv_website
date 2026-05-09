import { LEAD_TRACKING_PARAMS } from "@/common/constants/leads/tracking/lead-tracking-params";

function isTrackingParam(key: string): boolean {
  return LEAD_TRACKING_PARAMS.has(key) || key.startsWith("utm_");
}

export function normalizeLeadProfileUrl(url: string): string {
  const parsed = new URL(url.trim());

  for (const key of [...parsed.searchParams.keys()]) {
    if (isTrackingParam(key)) {
      parsed.searchParams.delete(key);
    }
  }

  // Remove trailing slashes from non-root paths
  if (parsed.pathname !== "/") {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }

  return parsed.toString();
}
