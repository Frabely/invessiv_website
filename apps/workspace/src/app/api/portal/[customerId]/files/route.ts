import "server-only";
import type { NextRequest } from "next/server";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { FileQueryParam as Q } from "@/common/constants/files/file-query-params";
import {
  fileApiResponse,
  privateFileResponse,
} from "@/lib/files/file-api-response";
import { withPortalReader } from "@/server/portal/auth/with-portal-reader";
import { listPortalFiles } from "@/server/portal/query-handler/list-portal-files.query-handler";
import { portalFileSchemas } from "@/server/portal/services/files/portal-file-schemas";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ customerId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { customerId } = await params;
  return privateFileResponse(() =>
    withPortalReader(customerId.toLowerCase(), async (req, reader) => {
      const query = req.nextUrl.searchParams;
      const parsed = portalFileSchemas.list.safeParse({
        origin: query.get(Q.Origin) ?? undefined,
        page: query.get(Q.Page) ?? undefined,
        pageSize: query.get(Q.PageSize) ?? undefined,
      });
      if (!parsed.success)
        return fileApiResponse({
          ok: false,
          code: FileApiErrorCode.Validation,
        });
      return fileApiResponse(await listPortalFiles(reader, parsed.data));
    })(request),
  );
}
