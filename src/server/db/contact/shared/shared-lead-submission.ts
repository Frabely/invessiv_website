import "server-only";
import { sql } from "drizzle-orm";
import type { ContactDatabaseTransaction } from "@/server/db/core";
import type { ContactLeadPersistRecord } from "@/server/db/contracts/contact/contact-lead-persist-record";
import type { ContactLeadSubmissionPersistRecord } from "@/server/db/contracts/contact/contact-lead-submission-persist-record";
import { leadSubmissions } from "@/server/db/record-configuration/lead-submissions";

export type PersistedSharedLeadSubmission = {
  leadId: string;
  submissionId: string;
};

export async function persistSharedLeadSubmission(
  tx: ContactDatabaseTransaction,
  input: {
    lead: ContactLeadPersistRecord;
    submission: ContactLeadSubmissionPersistRecord;
  },
): Promise<PersistedSharedLeadSubmission> {
  const leadUpsertResult = await tx.execute<{ id: string }>(sql`
    insert into leads (
      id,
      display_name,
      first_name,
      last_name,
      email,
      source,
      lead_status,
      created_at,
      updated_at
    )
    values (
      ${input.lead.id},
      ${input.lead.display_name},
      ${input.lead.first_name},
      ${input.lead.last_name},
      ${input.lead.email},
      ${input.lead.source},
      ${input.lead.lead_status},
      ${input.lead.created_at},
      ${input.lead.updated_at}
    ) on conflict ((lower(btrim(email))))
    where email is not null
    do update set
      display_name = excluded.display_name,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      email = excluded.email,
      updated_at = excluded.updated_at
    returning id
  `);
  const leadId = leadUpsertResult.rows[0]?.id;

  if (!leadId) {
    throw new Error("Lead upsert did not return an id.");
  }

  await tx.insert(leadSubmissions).values({
    channel: input.submission.channel,
    consent_accepted_at: input.submission.consent_accepted_at,
    created_at: input.submission.created_at,
    id: input.submission.id,
    lead_id: leadId,
    locale: input.submission.locale,
    request_id: input.submission.request_id,
    submission_started_at: input.submission.submission_started_at ?? null,
    updated_at: input.submission.updated_at,
  });

  return {
    leadId,
    submissionId: input.submission.id,
  };
}
