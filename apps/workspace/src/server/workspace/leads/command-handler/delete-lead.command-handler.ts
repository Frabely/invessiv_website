import "server-only";
import { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";
import type { DeleteLeadResult } from "@invessiv/common/contracts/leads/results/delete-lead-result";
import { leadService } from "@/server/workspace/leads/services/lead/lead-service";

export async function deleteLead(leadId: string): Promise<DeleteLeadResult> {
  const deletedIds = await leadService.delete([leadId]);

  if (deletedIds.length === 0) {
    return { ok: false, code: LeadErrorCode.NotFound };
  }

  return { ok: true };
}
