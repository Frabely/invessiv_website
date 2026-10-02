import type { BookingProvider } from "../../constants/portal/booking-providers";

/** Where a customer books the onboarding call of a project, once the form went out. */
export interface PortalOnboardingBookingDto {
  /** Display name of the member who answers for the project and offers the calendar. */
  memberDisplayName: string;
  /** The member's `https` booking link; opened in a new tab, never embedded. */
  bookingUrl: string;
  /** Provider derived from the host of the link, named to the customer before the click. */
  provider: BookingProvider;
}
