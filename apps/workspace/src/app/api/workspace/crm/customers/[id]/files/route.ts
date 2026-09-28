import "server-only";
import type { NextRequest } from "next/server";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { FileQueryParam as Q } from "@/common/constants/files/file-query-params";
import { withCrmPermission } from "@/lib/auth/api";
import {
  fileApiResponse,
  privateFileResponse,
} from "@/lib/workspace/crm/file-api-response";
import { fileSchemas } from "@/server/workspace/crm/services/files/file-schemas";
import { listCustomerFiles } from "@/server/workspace/crm/query-handler/list-customer-files.query-handler";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return privateFileResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.FilesList,
      async (authorized, actor) => {
        const query = authorized.nextUrl.searchParams;
        const parsed = fileSchemas.list.safeParse({
          page: query.get(Q.Page) ?? undefined,
          pageSize: query.get(Q.PageSize) ?? undefined,
          projectId:
            query.get(Q.ProjectId) === "null"
              ? null
              : (query.get(Q.ProjectId) ?? undefined),
          assetKind: query.get(Q.AssetKind) ?? undefined,
          origin: query.get(Q.Origin) ?? undefined,
          search: query.get(Q.Search) ?? undefined,
        });
        if (!parsed.success)
          return fileApiResponse({
            ok: false,
            code: FileApiErrorCode.Validation,
          });
        return fileApiResponse(await listCustomerFiles(id, parsed.data, actor));
      },
    )(request),
  );
}
