import "server-only";
import type { NextRequest } from "next/server";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import {
  credentialApiResponse,
  parseCredentialBody,
  privateCredentialResponse,
} from "@/lib/credentials/credential-api-response";
import { deleteCredential } from "@/server/workspace/crm/command-handler/delete-credential.command-handler";
import { updateCredential } from "@/server/workspace/crm/command-handler/update-credential.command-handler";
import { credentialSchemas } from "@/server/workspace/crm/services/credentials/credential-schemas";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ credentialId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { credentialId } = await params;
  return privateCredentialResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.CredentialUpdate,
      async (authorized, actor) =>
        parseCredentialBody(
          authorized,
          credentialSchemas.update,
          async (data) =>
            credentialApiResponse(
              await updateCredential(credentialId, data, actor),
            ),
        ),
    )(request),
  );
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { credentialId } = await params;
  return privateCredentialResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.CredentialDelete,
      async (authorized, actor) =>
        parseCredentialBody(
          authorized,
          credentialSchemas.delete,
          async (data) =>
            credentialApiResponse(
              await deleteCredential(credentialId, data, actor),
            ),
        ),
    )(request),
  );
}
