import "server-only";

import type { NextRequest } from "next/server";

import { LeadErrorCode } from "@/common/constants/leads/lead-error-codes";
import { withWorkspaceApiAuth } from "@/lib/auth/api";
import { createLead } from "@/server/workspace/leads/command-handler/create-lead.command-handler";
import { listLeads } from "@/server/workspace/leads/query-handler/list-leads.query-handler";
import { leadFilterSchema } from "@/server/workspace/leads/services/lead-filter/lead-filter.schema";
import { leadApiError } from "@/lib/workspace/leads/lead-api-error";

export const runtime = "nodejs";

export const GET = withWorkspaceApiAuth(async (request: NextRequest) => {
  const searchParams = new URL(request.url).searchParams;

  const rawFilter = {
    status: searchParams.get("status") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    date_from: searchParams.get("date_from") ?? undefined,
    date_to: searchParams.get("date_to") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    page: searchParams.has("page")
      ? Number(searchParams.get("page"))
      : undefined,
    score_min: searchParams.has("score_min")
      ? Number(searchParams.get("score_min"))
      : undefined,
  };

  const parsed = leadFilterSchema.safeParse(rawFilter);
  if (!parsed.success) {
    return leadApiError(
      LeadErrorCode.ValidationError,
      400,
      parsed.error.issues,
    );
  }

  const result = await listLeads(parsed.data);
  return Response.json(result, { status: 200 });
});

export const POST = withWorkspaceApiAuth(async (request: NextRequest) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return leadApiError(LeadErrorCode.ValidationError, 400);
  }

  let result;
  try {
    result = await createLead(body);
  } catch {
    return leadApiError(LeadErrorCode.Internal, 500);
  }

  if (!result.ok) {
    if (result.code === LeadErrorCode.EmailExists) {
      return leadApiError(LeadErrorCode.EmailExists, 409);
    }
    return leadApiError(LeadErrorCode.ValidationError, 400, result.errors);
  }

  return Response.json({ lead: result.lead }, { status: 201 });
});
