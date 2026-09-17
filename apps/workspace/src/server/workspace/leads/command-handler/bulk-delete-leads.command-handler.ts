import "server-only";

import type { BulkDeleteLeadsResult } from "@invessiv/common/contracts/leads/results/bulk-delete-leads-result";
import { leadService } from "@/server/workspace/leads/services/lead/lead-service";

type BulkDeleteLeadsInput = {
  ids: string[];
};

// TODO(CR #6 / ARCHITECTURE-open-items #1): once an ownership model exists, add
// `where user_id = $caller` — a hard delete without scope is especially critical.
export async function bulkDeleteLeads(
  input: BulkDeleteLeadsInput,
): Promise<BulkDeleteLeadsResult> {
  if (input.ids.length === 0) {
    return { ok: true, deletedCount: 0 };
  }

  const deletedIds = await leadService.delete(input.ids);

  return { ok: true, deletedCount: deletedIds.length };
}
