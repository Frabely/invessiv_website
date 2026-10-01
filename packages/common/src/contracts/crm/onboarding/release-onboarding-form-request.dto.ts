/** Releases a draft to the portal; from then on the customer can fill it in. */
export interface ReleaseOnboardingFormRequestDto {
  /** Form version the client last read; a stale value answers with a 409 and the current form. */
  expectedVersion: number;
  /** Releases although warnings exist; without it they come back as `ONBOARDING_RELEASE_WARNINGS`. */
  acknowledgeWarnings: boolean;
}
