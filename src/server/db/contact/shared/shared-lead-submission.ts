import "server-only";
import type { PreparedLeadRecord } from "@/server/db/records/contact/prepared-lead-record";
import type { PreparedLeadSubmissionRecord } from "@/server/db/records/contact/prepared-lead-submission-record";

export type SharedLeadSubmission = {
  params: unknown[];
  sql: string;
  submissionSource: string;
};

export function buildSharedLeadSubmission(input: {
  lead: PreparedLeadRecord;
  submission: PreparedLeadSubmissionRecord;
}): SharedLeadSubmission {
  const params: unknown[] = [];

  const addParam = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  const leadSource = "upserted_lead";
  const submissionSource = "inserted_submission";

  const sql = `
    ${leadSource} AS (
      INSERT INTO leads (
        id,
        first_name,
        last_name,
        email,
        lead_status,
        created_at,
        updated_at
      )
      VALUES (
        ${addParam(input.lead.id)},
        ${addParam(input.lead.firstName)},
        ${addParam(input.lead.lastName)},
        ${addParam(input.lead.email)},
        ${addParam(input.lead.leadStatus)},
        ${addParam(input.lead.createdAt)},
        ${addParam(input.lead.updatedAt)}
      )
      ON CONFLICT ((LOWER(BTRIM(email))))
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        updated_at = EXCLUDED.updated_at
      RETURNING id
    ),
    ${submissionSource} AS (
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
      SELECT
        ${addParam(input.submission.id)},
        ${leadSource}.id,
        ${addParam(input.submission.requestId)},
        ${addParam(input.submission.channel)},
        ${addParam(input.submission.locale)},
        ${addParam(input.submission.consentAcceptedAt)},
        ${addParam(input.submission.submissionStartedAt ?? null)},
        ${addParam(input.submission.createdAt)},
        ${addParam(input.submission.updatedAt)}
      FROM ${leadSource}
      RETURNING id
    )
  `;

  return {
    params,
    sql,
    submissionSource,
  };
}
