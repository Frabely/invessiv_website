import "server-only";
import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import {
  portalServiceRequestErrorResponse,
  privatePortalServiceRequestResponse,
} from "@/lib/portal/portal-service-request-api-error";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { withdrawPortalServiceRequest } from "@/server/portal/command-handler/withdraw-portal-service-request.command-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ customerId: string; requestId: string }>;
};

/** Only a verified contact can withdraw; the owner view never reaches this handler. */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId, requestId } = await params;

  return privatePortalServiceRequestResponse(() =>
    withPortalActor(customerId.toLowerCase(), async (_request, actor) => {
      const result = await withdrawPortalServiceRequest(
        actor,
        requestId.toLowerCase(),
      );
      if (!result.ok) return portalServiceRequestErrorResponse(result.code);
      return Response.json(
        { withdrawn: true },
        { status: HttpResponseCode.Ok },
      );
    })(request),
  );
}
