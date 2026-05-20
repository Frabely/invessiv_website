"use client";

import { track } from "@vercel/analytics/react";

export const CLICK_TRACKED_EVENT_NAMES = [
  "cta_click",
  "contact_click",
  "calendar_click",
] as const;

export type ClickTrackedEventName = (typeof CLICK_TRACKED_EVENT_NAMES)[number];

export const ALLOWED_CONVERSION_EVENT_NAMES = [
  ...CLICK_TRACKED_EVENT_NAMES,
  "lead_submit_success",
  "form_start",
  "form_submit_attempt",
  "form_submit_error",
  "language_switch",
  "theme_switch",
] as const;

export type ConversionEventName =
  (typeof ALLOWED_CONVERSION_EVENT_NAMES)[number];

export const ALLOWED_CONVERSION_PAYLOAD_FIELDS = [
  "location",
  "variant",
  "target",
  "form_id",
  "step",
  "error_type",
] as const;

export type ConversionEventPayload = {
  error_type?: string;
  form_id?: string;
  location?: string;
  step?: string;
  variant?: string;
  target?: string;
};

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
