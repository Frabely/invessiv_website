"use client";

import { track } from "@vercel/analytics/react";

import {
  CLICK_TRACKED_EVENT_NAMES,
  type ClickTrackedEventName,
} from "@/common/constants/analytics/click-tracked-event-names";
import {
  ALLOWED_CONVERSION_EVENT_NAMES,
  type ConversionEventName,
} from "@/common/constants/analytics/conversion-event-names";
import { ALLOWED_CONVERSION_PAYLOAD_FIELDS } from "@/common/constants/analytics/conversion-payload-fields";
import type { ConversionEventPayload } from "@/common/contracts/analytics/conversion-event-payload";

export function sanitizeConversionEventPayload(
  payload: ConversionEventPayload,
): ConversionEventPayload {
  return ALLOWED_CONVERSION_PAYLOAD_FIELDS.reduce<ConversionEventPayload>(
    (sanitizedPayload, field) => {
      const value = payload[field];
      if (typeof value === "string" && value.trim().length > 0) {
        sanitizedPayload[field] = value;
      }
      return sanitizedPayload;
    },
    {},
  );
}

export function isConversionEventName(
  value: string | undefined,
): value is ConversionEventName {
  return ALLOWED_CONVERSION_EVENT_NAMES.includes(value as ConversionEventName);
}

export function isClickTrackedEventName(
  value: ConversionEventName,
): value is ClickTrackedEventName {
  return CLICK_TRACKED_EVENT_NAMES.includes(value as ClickTrackedEventName);
}

export function trackConversionEvent(
  name: ConversionEventName,
  payload: ConversionEventPayload,
) {
  track(name, sanitizeConversionEventPayload(payload));
}
