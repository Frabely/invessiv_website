import {
  QUESTIONNAIRE_ERROR_CODE_VALUES,
  QuestionnaireErrorCode,
} from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import type { QuestionnaireClientResult } from "@/common/contracts/crm/questionnaire/questionnaire-client-result";
import type { QuestionnaireOwnerErrorCodes } from "@/common/contracts/crm/questionnaire/questionnaire-owner-error-codes";

const { isRecord } = versionedJsonMutationService;

function isBlock(value: unknown): value is QuestionnaireBlockDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "number" &&
    Array.isArray(value.fields)
  );
}

/**
 * One versioned write whose answer is `isValue`; a conflict carries the current state. An owner
 * of blocks may answer with codes of its own (a form whose structure is locked); `ownerCodes`
 * names the kit code each of them stands for, so the editor only ever sees kit codes.
 */
async function mutate<T>(
  url: string,
  method: HttpMethod,
  body: unknown,
  isValue: (value: unknown) => value is T,
  ownerCodes: QuestionnaireOwnerErrorCodes = {},
): Promise<QuestionnaireClientResult<T>> {
  const result = await versionedJsonMutationService.mutate<T, string>(
    url,
    method,
    body,
    (payload) => (isValue(payload) ? payload : null),
    isValue,
    [...QUESTIONNAIRE_ERROR_CODE_VALUES, ...Object.keys(ownerCodes)],
    QuestionnaireErrorCode.Internal,
  );
  if (result.ok || "current" in result) return result;
  return {
    ok: false,
    code:
      ownerCodes[result.code] ??
      QUESTIONNAIRE_ERROR_CODE_VALUES.find((code) => code === result.code) ??
      QuestionnaireErrorCode.Internal,
  };
}

export const questionnaireClientMutation = { isBlock, mutate } as const;
