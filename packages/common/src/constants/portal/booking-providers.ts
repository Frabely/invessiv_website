/**
 * Who runs the calendar behind a booking link. The portal names the provider before the customer
 * opens the link, so an unknown host is still announced, only without a name.
 */
export const BookingProvider = {
  Calendly: "calendly",
  CalCom: "cal_com",
  Other: "other",
} as const;

export type BookingProvider =
  (typeof BookingProvider)[keyof typeof BookingProvider];

export const BOOKING_PROVIDER_VALUES = [
  BookingProvider.Calendly,
  BookingProvider.CalCom,
  BookingProvider.Other,
] as const;

/** Registrable domain of a known provider; its subdomains belong to it as well. */
export const BOOKING_PROVIDERS = {
  "calendly.com": BookingProvider.Calendly,
  "cal.com": BookingProvider.CalCom,
} as const satisfies Record<string, BookingProvider>;

/** Brand names are the same in every language; only the unnamed case is a dictionary text. */
export const BOOKING_PROVIDER_NAMES = {
  [BookingProvider.Calendly]: "Calendly",
  [BookingProvider.CalCom]: "Cal.com",
} as const satisfies Record<
  Exclude<BookingProvider, typeof BookingProvider.Other>,
  string
>;
