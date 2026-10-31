/** One booked service. */
export interface OnboardingExportServiceItemDto {
  /** Service title as agreed with the customer. */
  title: string;
  /** Service scope; null when the line item had none. */
  description: string | null;
}
