import type { PortalOnboardingBookingDto } from "./portal-onboarding-booking.dto";

/**
 * The onboarding call of a form, once the team has reviewed it. Its mere presence tells the
 * portal that the call is due; before that the customer learns nothing about the review.
 */
export interface PortalOnboardingCallDto {
  /** Where the call is booked; null when nobody offers a link and the team gets in touch. */
  booking: PortalOnboardingBookingDto | null;
}
