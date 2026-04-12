import "server-only";
import { randomUUID } from "node:crypto";
import { DEFAULT_CONTACT_LEAD_STATUS } from "@/common/constants/contact/default-contact-lead-status";
import type { QuickContactPersistInput } from "@/server/db/records/contact/quick-contact-persist-input";
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
  const submission = mapSubmissionApiToDb(
    { locale: payload.locale },
    requestId,
    "quick_contact",
    createdAt,
  );

  return {
    emailContact: {
      createdAt: submission.createdAt,
      id: randomUUID(),
      leadSubmissionId: submission.id,
      message: payload.message.trim(),
      updatedAt: submission.updatedAt,
    },
    lead,
    submission,
  };
}
