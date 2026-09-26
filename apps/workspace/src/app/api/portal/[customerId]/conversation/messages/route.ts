import "server-only";

import type { NextRequest } from "next/server";
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { messageApiError } from "@/app/api/message-error";
import { readJsonBody } from "@/lib/http/read-json-body";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { sendCustomerMessage } from "@/server/portal/command-handler/send-customer-message.command-handler";

export const runtime = "nodejs";
type Context = { params: Promise<{ customerId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { customerId } = await params;
  return withPortalActor(customerId, async (req, actor) => {
    const parsed = await readJsonBody(req);
    if (!parsed.ok) return messageApiError(MessageErrorCode.ValidationError);
    try {
      const body =
        typeof parsed.body === "object" &&
        parsed.body !== null &&
        "body" in parsed.body
          ? parsed.body.body
          : undefined;
      const result = await sendCustomerMessage(actor, body);
      return result.ok
        ? Response.json(
            { message: result.message },
            { status: HttpResponseCode.Created },
          )
        : messageApiError(result.code);
    } catch (error) {
      console.error("[portal-message] send failed", {
        errorName: error instanceof Error ? error.name : typeof error,
      });
      return messageApiError(MessageErrorCode.Internal);
    }
  })(request);
}
