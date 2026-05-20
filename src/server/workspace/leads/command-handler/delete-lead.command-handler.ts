import "server-only";
import { eq } from "drizzle-orm";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { leads } from "@invessiv/db/record-configuration";
import { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";
import type { DeleteLeadResult } from "@invessiv/common/contracts/leads/results/delete-lead-result";

export async function deleteLead(leadId: string): Promise<DeleteLeadResult> {
  const db = getDrizzleDatabaseClient();

  const deleted = await db
    .delete(leads)
    .where(eq(leads.id, leadId))
    .returning({ id: leads.id });

  if (deleted.length === 0) {
    return { ok: false, code: LeadErrorCode.NotFound };
  }

  return { ok: true };
}
