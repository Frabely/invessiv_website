import "server-only";
import { sql } from "drizzle-orm";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import type { ContactLeadPersistRecord } from "@invessiv/db/contracts/contact/contact-lead-persist-record";
import type { ContactLeadSubmissionPersistRecord } from "@invessiv/db/contracts/contact/contact-lead-submission-persist-record";
import { leadSubmissions } from "@invessiv/db/record-configuration/lead-submissions";
import { leads } from "@invessiv/db/record-configuration/leads";

export type PersistedSharedLeadSubmission = {
  leadId: string;
  submissionId: string;
};

function columnName(column: { name: string }) {
  return sql.identifier(column.name);
}

export async function persistSharedLeadSubmission(
  tx: ContactDatabaseTransaction,
  input: {
    lead: ContactLeadPersistRecord;
    submission: ContactLeadSubmissionPersistRecord;
  },
): Promise<PersistedSharedLeadSubmission> {
  const leadUpsertResult = await tx.execute<{ id: string }>(sql`
    insert into ${leads} (
      ${columnName(leads.id)},
      ${columnName(leads.display_name)},
      ${columnName(leads.company_name)},
      ${columnName(leads.email)},
      ${columnName(leads.phone)},
      ${columnName(leads.website_url)},
      ${columnName(leads.notes)},
      ${columnName(leads.source)},
      ${columnName(leads.lead_status)},
      ${columnName(leads.created_at)},
      ${columnName(leads.updated_at)}
    )
    values (
      ${input.lead.id},
      ${input.lead.display_name},
      ${input.lead.company_name},
      ${input.lead.email},
      ${input.lead.phone},
      ${input.lead.website_url},
      ${input.lead.notes},
      ${input.lead.source},
      ${input.lead.lead_status},
      ${input.lead.created_at},
      ${input.lead.updated_at}
    ) on conflict ((lower(btrim(${leads.email}))))
    where ${leads.email} is not null
    do update set
      ${columnName(leads.display_name)} = excluded.${columnName(leads.display_name)},
      ${columnName(leads.company_name)} = excluded.${columnName(leads.company_name)},
      ${columnName(leads.phone)} = excluded.${columnName(leads.phone)},
      ${columnName(leads.website_url)} = excluded.${columnName(leads.website_url)},
      ${columnName(leads.notes)} = excluded.${columnName(leads.notes)},
      ${columnName(leads.updated_at)} = excluded.${columnName(leads.updated_at)}
    returning ${leads.id}
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
    marketing_consent: input.submission.marketing_consent,
    origin: input.submission.origin,
    request_id: input.submission.request_id,
    submission_started_at: input.submission.submission_started_at ?? null,
    updated_at: input.submission.updated_at,
  });

  return {
    leadId,
    submissionId: input.submission.id,
  };
}
