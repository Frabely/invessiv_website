import "server-only";
import type { NeonQueryFunctionInTransaction } from "@neondatabase/serverless";
import {
  getDatabaseClient,
  hasDatabaseConnectionString,
} from "@/server/db/client";
import type { ProjectRequestPersistInput } from "@/common/contracts/contact/project-request/project-request-persist-input";
import { persistLead } from "@/server/db/contact/lead-persistence";
import {
  persistSubmission,
  type PersistSubmissionResult,
} from "@/server/db/contact/submission-persistence";

export async function persistProjectRequestLead(
  write: ProjectRequestPersistInput,
): Promise<PersistSubmissionResult> {
  if (!hasDatabaseConnectionString()) {
    return { persisted: false };
  }

  const sql = getDatabaseClient();

  await sql.transaction(
    async (tx: NeonQueryFunctionInTransaction<boolean, boolean>) => {
      const leadResult = await persistLead(tx, write.lead);
      const leadId = leadResult.leadId ?? write.lead.id;

      await persistSubmission(tx, leadId, write.submission);
      await tx`
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
    `;
    },
  );

  return {
    persisted: true,
    submissionId: write.submission.id,
  };
}
