import "server-only";
import { randomUUID } from "node:crypto";
import type { ProjectRequestSubmitInput } from "@/features/contact/contact.schema";
import { CONTACT_LEAD_STORAGE } from "@/server/config/contact-lead-storage";
import type { ProjectRequestPersistInput } from "@/server/common/contracts/contact/project-request/project-request-persist-input";
import {
  mapLeadApiToDb,
  type ApiToDbMapperOptions,
} from "@/server/services/contact/lead-mapping-service";
import { mapSubmissionApiToDb } from "@/server/services/contact/submission-mapping-service";

export function mapProjectRequestApiToDb(
  payload: ProjectRequestSubmitInput,
  { createdAt = new Date(), requestId }: ApiToDbMapperOptions,
): ProjectRequestPersistInput {
  const lead = mapLeadApiToDb(
    payload,
    createdAt,
    { defaultLeadStatus: CONTACT_LEAD_STORAGE.defaultLeadStatus },
  );
  const submission = mapSubmissionApiToDb(
    {
      locale: payload.locale,
      startedAt: new Date(payload.startedAt),
    },
    requestId,
    "project_request",
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
