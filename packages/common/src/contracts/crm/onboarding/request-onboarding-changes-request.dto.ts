/** Hands every block with a question for the customer back to the portal. */
export interface RequestOnboardingChangesRequestDto {
  /** Form version the client last read; a stale value answers with a 409 and the current form. */
  expectedVersion: number;
}
