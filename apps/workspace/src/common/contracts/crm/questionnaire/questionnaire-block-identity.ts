import type { QuestionnaireFormValidationCode } from "@/common/constants/crm/questionnaire/questionnaire-form-validation-codes";

/** What a new block is created from: its first title and its key. */
export type QuestionnaireBlockIdentity = { title: string; key: string };

export type QuestionnaireBlockIdentityErrors = Partial<
  Record<keyof QuestionnaireBlockIdentity, QuestionnaireFormValidationCode>
>;
