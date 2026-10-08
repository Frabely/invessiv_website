import "server-only";
import type { NextRequest } from "next/server";
import {
  credentialApiResponse,
  parseCredentialBody,
  privateCredentialResponse,
} from "@/lib/credentials/credential-api-response";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { updatePortalCredential } from "@/server/portal/command-handler/update-portal-credential.command-handler";
import { portalCredentialSchemas } from "@/server/portal/services/credentials/portal-credential-schemas";

export const runtime = "nodejs";
type RouteContext = {
  params: Promise<{ customerId: string; credentialId: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { customerId, credentialId } = await params;
  return privateCredentialResponse(() =>
    withPortalActor(customerId.toLowerCase(), async (req, actor) =>
      parseCredentialBody(req, portalCredentialSchemas.update, async (data) =>
        credentialApiResponse(
          await updatePortalCredential(actor, credentialId, data),
        ),
      ),
    )(request),
  );
}
