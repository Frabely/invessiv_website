import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { QuestionnaireClientResult } from "@/common/contracts/crm/questionnaire/questionnaire-client-result";

/**
 * The error text key of a failed write. A conflict is handled by adopting the current state; where
 * a caller has nothing to adopt (creating), it can only be a server error.
 */
export function questionnaireFailureCode<T>(
  result: Exclude<QuestionnaireClientResult<T>, { ok: true }>,
): QuestionnaireErrorCode {
  return result.code === ConcurrencyErrorCode.VersionConflict
    ? QuestionnaireErrorCode.Internal
    : result.code;
}
