import "server-only";
import { eq, sql } from "drizzle-orm";
import type { ContactDatabaseTransaction } from "@/server/db/client";
import { leadSubmissions } from "@/server/db/record-configuration/lead-submissions";
import { leads } from "@/server/db/record-configuration/leads";
import type { LeadRecord } from "@/server/db/records/contact/lead-record";
import type { LeadSubmissionRecord } from "@/server/db/records/contact/lead-submission-record";

export type PersistedSharedLeadSubmission = {
  leadId: string;
  submissionId: string;
};

export async function persistSharedLeadSubmission(
  tx: ContactDatabaseTransaction,
  input: {
    lead: LeadRecord;
    submission: LeadSubmissionRecord;
  },
): Promise<PersistedSharedLeadSubmission> {
  const existingLead = await tx
    .select({ id: leads.id })
    .from(leads)
    .where(
      sql`lower(btrim(${leads.email})) = lower(btrim(${input.lead.email}))`,
    )
    .limit(1)
    .then((rows) => rows[0]);

  const leadId = existingLead?.id ?? input.lead.id;

  if (existingLead) {
    await tx
      .update(leads)
      .set({
        email: input.lead.email,
        first_name: input.lead.first_name,
        last_name: input.lead.last_name,
        updated_at: input.lead.updated_at,
      })
      .where(eq(leads.id, existingLead.id));
  } else {
    await tx.insert(leads).values({
      created_at: input.lead.created_at,
      email: input.lead.email,
      first_name: input.lead.first_name,
      id: input.lead.id,
      last_name: input.lead.last_name,
      lead_status: input.lead.lead_status,
      updated_at: input.lead.updated_at,
    });
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
