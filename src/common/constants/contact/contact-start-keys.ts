export const CONTACT_START_KEY = {
  Immediately: "immediately",
  LaterFlexible: "later_flexible",
  WithinOneMonth: "within_one_month",
  WithinTwoWeeks: "within_two_weeks",
} as const;

export const CONTACT_START_KEYS = [
  CONTACT_START_KEY.Immediately,
  CONTACT_START_KEY.WithinTwoWeeks,
  CONTACT_START_KEY.WithinOneMonth,
  CONTACT_START_KEY.LaterFlexible,
] as const;

export type ContactStartKey = (typeof CONTACT_START_KEYS)[number];
