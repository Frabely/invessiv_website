import {
  BOOKING_PROVIDERS,
  BookingProvider,
} from "../../constants/portal/booking-providers";

/**
 * Derives the provider from the host of a booking link. Only the host itself or a subdomain of a
 * known domain counts: `calendly.com.example.org` and `notcalendly.com` are someone else.
 */
export function resolveBookingProvider(bookingUrl: string): BookingProvider {
  if (!URL.canParse(bookingUrl)) {
    return BookingProvider.Other;
  }
  // A fully qualified host may end with a dot.
  const host = new URL(bookingUrl).hostname.toLowerCase().replace(/\.$/, "");
  for (const [domain, provider] of Object.entries(BOOKING_PROVIDERS)) {
    if (host === domain || host.endsWith(`.${domain}`)) {
      return provider;
    }
  }
  return BookingProvider.Other;
}
