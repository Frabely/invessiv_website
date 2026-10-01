import { QUESTIONNAIRE_KEY_PATTERN_SOURCE } from "@invessiv/common/constants/crm/questionnaire/questionnaire-key-patterns";
import { QuestionnaireFormValidationCode } from "@/common/constants/crm/questionnaire/questionnaire-form-validation-codes";
import type {
  QuestionnaireBlockIdentity,
  QuestionnaireBlockIdentityErrors,
} from "@/common/contracts/crm/questionnaire/questionnaire-block-identity";

const KEY = new RegExp(QUESTIONNAIRE_KEY_PATTERN_SOURCE);

/** Format checks before a block is created; uniqueness of the key is the server's call. */
export function validateQuestionnaireBlockIdentity(
  identity: QuestionnaireBlockIdentity,
): QuestionnaireBlockIdentityErrors {
  const errors: QuestionnaireBlockIdentityErrors = {};
  if (!identity.title.trim())
    errors.title = QuestionnaireFormValidationCode.Required;
  if (!identity.key) errors.key = QuestionnaireFormValidationCode.Required;
  else if (!KEY.test(identity.key))
    errors.key = QuestionnaireFormValidationCode.Key;
  return errors;
}
