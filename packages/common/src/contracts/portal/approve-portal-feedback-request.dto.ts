/** Approves the project in this round; final, there is no way back in v1. */
export interface ApprovePortalFeedbackRequestDto {
  /** Round version the client last read. */
  version: number;
  /** Must be `true`: the customer ticked the confirmation in the approval dialog. */
  confirmFinal: boolean;
}
