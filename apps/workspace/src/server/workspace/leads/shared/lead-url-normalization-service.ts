import { LEAD_TRACKING_PARAMS } from "@invessiv/common/constants/leads/tracking/lead-tracking-params";

function isTrackingParam(key: string): boolean {
  return LEAD_TRACKING_PARAMS.has(key) || key.startsWith("utm_");
}

export function normalizeLeadProfileUrl(url: string): string {
  const parsed = new URL(url.trim());

  parsed.protocol = "https:";
  parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

  const remainingParams: Array<[string, string]> = [];
  for (const [key, value] of parsed.searchParams.entries()) {
    if (!isTrackingParam(key)) {
      remainingParams.push([key, value]);
    }
  }
  remainingParams.sort(([a], [b]) => a.localeCompare(b));

  parsed.search = "";
  for (const [key, value] of remainingParams) {
    parsed.searchParams.append(key, value);
  }

  // Remove trailing slashes from non-root paths
  if (parsed.pathname !== "/") {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }

  return parsed.toString();
}
