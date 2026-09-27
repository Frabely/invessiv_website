import "server-only";

import type { NextRequest } from "next/server";
import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import {
  messageApiError,
  messageApiFailure,
} from "@/lib/workspace/crm/message-api-error";
import { readSendMessageInput } from "@/lib/workspace/crm/message-request-input";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { sendCustomerMessage } from "@/server/portal/command-handler/send-customer-message.command-handler";

export const runtime = "nodejs";
type Context = { params: Promise<{ customerId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { customerId } = await params;
  return withPortalActor(customerId, async (req, actor) => {
    const input = await readSendMessageInput(req);
    if (!input) return messageApiError(MessageErrorCode.ValidationError);
    try {
      const result = await sendCustomerMessage(actor, input);
      if (result.ok)
        return Response.json(
          { message: result.message },
          { status: HttpResponseCode.Created },
        );
      return result.code === MessageErrorCode.RateLimited
        ? messageApiError(result.code, result.retryAfterSeconds)
        : messageApiError(result.code);
    } catch (error) {
      return messageApiFailure(CrmOperation.SendPortalMessage, error);
    }
  })(request);
}
