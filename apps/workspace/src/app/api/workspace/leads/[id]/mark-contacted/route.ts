import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";
import { withWorkspaceApiAuth } from "@/lib/auth/api";
import { leadApiError } from "@/lib/workspace/leads/lead-api-error";
import { markLeadContacted } from "@/server/workspace/leads/command-handler/mark-lead-contacted.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withWorkspaceApiAuth(async () => {
    let result;
    try {
      result = await markLeadContacted(id);
    } catch {
      return leadApiError(
        LeadErrorCode.Internal,
        HttpResponseCode.InternalServerError,
      );
    }

    if (!result.ok) {
      return leadApiError(LeadErrorCode.NotFound, HttpResponseCode.NotFound);
    }

    return Response.json(result, { status: HttpResponseCode.Ok });
  })(request);
}
