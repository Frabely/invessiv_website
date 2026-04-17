import "server-only";
import {
  getDatabaseClient,
  hasDatabaseConnectionString,
} from "@/server/db/client";
import type { ProjectRequestPersistInput } from "@/server/db/persist-input/contact/project-request-persist-input";
import { type PersistSubmissionResult } from "@/server/db/contact/submission-persistence";
import { buildSharedLeadSubmission } from "@/server/db/contact/shared/shared-lead-submission";

export async function persistProjectRequestLead(
  projectRequestPersistInput: ProjectRequestPersistInput,
): Promise<PersistSubmissionResult> {
  if (!hasDatabaseConnectionString()) {
    return { persisted: false };
  }

  const sql = getDatabaseClient();
  const sharedLeadSubmission = buildSharedLeadSubmission({
    lead: projectRequestPersistInput.lead,
    submission: projectRequestPersistInput.lead_submission,
  });
  const params = [...sharedLeadSubmission.params];
  const addParam = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  const query = `
    WITH ${sharedLeadSubmission.sql}
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
    SELECT
      ${addParam(projectRequestPersistInput.lead_project_request.id)},
      ${sharedLeadSubmission.submissionSource}.id,
      ${addParam(projectRequestPersistInput.lead_project_request.offer_key)},
      ${addParam(projectRequestPersistInput.lead_project_request.goal_key ?? null)},
      ${addParam(projectRequestPersistInput.lead_project_request.workflow_key ?? null)},
      ${addParam(projectRequestPersistInput.lead_project_request.budget_key ?? null)},
      ${addParam(projectRequestPersistInput.lead_project_request.preferred_start_key ?? null)},
      ${addParam(projectRequestPersistInput.lead_project_request.company ?? null)},
      ${addParam(projectRequestPersistInput.lead_project_request.role ?? null)},
      ${addParam(projectRequestPersistInput.lead_project_request.phone ?? null)},
      ${addParam(projectRequestPersistInput.lead_project_request.website ?? null)},
      ${addParam(projectRequestPersistInput.lead_project_request.page_keys ?? null)},
      ${addParam(projectRequestPersistInput.lead_project_request.custom_page_names ?? null)},
      ${addParam(projectRequestPersistInput.lead_project_request.project_details)},
      ${addParam(projectRequestPersistInput.lead_project_request.created_at)},
      ${addParam(projectRequestPersistInput.lead_project_request.updated_at)}
    FROM ${sharedLeadSubmission.submissionSource}
  `;

  await sql.query(query, params);

  return {
    persisted: true,
    submissionId: projectRequestPersistInput.lead_submission.id,
  };
}
