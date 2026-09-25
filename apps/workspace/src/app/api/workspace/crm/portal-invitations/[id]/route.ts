import "server-only";
import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import { portalAccessApiError } from "@/lib/workspace/crm/portal-access-api-error";
import { revokePortalInvitation } from "@/server/workspace/crm/command-handler/revoke-portal-invitation.command-handler";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.PortalInvitationCreate,
    async (_, actor) => {
      const revoked = await revokePortalInvitation(id, actor);
      if (!revoked) return portalAccessApiError(PortalAccessErrorCode.NotFound);
      return Response.json({ ok: true }, { status: HttpResponseCode.Ok });
    },
  )(request);
}
