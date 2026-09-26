import "server-only";

import type { NextRequest } from "next/server";
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { messageApiError } from "@/app/api/message-error";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { updateConversationOwner } from "@/server/workspace/crm/command-handler/update-conversation-owner.command-handler";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.ConversationOwnerUpdate,
    async (req, actor) => {
      const parsed = await readJsonBody(req);
      if (!parsed.ok) return messageApiError(MessageErrorCode.ValidationError);
      try {
        const result = await updateConversationOwner(id, parsed.body, actor);
        if (!result.ok)
          return "conflict" in result && result.conflict
            ? Response.json(result.conflict, {
                status: HttpResponseCode.Conflict,
              })
            : messageApiError(result.code);
        return Response.json(
          { ownerMemberId: result.ownerMemberId, version: result.version },
          { status: HttpResponseCode.Ok },
        );
      } catch (error) {
        console.error("[crm-conversation] owner update failed", {
          errorName: error instanceof Error ? error.name : typeof error,
        });
        return messageApiError(MessageErrorCode.Internal);
      }
    },
  )(request);
}
