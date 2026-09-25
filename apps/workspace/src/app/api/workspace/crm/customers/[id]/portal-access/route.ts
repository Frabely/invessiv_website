import "server-only";
import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import { portalAccessApiError } from "@/lib/workspace/crm/portal-access-api-error";
import { getCustomerPortalAccess } from "@/server/workspace/crm/query-handler/get-customer-portal-access.query-handler";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.PortalInvitationCreate,
    async (_, actor) => {
      const access = await getCustomerPortalAccess(id, actor);
      if (!access) {
        return portalAccessApiError(PortalAccessErrorCode.NotFound);
      }

      return Response.json({ access }, { status: HttpResponseCode.Ok });
    },
  )(request);
}
