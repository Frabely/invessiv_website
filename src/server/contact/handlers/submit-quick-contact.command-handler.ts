import "server-only";
import { quickContactSchema } from "@/features/contact/contact.schema";
import type { QuickContactSubmitRequest } from "@/features/contact/contact.contract";
import type { ContactCommandHandlerResult } from "@/server/contact/handlers/contact-command-handler-result";
import { validateCommandPayload } from "@/server/contact/handlers/validate-command-payload";
import { getServerEnv } from "@/server/config/env";
import { createQuickContactLeadWrite } from "@/server/services/contact/contact-lead-metadata";
import { persistQuickContactLead } from "@/server/services/contact/persist-contact-lead";
import { mapQuickContactToMail } from "@/server/services/mail/templates/quick-contact-notification";
import { sendMail } from "@/server/services/mail/mail-service";

export async function submitQuickContactCommandHandler(
  payload: QuickContactSubmitRequest,
  requestId: string,
): Promise<ContactCommandHandlerResult> {
  return validateCommandPayload(
    quickContactSchema,
    payload,
    async (validatedPayload) => {
      const env = getServerEnv();
      const leadWrite = createQuickContactLeadWrite(
        validatedPayload,
        requestId,
      );
      await persistQuickContactLead(leadWrite);
      const message = await mapQuickContactToMail(
        validatedPayload,
        env.contactMailTo,
      );
      const deliveryResult = await sendMail(message);

      if (!deliveryResult.ok) {
        return {
          code: deliveryResult.reason,
          ok: false as const,
        };
      }

      return {
        ok: true as const,
      };
    },
  );
}
