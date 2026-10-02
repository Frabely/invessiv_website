/** Why a booking link is not accepted; the server schema and the dialogs name the same reasons. */
export const BookingUrlIssue = {
  Invalid: "invalid",
  NotHttps: "not_https",
  TooLong: "too_long",
} as const;

export type BookingUrlIssue =
  (typeof BookingUrlIssue)[keyof typeof BookingUrlIssue];

export const BOOKING_URL_ISSUE_VALUES = [
  BookingUrlIssue.Invalid,
  BookingUrlIssue.NotHttps,
  BookingUrlIssue.TooLong,
] as const;
