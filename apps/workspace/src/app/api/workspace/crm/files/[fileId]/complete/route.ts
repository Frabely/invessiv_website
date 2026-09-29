import "server-only";
import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import {
  fileApiResponse,
  privateFileResponse,
} from "@/lib/files/file-api-response";
import { completeFileUpload } from "@/server/workspace/crm/command-handler/complete-file-upload.command-handler";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ fileId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { fileId } = await params;
  return privateFileResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.FileComplete,
      async (_authorized, actor) =>
        fileApiResponse(
          await completeFileUpload(fileId, actor),
          HttpResponseCode.Ok,
        ),
    )(request),
  );
}
