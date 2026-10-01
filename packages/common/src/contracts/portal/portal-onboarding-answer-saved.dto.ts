/** Answer of an autosave; feeds the status line of the form. */
export interface PortalOnboardingAnswerSavedDto {
  /** When the slot was written. */
  savedAt: string;
  /** Contact who saved; null once the membership has no person name anymore. */
  savedByName: string | null;
}
