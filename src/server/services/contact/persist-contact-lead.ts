import "server-only";
import type { NeonQueryFunctionInTransaction } from "@neondatabase/serverless";
import {
  hasDatabaseConnectionString,
  getDatabaseClient,
} from "@/server/db/client";
import type {
  PreparedDiscoveryCallLeadWrite,
  PreparedProjectRequestLeadWrite,
  PreparedQuickContactLeadWrite,
} from "@/server/services/contact/contact-lead-metadata";

type PersistLeadResult = {
  persisted: boolean;
  submissionId?: string;
};

function createLeadAndSubmissionQuery(
  tx: NeonQueryFunctionInTransaction<boolean, boolean>,
  write:
    | PreparedDiscoveryCallLeadWrite
    | PreparedProjectRequestLeadWrite
    | PreparedQuickContactLeadWrite,
) {
  return tx`
    WITH upserted_lead AS (
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
        ${write.lead.id},
        ${write.lead.firstName},
        ${write.lead.lastName},
        ${write.lead.email},
        ${write.lead.leadStatus},
        ${write.lead.createdAt},
        ${write.lead.updatedAt}
      )
      ON CONFLICT ((LOWER(BTRIM(email))))
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        updated_at = EXCLUDED.updated_at
      RETURNING id
    )
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
      ${write.submission.id},
      upserted_lead.id,
      ${write.submission.requestId},
      ${write.submission.channel},
      ${write.submission.locale},
      ${write.submission.consentAcceptedAt},
      ${write.submission.submissionStartedAt ?? null},
      ${write.submission.createdAt},
      ${write.submission.updatedAt}
    FROM upserted_lead
  `;
}

export async function persistProjectRequestLead(
  write: PreparedProjectRequestLeadWrite,
): Promise<PersistLeadResult> {
  if (!hasDatabaseConnectionString()) {
    return { persisted: false };
  }

  const sql = getDatabaseClient();

  await sql.transaction((tx) => [
    createLeadAndSubmissionQuery(tx, write),
    tx`
      INSERT INTO lead_project_requests (
        id,
        lead_submission_id,
        offer_key,
        goal_key,
        workflow_key,
        budget_key,
        preferred_start_key,
        company,
        role,
        phone,
        website,
        page_keys,
        custom_page_names,
        project_details,
        created_at,
        updated_at
      )
      VALUES (
        ${write.projectRequest.id},
        ${write.projectRequest.leadSubmissionId},
        ${write.projectRequest.offerKey},
        ${write.projectRequest.goalKey ?? null},
        ${write.projectRequest.workflowKey ?? null},
        ${write.projectRequest.budgetKey ?? null},
        ${write.projectRequest.preferredStartKey ?? null},
        ${write.projectRequest.company ?? null},
        ${write.projectRequest.role ?? null},
        ${write.projectRequest.phone ?? null},
        ${write.projectRequest.website ?? null},
        ${write.projectRequest.pageKeys ?? null},
        ${write.projectRequest.customPageNames ?? null},
        ${write.projectRequest.projectDetails},
        ${write.projectRequest.createdAt},
        ${write.projectRequest.updatedAt}
      )
    `,
  ]);

  return {
    persisted: true,
    submissionId: write.submission.id,
  };
}

export async function persistQuickContactLead(
  write: PreparedQuickContactLeadWrite,
): Promise<PersistLeadResult> {
  if (!hasDatabaseConnectionString()) {
    return { persisted: false };
  }

  const sql = getDatabaseClient();

  await sql.transaction((tx) => [
    createLeadAndSubmissionQuery(tx, write),
    tx`
      INSERT INTO lead_email_contacts (
        id,
        lead_submission_id,
        message,
        created_at,
        updated_at
      )
      VALUES (
        ${write.emailContact.id},
        ${write.emailContact.leadSubmissionId},
        ${write.emailContact.message},
        ${write.emailContact.createdAt},
        ${write.emailContact.updatedAt}
      )
    `,
  ]);

  return {
    persisted: true,
    submissionId: write.submission.id,
  };
}

export async function persistDiscoveryCallLead(
  write: PreparedDiscoveryCallLeadWrite,
): Promise<PersistLeadResult> {
  if (!hasDatabaseConnectionString()) {
    return { persisted: false };
  }

  const sql = getDatabaseClient();

  await sql.transaction((tx) => [
    createLeadAndSubmissionQuery(tx, write),
    tx`
      INSERT INTO lead_call_contacts (
        id,
        lead_submission_id,
        message,
        created_at,
        updated_at
      )
      VALUES (
        ${write.callContact.id},
        ${write.callContact.leadSubmissionId},
        ${write.callContact.message ?? null},
        ${write.callContact.createdAt},
        ${write.callContact.updatedAt}
      )
    `,
  ]);

  return {
    persisted: true,
    submissionId: write.submission.id,
  };
}
