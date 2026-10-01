import type { VersionedJsonMutationResult } from "@/common/contracts/client/versioned-json-mutation-result";
import type { OnboardingFormClientErrorCode } from "@/common/constants/crm/onboarding/onboarding-form-client-error-codes";

/** A 409 carries the current form, so the block list adopts it instead of guessing. */
export type OnboardingFormClientResult<T> = VersionedJsonMutationResult<
  T,
  OnboardingFormClientErrorCode
>;
