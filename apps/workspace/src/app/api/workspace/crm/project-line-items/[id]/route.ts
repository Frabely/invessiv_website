import "server-only";

import type { NextRequest } from "next/server";

import { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { UpdateProjectLineItemRequestDto } from "@invessiv/common/contracts/crm/update-project-line-item-request.dto";
import type { UpdateProjectLineItemResult } from "@invessiv/common/contracts/crm/results/update-project-line-item-result";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import { projectLineItemApiError } from "@/lib/workspace/crm/project-line-item-api-error";
import { updateProjectLineItem } from "@/server/workspace/crm/command-handler/update-project-line-item.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withCrmPermission(
    CrmEndpointAccessRule.ProjectLineItemDetail,
    async (authorizedRequest, actor) => {
      const parsed = await readJsonBody(authorizedRequest);
      if (!parsed.ok) {
        return projectLineItemApiError(
          ProjectLineItemErrorCode.ValidationError,
          {
            status: HttpResponseCode.BadRequest,
          },
        );
      }

      let result: UpdateProjectLineItemResult;
      try {
        // The command validates the body against its schema before using it.
        result = await updateProjectLineItem(
          id,
          parsed.body as UpdateProjectLineItemRequestDto,
          actor,
        );
      } catch (error: unknown) {
        logCrmFailure(CrmOperation.UpdateProjectLineItem, error);
        return projectLineItemApiError(ProjectLineItemErrorCode.Internal);
      }

      if (result.ok) {
        return Response.json(
          { projectLineItem: result.projectLineItem },
          { status: HttpResponseCode.Ok },
        );
      }
      if ("conflict" in result) {
        return Response.json(result.conflict, {
          status: HttpResponseCode.Conflict,
        });
      }

      return projectLineItemApiError(result.code, {
        details: "errors" in result ? result.errors : undefined,
      });
    },
  )(request);
}
