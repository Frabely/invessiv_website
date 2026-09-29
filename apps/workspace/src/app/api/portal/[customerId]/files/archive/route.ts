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
import { FileQueryParam } from "@/common/constants/files/file-query-params";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";

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
        if (
          req.nextUrl.searchParams.get(FileQueryParam.ArchivePreflight) ===
          "true"
        )
          return Response.json({ ready: true });
        return fileArchiveResponse(
          fileArchiveService.stream(result.rows, req.signal),
        );
      }),
    )(request),
  );
}

/** Native browser download after a JSON preflight; visibility is checked again at download time. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { customerId } = await params;
  return privateFileResponse(() =>
    withPortalReader(customerId.toLowerCase(), async (req, reader) => {
      const parsed = portalFileSchemas.archive.safeParse({
        fileIds: req.nextUrl.searchParams.getAll(FileQueryParam.ArchiveFileId),
      });
      if (!parsed.success)
        return fileApiResponse({
          ok: false,
          code: FileApiErrorCode.Validation,
        });
      const result = await createPortalFilesArchive(
        reader,
        parsed.data.fileIds,
      );
      return result.ok
        ? fileArchiveResponse(
            fileArchiveService.stream(result.rows, req.signal),
            req.nextUrl.searchParams.get(FileQueryParam.ArchiveFilename),
          )
        : fileApiResponse(result);
    })(request),
  );
}
