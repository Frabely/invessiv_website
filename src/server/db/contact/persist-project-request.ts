import "server-only";
import {
  getDrizzleDatabaseClient,
  hasDatabaseConnectionString,
} from "@/server/db/core";
import type { ProjectRequestPersistInput } from "@/server/db/contracts/contact/project-request-persist-input";
import { type PersistSubmissionResult } from "@/server/db/contracts/contact/contact-persist-result";
import { persistSharedLeadSubmission } from "@/server/db/contact/shared/shared-lead-submission";
import { leadProjectRequests } from "@/server/db/record-configuration/lead-project-requests";

export async function persistProjectRequestLead(
  projectRequestPersistInput: ProjectRequestPersistInput,
): Promise<PersistSubmissionResult> {
  if (!hasDatabaseConnectionString()) {
    return { persisted: false };
  }

  const db = getDrizzleDatabaseClient();

  await db.transaction(async (tx) => {
    const { submissionId } = await persistSharedLeadSubmission(tx, {
      lead: projectRequestPersistInput.lead,
      submission: projectRequestPersistInput.lead_submission,
    });

    await tx.insert(leadProjectRequests).values({
      budget_key: projectRequestPersistInput.lead_project_request.budget_key,
      company: projectRequestPersistInput.lead_project_request.company,
      created_at: projectRequestPersistInput.lead_project_request.created_at,
      custom_page_names:
        projectRequestPersistInput.lead_project_request.custom_page_names,
      goal_key: projectRequestPersistInput.lead_project_request.goal_key,
      id: projectRequestPersistInput.lead_project_request.id,
      lead_submission_id: submissionId,
      offer_key: projectRequestPersistInput.lead_project_request.offer_key,
      page_keys: projectRequestPersistInput.lead_project_request.page_keys,
      phone: projectRequestPersistInput.lead_project_request.phone,
      preferred_start_key:
        projectRequestPersistInput.lead_project_request.preferred_start_key,
      project_details:
        projectRequestPersistInput.lead_project_request.project_details,
      role: projectRequestPersistInput.lead_project_request.role,
      updated_at: projectRequestPersistInput.lead_project_request.updated_at,
      website: projectRequestPersistInput.lead_project_request.website,
      workflow_key:
        projectRequestPersistInput.lead_project_request.workflow_key,
    });
  });

  return {
    persisted: true,
    submissionId: projectRequestPersistInput.lead_submission.id,
  };
}
