import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";
import { withWorkspaceApiAuth } from "@/lib/auth/api";
import { deleteLead } from "@/server/workspace/leads/command-handler/delete-lead.command-handler";
import { updateLead } from "@/server/workspace/leads/command-handler/update-lead.command-handler";
import { getLeadById } from "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler";
import { leadApiError } from "@/lib/workspace/leads/lead-api-error";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withWorkspaceApiAuth(async () => {
    const lead = await getLeadById(id);
    if (!lead) {
      return leadApiError(LeadErrorCode.NotFound, HttpResponseCode.NotFound);
    }
    return Response.json({ lead }, { status: HttpResponseCode.Ok });
  })(request);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withWorkspaceApiAuth(async (req) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return leadApiError(
        LeadErrorCode.ValidationError,
        HttpResponseCode.BadRequest,
      );
    }

    let result;
    try {
      result = await updateLead(id, body);
    } catch {
      return leadApiError(
        LeadErrorCode.Internal,
        HttpResponseCode.InternalServerError,
      );
    }

    if (!result.ok) {
      if (result.code === LeadErrorCode.NotFound) {
        return leadApiError(LeadErrorCode.NotFound, HttpResponseCode.NotFound);
      }
      if (result.code === LeadErrorCode.EmailExists) {
        return leadApiError(
          LeadErrorCode.EmailExists,
          HttpResponseCode.Conflict,
        );
      }
      if (result.code === LeadErrorCode.CompanyNameExists) {
        return leadApiError(
          LeadErrorCode.CompanyNameExists,
          HttpResponseCode.Conflict,
        );
      }
      return leadApiError(
        LeadErrorCode.ValidationError,
        HttpResponseCode.BadRequest,
        result.errors,
      );
    }

    return Response.json(
      { lead: result.lead },
      { status: HttpResponseCode.Ok },
    );
  })(request);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withWorkspaceApiAuth(async () => {
    let result;
    try {
      result = await deleteLead(id);
    } catch {
      return leadApiError(
        LeadErrorCode.Internal,
        HttpResponseCode.InternalServerError,
      );
    }

    if (!result.ok) {
      return leadApiError(LeadErrorCode.NotFound, HttpResponseCode.NotFound);
    }

    return Response.json({ ok: true }, { status: HttpResponseCode.Ok });
  })(request);
}
