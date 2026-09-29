import "server-only";
import type { NextRequest } from "next/server";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import {
  fileApiResponse,
  privateFileResponse,
} from "@/lib/files/file-api-response";
import { cancelFileUpload } from "@/server/workspace/crm/command-handler/cancel-file-upload.command-handler";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ fileId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { fileId } = await params;
  return privateFileResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.FileCancel,
      async (_authorized, actor) =>
        fileApiResponse(await cancelFileUpload(fileId, actor)),
    )(request),
  );
}
