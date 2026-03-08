"use client";

import { track } from "@vercel/analytics/react";

export type ConversionEventName =
  | "cta_click"
  | "contact_click"
  | "lead_submit_success";

export type ConversionEventPayload = {
  location?: string;
  variant?: string;
  target?: string;
};

export function trackConversionEvent(
  name: ConversionEventName,
  payload: ConversionEventPayload,
) {
  track(name, payload);
}
