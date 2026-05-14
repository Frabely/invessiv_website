import { HttpResponseCode } from "@/common/constants/http/http-response-codes";
import { LeadBulkAction } from "@/common/constants/leads/bulk/lead-bulk-actions";
import type { BulkEditLeadsPatch } from "@/common/contracts/leads/bulk-edit-leads-input";
import type { BulkEditLeadsFailedLead } from "@/common/contracts/leads/results/bulk-edit-leads-result";

const BULK_API_ENDPOINT = "/api/workspace/leads/bulk";

type BulkEditSuccess = {
  ok: true;
  updatedCount: number;
  failedLeads: BulkEditLeadsFailedLead[];
};

type BulkEditFailure = {
  ok: false;
  kind: "network" | "server";
};

export type BulkEditSubmitResult = BulkEditSuccess | BulkEditFailure;

export type BulkEditSubmitInput = {
  ids: string[];
  patch: BulkEditLeadsPatch;
};

export async function submitBulkEdit(
  input: BulkEditSubmitInput,
): Promise<BulkEditSubmitResult> {
  try {
    const response = await fetch(BULK_API_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: LeadBulkAction.BulkEdit,
        ids: input.ids,
        patch: input.patch,
      }),
    });

    if (response.status !== HttpResponseCode.Ok) {
      return { ok: false, kind: "server" };
    }

    const data = (await response.json()) as BulkEditSuccess;
    return {
      ok: true,
      updatedCount: data.updatedCount ?? 0,
      failedLeads: data.failedLeads ?? [],
    };
  } catch {
    return { ok: false, kind: "network" };
  }
}
