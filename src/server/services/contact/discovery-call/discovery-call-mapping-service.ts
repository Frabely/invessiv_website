import "server-only";
import { randomUUID } from "node:crypto";
import type { DiscoveryCallSubmitInput } from "@/features/contact/contact.schema";
import { CONTACT_LEAD_STORAGE } from "@/server/config/contact-lead-storage";
import type { DiscoveryCallPersistInput } from "@/server/common/contracts/contact/discovery-call/discovery-call-persist-input";
import {
  mapLeadApiToDb,
  type ApiToDbMapperOptions,
} from "@/server/services/contact/lead-mapping-service";
import { mapSubmissionApiToDb } from "@/server/services/contact/submission-mapping-service";

export function mapDiscoveryCallApiToDb(
  payload: DiscoveryCallSubmitInput,
  { createdAt = new Date(), requestId }: ApiToDbMapperOptions,
): DiscoveryCallPersistInput {
  const lead = mapLeadApiToDb(
    payload,
    createdAt,
    { defaultLeadStatus: CONTACT_LEAD_STORAGE.defaultLeadStatus },
  );
  const submission = mapSubmissionApiToDb(
    { locale: payload.locale },
    requestId,
    "discovery_call",
    createdAt,
  );
  const message = payload.message?.trim();

  return {
    callContact: {
      createdAt: submission.createdAt,
      id: randomUUID(),
      leadSubmissionId: submission.id,
      message: message || undefined,
      updatedAt: submission.updatedAt,
    },
    lead,
    submission,
  };
}
