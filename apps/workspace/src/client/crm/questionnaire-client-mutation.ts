import {
  QUESTIONNAIRE_ERROR_CODE_VALUES,
  QuestionnaireErrorCode,
} from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import type { QuestionnaireClientResult } from "@/common/contracts/crm/questionnaire/questionnaire-client-result";

const { isRecord } = versionedJsonMutationService;

function isBlock(value: unknown): value is QuestionnaireBlockDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "number" &&
    Array.isArray(value.fields)
  );
}

/** One versioned write whose answer is `isValue`; a conflict carries the current state. */
function mutate<T>(
  url: string,
  method: HttpMethod,
  body: unknown,
  isValue: (value: unknown) => value is T,
): Promise<QuestionnaireClientResult<T>> {
  return versionedJsonMutationService.mutate(
    url,
    method,
    body,
    (payload) => (isValue(payload) ? payload : null),
    isValue,
    QUESTIONNAIRE_ERROR_CODE_VALUES,
    QuestionnaireErrorCode.Internal,
  );
}

export const questionnaireClientMutation = { isBlock, mutate } as const;
