import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import {
  PORTAL_TASK_ERROR_CODE_VALUES,
  PortalTaskErrorCode,
} from "@invessiv/common/constants/portal/portal-task-error-codes";
import type { CreatePortalTaskRequestDto } from "@invessiv/common/contracts/portal/create-portal-task-request.dto";
import type { CompleteCustomerTaskResult } from "@invessiv/common/contracts/portal/results/complete-customer-task-result";
import type { ReopenCustomerTaskResult } from "@invessiv/common/contracts/portal/results/reopen-customer-task-result";
import {
  portalTaskCompleteEndpoint,
  portalTaskReopenEndpoint,
  portalTasksEndpoint,
} from "@/common/patterns/portal/portal-api-endpoints";

type PostResult =
  { ok: true; payload: unknown } | { ok: false; code: PortalTaskErrorCode };

function hasFlag(payload: unknown, flag: string): boolean {
  return (
    typeof payload === "object" &&
    payload !== null &&
    flag in payload &&
    (payload as Record<string, unknown>)[flag] === true
  );
}

/** A 404 from the access gate carries no task code, so the status decides first. */
function toErrorCode(status: number, payload: unknown): PortalTaskErrorCode {
  if (status === HttpResponseCode.NotFound) return PortalTaskErrorCode.NotFound;
  const code =
    typeof payload === "object" && payload !== null && "code" in payload
      ? payload.code
      : null;
  return (
    PORTAL_TASK_ERROR_CODE_VALUES.find((known) => known === code) ??
    PortalTaskErrorCode.Unavailable
  );
}

async function post(endpoint: string, body?: unknown): Promise<PostResult> {
  try {
    const response = await fetch(
      endpoint,
      body === undefined
        ? { method: HttpMethod.Post }
        : {
            method: HttpMethod.Post,
            headers: { [HttpHeaderName.ContentType]: MediaType.Json },
            body: JSON.stringify(body),
          },
    );
    const payload: unknown = await response.json().catch(() => null);
    return response.ok
      ? { ok: true, payload }
      : { ok: false, code: toErrorCode(response.status, payload) };
  } catch {
    return { ok: false, code: PortalTaskErrorCode.Unavailable };
  }
}

async function completeTask(
  customerId: string,
  taskId: string,
): Promise<CompleteCustomerTaskResult> {
  const result = await post(portalTaskCompleteEndpoint(customerId, taskId));
  return result.ok
    ? { ok: true, alreadyDone: hasFlag(result.payload, "alreadyDone") }
    : result;
}

async function reopenTask(
  customerId: string,
  taskId: string,
): Promise<ReopenCustomerTaskResult> {
  const result = await post(portalTaskReopenEndpoint(customerId, taskId));
  return result.ok
    ? { ok: true, alreadyOpen: hasFlag(result.payload, "alreadyOpen") }
    : result;
}

/** The answer only confirms; the dashboard reloads to show the new task. */
async function createTask(
  customerId: string,
  input: CreatePortalTaskRequestDto,
): Promise<{ ok: true } | { ok: false; code: PortalTaskErrorCode }> {
  const result = await post(portalTasksEndpoint(customerId), input);
  return result.ok ? { ok: true } : result;
}

export const portalTasksApiService = {
  completeTask,
  reopenTask,
  createTask,
} as const;
