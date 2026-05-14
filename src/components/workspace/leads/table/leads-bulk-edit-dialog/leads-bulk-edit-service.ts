import { HttpResponseCode } from "@/common/constants/http/http-response-codes";
import { LeadBulkAction } from "@/common/constants/leads/bulk/lead-bulk-actions";
import type { BulkSubmitFailureKind as BulkSubmitFailureKindType } from "@/common/constants/leads/bulk/bulk-submit-failure-kinds";
import { BulkSubmitFailureKind } from "@/common/constants/leads/bulk/bulk-submit-failure-kinds";
import { BULK_API_ENDPOINT } from "@/common/constants/leads/bulk/bulk-api-endpoint";
import type { BulkEditLeadsPatch } from "@/common/contracts/leads/bulk-edit-leads-input";
import type { BulkEditLeadsFailedLead } from "@/common/contracts/leads/results/bulk-edit-leads-result";

type BulkEditSuccess = {
  ok: true;
  updatedCount: number;
  failedLeads: BulkEditLeadsFailedLead[];
};

type BulkEditFailure = {
  ok: false;
  kind: BulkSubmitFailureKindType;
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
      return { ok: false, kind: BulkSubmitFailureKind.Server };
    }

    const data = (await response.json()) as BulkEditSuccess;
    return {
      ok: true,
      updatedCount: data.updatedCount ?? 0,
      failedLeads: data.failedLeads ?? [],
    };
  } catch {
    return { ok: false, kind: BulkSubmitFailureKind.Network };
  }
}
