import "server-only";
import { randomUUID } from "node:crypto";
import { DEFAULT_CONTACT_LEAD_STATUS } from "@/common/constants/contact/default-contact-lead-status";
import { CONTACT_REQUEST_KIND } from "@/common/constants/contact/contact-request-kind";
import type { QuickContactPersistInput } from "@/server/db/contracts/contact/quick-contact-persist-input";
import type { SaveQuickContactDto } from "@/common/contracts/contact/quick-contact/save-quick-contact-dto";
import {
  mapLeadApiToDb,
  type ApiToDbMapperOptions,
} from "@/server/services/contact/lead-mapping-service";
import { mapSubmissionApiToDb } from "@/server/services/contact/submission-mapping-service";

export function mapQuickContactDtoToDbPersistInput(
  payload: SaveQuickContactDto,
  { createdAt = new Date(), requestId }: ApiToDbMapperOptions,
): QuickContactPersistInput {
  const lead = mapLeadApiToDb(payload, createdAt, {
    defaultLeadStatus: DEFAULT_CONTACT_LEAD_STATUS,
  });
  const leadSubmission = mapSubmissionApiToDb(
    { locale: payload.locale },
    requestId,
    CONTACT_REQUEST_KIND.QuickContact,
    lead.id,
    createdAt,
  );

  return {
    lead,
    lead_email_contact: {
      created_at: leadSubmission.created_at,
      id: randomUUID(),
      lead_submission_id: leadSubmission.id,
      message: payload.message.trim(),
      updated_at: leadSubmission.updated_at,
    },
    lead_submission: leadSubmission,
  };
}
