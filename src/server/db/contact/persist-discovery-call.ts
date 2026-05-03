import "server-only";
import {
  getDrizzleDatabaseClient,
  hasDatabaseConnectionString,
} from "@/server/db/core";
import type { DiscoveryCallPersistInput } from "@/server/db/contracts/contact/discovery-call-persist-input";
import { type PersistSubmissionResult } from "@/server/db/contracts/contact/contact-persist-result";
import { persistSharedLeadSubmission } from "@/server/db/contact/shared/shared-lead-submission";
import { leadCallContacts } from "@/server/db/record-configuration/lead-call-contacts";

export async function persistDiscoveryCallLead(
  discoveryCallPersistInput: DiscoveryCallPersistInput,
): Promise<PersistSubmissionResult> {
  if (!hasDatabaseConnectionString()) {
    return { persisted: false };
  }

  const db = getDrizzleDatabaseClient();

  await db.transaction(async (tx) => {
    const { submissionId } = await persistSharedLeadSubmission(tx, {
      lead: discoveryCallPersistInput.lead,
      submission: discoveryCallPersistInput.lead_submission,
    });

    await tx.insert(leadCallContacts).values({
      created_at: discoveryCallPersistInput.call_contact.created_at,
      id: discoveryCallPersistInput.call_contact.id,
      lead_submission_id: submissionId,
      message: discoveryCallPersistInput.call_contact.message ?? null,
      updated_at: discoveryCallPersistInput.call_contact.updated_at,
    });
  });

  return {
    persisted: true,
    submissionId: discoveryCallPersistInput.lead_submission.id,
  };
}
