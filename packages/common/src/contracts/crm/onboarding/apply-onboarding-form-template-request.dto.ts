/** Applies a catalog template to an empty draft form. */
export interface ApplyOnboardingFormTemplateRequestDto {
  /** The active template to copy into the form. */
  templateId: string;
  /** Form version the client last read; stale values answer with the current form. */
  expectedFormVersion: number;
}
