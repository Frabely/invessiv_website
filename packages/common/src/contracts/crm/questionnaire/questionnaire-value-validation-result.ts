import type { QuestionnaireValueErrorCode } from "../../../constants/crm/questionnaire/questionnaire-value-error-codes";

export type QuestionnaireValueValidationResult =
  { ok: true } | { ok: false; code: QuestionnaireValueErrorCode };
