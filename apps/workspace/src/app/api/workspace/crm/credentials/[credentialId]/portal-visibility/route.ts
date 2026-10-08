import "server-only";
import type { NextRequest } from "next/server";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import {
  credentialApiResponse,
  parseCredentialBody,
  privateCredentialResponse,
} from "@/lib/credentials/credential-api-response";
import { setCredentialPortalVisibility } from "@/server/workspace/crm/command-handler/set-credential-portal-visibility.command-handler";
import { credentialSchemas } from "@/server/workspace/crm/services/credentials/credential-schemas";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ credentialId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { credentialId } = await params;
  return privateCredentialResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.CredentialPortalVisibility,
      async (authorized, actor) =>
        parseCredentialBody(
          authorized,
          credentialSchemas.portalVisibility,
          async (data) =>
            credentialApiResponse(
              await setCredentialPortalVisibility(credentialId, data, actor),
            ),
        ),
    )(request),
  );
}
