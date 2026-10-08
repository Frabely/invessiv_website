import "server-only";
import type { NextRequest } from "next/server";
import {
  credentialApiResponse,
  parseCredentialBody,
  privateCredentialResponse,
} from "@/lib/credentials/credential-api-response";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { revealPortalCredential } from "@/server/portal/command-handler/reveal-portal-credential.command-handler";
import { portalCredentialSchemas } from "@/server/portal/services/credentials/portal-credential-schemas";

export const runtime = "nodejs";
type RouteContext = {
  params: Promise<{ customerId: string; credentialId: string }>;
};

/** POST, not GET: a reveal writes an audit event and must never be prefetched or cached. */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId, credentialId } = await params;
  return privateCredentialResponse(() =>
    withPortalActor(customerId.toLowerCase(), async (req, actor) =>
      parseCredentialBody(req, portalCredentialSchemas.reveal, async (data) =>
        credentialApiResponse(
          await revealPortalCredential(actor, credentialId, data),
        ),
      ),
    )(request),
  );
}
