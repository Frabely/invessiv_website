import "server-only";
import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { portalAccessApiError } from "@/lib/workspace/crm/portal-access-api-error";
import { membershipUpdateResponse } from "@/server/workspace/crm/command-handler/membership-update-response";
import { portalAccessSchemas } from "@/server/workspace/crm/services/portal-access/portal-access-schemas";
import { updatePortalMembershipNotifications } from "@/server/workspace/crm/command-handler/update-portal-membership-notifications.command-handler";
import { revokePortalMembership } from "@/server/workspace/crm/command-handler/revoke-portal-membership.command-handler";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.PortalInvitationCreate,
    async (req, actor) => {
      const body = await readJsonBody(req);
      const input = body.ok
        ? portalAccessSchemas.membershipNotifications.safeParse(body.body)
        : null;
      if (!input?.success) {
        return portalAccessApiError(PortalAccessErrorCode.ValidationError);
      }

      const result = await updatePortalMembershipNotifications(
        id,
        input.data,
        actor,
      );
      return membershipUpdateResponse(result);
    },
  )(request);
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.PortalInvitationCreate,
    async (_, actor) => {
      const ok = await revokePortalMembership(id, actor);
      if (!ok) return portalAccessApiError(PortalAccessErrorCode.NotFound);
      return Response.json({ ok: true }, { status: HttpResponseCode.Ok });
    },
  )(request);
}
