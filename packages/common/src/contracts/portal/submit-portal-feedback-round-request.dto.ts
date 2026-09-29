/** Submits the saved draft; unsaved changes have to be saved first. */
export interface SubmitPortalFeedbackRoundRequestDto {
  /** Round version the client last read; guarantees the customer submits the draft they saw. */
  version: number;
}
