/** Confirms the booked services shown in the form; it never changes the services themselves. */
export interface ConfirmPortalOnboardingServicesRequestDto {
  /** Always true: a confirmation cannot be taken back, only repeated with another remark. */
  confirmed: true;
  /** Remark on the services; null means they fit as shown. A remark must carry text. */
  note: string | null;
}
