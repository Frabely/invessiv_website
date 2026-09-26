import "server-only";

import type { NextRequest } from "next/server";
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { messageApiError } from "@/app/api/message-error";
import { withCrmPermission } from "@/lib/auth/api";
import { countUnreadConversations } from "@/server/workspace/crm/query-handler/count-unread-conversations.query-handler";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return withCrmPermission(
    CrmEndpointAccessRule.ConversationsUnreadCount,
    async (_, actor) => {
      try {
        return Response.json(
          { unreadCount: await countUnreadConversations(actor) },
          { status: HttpResponseCode.Ok },
        );
      } catch (error) {
        console.error("[crm-conversations] unread count failed", {
          errorName: error instanceof Error ? error.name : typeof error,
        });
        return messageApiError(MessageErrorCode.Internal);
      }
    },
  )(request);
}
