import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import {
  portalTaskErrorResponse,
  privatePortalTaskResponse,
} from "@/lib/portal/portal-task-api-error";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { reopenCustomerTask } from "@/server/portal/command-handler/reopen-customer-task.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ customerId: string; taskId: string }> };

/** Only a verified contact can take a completion back; the owner view never reaches this handler. */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId, taskId } = await params;

  return privatePortalTaskResponse(() =>
    withPortalActor(customerId.toLowerCase(), async (_request, actor) => {
      const result = await reopenCustomerTask(actor, taskId.toLowerCase());
      if (!result.ok) return portalTaskErrorResponse(result.code);
      return Response.json(
        { alreadyOpen: result.alreadyOpen },
        { status: HttpResponseCode.Ok },
      );
    })(request),
  );
}
