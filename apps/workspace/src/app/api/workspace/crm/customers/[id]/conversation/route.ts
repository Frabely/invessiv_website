import "server-only";

import type { NextRequest } from "next/server";
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { ConversationQueryParam } from "@/common/constants/crm/conversation-query-params";
import { messageApiError } from "@/app/api/message-error";
import { withCrmPermission } from "@/lib/auth/api";
import { getCustomerConversation } from "@/server/workspace/crm/query-handler/get-customer-conversation.query-handler";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.CustomerConversation,
    async (req, actor) => {
      try {
        const conversation = await getCustomerConversation(
          id,
          actor,
          req.nextUrl.searchParams.get(ConversationQueryParam.Cursor),
        );
        return conversation
          ? Response.json({ conversation }, { status: HttpResponseCode.Ok })
          : messageApiError(MessageErrorCode.NotFound);
      } catch (error) {
        console.error("[crm-conversation] read failed", {
          errorName: error instanceof Error ? error.name : typeof error,
        });
        return messageApiError(MessageErrorCode.Internal);
      }
    },
  )(request);
}
