import "server-only";
import { inArray } from "drizzle-orm";

import type { BulkDeleteLeadsResult } from "@/common/contracts/leads/results/bulk-delete-leads-result";
import { getDrizzleDatabaseClient } from "@/server/db/core";
import { leads } from "@/server/db/record-configuration";

export type BulkDeleteLeadsInput = {
  ids: string[];
};

export async function bulkDeleteLeads(
  input: BulkDeleteLeadsInput,
): Promise<BulkDeleteLeadsResult> {
  if (input.ids.length === 0) {
    return { ok: true, deletedCount: 0 };
  }

  const db = getDrizzleDatabaseClient();

  const deleted = await db
    .delete(leads)
    .where(inArray(leads.id, input.ids))
    .returning({ id: leads.id });

  return { ok: true, deletedCount: deleted.length };
}
