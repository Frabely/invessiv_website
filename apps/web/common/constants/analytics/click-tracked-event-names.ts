export const CLICK_TRACKED_EVENT_NAMES = [
  "cta_click",
  "contact_click",
  "calendar_click",
  "faq_exit_services_click",
] as const;

export type ClickTrackedEventName = (typeof CLICK_TRACKED_EVENT_NAMES)[number];
