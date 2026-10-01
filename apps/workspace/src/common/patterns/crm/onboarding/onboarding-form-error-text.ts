import {
  ONBOARDING_ERROR_CODE_VALUES,
  type OnboardingErrorCode,
} from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import type { OnboardingFormClientErrorCode } from "@/common/constants/crm/onboarding/onboarding-form-client-error-codes";
import type { OnboardingFormErrorTexts } from "@/common/contracts/crm/onboarding/onboarding-form-error-texts";

function isOnboardingCode(
  code: OnboardingFormClientErrorCode,
): code is OnboardingErrorCode {
  return (ONBOARDING_ERROR_CODE_VALUES as readonly string[]).includes(code);
}

/** Form codes are worded by the onboarding dictionary, kit codes by the kit's; shared codes by the form. */
export function onboardingFormErrorText(
  code: OnboardingFormClientErrorCode,
  texts: OnboardingFormErrorTexts,
): string {
  return isOnboardingCode(code)
    ? texts.onboarding[code]
    : texts.questionnaire[code];
}
