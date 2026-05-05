import "server-only";

import { z } from "zod";
import type { NextRequest } from "next/server";

import {
  CONTACT_LEAD_STATUS_VALUES,
  ContactLeadStatus,
} from "@/common/constants/contact/contact-lead-statuses";
import { LeadErrorCode } from "@/common/constants/leads/lead-error-codes";
import { withWorkspaceApiAuth } from "@/lib/auth/api";
import { bulkEditLeads } from "@/server/workspace/leads/command-handler/bulk-edit-leads.command-handler";
import { leadApiError } from "@/lib/workspace/leads/lead-api-error";

export const runtime = "nodejs";

const bulkActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set_status"),
    ids: z.array(z.string()).min(1),
    status: z.enum(CONTACT_LEAD_STATUS_VALUES),
  }),
  z.object({
    action: z.literal("archive"),
    ids: z.array(z.string()).min(1),
  }),
]);

export const POST = withWorkspaceApiAuth(async (request: NextRequest) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return leadApiError(LeadErrorCode.ValidationError, 400);
  }

  const parsed = bulkActionSchema.safeParse(body);
  if (!parsed.success) {
    return leadApiError(
      LeadErrorCode.ValidationError,
      400,
      parsed.error.issues,
    );
  }

  const input =
    parsed.data.action === "archive"
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
