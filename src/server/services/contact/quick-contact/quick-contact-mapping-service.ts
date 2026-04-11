import "server-only";
import { randomUUID } from "node:crypto";
import { CONTACT_LEAD_STORAGE } from "@/server/config/contact-lead-storage";
import type { QuickContactPersistInput } from "@/common/contracts/contact/quick-contact/quick-contact-persist-input";
import type { SaveQuickContactDto } from "@/common/contracts/contact/quick-contact/save-quick-contact-dto";
import {
  mapLeadApiToDb,
  type ApiToDbMapperOptions,
} from "@/server/services/contact/lead-mapping-service";
import { mapSubmissionApiToDb } from "@/server/services/contact/submission-mapping-service";

export function mapQuickContactApiToDb(
  payload: SaveQuickContactDto,
  { createdAt = new Date(), requestId }: ApiToDbMapperOptions,
): QuickContactPersistInput {
  const lead = mapLeadApiToDb(payload, createdAt, {
    defaultLeadStatus: CONTACT_LEAD_STORAGE.defaultLeadStatus,
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
