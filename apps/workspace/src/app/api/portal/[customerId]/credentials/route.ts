import "server-only";
import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import {
  credentialApiResponse,
  parseCredentialBody,
  privateCredentialResponse,
} from "@/lib/credentials/credential-api-response";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { withPortalReader } from "@/server/portal/auth/with-portal-reader";
import { createPortalCredential } from "@/server/portal/command-handler/create-portal-credential.command-handler";
import { listPortalCredentials } from "@/server/portal/query-handler/list-portal-credentials.query-handler";
import { portalCredentialSchemas } from "@/server/portal/services/credentials/portal-credential-schemas";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ customerId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { customerId } = await params;
  return privateCredentialResponse(() =>
    withPortalReader(customerId.toLowerCase(), async (_request, reader) =>
      credentialApiResponse(await listPortalCredentials(reader)),
    )(request),
  );
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId } = await params;
  return privateCredentialResponse(() =>
    withPortalActor(customerId.toLowerCase(), async (req, actor) =>
      parseCredentialBody(req, portalCredentialSchemas.create, async (data) =>
        credentialApiResponse(
          await createPortalCredential(actor, data),
          HttpResponseCode.Created,
        ),
      ),
    )(request),
  );
}
