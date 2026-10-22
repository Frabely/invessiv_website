import {
  ANALYTICS_OPT_OUT_QUERY_PARAM,
  ANALYTICS_OPT_OUT_STORAGE_KEY,
  AnalyticsOptOutQueryValue,
} from "@/common/constants/analytics/analytics-tracking-config";

function getOptOutQueryValue(search: string) {
  return new URLSearchParams(search).get(ANALYTICS_OPT_OUT_QUERY_PARAM);
}

export function syncAnalyticsOptOutFromUrl(search: string) {
  const queryValue = getOptOutQueryValue(search);

  try {
    if (queryValue === AnalyticsOptOutQueryValue.Off) {
      window.localStorage.setItem(ANALYTICS_OPT_OUT_STORAGE_KEY, "1");
    }
    if (queryValue === AnalyticsOptOutQueryValue.On) {
      window.localStorage.removeItem(ANALYTICS_OPT_OUT_STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
  }
}

// Read-only: the current URL wins over the stored flag; persisting happens in beforeSend.
export function isAnalyticsOptedOut(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const queryValue = getOptOutQueryValue(window.location.search);
  if (queryValue === AnalyticsOptOutQueryValue.Off) {
    return true;
  }
  if (queryValue === AnalyticsOptOutQueryValue.On) {
    return false;
  }
  try {
    return window.localStorage.getItem(ANALYTICS_OPT_OUT_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
