import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { QuestionnaireDefinitionClientApi } from "@/common/contracts/crm/questionnaire/questionnaire-definition-client-api";
import type { QuestionnaireDefinitionEndpoints } from "@/common/contracts/crm/questionnaire/questionnaire-definition-endpoints";
import { questionnaireClientMutation } from "@/client/crm/questionnaire-client-mutation";

const { isBlock, mutate } = questionnaireClientMutation;

/**
 * The writes of the block editor against one owner's endpoints. The catalog passes its paths, a
 * form's blocks pass theirs; the requests, the parsing and the conflict handling stay the same.
 */
function forEndpoints(
  endpoints: QuestionnaireDefinitionEndpoints,
): QuestionnaireDefinitionClientApi {
  return {
    updateBlock: (blockId, request) =>
      mutate(endpoints.block(blockId), HttpMethod.Patch, request, isBlock),
    createField: (blockId, request) =>
      mutate(endpoints.blockFields(blockId), HttpMethod.Post, request, isBlock),
    updateField: (fieldId, request) =>
      mutate(endpoints.field(fieldId), HttpMethod.Patch, request, isBlock),
    deleteField: (fieldId, request) =>
      mutate(endpoints.field(fieldId), HttpMethod.Delete, request, isBlock),
    moveField: (fieldId, request) =>
      mutate(endpoints.fieldMove(fieldId), HttpMethod.Post, request, isBlock),
  };
}

export const questionnaireDefinitionApiService = { forEndpoints } as const;
