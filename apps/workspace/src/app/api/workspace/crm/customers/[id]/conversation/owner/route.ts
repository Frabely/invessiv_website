import "server-only";

import type { NextRequest } from "next/server";
import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { updateConversationOwnerInputSchema } from "@invessiv/common/contracts/crm/update-conversation-owner.input";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import {
  messageApiError,
  messageApiFailure,
} from "@/lib/workspace/crm/message-api-error";
import { updateConversationOwner } from "@/server/workspace/crm/command-handler/update-conversation-owner.command-handler";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.ConversationOwnerUpdate,
    async (req, actor) => {
      const json = await readJsonBody(req);
      const input = json.ok
        ? updateConversationOwnerInputSchema.safeParse(json.body)
        : null;
      if (!input?.success)
        return messageApiError(MessageErrorCode.ValidationError);
      try {
        const result = await updateConversationOwner(id, input.data, actor);
        if (result.ok)
          return Response.json(
            { ownerMemberId: result.ownerMemberId, version: result.version },
            { status: HttpResponseCode.Ok },
          );
        return result.code === MessageErrorCode.VersionConflict
          ? Response.json(result.conflict, {
              status: HttpResponseCode.Conflict,
            })
          : messageApiError(result.code);
      } catch (error) {
        return messageApiFailure(CrmOperation.UpdateConversationOwner, error);
      }
    },
  )(request);
}
