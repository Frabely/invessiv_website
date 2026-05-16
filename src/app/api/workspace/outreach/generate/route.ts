import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@/common/constants/http/http-response-codes";
import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";
import { withWorkspaceApiAuth } from "@/lib/auth/api";
import { outreachApiError } from "@/lib/workspace/outreach/outreach-api-error";
import { generateOutreachMessage } from "@/server/workspace/outreach/command-handler/generate-outreach-message.command-handler";
import { generateOutreachMessageSchema } from "@/server/workspace/outreach/generate-outreach-message.schema";

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

  const parsed = generateOutreachMessageSchema.safeParse(body);
  if (!parsed.success) {
    return outreachApiError(
      OutreachErrorCode.ValidationError,
      HttpResponseCode.BadRequest,
      parsed.error.issues,
    );
  }

  try {
    const result = await generateOutreachMessage(parsed.data);

    if (!result.ok) {
      switch (result.code) {
        case OutreachErrorCode.ValidationError:
          return outreachApiError(
            OutreachErrorCode.ValidationError,
            HttpResponseCode.BadRequest,
          );
        case OutreachErrorCode.LeadNotFound:
          return outreachApiError(
            OutreachErrorCode.LeadNotFound,
            HttpResponseCode.NotFound,
          );
        case OutreachErrorCode.ProviderUnavailable:
          return outreachApiError(
            OutreachErrorCode.ProviderUnavailable,
            HttpResponseCode.ServiceUnavailable,
          );
        case OutreachErrorCode.NotConfigured:
          return outreachApiError(
            OutreachErrorCode.NotConfigured,
            HttpResponseCode.ServiceUnavailable,
          );
        case OutreachErrorCode.Internal:
          return outreachApiError(
            OutreachErrorCode.Internal,
            HttpResponseCode.InternalServerError,
          );
        default:
          return outreachApiError(
            OutreachErrorCode.Internal,
            HttpResponseCode.InternalServerError,
          );
      }
    }

    return Response.json(result, { status: HttpResponseCode.Ok });
  } catch {
    return outreachApiError(
      OutreachErrorCode.Internal,
      HttpResponseCode.InternalServerError,
    );
  }
});
