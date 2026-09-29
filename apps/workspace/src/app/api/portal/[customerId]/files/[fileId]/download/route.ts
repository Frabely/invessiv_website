import "server-only";
import type { NextRequest } from "next/server";
import {
  fileApiResponse,
  fileDownloadResponse,
  parseFileDisposition,
  privateFileResponse,
} from "@/lib/files/file-api-response";
import { withPortalReader } from "@/server/portal/auth/with-portal-reader";
import { downloadPortalFile } from "@/server/portal/query-handler/download-portal-file.query-handler";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ customerId: string; fileId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { customerId, fileId } = await params;
  return privateFileResponse(() =>
    withPortalReader(customerId.toLowerCase(), async (req, reader) =>
      parseFileDisposition(req, async (disposition) => {
        const result = await downloadPortalFile(reader, fileId.toLowerCase());
        return result.ok
          ? fileDownloadResponse(result.value, disposition)
          : fileApiResponse(result);
      }),
    )(request),
  );
}
