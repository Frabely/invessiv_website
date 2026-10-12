import "server-only";
import type { NextRequest } from "next/server";
import { ServiceRequestErrorCode as E } from "@invessiv/common/constants/crm/errors/service-request-error-codes";
import type { AcceptServiceRequestRequestDto } from "@invessiv/common/contracts/crm/service-requests/accept-service-request-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { withJsonBody } from "@/lib/http/with-json-body";
import {
  serviceRequestApiError,
  serviceRequestResponse,
  privateServiceRequestResponse,
} from "@/lib/workspace/crm/service-request-api-error";
import { acceptServiceRequest } from "@/server/workspace/crm/command-handler/accept-service-request.command-handler";
export const runtime = "nodejs";
type RouteContext = { params: Promise<{ requestId: string }> };
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { requestId } = await params;
  return privateServiceRequestResponse(CrmOperation.AcceptServiceRequest, () =>
    withCrmPermission(
      CrmEndpointAccessRule.ServiceRequestAccept,
      (authorizedRequest, actor) =>
        withJsonBody(
          authorizedRequest,
          async (body) =>
            serviceRequestResponse(
              await acceptServiceRequest(
                requestId,
                body as AcceptServiceRequestRequestDto,
                actor,
              ),
            ),
          () => serviceRequestApiError(E.ValidationError),
        ),
    )(request),
  );
}
