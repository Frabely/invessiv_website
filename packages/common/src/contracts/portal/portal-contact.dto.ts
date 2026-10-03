import type { PortalBookingDto } from "./portal-booking.dto";

export interface PortalContactDto {
  /** Public display name of the customer's assigned workspace contact. */
  displayName: string;
  /** Public contact address; it is never used to authorize portal access. */
  email: string;
  /** Optional meeting link for the contact responsible for the current project. */
  booking: PortalBookingDto | null;
}
