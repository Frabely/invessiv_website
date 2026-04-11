import "server-only";
import type { NeonQueryFunctionInTransaction } from "@neondatabase/serverless";
import type { PreparedLeadSubmissionRecord } from "@/common/contracts/contact/records/prepared-lead-submission-record";

export type PersistSubmissionResult = {
  persisted: boolean;
  submissionId?: string;
};

export async function persistSubmission(
  tx: NeonQueryFunctionInTransaction<boolean, boolean>,
  leadId: string,
  submission: PreparedLeadSubmissionRecord,
): Promise<PersistSubmissionResult> {
  await tx`
    INSERT INTO lead_submissions (
      id,
      lead_id,
      request_id,
      channel,
      locale,
      consent_accepted_at,
      submission_started_at,
      created_at,
      updated_at
    )
    VALUES (
      ${submission.id},
      ${leadId},
      ${submission.requestId},
      ${submission.channel},
      ${submission.locale},
      ${submission.consentAcceptedAt},
      ${submission.submissionStartedAt ?? null},
      ${submission.createdAt},
      ${submission.updatedAt}
    )
  `;

  return {
    persisted: true,
    submissionId: submission.id,
  };
}
