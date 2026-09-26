import "server-only";

import type { NextRequest } from "next/server";
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { messageApiError } from "@/app/api/message-error";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { markPortalConversationRead } from "@/server/portal/command-handler/mark-portal-conversation-read.command-handler";

export const runtime = "nodejs";
type Context = { params: Promise<{ customerId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { customerId } = await params;
  return withPortalActor(customerId, async (_, actor) => {
    try {
      const result = await markPortalConversationRead(actor);
      return result.ok
        ? Response.json({ ok: true }, { status: HttpResponseCode.Ok })
        : messageApiError(result.code);
    } catch (error) {
      console.error("[portal-conversation] mark read failed", {
        errorName: error instanceof Error ? error.name : typeof error,
      });
      return messageApiError(MessageErrorCode.Internal);
    }
  })(request);
}
