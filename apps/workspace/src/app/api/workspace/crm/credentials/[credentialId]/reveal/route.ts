import "server-only";
import type { NextRequest } from "next/server";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import {
  credentialApiResponse,
  parseCredentialBody,
  privateCredentialResponse,
} from "@/lib/credentials/credential-api-response";
import { revealCredential } from "@/server/workspace/crm/command-handler/reveal-credential.command-handler";
import { credentialSchemas } from "@/server/workspace/crm/services/credentials/credential-schemas";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ credentialId: string }> };

/** POST, not GET: a reveal writes an audit event and must never be prefetched or cached. */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { credentialId } = await params;
  return privateCredentialResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.CredentialReveal,
      async (authorized, actor) =>
        parseCredentialBody(
          authorized,
          credentialSchemas.reveal,
          async (data) =>
            credentialApiResponse(
              await revealCredential(credentialId, data, actor),
            ),
        ),
    )(request),
  );
}
