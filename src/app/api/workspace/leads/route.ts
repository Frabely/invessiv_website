import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@/common/constants/http/http-response-codes";
import { LeadErrorCode } from "@/common/constants/leads/errors/lead-error-codes";
import { LeadListQueryParam } from "@/common/constants/leads/list/lead-list-query-params";
import { withWorkspaceApiAuth } from "@/lib/auth/api";
import { createLead } from "@/server/workspace/leads/command-handler/create-lead.command-handler";
import { listLeads } from "@/server/workspace/leads/query-handler/list-leads.query-handler";
import { createLeadSchema } from "@/server/workspace/leads/services/create-lead/create-lead.schema";
import { leadFilterSchema } from "@/server/workspace/leads/services/lead-filter/lead-filter.schema";
import { leadApiError } from "@/lib/workspace/leads/lead-api-error";

export const runtime = "nodejs";

export const GET = withWorkspaceApiAuth(async (request: NextRequest) => {
  const searchParams = new URL(request.url).searchParams;

  const rawFilter = {
    [LeadListQueryParam.Status]:
      searchParams.get(LeadListQueryParam.Status) ?? undefined,
    [LeadListQueryParam.Source]:
      searchParams.get(LeadListQueryParam.Source) ?? undefined,
    [LeadListQueryParam.Category]:
      searchParams.get(LeadListQueryParam.Category) ?? undefined,
    [LeadListQueryParam.Search]:
      searchParams.get(LeadListQueryParam.Search) ?? undefined,
    [LeadListQueryParam.DateFrom]:
      searchParams.get(LeadListQueryParam.DateFrom) ?? undefined,
    [LeadListQueryParam.DateTo]:
      searchParams.get(LeadListQueryParam.DateTo) ?? undefined,
    [LeadListQueryParam.Sort]:
      searchParams.get(LeadListQueryParam.Sort) ?? undefined,
    [LeadListQueryParam.Page]: searchParams.has(LeadListQueryParam.Page)
      ? Number(searchParams.get(LeadListQueryParam.Page))
      : undefined,
    [LeadListQueryParam.ScoreMin]: searchParams.has(LeadListQueryParam.ScoreMin)
      ? Number(searchParams.get(LeadListQueryParam.ScoreMin))
      : undefined,
  };

  const parsed = leadFilterSchema.safeParse(rawFilter);
  if (!parsed.success) {
    return leadApiError(
      LeadErrorCode.ValidationError,
      HttpResponseCode.BadRequest,
      parsed.error.issues,
    );
  }

  const result = await listLeads(parsed.data);
  return Response.json(result, { status: HttpResponseCode.Ok });
});

export const POST = withWorkspaceApiAuth(async (request: NextRequest) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return leadApiError(
      LeadErrorCode.ValidationError,
      HttpResponseCode.BadRequest,
    );
  }

  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return leadApiError(
      LeadErrorCode.ValidationError,
      HttpResponseCode.BadRequest,
      parsed.error.issues,
    );
  }

  let result;
  try {
    result = await createLead(parsed.data);
  } catch {
    return leadApiError(
      LeadErrorCode.Internal,
      HttpResponseCode.InternalServerError,
    );
  }

  if (!result.ok) {
    if (result.code === LeadErrorCode.EmailExists) {
      return leadApiError(LeadErrorCode.EmailExists, HttpResponseCode.Conflict);
    }
    return leadApiError(
      LeadErrorCode.ValidationError,
      HttpResponseCode.BadRequest,
      result.errors,
    );
  }

  return Response.json(
    { lead: result.lead },
    { status: HttpResponseCode.Created },
  );
});
