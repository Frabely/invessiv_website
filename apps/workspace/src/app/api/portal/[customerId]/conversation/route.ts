import "server-only";

import type { NextRequest } from "next/server";
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { ConversationQueryParam } from "@/common/constants/crm/conversation-query-params";
import { messageApiError } from "@/app/api/message-error";
import { withPortalReader } from "@/server/portal/auth/with-portal-reader";
import { getPortalConversation } from "@/server/portal/query-handler/get-portal-conversation.query-handler";

export const runtime = "nodejs";
type Context = { params: Promise<{ customerId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { customerId } = await params;
  return withPortalReader(customerId, async (req, reader) => {
    try {
      const conversation = await getPortalConversation(
        reader,
        req.nextUrl.searchParams.get(ConversationQueryParam.Cursor),
      );
      return conversation
        ? Response.json({ conversation }, { status: HttpResponseCode.Ok })
        : messageApiError(MessageErrorCode.NotFound);
    } catch (error) {
      console.error("[portal-conversation] read failed", {
        errorName: error instanceof Error ? error.name : typeof error,
      });
      return messageApiError(MessageErrorCode.Internal);
    }
  })(request);
}
