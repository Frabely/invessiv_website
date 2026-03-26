import "server-only";
import type { ContactSubmitInput } from "@/features/contact/contact.schema";
import {
  persistContactLead,
  updateContactLeadMailStatus,
} from "@/server/db/contact-leads";
import { getServerEnv } from "@/server/config/env";
import { createContactLeadSubmission } from "@/server/services/contact/contact-lead-metadata";
import { mapContactToMail } from "@/server/services/mail/mappers/map-contact-to-mail";
import { sendMail } from "@/server/services/mail/mail-service";

export async function submitContactInquiry(
  payload: ContactSubmitInput,
  requestId: string,
) {
  const env = getServerEnv();
  const submission = createContactLeadSubmission(payload, requestId);
  const persistenceResult = await persistContactLead(submission);
  const message = await mapContactToMail(payload, env.contactMailTo);
  const deliveryResult = await sendMail(message);

  if (!deliveryResult.ok) {
    if (persistenceResult.persisted) {
      void updateContactLeadMailStatus(
        persistenceResult.leadId,
        "failed",
        deliveryResult.reason,
      );
    }

    return {
      ok: false as const,
      code: deliveryResult.reason,
    };
  }

  if (persistenceResult.persisted) {
    void updateContactLeadMailStatus(persistenceResult.leadId, "sent");
  }

  return {
    ok: true as const,
  };
}
