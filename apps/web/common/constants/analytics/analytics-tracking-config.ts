export const ANALYTICS_DATA_ATTRIBUTE = {
  Event: "data-analytics-event",
  Payload: "data-analytics-payload",
} as const;

export const ANALYTICS_OPT_OUT_STORAGE_KEY = "invessiv:analytics-disabled";

export const ANALYTICS_OPT_OUT_QUERY_PARAM = "analytics";

export const AnalyticsOptOutQueryValue = {
  Off: "off",
  On: "on",
} as const;

export const ANALYTICS_ALLOWED_UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export const ANALYTICS_UTM_VALUE_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;

export const ANALYTICS_SECTION_REACH_DWELL_MS = 1000;

// A section counts once its visible part covers at least 35 % of the viewport height.
export const ANALYTICS_SECTION_REACH_ROOT_MARGIN = "0px 0px -35% 0px";

export const ANALYTICS_PAGE_ENGAGED_MS = 30_000;
