import "server-only";
import type { NextRequest } from "next/server";
import {
  fileApiResponse,
  privateFileResponse,
} from "@/lib/files/file-api-response";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { cancelPortalFileUpload } from "@/server/portal/command-handler/cancel-portal-file-upload.command-handler";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ customerId: string; fileId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId, fileId } = await params;
  return privateFileResponse(() =>
    withPortalActor(customerId.toLowerCase(), async (_req, actor) =>
      fileApiResponse(
        await cancelPortalFileUpload(actor, fileId.toLowerCase()),
      ),
    )(request),
  );
}
