import {
  ONBOARDING_ERROR_CODE_VALUES,
  type OnboardingErrorCode,
} from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import {
  QUESTIONNAIRE_ERROR_CODE_VALUES,
  type QuestionnaireErrorCode,
} from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";

/** A form endpoint answers with its own codes and, for blocks and fields, with the kit's. */
export type OnboardingFormClientErrorCode =
  OnboardingErrorCode | QuestionnaireErrorCode;

/** Both sets share the validation and the internal code, which appear once here. */
export const ONBOARDING_FORM_CLIENT_ERROR_CODE_VALUES: readonly OnboardingFormClientErrorCode[] =
  [
    ...new Set<OnboardingFormClientErrorCode>([
      ...ONBOARDING_ERROR_CODE_VALUES,
      ...QUESTIONNAIRE_ERROR_CODE_VALUES,
    ]),
  ];
