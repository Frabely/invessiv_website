import {
  ANALYTICS_EVENT_NAMES,
  ANALYTICS_MAX_EVENT_PROPERTIES,
  type AnalyticsEventName,
} from "@/common/constants/analytics/analytics-event-name";
import { ANALYTICS_DATA_ATTRIBUTE } from "@/common/constants/analytics/analytics-tracking-config";
import type { AnalyticsAttributes } from "@/common/contracts/analytics/analytics-attributes";
import type {
  AnalyticsEventPayloadMap,
  AnalyticsEventProperties,
} from "@/common/contracts/analytics/analytics-event-payloads";

const MAX_PROPERTY_LENGTH = 255;

export function isAnalyticsEventName(
  value: string | undefined,
): value is AnalyticsEventName {
  return ANALYTICS_EVENT_NAMES.includes(value as AnalyticsEventName);
}

export function sanitizeAnalyticsProperties(
  payload: object,
): AnalyticsEventProperties {
  const properties: AnalyticsEventProperties = {};

  for (const [key, value] of Object.entries(payload)) {
    if (Object.keys(properties).length >= ANALYTICS_MAX_EVENT_PROPERTIES) {
      break;
    }
    if (typeof value !== "string") {
      continue;
    }
    const trimmedValue = value.trim();
    if (
      trimmedValue.length === 0 ||
      trimmedValue.length > MAX_PROPERTY_LENGTH
    ) {
      continue;
    }
    properties[key] = trimmedValue;
  }

  return properties;
}

export function analyticsAttributes<E extends AnalyticsEventName>(
  event: E,
  payload: AnalyticsEventPayloadMap[E],
): AnalyticsAttributes {
  return {
    [ANALYTICS_DATA_ATTRIBUTE.Event]: event,
    [ANALYTICS_DATA_ATTRIBUTE.Payload]: JSON.stringify(payload),
  };
}

export function parseAnalyticsPayloadAttribute(
  rawPayload: string | undefined,
): AnalyticsEventProperties | null {
  if (!rawPayload) {
    return null;
  }

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(rawPayload);
  } catch {
    return null;
  }

  if (
    typeof parsedPayload !== "object" ||
    parsedPayload === null ||
    Array.isArray(parsedPayload)
  ) {
    return null;
  }

  return sanitizeAnalyticsProperties(parsedPayload);
}
