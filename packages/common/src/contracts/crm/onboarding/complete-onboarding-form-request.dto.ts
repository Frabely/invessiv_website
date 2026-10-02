/** Completes a submitted form; from then on it is read-only for good and its services are frozen. */
export interface CompleteOnboardingFormRequestDto {
  /** Form version the client last read; a stale value answers with a 409 and the current form. */
  expectedVersion: number;
  /** Day the onboarding call took place as `YYYY-MM-DD`; empty or in the future answers `ONBOARDING_CALL_DATE_REQUIRED`. */
  callHeldOn: string;
  /** Moves a project in the `onboarding` phase on to `design`; any other phase stays as it is. */
  advancePhase: boolean;
}
