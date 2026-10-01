import type { QuestionnaireFormValidationCode } from "@/common/constants/crm/questionnaire/questionnaire-form-validation-codes";

/** Client check results of the field dialog, one code per invalid control. */
export type QuestionnaireFieldFormErrors = Partial<
  Record<
    "key" | "label" | "maxLength" | "minItems" | "maxItems" | "choices",
    QuestionnaireFormValidationCode
  >
>;
