import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalTaskErrorCode } from "@invessiv/common/constants/portal/portal-task-error-codes";
import type { CreatePortalTaskRequestDto } from "@invessiv/common/contracts/portal/create-portal-task-request.dto";
import { withJsonBody } from "@/lib/http/with-json-body";
import {
  portalTaskErrorResponse,
  privatePortalTaskResponse,
} from "@/lib/portal/portal-task-api-error";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { createCustomerRequestTask } from "@/server/portal/command-handler/create-customer-request-task.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ customerId: string }> };

/**
 * The customer comes from the verified actor, never from the body. A body that is not JSON is
 * rejected here; the command validates its shape. The answer only confirms, so a contact with the
 * create grant alone learns nothing about other tasks.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId } = await params;

  return privatePortalTaskResponse(() =>
    withPortalActor(customerId.toLowerCase(), (authorized, actor) =>
      withJsonBody(
        authorized,
        async (body) => {
          const result = await createCustomerRequestTask(
            actor,
            body as CreatePortalTaskRequestDto,
          );
          if (!result.ok) return portalTaskErrorResponse(result.code);
          return Response.json(
            { created: true },
            { status: HttpResponseCode.Created },
          );
        },
        () => portalTaskErrorResponse(PortalTaskErrorCode.Validation),
      ),
    )(request),
  );
}
