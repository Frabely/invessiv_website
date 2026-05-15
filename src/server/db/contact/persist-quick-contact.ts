import "server-only";
import {
  getDrizzleDatabaseClient,
  hasDatabaseConnectionString,
} from "@/server/db/core";
import type { QuickContactPersistInput } from "@/server/db/contracts/contact/quick-contact-persist-input";
import { type PersistSubmissionResult } from "@/server/db/contracts/contact/contact-persist-result";
import { persistSharedLeadSubmission } from "@/server/db/contact/shared/shared-lead-submission";
import { leadEmailContacts } from "@/server/db/record-configuration/lead-email-contacts";

export async function persistQuickContactLead(
  quickContactPersistInput: QuickContactPersistInput,
): Promise<PersistSubmissionResult> {
  if (!hasDatabaseConnectionString()) {
    return { persisted: false };
  }

  const db = getDrizzleDatabaseClient();

  await db.transaction(async (tx) => {
    const sharedResult = await persistSharedLeadSubmission(tx, {
      lead: quickContactPersistInput.lead,
      submission: quickContactPersistInput.lead_submission,
    });

    await tx.insert(leadEmailContacts).values({
      created_at: quickContactPersistInput.lead_email_contact.created_at,
      id: quickContactPersistInput.lead_email_contact.id,
      lead_submission_id: sharedResult.submissionId,
      message: quickContactPersistInput.lead_email_contact.message,
      updated_at: quickContactPersistInput.lead_email_contact.updated_at,
    });
  });

  return {
    persisted: true,
    submissionId: quickContactPersistInput.lead_submission.id,
  };
}
