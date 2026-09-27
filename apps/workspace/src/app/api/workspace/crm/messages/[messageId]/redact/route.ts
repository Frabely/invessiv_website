import "server-only";

import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import {
  messageApiError,
  messageApiFailure,
} from "@/lib/workspace/crm/message-api-error";
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
        return messageApiFailure(CrmOperation.RedactMessage, error);
      }
    },
  )(request);
}
