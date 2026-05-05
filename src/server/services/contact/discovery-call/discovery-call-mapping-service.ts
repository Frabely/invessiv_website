import "server-only";
import { randomUUID } from "node:crypto";
import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { CONTACT_REQUEST_KIND } from "@/common/constants/contact/contact-request-kind";
import type { DiscoveryCallPersistInput } from "@/server/db/contracts/contact/discovery-call-persist-input";
import type { SaveDiscoveryCallDto } from "@/common/contracts/contact/discovery-call/save-discovery-call-dto";
import {
  type ApiToDbMapperOptions,
  mapLeadApiToDb,
} from "@/server/services/contact/lead-mapping-service";
import { mapSubmissionApiToDb } from "@/server/services/contact/submission-mapping-service";

export function mapDiscoveryCallDtoToDbPersistInput(
  payload: SaveDiscoveryCallDto,
  { createdAt = new Date(), requestId }: ApiToDbMapperOptions,
): DiscoveryCallPersistInput {
  const lead = mapLeadApiToDb(payload, createdAt, {
    defaultLeadStatus: ContactLeadStatus.New,
  });
  const leadSubmission = mapSubmissionApiToDb(
    { locale: payload.locale },
    requestId,
    CONTACT_REQUEST_KIND.DiscoveryCall,
    lead.id,
    createdAt,
  );
  const message = payload.message?.trim();

  return {
    call_contact: {
      created_at: leadSubmission.created_at,
      id: randomUUID(),
      lead_submission_id: leadSubmission.id,
      message: message || undefined,
      updated_at: leadSubmission.updated_at,
    },
    lead,
    lead_submission: leadSubmission,
  };
}
