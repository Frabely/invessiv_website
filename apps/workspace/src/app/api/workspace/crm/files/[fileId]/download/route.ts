import "server-only";
import type { NextRequest } from "next/server";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { FileQueryParam } from "@/common/constants/files/file-query-params";
import { withCrmPermission } from "@/lib/auth/api";
import {
  fileApiResponse,
  fileDownloadResponse,
  privateFileResponse,
} from "@/lib/files/file-api-response";
import { downloadFile } from "@/server/workspace/crm/query-handler/download-file.query-handler";
import { fileSchemas } from "@/server/workspace/crm/services/files/file-schemas";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ fileId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { fileId } = await params;
  return privateFileResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.FileDownload,
      async (authorized, actor) => {
        const parsed = fileSchemas.disposition.safeParse(
          authorized.nextUrl.searchParams.get(FileQueryParam.Disposition) ??
            undefined,
        );
        if (!parsed.success)
          return fileApiResponse({
            ok: false,
            code: FileApiErrorCode.Validation,
          });
        const result = await downloadFile(fileId, actor);
        return result.ok
          ? fileDownloadResponse(result.value, parsed.data)
          : fileApiResponse(result);
      },
    )(request),
  );
}
