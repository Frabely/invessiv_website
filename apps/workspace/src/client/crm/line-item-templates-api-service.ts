import {
  LINE_ITEM_TEMPLATE_ERROR_CODE_VALUES,
  LineItemTemplateErrorCode,
} from "@invessiv/common/constants/crm/errors/line-item-template-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { CreateLineItemTemplateRequestDto } from "@invessiv/common/contracts/crm/create-line-item-template-request.dto";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import type { UpdateLineItemTemplateRequestDto } from "@invessiv/common/contracts/crm/update-line-item-template-request.dto";
import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import type { LineItemTemplateMutationClientResult } from "@/common/contracts/crm/line-item-template-client-results";
import { crmLineItemTemplateEndpoint } from "@/common/patterns/crm/crm-api-endpoints";

/** Envelope key both the server response and the client result DTO use for a line item template. */
const LINE_ITEM_TEMPLATE_RESULT_KEY = "lineItemTemplate";

function isLineItemTemplate(value: unknown): value is LineItemTemplateDto {
  return (
    versionedJsonMutationService.isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "number"
  );
}

function mutate(
  url: string,
  method: HttpMethod,
  body: unknown,
): Promise<LineItemTemplateMutationClientResult> {
  return versionedJsonMutationService.mutateNamed(
    LINE_ITEM_TEMPLATE_RESULT_KEY,
    url,
    method,
    body,
    (payload) =>
      versionedJsonMutationService.isRecord(payload) &&
      isLineItemTemplate(payload.lineItemTemplate)
        ? payload.lineItemTemplate
        : null,
    isLineItemTemplate,
    LINE_ITEM_TEMPLATE_ERROR_CODE_VALUES,
    LineItemTemplateErrorCode.Internal,
  );
}

function createLineItemTemplate(
  request: CreateLineItemTemplateRequestDto,
): Promise<LineItemTemplateMutationClientResult> {
  return mutate(
    WorkspaceApiEndpoint.CrmLineItemTemplates,
    HttpMethod.Post,
    request,
  );
}

function updateLineItemTemplate(
  lineItemTemplateId: string,
  request: UpdateLineItemTemplateRequestDto,
): Promise<LineItemTemplateMutationClientResult> {
  return mutate(
    crmLineItemTemplateEndpoint(lineItemTemplateId),
    HttpMethod.Patch,
    request,
  );
}

export const lineItemTemplatesApiService = {
  createLineItemTemplate,
  updateLineItemTemplate,
} as const;
