import "server-only";
import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import {
  fileApiResponse,
  parseFileBody,
  privateFileResponse,
} from "@/lib/files/file-api-response";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { createPortalFileUpload } from "@/server/portal/command-handler/create-portal-file-upload.command-handler";
import { portalFileSchemas } from "@/server/portal/services/files/portal-file-schemas";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ customerId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId } = await params;
  return privateFileResponse(() =>
    withPortalActor(customerId.toLowerCase(), async (req, actor) =>
      parseFileBody(req, portalFileSchemas.upload, async (data) =>
        fileApiResponse(
          await createPortalFileUpload(actor, data),
          HttpResponseCode.Created,
        ),
      ),
    )(request),
  );
}
