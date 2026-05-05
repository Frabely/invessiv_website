import "server-only";

import type { NextRequest } from "next/server";

import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { LeadErrorCode } from "@/common/constants/leads/lead-error-codes";
import { withWorkspaceApiAuth } from "@/lib/auth/api";
import { bulkEditLeads } from "@/server/workspace/leads/command-handler/bulk-edit-leads.command-handler";
import { leadApiError } from "@/lib/workspace/leads/lead-api-error";
import { LeadBulkAction, leadBulkActionSchema } from "./bulk-action-schema";

export const runtime = "nodejs";

export const POST = withWorkspaceApiAuth(async (request: NextRequest) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return leadApiError(LeadErrorCode.ValidationError, 400);
  }

  const parsed = leadBulkActionSchema.safeParse(body);
  if (!parsed.success) {
    return leadApiError(
      LeadErrorCode.ValidationError,
      400,
      parsed.error.issues,
    );
  }

  const input =
    parsed.data.action === LeadBulkAction.Archive
      ? { ids: parsed.data.ids, status: ContactLeadStatus.Archived }
      : { ids: parsed.data.ids, status: parsed.data.status };

  try {
    const result = await bulkEditLeads(input);
    return Response.json(
      { ok: result.ok, updatedCount: result.updatedCount },
      { status: 200 },
    );
  } catch {
    return leadApiError(LeadErrorCode.Internal, 500);
  }
});
