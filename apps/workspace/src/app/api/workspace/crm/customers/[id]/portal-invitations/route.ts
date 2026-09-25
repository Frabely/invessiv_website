import "server-only";

import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { isSupportedLocale } from "@/config/i18n";
import { withCrmPermission } from "@/lib/auth/api";
import { portalInvitePathFor } from "@/lib/auth/routes";
import { readJsonBody } from "@/lib/http/read-json-body";
import { portalAccessApiError } from "@/lib/workspace/crm/portal-access-api-error";
import { invitePortalContact } from "@/server/workspace/crm/command-handler/invite-portal-contact.command-handler";
import { portalAccessSchemas } from "@/server/workspace/crm/services/portal-access/portal-access-schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const locale = request.nextUrl.searchParams.get("locale");
  if (!locale || !isSupportedLocale(locale)) {
    return portalAccessApiError(PortalAccessErrorCode.ValidationError);
  }

  return withCrmPermission(
    CrmEndpointAccessRule.PortalInvitationCreate,
    async (req, actor) => {
      const parsed = await readJsonBody(req);
      const input = parsed.ok
        ? portalAccessSchemas.invite.safeParse(parsed.body)
        : null;
      if (!input?.success) {
        return portalAccessApiError(PortalAccessErrorCode.ValidationError);
      }

      try {
        const inviteUrlForToken = (token: string) =>
          new URL(
            portalInvitePathFor(locale, token),
            request.nextUrl.origin,
          ).toString();
        const result = await invitePortalContact(
          id,
          input.data,
          actor,
          inviteUrlForToken,
        );
        if (!result.ok) return portalAccessApiError(result.code);
        return Response.json(result, { status: HttpResponseCode.Created });
      } catch {
        return portalAccessApiError(PortalAccessErrorCode.Unavailable);
      }
    },
  )(request);
}
