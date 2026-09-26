import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalTaskErrorCode } from "@invessiv/common/constants/portal/portal-task-error-codes";
import type { CompleteCustomerTaskResult } from "@invessiv/common/contracts/portal/results/complete-customer-task-result";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { completeCustomerTask } from "@/server/portal/command-handler/complete-customer-task.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ customerId: string; taskId: string }> };

const ERROR_RESPONSES: Record<
  PortalTaskErrorCode,
  { status: HttpResponseCode; message: string }
> = {
  [PortalTaskErrorCode.NotFound]: {
    status: HttpResponseCode.NotFound,
    message: "Task not found.",
  },
  [PortalTaskErrorCode.Unavailable]: {
    status: HttpResponseCode.ServiceUnavailable,
    message: "Task completion is temporarily unavailable.",
  },
};

function errorResponse(code: PortalTaskErrorCode): Response {
  const { status, message } = ERROR_RESPONSES[code];
  return Response.json({ code, message }, { status });
}

/** Only a verified contact can complete; the owner view never reaches this handler. */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId, taskId } = await params;

  return withPortalActor(customerId.toLowerCase(), async (_request, actor) => {
    let result: CompleteCustomerTaskResult;
    try {
      result = await completeCustomerTask(actor, taskId.toLowerCase());
    } catch (error: unknown) {
      console.error("[portal-task-complete] completion failed", {
        errorName: error instanceof Error ? error.name : typeof error,
      });
      return errorResponse(PortalTaskErrorCode.Unavailable);
    }

    if (!result.ok) return errorResponse(result.code);
    return Response.json(
      { alreadyDone: result.alreadyDone },
      { status: HttpResponseCode.Ok },
    );
  })(request);
}
