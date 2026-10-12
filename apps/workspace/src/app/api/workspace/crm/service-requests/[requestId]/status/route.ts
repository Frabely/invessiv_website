import "server-only";
import type { NextRequest } from "next/server";
import { ServiceRequestErrorCode as E } from "@invessiv/common/constants/crm/errors/service-request-error-codes";
import type { ChangeServiceRequestStatusRequestDto } from "@invessiv/common/contracts/crm/service-requests/change-service-request-status-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { withJsonBody } from "@/lib/http/with-json-body";
import {
  serviceRequestApiError,
  serviceRequestResponse,
  privateServiceRequestResponse,
} from "@/lib/workspace/crm/service-request-api-error";
import { changeServiceRequestStatus } from "@/server/workspace/crm/command-handler/change-service-request-status.command-handler";
export const runtime = "nodejs";
type RouteContext = { params: Promise<{ requestId: string }> };
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { requestId } = await params;
  return privateServiceRequestResponse(
    CrmOperation.ChangeServiceRequestStatus,
    () =>
      withCrmPermission(
        CrmEndpointAccessRule.ServiceRequestStatusChange,
        (authorizedRequest, actor) =>
          withJsonBody(
            authorizedRequest,
            async (body) =>
              serviceRequestResponse(
                await changeServiceRequestStatus(
                  requestId,
                  body as ChangeServiceRequestStatusRequestDto,
                  actor,
                ),
              ),
            () => serviceRequestApiError(E.ValidationError),
          ),
      )(request),
  );
}
