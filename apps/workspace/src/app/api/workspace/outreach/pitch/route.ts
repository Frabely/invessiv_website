import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { LeadPitchErrorCode } from "@invessiv/common/constants/leads/outreach/lead-pitch-error-codes";
import { withWorkspaceApiAuth } from "@/lib/auth/api";
import { pitchApiError } from "@/lib/workspace/outreach/pitch-api-error";
import { generateLeadPitch } from "@/server/workspace/outreach/command-handler/generate-lead-pitch.command-handler";
import {
  generateLeadPitchSchema,
  getLatestLeadPitchSchema,
} from "@/server/workspace/outreach/generate-lead-pitch.schema";
import { getLatestLeadPitch } from "@/server/workspace/outreach/query-handler/get-latest-lead-pitch.query-handler";

export const runtime = "nodejs";

function readPitchErrorCode(error: unknown): LeadPitchErrorCode | null {
  if (!(error instanceof Error)) {
    return null;
  }

  return (
    Object.values(LeadPitchErrorCode).find(
      (value) => value === error.message,
    ) ?? null
  );
}

function unexpectedPitchError(stage: "generate" | "load", error: unknown) {
  const errorId = crypto.randomUUID();
  console.error("[lead-pitch] unexpected failure", {
    errorId,
    stage,
    errorName: error instanceof Error ? error.name : typeof error,
  });

  return pitchApiError(LeadPitchErrorCode.Internal, undefined, errorId);
}

export const POST = withWorkspaceApiAuth(async (request: NextRequest) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return pitchApiError(LeadPitchErrorCode.ValidationError);
  }

  const parsed = generateLeadPitchSchema.safeParse(body);
  if (!parsed.success) {
    return pitchApiError(
      LeadPitchErrorCode.ValidationError,
      parsed.error.issues,
    );
  }

  try {
    const result = await generateLeadPitch(parsed.data);

    if (!result.ok) {
      return pitchApiError(result.code);
    }

    return Response.json(result, { status: HttpResponseCode.Ok });
  } catch (error) {
    const code = readPitchErrorCode(error);
    return code ? pitchApiError(code) : unexpectedPitchError("generate", error);
  }
});

export const GET = withWorkspaceApiAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const parsed = getLatestLeadPitchSchema.safeParse({
    leadId: searchParams.get("leadId"),
    channel: searchParams.get("channel"),
  });

  if (!parsed.success) {
    return pitchApiError(
      LeadPitchErrorCode.ValidationError,
      parsed.error.issues,
    );
  }

  try {
    const draft = await getLatestLeadPitch(
      parsed.data.leadId,
      parsed.data.channel,
    );

    return Response.json({ ok: true, draft }, { status: HttpResponseCode.Ok });
  } catch (error) {
    return unexpectedPitchError("load", error);
  }
});
