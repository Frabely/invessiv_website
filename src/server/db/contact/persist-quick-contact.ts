import "server-only";
import {
  getDatabaseClient,
  hasDatabaseConnectionString,
} from "@/server/db/client";
import type { QuickContactPersistInput } from "@/server/db/persist-input/contact/quick-contact-persist-input";
import { type PersistSubmissionResult } from "@/server/db/contact/submission-persistence";
import { buildSharedLeadSubmission } from "@/server/db/contact/shared/shared-lead-submission";

export async function persistQuickContactLead(
  quickContactPersistInput: QuickContactPersistInput,
): Promise<PersistSubmissionResult> {
  if (!hasDatabaseConnectionString()) {
    return { persisted: false };
  }

  const sql = getDatabaseClient();
  const sharedLeadSubmission = buildSharedLeadSubmission({
    lead: quickContactPersistInput.lead,
    submission: quickContactPersistInput.submission,
  });
  const params = [...sharedLeadSubmission.params];
  const addParam = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  const query = `
    WITH ${sharedLeadSubmission.sql}
    INSERT INTO lead_email_contacts (
      id,
      lead_submission_id,
      message,
      created_at,
      updated_at
    )
    SELECT
      ${addParam(quickContactPersistInput.emailContact.id)},
      ${sharedLeadSubmission.submissionSource}.id,
      ${addParam(quickContactPersistInput.emailContact.message)},
      ${addParam(quickContactPersistInput.emailContact.createdAt)},
      ${addParam(quickContactPersistInput.emailContact.updatedAt)}
    FROM ${sharedLeadSubmission.submissionSource}
  `;

  await sql.query(query, params);

  return {
    persisted: true,
    submissionId: quickContactPersistInput.submission.id,
  };
}
