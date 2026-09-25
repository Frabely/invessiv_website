import "server-only";
import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { membershipUpdateResponse } from "../membership-update-response";
import { portalAccessSchemas } from "@/server/workspace/crm/services/portal-access/portal-access-schemas";
import { updatePortalMembership } from "@/server/workspace/crm/command-handler/update-portal-membership.command-handler";
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
        return Response.json(
          { code: PortalAccessErrorCode.ValidationError },
          { status: HttpResponseCode.BadRequest },
        );
      }

      const result = await updatePortalMembership(id, input.data, actor);
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
      return Response.json(
        { ok },
        {
          status: ok ? HttpResponseCode.Ok : HttpResponseCode.NotFound,
        },
      );
    },
  )(request);
}
