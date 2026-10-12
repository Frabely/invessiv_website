import "server-only";
import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalServiceRequestErrorCode } from "@invessiv/common/constants/portal/portal-service-request-error-codes";
import type { CreatePortalServiceRequestDto } from "@invessiv/common/contracts/portal/create-portal-service-request.dto";
import { withJsonBody } from "@/lib/http/with-json-body";
import {
  portalServiceRequestErrorResponse,
  privatePortalServiceRequestResponse,
} from "@/lib/portal/portal-service-request-api-error";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { createPortalServiceRequest } from "@/server/portal/command-handler/create-portal-service-request.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ customerId: string }> };

/**
 * The customer comes from the verified actor, never from the body. A body that is not JSON is
 * rejected here; the command validates its shape strictly. The answer only confirms, so a contact
 * with the request grant alone learns nothing about other requests.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId } = await params;

  return privatePortalServiceRequestResponse(() =>
    withPortalActor(customerId.toLowerCase(), (authorized, actor) =>
      withJsonBody(
        authorized,
        async (body) => {
          const result = await createPortalServiceRequest(
            actor,
            body as CreatePortalServiceRequestDto,
          );
          if (!result.ok) return portalServiceRequestErrorResponse(result.code);
          return Response.json(
            { created: true },
            { status: HttpResponseCode.Created },
          );
        },
        () =>
          portalServiceRequestErrorResponse(
            PortalServiceRequestErrorCode.Validation,
          ),
      ),
    )(request),
  );
}
