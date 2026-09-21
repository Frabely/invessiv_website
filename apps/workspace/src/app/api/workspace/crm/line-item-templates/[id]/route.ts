import "server-only";

import type { NextRequest } from "next/server";

import { LineItemTemplateErrorCode } from "@invessiv/common/constants/crm/errors/line-item-template-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { UpdateLineItemTemplateRequestDto } from "@invessiv/common/contracts/crm/update-line-item-template-request.dto";
import type { UpdateLineItemTemplateResult } from "@invessiv/common/contracts/crm/results/update-line-item-template-result";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import { lineItemTemplateApiError } from "@/lib/workspace/crm/line-item-template-api-error";
import { updateLineItemTemplate } from "@/server/workspace/crm/command-handler/update-line-item-template.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withCrmPermission(
    CrmEndpointAccessRule.LineItemTemplateDetail,
    async (req) => {
      const parsed = await readJsonBody(req);
      if (!parsed.ok) {
        return lineItemTemplateApiError(
          LineItemTemplateErrorCode.ValidationError,
          {
            status: HttpResponseCode.BadRequest,
          },
        );
      }

      let result: UpdateLineItemTemplateResult;
      try {
        // The command validates the body against its schema before using it.
        result = await updateLineItemTemplate(
          id,
          parsed.body as UpdateLineItemTemplateRequestDto,
        );
      } catch (error: unknown) {
        logCrmFailure(CrmOperation.UpdateLineItemTemplate, error);
        return lineItemTemplateApiError(LineItemTemplateErrorCode.Internal);
      }

      if (result.ok) {
        return Response.json(
          { lineItemTemplate: result.lineItemTemplate },
          { status: HttpResponseCode.Ok },
        );
      }
      if ("conflict" in result) {
        return Response.json(result.conflict, {
          status: HttpResponseCode.Conflict,
        });
      }

      return lineItemTemplateApiError(result.code, {
        details: "errors" in result ? result.errors : undefined,
      });
    },
  )(request);
}
