import "server-only";
import type { NextRequest } from "next/server";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import {
  fileApiResponse,
  parseFileDisposition,
  privateFileResponse,
} from "@/lib/files/file-api-response";
import { getFileDownloadUrl } from "@/server/workspace/crm/query-handler/get-file-download-url.query-handler";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ fileId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { fileId } = await params;
  return privateFileResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.FileDownloadUrl,
      async (authorized, actor) =>
        parseFileDisposition(authorized, async (disposition) =>
          fileApiResponse(await getFileDownloadUrl(fileId, disposition, actor)),
        ),
    )(request),
  );
}
