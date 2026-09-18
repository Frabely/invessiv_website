import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ServiceTemplateErrorCode } from "@invessiv/common/constants/crm/errors/service-template-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { CreateServiceTemplateRequestDto } from "@invessiv/common/contracts/crm/create-service-template-request.dto";
import type { CreateServiceTemplateResult } from "@invessiv/common/contracts/crm/results/create-service-template-result";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { ServiceTemplateListQueryParam } from "@/common/constants/crm/list/service-template-list-query-params";
import { withPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import { serviceTemplateApiError } from "@/lib/workspace/crm/service-template-api-error";
import { createServiceTemplate } from "@/server/workspace/crm/command-handler/create-service-template.command-handler";
import { listServiceTemplates } from "@/server/workspace/crm/query-handler/list-service-templates.query-handler";

export const runtime = "nodejs";

export const GET = withPermission(Permission.ServicesRead, async (request) => {
  try {
    const searchParams = new URL(request.url).searchParams;
    const includeArchived =
      searchParams.get(ServiceTemplateListQueryParam.IncludeArchived) ===
      "true";
    const result = await listServiceTemplates({ includeArchived });
    return Response.json(result, { status: HttpResponseCode.Ok });
  } catch (error: unknown) {
    logCrmFailure(CrmOperation.ListServiceTemplates, error);
    return serviceTemplateApiError(ServiceTemplateErrorCode.Internal);
  }
});

export const POST = withPermission(
  Permission.ServicesWrite,
  async (request) => {
    const parsed = await readJsonBody(request);
    if (!parsed.ok) {
      return serviceTemplateApiError(ServiceTemplateErrorCode.ValidationError, {
        status: HttpResponseCode.BadRequest,
      });
    }

    let result: CreateServiceTemplateResult;
    try {
      // The command validates the body against its schema before using it.
      result = await createServiceTemplate(
        parsed.body as CreateServiceTemplateRequestDto,
      );
    } catch (error: unknown) {
      logCrmFailure(CrmOperation.CreateServiceTemplate, error);
      return serviceTemplateApiError(ServiceTemplateErrorCode.Internal);
    }

    if (!result.ok) {
      return serviceTemplateApiError(result.code, { details: result.errors });
    }

    return Response.json(
      { serviceTemplate: result.serviceTemplate },
      { status: HttpResponseCode.Created },
    );
  },
);
