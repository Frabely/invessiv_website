import "server-only";
import type { NextRequest } from "next/server";
import {
  fileApiResponse,
  fileArchiveResponse,
  parseFileBody,
  privateFileResponse,
} from "@/lib/files/file-api-response";
import { withPortalReader } from "@/server/portal/auth/with-portal-reader";
import { createPortalFilesArchive } from "@/server/portal/query-handler/create-portal-files-archive.query-handler";
import { portalFileSchemas } from "@/server/portal/services/files/portal-file-schemas";
import { fileArchiveService } from "@/server/shared/files/file-archive-service";

export const runtime = "nodejs";
export const maxDuration = 120;
type RouteContext = { params: Promise<{ customerId: string }> };

/** A read, not a write: the owner view may download what the customer sees. */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId } = await params;
  return privateFileResponse(() =>
    withPortalReader(customerId.toLowerCase(), async (req, reader) =>
      parseFileBody(req, portalFileSchemas.archive, async ({ fileIds }) => {
        const result = await createPortalFilesArchive(reader, fileIds);
        if (!result.ok) return fileApiResponse(result);
        return fileArchiveResponse(
          fileArchiveService.stream(result.rows, req.signal),
        );
      }),
    )(request),
  );
}
