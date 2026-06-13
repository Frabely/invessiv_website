import { CLICK_TRACKED_EVENT_NAMES } from "@/common/constants/analytics/click-tracked-event-names";

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
