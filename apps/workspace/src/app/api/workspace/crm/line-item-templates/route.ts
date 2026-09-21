import "server-only";

import { LineItemTemplateErrorCode } from "@invessiv/common/constants/crm/errors/line-item-template-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { CreateLineItemTemplateRequestDto } from "@invessiv/common/contracts/crm/create-line-item-template-request.dto";
import type { CreateLineItemTemplateResult } from "@invessiv/common/contracts/crm/results/create-line-item-template-result";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { LineItemTemplateListQueryParam } from "@/common/constants/crm/list/line-item-template-list-query-params";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import { lineItemTemplateApiError } from "@/lib/workspace/crm/line-item-template-api-error";
import { createLineItemTemplate } from "@/server/workspace/crm/command-handler/create-line-item-template.command-handler";
import { listLineItemTemplates } from "@/server/workspace/crm/query-handler/list-line-item-templates.query-handler";

export const runtime = "nodejs";

export const GET = withCrmPermission(
  CrmEndpointAccessRule.LineItemTemplates,
  async (request) => {
    try {
      const searchParams = new URL(request.url).searchParams;
      const includeArchived =
        searchParams.get(LineItemTemplateListQueryParam.IncludeArchived) ===
        "true";
      const result = await listLineItemTemplates({ includeArchived });
      return Response.json(result, { status: HttpResponseCode.Ok });
    } catch (error: unknown) {
      logCrmFailure(CrmOperation.ListLineItemTemplates, error);
      return lineItemTemplateApiError(LineItemTemplateErrorCode.Internal);
    }
  },
);

export const POST = withCrmPermission(
  CrmEndpointAccessRule.LineItemTemplateCreate,
  async (request) => {
    const parsed = await readJsonBody(request);
    if (!parsed.ok) {
      return lineItemTemplateApiError(
        LineItemTemplateErrorCode.ValidationError,
        {
          status: HttpResponseCode.BadRequest,
        },
      );
    }

    let result: CreateLineItemTemplateResult;
    try {
      // The command validates the body against its schema before using it.
      result = await createLineItemTemplate(
        parsed.body as CreateLineItemTemplateRequestDto,
      );
    } catch (error: unknown) {
      logCrmFailure(CrmOperation.CreateLineItemTemplate, error);
      return lineItemTemplateApiError(LineItemTemplateErrorCode.Internal);
    }

    if (!result.ok) {
      return lineItemTemplateApiError(result.code, { details: result.errors });
    }

    return Response.json(
      { lineItemTemplate: result.lineItemTemplate },
      { status: HttpResponseCode.Created },
    );
  },
);
