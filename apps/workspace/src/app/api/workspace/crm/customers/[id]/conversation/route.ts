import "server-only";

import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { ConversationQueryParam } from "@/common/constants/crm/conversation-query-params";
import { withCrmPermission } from "@/lib/auth/api";
import {
  messageApiError,
  messageApiFailure,
} from "@/lib/workspace/crm/message-api-error";
import { getCustomerConversation } from "@/server/workspace/crm/query-handler/get-customer-conversation.query-handler";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.CustomerConversation,
    async (req, actor) => {
      try {
        const result = await getCustomerConversation(
          id,
          actor,
          req.nextUrl.searchParams.get(ConversationQueryParam.Cursor),
        );
        return result.ok
          ? Response.json(
              { conversation: result.conversation },
              { status: HttpResponseCode.Ok },
            )
          : messageApiError(result.code);
      } catch (error) {
        return messageApiFailure(CrmOperation.GetConversation, error);
      }
    },
  )(request);
}
