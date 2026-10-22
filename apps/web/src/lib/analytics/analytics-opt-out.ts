import {
  ANALYTICS_OPT_OUT_QUERY_PARAM,
  ANALYTICS_OPT_OUT_STORAGE_KEY,
  AnalyticsOptOutQueryValue,
} from "@/common/constants/analytics/analytics-tracking-config";

export function syncAnalyticsOptOutFromUrl(search: string) {
  const queryValue = new URLSearchParams(search).get(
    ANALYTICS_OPT_OUT_QUERY_PARAM,
  );

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

export function isAnalyticsOptedOut(): boolean {
  try {
    return window.localStorage.getItem(ANALYTICS_OPT_OUT_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
