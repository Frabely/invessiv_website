import "server-only";
import type { NextRequest } from "next/server";
import { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { portalAccessApiError } from "@/lib/workspace/crm/portal-access-api-error";
import { membershipUpdateResponse } from "@/server/workspace/crm/command-handler/membership-update-response";
import { replacePortalMembershipRoles } from "@/server/workspace/crm/command-handler/replace-portal-membership-roles.command-handler";
import { portalAccessSchemas } from "@/server/workspace/crm/services/portal-access/portal-access-schemas";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.PortalInvitationCreate,
    async (req, actor) => {
      const body = await readJsonBody(req);
      const input = body.ok
        ? portalAccessSchemas.membershipRoles.safeParse(body.body)
        : null;
      if (!input?.success) {
        return portalAccessApiError(PortalAccessErrorCode.ValidationError);
      }

      const result = await replacePortalMembershipRoles(id, input.data, actor);
      return membershipUpdateResponse(result);
    },
  )(request);
}
