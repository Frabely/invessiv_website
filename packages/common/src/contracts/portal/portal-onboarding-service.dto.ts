/** A booked service as the customer confirms it in the form: what was agreed, never a price. */
export interface PortalOnboardingServiceDto {
  /** Service title as agreed. */
  title: string;
  /** Service scope; null when the line item had none. */
  description: string | null;
  /** Display order, starting at 0. */
  position: number;
}
