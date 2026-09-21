import "server-only";

import type { NextRequest } from "next/server";

import { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { CreateProjectLineItemRequestDto } from "@invessiv/common/contracts/crm/create-project-line-item-request.dto";
import type { CreateProjectLineItemResult } from "@invessiv/common/contracts/crm/results/create-project-line-item-result";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import { projectLineItemApiError } from "@/lib/workspace/crm/project-line-item-api-error";
import { createProjectLineItem } from "@/server/workspace/crm/command-handler/create-project-line-item.command-handler";
import { listProjectLineItems } from "@/server/workspace/crm/query-handler/list-project-line-items.query-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { projectId } = await params;

  return withCrmPermission(
    CrmEndpointAccessRule.ProjectLineItems,
    async (_, actor) => {
      let projectLineItems: Awaited<ReturnType<typeof listProjectLineItems>>;
      try {
        projectLineItems = await listProjectLineItems(projectId, actor);
      } catch (error: unknown) {
        logCrmFailure(CrmOperation.ListProjectLineItems, error);
        return projectLineItemApiError(ProjectLineItemErrorCode.Internal);
      }

      // Null is a project out of reach; an empty array is a readable project without services.
      if (projectLineItems === null) {
        return projectLineItemApiError(
          ProjectLineItemErrorCode.ProjectNotFound,
        );
      }

      return Response.json(
        { projectLineItems },
        { status: HttpResponseCode.Ok },
      );
    },
  )(request);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { projectId } = await params;

  return withCrmPermission(
    CrmEndpointAccessRule.ProjectLineItemCreate,
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

      let result: CreateProjectLineItemResult;
      try {
        // The command validates the body against its schema before using it.
        result = await createProjectLineItem(
          projectId,
          parsed.body as CreateProjectLineItemRequestDto,
          actor,
        );
      } catch (error: unknown) {
        logCrmFailure(CrmOperation.CreateProjectLineItem, error);
        return projectLineItemApiError(ProjectLineItemErrorCode.Internal);
      }

      if (!result.ok) {
        return projectLineItemApiError(result.code, {
          details: "errors" in result ? result.errors : undefined,
        });
      }

      return Response.json(
        { projectLineItem: result.projectLineItem },
        { status: HttpResponseCode.Created },
      );
    },
  )(request);
}
