import "server-only";
import {
  getDatabaseClient,
  hasDatabaseConnectionString,
} from "@/server/db/client";
import type { DiscoveryCallPersistInput } from "@/server/db/persist-input/contact/discovery-call-persist-input";
import { type PersistSubmissionResult } from "@/server/db/contact/submission-persistence";
import { buildSharedLeadSubmission } from "@/server/db/contact/shared/shared-lead-submission";

export async function persistDiscoveryCallLead(
  discoveryCallPersistInput: DiscoveryCallPersistInput,
): Promise<PersistSubmissionResult> {
  if (!hasDatabaseConnectionString()) {
    return { persisted: false };
  }

  const sql = getDatabaseClient();
  const sharedLeadSubmission = buildSharedLeadSubmission({
    lead: discoveryCallPersistInput.lead,
    submission: discoveryCallPersistInput.lead_submission,
  });
  const params = [...sharedLeadSubmission.params];
  const addParam = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  const query = `
    WITH ${sharedLeadSubmission.sql}
    INSERT INTO lead_call_contacts (
      id,
      lead_submission_id,
      message,
      created_at,
      updated_at
    )
    SELECT
      ${addParam(discoveryCallPersistInput.call_contact.id)},
      ${sharedLeadSubmission.submissionSource}.id,
      ${addParam(discoveryCallPersistInput.call_contact.message ?? null)},
      ${addParam(discoveryCallPersistInput.call_contact.created_at)},
      ${addParam(discoveryCallPersistInput.call_contact.updated_at)}
    FROM ${sharedLeadSubmission.submissionSource}
  `;

  await sql.query(query, params);

  return {
    persisted: true,
    submissionId: discoveryCallPersistInput.lead_submission.id,
  };
}
