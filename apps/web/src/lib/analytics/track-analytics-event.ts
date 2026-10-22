"use client";

import { track } from "@vercel/analytics";

import type { AnalyticsEventName } from "@/common/constants/analytics/analytics-event-name";
import type {
  AnalyticsEventPayloadMap,
  AnalyticsEventProperties,
} from "@/common/contracts/analytics/analytics-event-payloads";
import { sanitizeAnalyticsProperties } from "@/common/patterns/analytics/analytics-properties";

export function trackAnalyticsEvent<E extends AnalyticsEventName>(
  name: E,
  payload: AnalyticsEventPayloadMap[E],
) {
  track(name, sanitizeAnalyticsProperties(payload));
}

export function trackAnalyticsProperties(
  name: AnalyticsEventName,
  properties: AnalyticsEventProperties,
) {
  track(name, sanitizeAnalyticsProperties(properties));
}
