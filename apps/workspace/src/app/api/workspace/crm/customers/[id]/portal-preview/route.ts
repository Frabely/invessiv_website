import "server-only";
import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { confirmCustomerPortalPreview } from "@/server/workspace/crm/command-handler/confirm-customer-portal-preview.command-handler";
import { portalAccessSchemas } from "@/server/workspace/crm/services/portal-access/portal-access-schemas";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.PortalInvitationCreate,
    async (req, actor) => {
      const body = await readJsonBody(req);
      const input = body.ok
        ? portalAccessSchemas.preview.safeParse(body.body)
        : null;
      if (!input?.success) {
        return Response.json(
          { code: PortalAccessErrorCode.ValidationError },
          { status: HttpResponseCode.BadRequest },
        );
      }

      const result = await confirmCustomerPortalPreview(id, input.data, actor);
      if (result.ok)
        return Response.json(result, { status: HttpResponseCode.Ok });
      if (result.code === PortalAccessErrorCode.NotFound)
        return Response.json(result, { status: HttpResponseCode.NotFound });
      if (result.code === ConcurrencyErrorCode.VersionConflict)
        return Response.json(result, { status: HttpResponseCode.Conflict });
      return Response.json(result, { status: HttpResponseCode.BadRequest });
    },
  )(request);
}
