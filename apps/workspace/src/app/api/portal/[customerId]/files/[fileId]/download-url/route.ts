import "server-only";
import type { NextRequest } from "next/server";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { FileQueryParam } from "@/common/constants/files/file-query-params";
import {
  fileApiResponse,
  privateFileResponse,
} from "@/lib/files/file-api-response";
import { withPortalReader } from "@/server/portal/auth/with-portal-reader";
import { getPortalFileDownloadUrl } from "@/server/portal/query-handler/get-portal-file-download-url.query-handler";
import { portalFileSchemas } from "@/server/portal/services/files/portal-file-schemas";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ customerId: string; fileId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { customerId, fileId } = await params;
  return privateFileResponse(() =>
    withPortalReader(customerId.toLowerCase(), async (req, reader) => {
      const parsed = portalFileSchemas.disposition.safeParse(
        req.nextUrl.searchParams.get(FileQueryParam.Disposition) ?? undefined,
      );
      if (!parsed.success)
        return fileApiResponse({
          ok: false,
          code: FileApiErrorCode.Validation,
        });
      return fileApiResponse(
        await getPortalFileDownloadUrl(
          reader,
          fileId.toLowerCase(),
          parsed.data,
        ),
      );
    })(request),
  );
}
