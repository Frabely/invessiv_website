import type { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import type { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";

/** The two dictionaries a failed form request is worded from. */
export type OnboardingFormErrorTexts = {
  onboarding: Readonly<Record<OnboardingErrorCode, string>>;
  questionnaire: Readonly<Record<QuestionnaireErrorCode, string>>;
};
