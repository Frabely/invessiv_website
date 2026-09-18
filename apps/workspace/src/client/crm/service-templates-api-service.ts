import {
  SERVICE_TEMPLATE_ERROR_CODE_VALUES,
  ServiceTemplateErrorCode,
} from "@invessiv/common/constants/crm/errors/service-template-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { CreateServiceTemplateRequestDto } from "@invessiv/common/contracts/crm/create-service-template-request.dto";
import type { ServiceTemplateDto } from "@invessiv/common/contracts/crm/service-template.dto";
import type { UpdateServiceTemplateRequestDto } from "@invessiv/common/contracts/crm/update-service-template-request.dto";
import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import type { ServiceTemplateMutationClientResult } from "@/common/contracts/crm/service-template-client-results";
import { crmServiceTemplateEndpoint } from "@/common/patterns/crm/crm-api-endpoints";

/** Envelope key both the server response and the client result DTO use for a service template. */
const SERVICE_TEMPLATE_RESULT_KEY = "serviceTemplate";

function isServiceTemplate(value: unknown): value is ServiceTemplateDto {
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
): Promise<ServiceTemplateMutationClientResult> {
  return versionedJsonMutationService.mutateNamed(
    SERVICE_TEMPLATE_RESULT_KEY,
    url,
    method,
    body,
    (payload) =>
      versionedJsonMutationService.isRecord(payload) &&
      isServiceTemplate(payload.serviceTemplate)
        ? payload.serviceTemplate
        : null,
    isServiceTemplate,
    SERVICE_TEMPLATE_ERROR_CODE_VALUES,
    ServiceTemplateErrorCode.Internal,
  );
}

function createServiceTemplate(
  request: CreateServiceTemplateRequestDto,
): Promise<ServiceTemplateMutationClientResult> {
  return mutate(
    WorkspaceApiEndpoint.CrmServiceTemplates,
    HttpMethod.Post,
    request,
  );
}

function updateServiceTemplate(
  serviceTemplateId: string,
  request: UpdateServiceTemplateRequestDto,
): Promise<ServiceTemplateMutationClientResult> {
  return mutate(
    crmServiceTemplateEndpoint(serviceTemplateId),
    HttpMethod.Patch,
    request,
  );
}

export const serviceTemplatesApiService = {
  createServiceTemplate,
  updateServiceTemplate,
} as const;
