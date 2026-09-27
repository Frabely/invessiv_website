import "server-only";

import type { NextRequest } from "next/server";
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { messageApiError } from "@/app/api/message-error";
import { withCrmPermission } from "@/lib/auth/api";
import { redactMessage } from "@/server/workspace/crm/command-handler/redact-message.command-handler";

export const runtime = "nodejs";
type Context = { params: Promise<{ messageId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { messageId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.MessageRedact,
    async (_, actor) => {
      try {
        const result = await redactMessage(messageId, actor);
        return result.ok
          ? Response.json(
              { message: result.message },
              { status: HttpResponseCode.Ok },
            )
          : messageApiError(result.code);
      } catch (error) {
        console.error("[crm-message] redaction failed", {
          errorName: error instanceof Error ? error.name : typeof error,
        });
        return messageApiError(MessageErrorCode.Internal);
      }
    },
  )(request);
}
