import "server-only";

import type { NextRequest } from "next/server";

import { LeadErrorCode } from "@/common/constants/leads/lead-error-codes";
import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { withWorkspaceApiAuth } from "@/lib/auth/api";
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
      return leadApiError(LeadErrorCode.NotFound, 404);
    }
    return Response.json({ lead }, { status: 200 });
  })(request);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withWorkspaceApiAuth(async (req) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return leadApiError(LeadErrorCode.ValidationError, 400);
    }

    let result;
    try {
      result = await updateLead(id, body);
    } catch {
      return leadApiError(LeadErrorCode.Internal, 500);
    }

    if (!result.ok) {
      if (result.code === LeadErrorCode.NotFound) {
        return leadApiError(LeadErrorCode.NotFound, 404);
      }
      return leadApiError(LeadErrorCode.ValidationError, 400, result.errors);
    }

    return Response.json({ lead: result.lead }, { status: 200 });
  })(request);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return withWorkspaceApiAuth(async () => {
    let result;
    try {
      result = await updateLead(id, {
        lead_status: ContactLeadStatus.Archived,
      });
    } catch {
      return leadApiError(LeadErrorCode.Internal, 500);
    }

    if (!result.ok) {
      return leadApiError(LeadErrorCode.NotFound, 404);
    }

    return Response.json(
      { ok: true, status: ContactLeadStatus.Archived },
      { status: 200 },
    );
  })(request);
}
