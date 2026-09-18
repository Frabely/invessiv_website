import {
  SERVICE_TEMPLATE_ERROR_CODE_VALUES,
  ServiceTemplateErrorCode,
} from "@invessiv/common/constants/crm/errors/service-template-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { CreateServiceTemplateRequestDto } from "@invessiv/common/contracts/crm/create-service-template-request.dto";
import type { ServiceTemplateDto } from "@invessiv/common/contracts/crm/service-template.dto";
import type { UpdateServiceTemplateRequestDto } from "@invessiv/common/contracts/crm/update-service-template-request.dto";
import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import type { ServiceTemplateMutationClientResult } from "@/common/contracts/crm/service-template-client-results";
import { crmServiceTemplateEndpoint } from "@/common/patterns/crm/crm-api-endpoints";

function isServiceTemplate(value: unknown): value is ServiceTemplateDto {
  return (
    versionedJsonMutationService.isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "number"
  );
}

async function mutate(
  url: string,
  method: HttpMethod,
  body: unknown,
): Promise<ServiceTemplateMutationClientResult> {
  const result = await versionedJsonMutationService.mutate(
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
  if (result.ok) {
    return { ok: true, serviceTemplate: result.value };
  }
  if (result.code === ConcurrencyErrorCode.VersionConflict) {
    return {
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: result.current,
    };
  }
  return result;
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
