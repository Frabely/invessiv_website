import "server-only";
import type { NeonQueryFunctionInTransaction } from "@neondatabase/serverless";
import {
  getDatabaseClient,
  hasDatabaseConnectionString,
} from "@/server/db/client";
import type { DiscoveryCallPersistInput } from "@/server/db/records/contact/discovery-call-persist-input";
import { persistLead } from "@/server/db/contact/lead-persistence";
import {
  persistSubmission,
  type PersistSubmissionResult,
} from "@/server/db/contact/submission-persistence";

type TransactionExecutor = (
  callback: (
    tx: NeonQueryFunctionInTransaction<boolean, boolean>,
  ) => Promise<void>,
) => Promise<void>;

export async function persistDiscoveryCallLead(
  write: DiscoveryCallPersistInput,
): Promise<PersistSubmissionResult> {
  if (!hasDatabaseConnectionString()) {
    return { persisted: false };
  }

  const sql = getDatabaseClient();
  const runTransaction = sql.transaction as unknown as TransactionExecutor;

  await runTransaction(
    async (tx: NeonQueryFunctionInTransaction<boolean, boolean>) => {
      const leadResult = await persistLead(tx, write.lead);
      const leadId = leadResult.leadId ?? write.lead.id;

      await persistSubmission(tx, leadId, write.submission);
      await tx`
      INSERT INTO lead_call_contacts (
        id,
        lead_submission_id,
        message,
        created_at,
        updated_at
      )
      VALUES (
        ${write.callContact.id},
        ${write.callContact.leadSubmissionId},
        ${write.callContact.message ?? null},
        ${write.callContact.createdAt},
        ${write.callContact.updatedAt}
      )
    `;
    },
  );

  return {
    persisted: true,
    submissionId: write.submission.id,
  };
}
