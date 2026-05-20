import "server-only";
import { inArray } from "drizzle-orm";

import type { BulkDeleteLeadsResult } from "@invessiv/common/contracts/leads/results/bulk-delete-leads-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { leads } from "@invessiv/db/record-configuration";

export type BulkDeleteLeadsInput = {
  ids: string[];
};

// TODO(CR #6 / ARCHITECTURE-open-items #1): wenn Ownership-Modell eingeführt wird,
// `where user_id = $caller` ergänzen — Hard-Delete ohne Scope ist besonders kritisch.
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
