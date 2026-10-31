import type { OnboardingExportServiceItemDto } from "./onboarding-export-service-item.dto";

/** The booked services of the project as the form shows them. */
export interface OnboardingExportServicesDto {
  /** When the customer confirmed the services; null while unconfirmed. */
  confirmedAt: string | null;
  /** Customer remark on the services; null when left empty. Never changes the services themselves. */
  note: string | null;
  /** A service changed after the confirmation; always false while unconfirmed or once completed. */
  changedSinceConfirmation: boolean;
  /** Current project line items; the frozen snapshot once the form is completed. */
  items: OnboardingExportServiceItemDto[];
}
