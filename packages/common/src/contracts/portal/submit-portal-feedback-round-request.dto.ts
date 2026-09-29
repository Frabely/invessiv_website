/** Submits the saved draft; unsaved changes have to be saved first. */
export interface SubmitPortalFeedbackRoundRequestDto {
  /**
   * Round version the client last read; guarantees the customer submits the draft they saw. A retry
   * by the contact who already submitted succeeds with `alreadySubmitted`, whatever version it sends.
   */
  version: number;
}
