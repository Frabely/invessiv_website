/** Starts the one onboarding form of a project as a draft. */
export interface StartProjectOnboardingRequestDto {
  /** Active template whose blocks are copied into the form; null starts without blocks. */
  templateId: string | null;
}
