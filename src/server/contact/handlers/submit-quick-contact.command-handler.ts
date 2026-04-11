import "server-only";
import { quickContactSchema } from "@/features/contact/contact.schema";
import type { QuickContactSubmitRequest } from "@/common/contracts/contact/submit/contact-submit";
import type { ContactCommandHandlerResult } from "@/common/contracts/contact/records/contact-command-handler-result";
import { validateCommandPayload } from "@/server/contact/validators/validate-command-payload";
import { getServerEnv } from "@/server/config/env";
import { persistQuickContactLead } from "@/server/db/contact/persist-quick-contact";
import { mapQuickContactApiToDb } from "@/server/services/contact/quick-contact/quick-contact-mapping-service";
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
      const leadWrite = mapQuickContactApiToDb(validatedPayload, { requestId });
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
