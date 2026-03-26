import "server-only";
import type { ContactLeadMailStatus } from "@/server/config/contact-lead-storage";
import { hasDatabaseConnectionString, getDatabaseClient } from "@/server/db/client";
import type { PreparedContactLeadSubmission } from "@/server/services/contact/contact-lead-metadata";

export async function persistContactLead(
  submission: PreparedContactLeadSubmission,
) {
  if (!hasDatabaseConnectionString()) {
    return { persisted: false as const };
  }

  const sql = getDatabaseClient();
  const { lead, projectRequest } = submission;

  await sql.transaction([
    sql`
      INSERT INTO leads (
        id,
        request_id,
        source_form,
        locale,
        full_name,
        email,
        phone,
        company,
        role,
        inquiry_type,
        message,
        consent_accepted_at,
        privacy_version,
        terms_version,
        submission_started_at,
        mail_status,
        mail_provider,
        lead_status,
        retention_until,
        created_at,
        updated_at
      ) VALUES (
        ${lead.id},
        ${lead.requestId},
        ${lead.sourceForm},
        ${lead.locale},
        ${lead.fullName},
        ${lead.email},
        ${lead.phone},
        ${lead.company},
        ${lead.role},
        ${lead.inquiryType},
        ${lead.message},
        ${lead.consentAcceptedAt},
        ${lead.privacyVersion},
        ${lead.termsVersion},
        ${lead.submissionStartedAt},
        ${lead.mailStatus},
        ${lead.mailProvider},
        ${lead.leadStatus},
        ${lead.retentionUntil},
        ${lead.createdAt},
        ${lead.updatedAt}
      )
    `,
    sql`
      INSERT INTO lead_project_requests (
        lead_id,
        goal_key,
        workflow_key,
        budget_key,
        preferred_start_key,
        website,
        page_keys,
        pages_custom,
        created_at,
        updated_at
      ) VALUES (
        ${projectRequest.leadId},
        ${projectRequest.goalKey},
        ${projectRequest.workflowKey},
        ${projectRequest.budgetKey},
        ${projectRequest.preferredStartKey},
        ${projectRequest.website},
        ${projectRequest.pageKeys},
        ${projectRequest.pagesCustom},
        ${projectRequest.createdAt},
        ${projectRequest.updatedAt}
      )
    `,
  ]);

  return {
    leadId: lead.id,
    persisted: true as const,
  };
}

export async function updateContactLeadMailStatus(
  leadId: string,
  mailStatus: ContactLeadMailStatus,
  mailErrorCode?: string,
) {
  if (!hasDatabaseConnectionString()) {
    return;
  }

  const sql = getDatabaseClient();

  await sql`
    UPDATE leads
    SET
      mail_status = ${mailStatus},
      mail_error_code = ${mailErrorCode},
      updated_at = NOW()
    WHERE id = ${leadId}
  `;
}
