import "server-only";
import {
  getDatabaseClient,
  hasDatabaseConnectionString,
} from "@/server/db/client";
import type { ProjectRequestPersistInput } from "@/server/db/records/contact/project-request-persist-input";
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
    submission: projectRequestPersistInput.submission,
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
      ${addParam(projectRequestPersistInput.projectRequest.id)},
      ${sharedLeadSubmission.submissionSource}.id,
      ${addParam(projectRequestPersistInput.projectRequest.offerKey)},
      ${addParam(projectRequestPersistInput.projectRequest.goalKey ?? null)},
      ${addParam(projectRequestPersistInput.projectRequest.workflowKey ?? null)},
      ${addParam(projectRequestPersistInput.projectRequest.budgetKey ?? null)},
      ${addParam(projectRequestPersistInput.projectRequest.preferredStartKey ?? null)},
      ${addParam(projectRequestPersistInput.projectRequest.company ?? null)},
      ${addParam(projectRequestPersistInput.projectRequest.role ?? null)},
      ${addParam(projectRequestPersistInput.projectRequest.phone ?? null)},
      ${addParam(projectRequestPersistInput.projectRequest.website ?? null)},
      ${addParam(projectRequestPersistInput.projectRequest.pageKeys ?? null)},
      ${addParam(projectRequestPersistInput.projectRequest.customPageNames ?? null)},
      ${addParam(projectRequestPersistInput.projectRequest.projectDetails)},
      ${addParam(projectRequestPersistInput.projectRequest.createdAt)},
      ${addParam(projectRequestPersistInput.projectRequest.updatedAt)}
    FROM ${sharedLeadSubmission.submissionSource}
  `;

  await sql.query(query, params);

  return {
    persisted: true,
    submissionId: projectRequestPersistInput.submission.id,
  };
}
