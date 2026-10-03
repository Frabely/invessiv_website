import type { BookingProvider } from "../../constants/portal/booking-providers";

/** A public booking link offered by the member responsible for a project. */
export interface PortalBookingDto {
  /** Display name shown before opening the external calendar. */
  memberDisplayName: string;
  /** HTTPS booking link, opened in a new tab. */
  bookingUrl: string;
  /** Provider derived from the link host. */
  provider: BookingProvider;
}
