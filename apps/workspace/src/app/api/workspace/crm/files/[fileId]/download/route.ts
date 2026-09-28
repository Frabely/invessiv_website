import "server-only";
import type { NextRequest } from "next/server";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import {
  fileApiResponse,
  privateFileResponse,
} from "@/lib/workspace/crm/file-api-response";
import { downloadFile } from "@/server/workspace/crm/query-handler/download-file.query-handler";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ fileId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { fileId } = await params;
  return privateFileResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.FileDownload,
      async (_authorized, actor) => {
        const result = await downloadFile(fileId, actor);
        if (!result.ok) return fileApiResponse(result);
        const { stream, filename, contentType } = result.value;
        const encoded = encodeURIComponent(filename).replace(
          /['()*]/g,
          (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
        );
        return new Response(stream, {
          headers: {
            [HttpHeaderName.ContentType]: contentType,
            [HttpHeaderName.ContentDisposition]: `attachment; filename="download"; filename*=UTF-8''${encoded}`,
            [HttpHeaderName.ContentSecurityPolicy]: "sandbox",
          },
        });
      },
    )(request),
  );
}
