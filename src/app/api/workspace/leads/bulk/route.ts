import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { LeadBulkAction } from "@invessiv/common/constants/leads/bulk/lead-bulk-actions";
import { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";
import { withWorkspaceApiAuth } from "@/lib/auth/api";
import { leadApiError } from "@/lib/workspace/leads/lead-api-error";
import { bulkArchiveLeads } from "@/server/workspace/leads/command-handler/bulk-archive-leads.command-handler";
import { bulkDeleteLeads } from "@/server/workspace/leads/command-handler/bulk-delete-leads.command-handler";
import { bulkEditLeads } from "@/server/workspace/leads/command-handler/bulk-edit-leads.command-handler";
import { leadBulkActionSchema } from "@/server/workspace/leads/services/bulk-action.schema";

export const runtime = "nodejs";

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

  const parsed = leadBulkActionSchema.safeParse(body);
  if (!parsed.success) {
    return leadApiError(
      LeadErrorCode.ValidationError,
      HttpResponseCode.BadRequest,
      parsed.error.issues,
    );
  }

  try {
    const action = parsed.data.action;

    switch (action) {
      case LeadBulkAction.BulkEdit: {
        const result = await bulkEditLeads({
          ids: parsed.data.ids,
          patch: parsed.data.patch,
        });
        return Response.json(
          {
            ok: result.ok,
            updatedCount: result.updatedCount,
            failedLeads: result.failedLeads,
          },
          { status: HttpResponseCode.Ok },
        );
      }
      case LeadBulkAction.Archive: {
        const result = await bulkArchiveLeads({ ids: parsed.data.ids });
        return Response.json(
          { ok: result.ok, updatedCount: result.updatedCount },
          { status: HttpResponseCode.Ok },
        );
      }
      case LeadBulkAction.Delete: {
        const result = await bulkDeleteLeads({ ids: parsed.data.ids });
        return Response.json(
          { ok: result.ok, deletedCount: result.deletedCount },
          { status: HttpResponseCode.Ok },
        );
      }
      default: {
        const _exhaustive: never = action;
        void _exhaustive;
        return leadApiError(
          LeadErrorCode.Internal,
          HttpResponseCode.InternalServerError,
        );
      }
    }
  } catch {
    return leadApiError(
      LeadErrorCode.Internal,
      HttpResponseCode.InternalServerError,
    );
  }
});
