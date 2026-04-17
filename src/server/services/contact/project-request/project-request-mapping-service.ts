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
  const submission = mapSubmissionApiToDb(
    {
      locale: payload.locale,
      startedAt: new Date(payload.startedAt),
    },
    requestId,
    CONTACT_REQUEST_KIND.ProjectRequest,
    createdAt,
  );

  return {
    lead,
    projectRequest: {
      offerKey: payload.offerKey,
      budgetKey: payload.budgetKey,
      company: payload.company,
      createdAt: submission.createdAt,
      customPageNames: payload.customPageNames?.length
        ? payload.customPageNames
        : undefined,
      goalKey: payload.goalKey,
      id: randomUUID(),
      leadSubmissionId: submission.id,
      pageKeys: payload.pageKeys?.length ? payload.pageKeys : undefined,
      phone: payload.phone,
      preferredStartKey: payload.preferredStartKey,
      projectDetails: payload.projectDetails.trim(),
      role: payload.role,
      updatedAt: submission.updatedAt,
      website: payload.website,
      workflowKey: payload.workflowKey,
    },
    submission,
  };
}
