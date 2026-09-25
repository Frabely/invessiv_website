import "server-only";
import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import { revokePortalInvitation } from "@/server/workspace/crm/command-handler/revoke-portal-invitation.command-handler";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.PortalInvitationCreate,
    async (_, actor) => {
      const revoked = await revokePortalInvitation(id, actor);
      return new Response(null, {
        status: revoked ? HttpResponseCode.Ok : HttpResponseCode.NotFound,
      });
    },
  )(request);
}
