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
          return fileArchiveResponse(
            fileArchiveService.stream(result.rows, authorized.signal),
          );
        }),
    )(request),
  );
}
