import "server-only";
import { randomUUID } from "node:crypto";
import { DEFAULT_CONTACT_LEAD_STATUS } from "@/common/constants/contact/default-contact-lead-status";
import { CONTACT_REQUEST_KIND } from "@/common/constants/contact/contact-request-kind";
import type { DiscoveryCallPersistInput } from "@/server/db/persist-input/contact/discovery-call-persist-input";
import type { SaveDiscoveryCallDto } from "@/common/contracts/contact/discovery-call/save-discovery-call-dto";
import {
  mapLeadApiToDb,
  type ApiToDbMapperOptions,
} from "@/server/services/contact/lead-mapping-service";
import { mapSubmissionApiToDb } from "@/server/services/contact/submission-mapping-service";

export function mapDiscoveryCallDtoToDbPersistInput(
  payload: SaveDiscoveryCallDto,
  { createdAt = new Date(), requestId }: ApiToDbMapperOptions,
): DiscoveryCallPersistInput {
  const lead = mapLeadApiToDb(payload, createdAt, {
    defaultLeadStatus: DEFAULT_CONTACT_LEAD_STATUS,
  });
  const submission = mapSubmissionApiToDb(
    { locale: payload.locale },
    requestId,
    CONTACT_REQUEST_KIND.DiscoveryCall,
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
