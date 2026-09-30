/** A booked service as the form shows it: live project line items until completion, then the snapshot. */
export interface OnboardingFormServiceDto {
  /** Project line item the entry stems from; null once that line item was deleted after the snapshot. */
  projectLineItemId: string | null;
  /** Service title as agreed. */
  title: string;
  /** Service scope; null when the line item had none. */
  description: string | null;
  /** Display order, starting at 0. */
  position: number;
}
