import "server-only";

import type { NextRequest } from "next/server";
import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import {
  messageApiError,
  messageApiFailure,
} from "@/lib/workspace/crm/message-api-error";
import { readSendMessageInput } from "@/lib/workspace/crm/message-request-input";
import { sendInternalMessage } from "@/server/workspace/crm/command-handler/send-internal-message.command-handler";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.CustomerConversationWrite,
    async (req, actor) => {
      const input = await readSendMessageInput(req);
      if (!input) return messageApiError(MessageErrorCode.ValidationError);
      try {
        const result = await sendInternalMessage(id, input, actor);
        return result.ok
          ? Response.json(
              { message: result.message },
              { status: HttpResponseCode.Created },
            )
          : messageApiError(result.code);
      } catch (error) {
        return messageApiFailure(CrmOperation.SendMessage, error);
      }
    },
  )(request);
}
