import "server-only";
import type { NextRequest } from "next/server";
import {
  fileApiResponse,
  parseFileDisposition,
  privateFileResponse,
} from "@/lib/files/file-api-response";
import { withPortalReader } from "@/server/portal/auth/with-portal-reader";
import { getPortalFileDownloadUrl } from "@/server/portal/query-handler/get-portal-file-download-url.query-handler";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ customerId: string; fileId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { customerId, fileId } = await params;
  return privateFileResponse(() =>
    withPortalReader(customerId.toLowerCase(), async (req, reader) =>
      parseFileDisposition(req, async (disposition) =>
        fileApiResponse(
          await getPortalFileDownloadUrl(
            reader,
            fileId.toLowerCase(),
            disposition,
          ),
        ),
      ),
    )(request),
  );
}
