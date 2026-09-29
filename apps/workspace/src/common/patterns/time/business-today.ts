import { BUSINESS_TIME_ZONE } from "@invessiv/common/constants/crm/business-time-zone";

// `en-CA` formats a date as YYYY-MM-DD, which sorts and compares as plain text.
const BUSINESS_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The calendar day of `now` in the business time zone, as `YYYY-MM-DD`; due dates compare against it. */
export function businessToday(now: Date = new Date()): string {
  return BUSINESS_DATE_FORMAT.format(now);
}
