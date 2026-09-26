import "server-only";

import type { NextRequest } from "next/server";
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { messageApiError } from "@/app/api/message-error";
import { withCrmPermission } from "@/lib/auth/api";
import { markConversationRead } from "@/server/workspace/crm/command-handler/mark-conversation-read.command-handler";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.CustomerConversationRead,
    async (_, actor) => {
      try {
        const result = await markConversationRead(id, actor);
        return result.ok
          ? Response.json({ ok: true }, { status: HttpResponseCode.Ok })
          : messageApiError(result.code);
      } catch (error) {
        console.error("[crm-conversation] mark read failed", {
          errorName: error instanceof Error ? error.name : typeof error,
        });
        return messageApiError(MessageErrorCode.Internal);
      }
    },
  )(request);
}
