import "server-only";
import type { NextRequest } from "next/server";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import {
  fileApiResponse,
  fileArchiveResponse,
  parseFileBody,
  privateFileResponse,
} from "@/lib/files/file-api-response";
import { createFilesArchive } from "@/server/workspace/crm/query-handler/create-files-archive.query-handler";
import { fileArchiveService } from "@/server/shared/files/file-archive-service";
import { fileSchemas } from "@/server/workspace/crm/services/files/file-schemas";
import { FileQueryParam } from "@/common/constants/files/file-query-params";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";

export const runtime = "nodejs";
export const maxDuration = 120;
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return privateFileResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.FilesArchive,
      async (authorized, actor) =>
        parseFileBody(authorized, fileSchemas.archive, async ({ fileIds }) => {
          const result = await createFilesArchive(id, fileIds, actor);
          if (!result.ok) return fileApiResponse(result);
          if (
            authorized.nextUrl.searchParams.get(
              FileQueryParam.ArchivePreflight,
            ) === "true"
          )
            return Response.json({ ready: true });
          return fileArchiveResponse(
            fileArchiveService.stream(result.rows, authorized.signal),
          );
        }),
    )(request),
  );
}

/** Native browser download after a JSON preflight; authorization is checked again at download time. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return privateFileResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.FilesArchive,
      async (authorized, actor) => {
        const parsed = fileSchemas.archive.safeParse({
          fileIds: authorized.nextUrl.searchParams.getAll(
            FileQueryParam.ArchiveFileId,
          ),
        });
        if (!parsed.success)
          return fileApiResponse({
            ok: false,
            code: FileApiErrorCode.Validation,
          });
        const result = await createFilesArchive(id, parsed.data.fileIds, actor);
        return result.ok
          ? fileArchiveResponse(
              fileArchiveService.stream(result.rows, authorized.signal),
              authorized.nextUrl.searchParams.get(
                FileQueryParam.ArchiveFilename,
              ),
            )
          : fileApiResponse(result);
      },
    )(request),
  );
}
