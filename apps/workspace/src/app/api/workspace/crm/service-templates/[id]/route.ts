import "server-only";

import type { NextRequest } from "next/server";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ServiceTemplateErrorCode } from "@invessiv/common/constants/crm/errors/service-template-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { UpdateServiceTemplateRequestDto } from "@invessiv/common/contracts/crm/update-service-template-request.dto";
import type { UpdateServiceTemplateResult } from "@invessiv/common/contracts/crm/results/update-service-template-result";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import { serviceTemplateApiError } from "@/lib/workspace/crm/service-template-api-error";
import { updateServiceTemplate } from "@/server/workspace/crm/command-handler/update-service-template.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withPermission(Permission.ServicesWrite, async (req) => {
    const parsed = await readJsonBody(req);
    if (!parsed.ok) {
      return serviceTemplateApiError(ServiceTemplateErrorCode.ValidationError, {
        status: HttpResponseCode.BadRequest,
      });
    }

    let result: UpdateServiceTemplateResult;
    try {
      // The command validates the body against its schema before using it.
      result = await updateServiceTemplate(
        id,
        parsed.body as UpdateServiceTemplateRequestDto,
      );
    } catch (error: unknown) {
      logCrmFailure(CrmOperation.UpdateServiceTemplate, error);
      return serviceTemplateApiError(ServiceTemplateErrorCode.Internal);
    }

    if (result.ok) {
      return Response.json(
        { serviceTemplate: result.serviceTemplate },
        { status: HttpResponseCode.Ok },
      );
    }
    if ("conflict" in result) {
      return Response.json(result.conflict, {
        status: HttpResponseCode.Conflict,
      });
    }

    return serviceTemplateApiError(result.code, {
      details: "errors" in result ? result.errors : undefined,
    });
  })(request);
}
