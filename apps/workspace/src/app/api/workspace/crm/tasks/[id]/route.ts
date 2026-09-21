import "server-only";

import type { NextRequest } from "next/server";

import { TaskErrorCode } from "@invessiv/common/constants/crm/errors/task-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { UpdateTaskResult } from "@invessiv/common/contracts/crm/results/update-task-result";
import type { UpdateTaskRequestDto } from "@invessiv/common/contracts/crm/update-task-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import { taskApiError } from "@/lib/workspace/crm/task-api-error";
import { updateTask } from "@/server/workspace/crm/command-handler/update-task.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withCrmPermission(
    CrmEndpointAccessRule.TaskDetail,
    async (authorizedRequest, actor) => {
      const parsed = await readJsonBody(authorizedRequest);
      if (!parsed.ok) {
        return taskApiError(TaskErrorCode.ValidationError, {
          status: HttpResponseCode.BadRequest,
        });
      }

      let result: UpdateTaskResult;
      try {
        // The command validates the body against its schema before using it.
        result = await updateTask(
          id,
          parsed.body as UpdateTaskRequestDto,
          actor,
        );
      } catch (error: unknown) {
        logCrmFailure(CrmOperation.UpdateTask, error);
        return taskApiError(TaskErrorCode.Internal);
      }

      if (result.ok) {
        return Response.json(
          { task: result.task },
          { status: HttpResponseCode.Ok },
        );
      }
      if ("conflict" in result) {
        return Response.json(result.conflict, {
          status: HttpResponseCode.Conflict,
        });
      }

      return taskApiError(result.code, {
        details: "errors" in result ? result.errors : undefined,
      });
    },
  )(request);
}
