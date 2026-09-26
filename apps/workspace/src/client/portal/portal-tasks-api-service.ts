import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalTaskErrorCode } from "@invessiv/common/constants/portal/portal-task-error-codes";
import type { CompleteCustomerTaskResult } from "@invessiv/common/contracts/portal/results/complete-customer-task-result";
import { portalTaskCompleteEndpoint } from "@/common/patterns/portal/portal-api-endpoints";

async function completeTask(
  customerId: string,
  taskId: string,
): Promise<CompleteCustomerTaskResult> {
  try {
    const response = await fetch(
      portalTaskCompleteEndpoint(customerId, taskId),
      { method: HttpMethod.Post },
    );
    const payload: unknown = await response.json().catch(() => null);
    if (response.ok) {
      const alreadyDone =
        typeof payload === "object" &&
        payload !== null &&
        "alreadyDone" in payload &&
        payload.alreadyDone === true;
      return { ok: true, alreadyDone };
    }
    return {
      ok: false,
      code:
        response.status === HttpResponseCode.NotFound
          ? PortalTaskErrorCode.NotFound
          : PortalTaskErrorCode.Unavailable,
    };
  } catch {
    return { ok: false, code: PortalTaskErrorCode.Unavailable };
  }
}

export const portalTasksApiService = { completeTask } as const;
