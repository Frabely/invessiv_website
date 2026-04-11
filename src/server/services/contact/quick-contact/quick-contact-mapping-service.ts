import "server-only";
import { randomUUID } from "node:crypto";
import type { QuickContactSubmitInput } from "@/features/contact/contact.schema";
import { CONTACT_LEAD_STORAGE } from "@/server/config/contact-lead-storage";
import type { QuickContactPersistInput } from "@/server/common/contracts/contact/quick-contact/quick-contact-persist-input";
import {
  mapLeadApiToDb,
  type ApiToDbMapperOptions,
} from "@/server/services/contact/lead-mapping-service";
import { mapSubmissionApiToDb } from "@/server/services/contact/submission-mapping-service";

export function mapQuickContactApiToDb(
  payload: QuickContactSubmitInput,
  { createdAt = new Date(), requestId }: ApiToDbMapperOptions,
): QuickContactPersistInput {
  const lead = mapLeadApiToDb(
    payload,
    createdAt,
    { defaultLeadStatus: CONTACT_LEAD_STORAGE.defaultLeadStatus },
  );
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
