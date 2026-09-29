import "server-only";
import type { NextRequest } from "next/server";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import {
  fileApiResponse,
  fileDownloadResponse,
  parseFileDisposition,
  privateFileResponse,
} from "@/lib/files/file-api-response";
import { downloadFile } from "@/server/workspace/crm/query-handler/download-file.query-handler";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ fileId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { fileId } = await params;
  return privateFileResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.FileDownload,
      async (authorized, actor) =>
        parseFileDisposition(authorized, async (disposition) => {
          const result = await downloadFile(fileId, actor);
          return result.ok
            ? fileDownloadResponse(result.value, disposition)
            : fileApiResponse(result);
        }),
    )(request),
  );
}
