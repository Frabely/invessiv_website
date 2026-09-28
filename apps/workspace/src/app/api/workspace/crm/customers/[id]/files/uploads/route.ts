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
import { createFileUpload } from "@/server/workspace/crm/command-handler/create-file-upload.command-handler";
import { fileSchemas } from "@/server/workspace/crm/services/files/file-schemas";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return privateFileResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.FileUpload,
      async (authorized, actor) =>
        parseFileBody(authorized, fileSchemas.upload, async (data) =>
          fileApiResponse(
            await createFileUpload(id, data, actor),
            HttpResponseCode.Created,
          ),
        ),
    )(request),
  );
}
