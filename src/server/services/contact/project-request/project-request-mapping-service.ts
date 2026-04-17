import "server-only";
import { randomUUID } from "node:crypto";
import { DEFAULT_CONTACT_LEAD_STATUS } from "@/common/constants/contact/default-contact-lead-status";
import { CONTACT_REQUEST_KIND } from "@/common/constants/contact/contact-request-kind";
import type { ProjectRequestPersistInput } from "@/server/db/persist-input/contact/project-request-persist-input";
import type { SaveProjectRequestDto } from "@/common/contracts/contact/project-request/save-project-request-dto";
import {
  mapLeadApiToDb,
  type ApiToDbMapperOptions,
} from "@/server/services/contact/lead-mapping-service";
import { mapSubmissionApiToDb } from "@/server/services/contact/submission-mapping-service";

export function mapProjectRequestDtoToDbPersistInput(
  payload: SaveProjectRequestDto,
  { createdAt = new Date(), requestId }: ApiToDbMapperOptions,
): ProjectRequestPersistInput {
  const lead = mapLeadApiToDb(payload, createdAt, {
    defaultLeadStatus: DEFAULT_CONTACT_LEAD_STATUS,
  });
  const leadSubmission = mapSubmissionApiToDb(
    {
      locale: payload.locale,
      startedAt: new Date(payload.startedAt),
    },
    requestId,
    CONTACT_REQUEST_KIND.ProjectRequest,
    lead.id,
    createdAt,
  );

  return {
    lead,
    lead_project_request: {
      offer_key: payload.offerKey,
      budget_key: payload.budgetKey,
      company: payload.company,
      created_at: leadSubmission.created_at,
      custom_page_names: payload.customPageNames?.length
        ? payload.customPageNames
        : undefined,
      goal_key: payload.goalKey,
      id: randomUUID(),
      lead_submission_id: leadSubmission.id,
      page_keys: payload.pageKeys?.length ? payload.pageKeys : undefined,
      phone: payload.phone,
      preferred_start_key: payload.preferredStartKey,
      project_details: payload.projectDetails.trim(),
      role: payload.role,
      updated_at: leadSubmission.updated_at,
      website: payload.website,
      workflow_key: payload.workflowKey,
    },
    lead_submission: leadSubmission,
  };
}
