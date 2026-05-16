import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@/common/constants/http/http-response-codes";
import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";
import { withWorkspaceApiAuth } from "@/lib/auth/api";
import { outreachApiError } from "@/lib/workspace/outreach/outreach-api-error";
import { getLeadById } from "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler";
import { outreachPromptService } from "@/server/workspace/outreach/services/outreach-prompt-service";
import { buildOutreachPromptSchema } from "@/server/workspace/outreach/build-outreach-prompt.schema";

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

  const parsed = buildOutreachPromptSchema.safeParse(body);
  if (!parsed.success) {
    return outreachApiError(
      OutreachErrorCode.ValidationError,
      HttpResponseCode.BadRequest,
      parsed.error.issues,
    );
  }

  try {
    const lead = await getLeadById(parsed.data.leadId);
    if (!lead) {
      return outreachApiError(
        OutreachErrorCode.LeadNotFound,
        HttpResponseCode.NotFound,
      );
    }

    const { systemPrompt, userPrompt } =
      outreachPromptService.buildPromptMessages(
        lead,
        parsed.data.promptKey,
        parsed.data.channel,
        {
          includeImprovements: parsed.data.includeImprovements,
          contextNote: parsed.data.contextNote,
        },
      );

    return Response.json(
      {
        systemPrompt,
        userPrompt,
      },
      { status: HttpResponseCode.Ok },
    );
  } catch {
    return outreachApiError(
      OutreachErrorCode.Internal,
      HttpResponseCode.InternalServerError,
    );
  }
});
