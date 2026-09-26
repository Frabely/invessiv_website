import "server-only";

import type { NextRequest } from "next/server";
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { messageApiError } from "@/app/api/message-error";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { sendInternalMessage } from "@/server/workspace/crm/command-handler/send-internal-message.command-handler";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.CustomerConversationWrite,
    async (req, actor) => {
      const parsed = await readJsonBody(req);
      if (!parsed.ok) return messageApiError(MessageErrorCode.ValidationError);
      try {
        const body =
          typeof parsed.body === "object" &&
          parsed.body !== null &&
          "body" in parsed.body
            ? parsed.body.body
            : undefined;
        const result = await sendInternalMessage(id, body, actor);
        return result.ok
          ? Response.json(
              { message: result.message },
              { status: HttpResponseCode.Created },
            )
          : messageApiError(result.code);
      } catch (error) {
        console.error("[crm-message] send failed", {
          errorName: error instanceof Error ? error.name : typeof error,
        });
        return messageApiError(MessageErrorCode.Internal);
      }
    },
  )(request);
}
