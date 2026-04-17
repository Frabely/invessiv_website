import "server-only";
import type { LeadRecord } from "@/server/db/records/contact/lead-record";
import type { LeadSubmissionRecord } from "@/server/db/records/contact/lead-submission-record";

export type SharedLeadSubmission = {
  params: unknown[];
  sql: string;
  submissionSource: string;
};

export function buildSharedLeadSubmission(input: {
  lead: LeadRecord;
  submission: LeadSubmissionRecord;
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
        ${addParam(input.lead.first_name)},
        ${addParam(input.lead.last_name)},
        ${addParam(input.lead.email)},
        ${addParam(input.lead.lead_status)},
        ${addParam(input.lead.created_at)},
        ${addParam(input.lead.updated_at)}
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
        ${addParam(input.submission.request_id)},
        ${addParam(input.submission.channel)},
        ${addParam(input.submission.locale)},
        ${addParam(input.submission.consent_accepted_at)},
        ${addParam(input.submission.submission_started_at ?? null)},
        ${addParam(input.submission.created_at)},
        ${addParam(input.submission.updated_at)}
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
