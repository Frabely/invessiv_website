import "server-only";
import {
  getDrizzleDatabaseClient,
  hasDatabaseConnectionString,
} from "@invessiv/db/core";
import { type PersistSubmissionResult } from "@invessiv/db/contracts/contact/contact-persist-result";
import type { LinkedInPostDeliveryPersistInput } from "@invessiv/db/contracts/contact/linkedin-post-delivery-persist-input";
import { persistSharedLeadSubmission } from "@invessiv/db/contact/shared/shared-lead-submission";
import { leadEmailContacts } from "@invessiv/db/record-configuration/lead-email-contacts";

export async function persistLinkedInPostDeliveryLead(
  deliveryPersistInput: LinkedInPostDeliveryPersistInput,
): Promise<PersistSubmissionResult> {
  if (!hasDatabaseConnectionString()) {
    return { persisted: false };
  }

  const db = getDrizzleDatabaseClient();

  await db.transaction(async (tx) => {
    const sharedResult = await persistSharedLeadSubmission(tx, {
      lead: deliveryPersistInput.lead,
      submission: deliveryPersistInput.lead_submission,
    });

    await tx.insert(leadEmailContacts).values({
      created_at: deliveryPersistInput.lead_email_contact.created_at,
      id: deliveryPersistInput.lead_email_contact.id,
      lead_submission_id: sharedResult.submissionId,
      message: deliveryPersistInput.lead_email_contact.message,
      updated_at: deliveryPersistInput.lead_email_contact.updated_at,
    });
  });

  return {
    persisted: true,
    submissionId: deliveryPersistInput.lead_submission.id,
  };
}
