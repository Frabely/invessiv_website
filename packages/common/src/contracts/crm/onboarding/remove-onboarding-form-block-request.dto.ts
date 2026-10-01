/** Removes a block from a form together with its fields, answers and file links; the files stay. */
export interface RemoveOnboardingFormBlockRequestDto {
  /** Form version the client last read; a stale value answers with a 409 and the current form. */
  expectedFormVersion: number;
}
