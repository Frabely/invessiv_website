import "server-only";

import type { NextRequest } from "next/server";

import { TaskErrorCode } from "@invessiv/common/constants/crm/errors/task-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { CreateTaskRequestDto } from "@invessiv/common/contracts/crm/create-task-request.dto";
import type { CreateTaskResult } from "@invessiv/common/contracts/crm/results/create-task-result";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import { taskApiError } from "@/lib/workspace/crm/task-api-error";
import { createTask } from "@/server/workspace/crm/command-handler/create-task.command-handler";
import { listProjectTasks } from "@/server/workspace/crm/query-handler/list-project-tasks.query-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { projectId } = await params;

  return withCrmPermission(CrmEndpointAccessRule.Tasks, async (_, actor) => {
    let tasks: Awaited<ReturnType<typeof listProjectTasks>>;
    try {
      tasks = await listProjectTasks(projectId, actor);
    } catch (error: unknown) {
      logCrmFailure(CrmOperation.ListTasks, error);
      return taskApiError(TaskErrorCode.Internal);
    }

    // Null is a project out of reach; an empty array is a readable project without tasks.
    if (tasks === null) {
      return taskApiError(TaskErrorCode.ProjectNotFound);
    }

    return Response.json({ tasks }, { status: HttpResponseCode.Ok });
  })(request);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { projectId } = await params;

  return withCrmPermission(
    CrmEndpointAccessRule.TaskCreate,
    async (authorizedRequest, actor) => {
      const parsed = await readJsonBody(authorizedRequest);
      if (!parsed.ok) {
        return taskApiError(TaskErrorCode.ValidationError, {
          status: HttpResponseCode.BadRequest,
        });
      }

      let result: CreateTaskResult;
      try {
        // The command validates the body against its schema before using it.
        result = await createTask(
          projectId,
          parsed.body as CreateTaskRequestDto,
          actor,
        );
      } catch (error: unknown) {
        logCrmFailure(CrmOperation.CreateTask, error);
        return taskApiError(TaskErrorCode.Internal);
      }

      if (!result.ok) {
        return taskApiError(result.code, {
          details: "errors" in result ? result.errors : undefined,
        });
      }

      return Response.json(
        { task: result.task },
        { status: HttpResponseCode.Created },
      );
    },
  )(request);
}
