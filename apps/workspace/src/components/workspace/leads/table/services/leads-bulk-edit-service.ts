import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { LeadBulkAction } from "@invessiv/common/constants/leads/bulk/lead-bulk-actions";
import { BulkSubmitFailureKind } from "@invessiv/common/constants/leads/bulk/bulk-submit-failure-kinds";
import { BULK_API_ENDPOINT } from "@invessiv/common/constants/leads/bulk/bulk-api-endpoint";
import type {
  BulkActionSubmitInputDto,
  BulkActionSubmitResultDto,
  BulkEditSubmitInputDto,
  BulkEditSubmitResultDto,
  BulkEditSubmitSuccessDto,
} from "@invessiv/common/contracts/leads";

function buildBulkActionRequestBody(action: string, ids: string[]) {
  return JSON.stringify({
    action,
    ids,
  });
}

async function submitBulkAction(
  action: typeof LeadBulkAction.Archive | typeof LeadBulkAction.Delete,
  input: BulkActionSubmitInputDto,
): Promise<BulkActionSubmitResultDto> {
  try {
    const response = await fetch(BULK_API_ENDPOINT, {
      headers: { "content-type": "application/json" },
      method: "POST",
      body: buildBulkActionRequestBody(action, input.ids),
    });

    if (response.status !== HttpResponseCode.Ok) {
      return { ok: false, kind: BulkSubmitFailureKind.Server };
    }

    return { ok: true };
  } catch {
    return { ok: false, kind: BulkSubmitFailureKind.Network };
  }
}

async function edit(
  input: BulkEditSubmitInputDto,
): Promise<BulkEditSubmitResultDto> {
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

    const data = (await response.json()) as Partial<BulkEditSubmitSuccessDto>;
    return {
      ok: true,
      updatedCount: data.updatedCount ?? 0,
      failedLeads: data.failedLeads ?? [],
    };
  } catch {
    return { ok: false, kind: BulkSubmitFailureKind.Network };
  }
}

async function archiveLeads(
  input: BulkActionSubmitInputDto,
): Promise<BulkActionSubmitResultDto> {
  return submitBulkAction(LeadBulkAction.Archive, input);
}

async function deleteLeads(
  input: BulkActionSubmitInputDto,
): Promise<BulkActionSubmitResultDto> {
  return submitBulkAction(LeadBulkAction.Delete, input);
}

export const leadsBulkEditService = {
  archive: archiveLeads,
  delete: deleteLeads,
  edit,
} as const;
