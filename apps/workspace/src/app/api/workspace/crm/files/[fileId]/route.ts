import "server-only";
import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import {
  fileApiResponse,
  parseFileBody,
  privateFileResponse,
} from "@/lib/workspace/crm/file-api-response";
import { deleteFile } from "@/server/workspace/crm/command-handler/delete-file.command-handler";
import { updateFile } from "@/server/workspace/crm/command-handler/update-file.command-handler";
import { fileSchemas } from "@/server/workspace/crm/services/files/file-schemas";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ fileId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { fileId } = await params;
  return privateFileResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.FileUpdate,
      async (authorized, actor) =>
        parseFileBody(authorized, fileSchemas.update, async (data) =>
          fileApiResponse(
            await updateFile(fileId, data, actor),
            HttpResponseCode.Ok,
          ),
        ),
    )(request),
  );
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { fileId } = await params;
  return privateFileResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.FileDelete,
      async (authorized, actor) =>
        parseFileBody(authorized, fileSchemas.delete, async (data) =>
          fileApiResponse(await deleteFile(fileId, data, actor)),
        ),
    )(request),
  );
}
