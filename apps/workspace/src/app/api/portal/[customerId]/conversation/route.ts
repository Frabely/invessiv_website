import "server-only";

import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { ConversationQueryParam } from "@/common/constants/crm/conversation-query-params";
import {
  messageApiError,
  messageApiFailure,
} from "@/lib/workspace/crm/message-api-error";
import { withPortalReader } from "@/server/portal/auth/with-portal-reader";
import { getPortalConversation } from "@/server/portal/query-handler/get-portal-conversation.query-handler";

export const runtime = "nodejs";
type Context = { params: Promise<{ customerId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { customerId } = await params;
  return withPortalReader(customerId, async (req, reader) => {
    try {
      const result = await getPortalConversation(
        reader,
        req.nextUrl.searchParams.get(ConversationQueryParam.Cursor),
      );
      return result.ok
        ? Response.json(
            { conversation: result.conversation },
            { status: HttpResponseCode.Ok },
          )
        : messageApiError(result.code);
    } catch (error) {
      return messageApiFailure(CrmOperation.GetPortalConversation, error);
    }
  })(request);
}
