import {
  TASK_ERROR_CODE_VALUES,
  TaskErrorCode,
} from "@invessiv/common/constants/crm/errors/task-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { ChangeTaskStatusRequestDto } from "@invessiv/common/contracts/crm/change-task-status-request.dto";
import type { CreateTaskRequestDto } from "@invessiv/common/contracts/crm/create-task-request.dto";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import type { UpdateTaskRequestDto } from "@invessiv/common/contracts/crm/update-task-request.dto";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import type { TaskMutationClientResult } from "@/common/contracts/crm/task-client-results";
import {
  crmProjectTasksEndpoint,
  crmTaskEndpoint,
  crmTaskStatusEndpoint,
} from "@/common/patterns/crm/crm-api-endpoints";

/** Envelope key both the server response and the client result DTO use for a task. */
const TASK_RESULT_KEY = "task";

function isTask(value: unknown): value is TaskDto {
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
): Promise<TaskMutationClientResult> {
  return versionedJsonMutationService.mutateNamed(
    TASK_RESULT_KEY,
    url,
    method,
    body,
    (payload) =>
      versionedJsonMutationService.isRecord(payload) && isTask(payload.task)
        ? payload.task
        : null,
    isTask,
    TASK_ERROR_CODE_VALUES,
    TaskErrorCode.Internal,
  );
}

function createTask(
  projectId: string,
  request: CreateTaskRequestDto,
): Promise<TaskMutationClientResult> {
  return mutate(crmProjectTasksEndpoint(projectId), HttpMethod.Post, request);
}

function updateTask(
  taskId: string,
  request: UpdateTaskRequestDto,
): Promise<TaskMutationClientResult> {
  return mutate(crmTaskEndpoint(taskId), HttpMethod.Patch, request);
}

function changeTaskStatus(
  taskId: string,
  request: ChangeTaskStatusRequestDto,
): Promise<TaskMutationClientResult> {
  return mutate(crmTaskStatusEndpoint(taskId), HttpMethod.Patch, request);
}

export const tasksApiService = {
  createTask,
  updateTask,
  changeTaskStatus,
} as const;
