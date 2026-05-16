import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@/common/constants/http/http-response-codes";
import { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import { LeadActorType } from "@/common/constants/leads/activity/lead-actor-types";
import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";
import { withWorkspaceApiAuth } from "@/lib/auth/api";
import { outreachApiError } from "@/lib/workspace/outreach/outreach-api-error";
import { appendLeadActivity } from "@/server/workspace/leads/services/lead-activity-service";
import { outreachMessageParser } from "@/server/workspace/outreach/services/outreach-message-parser";
import { saveGeneratedMessageSchema } from "@/server/workspace/outreach/save-generated-message.schema";
import type { GenerateOutreachResultDto } from "@/common/ai-outreach-generation/generate-outreach-result.dto";
import { PostgresErrorCode } from "@/server/db/core";

function isForeignKeyViolationError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === PostgresErrorCode.ForeignKeyViolation
  );
}

export const runtime = "nodejs";

export const POST = withWorkspaceApiAuth(async (request: NextRequest) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return outreachApiError(
      OutreachErrorCode.ValidationError,
      HttpResponseCode.BadRequest,
    );
  }

  const parsed = saveGeneratedMessageSchema.safeParse(body);
  if (!parsed.success) {
    return outreachApiError(
      OutreachErrorCode.ValidationError,
      HttpResponseCode.BadRequest,
      parsed.error.issues,
    );
  }

  try {
    const parsedMessage = outreachMessageParser.parse(
      parsed.data.channel,
      parsed.data.rawText,
    );

    await appendLeadActivity({
      actorType: LeadActorType.System,
      body: parsedMessage.body,
      leadId: parsed.data.leadId,
      metadata: {
        channel: parsed.data.channel,
        promptKey: parsed.data.promptKey,
        ...(parsedMessage.subject !== undefined
          ? { subject: parsedMessage.subject }
          : {}),
      },
      type: LeadActivityType.MessageDrafted,
    });

    const result: GenerateOutreachResultDto = {
      ok: true,
      channel: parsed.data.channel,
      promptKey: parsed.data.promptKey,
      body: parsedMessage.body,
      ...(parsedMessage.subject !== undefined
        ? { subject: parsedMessage.subject }
        : {}),
    };

    return Response.json(result, { status: HttpResponseCode.Ok });
  } catch (error) {
    if (isForeignKeyViolationError(error)) {
      return outreachApiError(
        OutreachErrorCode.LeadNotFound,
        HttpResponseCode.NotFound,
      );
    }

    console.error("[outreach/save-generated-message]", error);
    return outreachApiError(
      OutreachErrorCode.Internal,
      HttpResponseCode.InternalServerError,
    );
  }
});
