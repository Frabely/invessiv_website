import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { QuestionnaireDefinitionClientApi } from "@/common/contracts/crm/questionnaire/questionnaire-definition-client-api";
import type { QuestionnaireDefinitionEndpoints } from "@/common/contracts/crm/questionnaire/questionnaire-definition-endpoints";
import type { QuestionnaireOwnerErrorCodes } from "@/common/contracts/crm/questionnaire/questionnaire-owner-error-codes";
import { questionnaireClientMutation } from "@/client/crm/questionnaire-client-mutation";

const { isBlock, mutate } = questionnaireClientMutation;

/**
 * The writes of the block editor against one owner's endpoints. The catalog passes its paths, a
 * form's blocks pass theirs plus the codes only a form answers with; the requests, the parsing and
 * the conflict handling stay the same.
 */
function forEndpoints(
  endpoints: QuestionnaireDefinitionEndpoints,
  ownerCodes?: QuestionnaireOwnerErrorCodes,
): QuestionnaireDefinitionClientApi {
  const write = (url: string, method: HttpMethod, request: unknown) =>
    mutate(url, method, request, isBlock, ownerCodes);
  return {
    updateBlock: (blockId, request) =>
      write(endpoints.block(blockId), HttpMethod.Patch, request),
    createField: (blockId, request) =>
      write(endpoints.blockFields(blockId), HttpMethod.Post, request),
    updateField: (fieldId, request) =>
      write(endpoints.field(fieldId), HttpMethod.Patch, request),
    deleteField: (fieldId, request) =>
      write(endpoints.field(fieldId), HttpMethod.Delete, request),
    moveField: (fieldId, request) =>
      write(endpoints.fieldMove(fieldId), HttpMethod.Post, request),
  };
}

export const questionnaireDefinitionApiService = { forEndpoints } as const;
