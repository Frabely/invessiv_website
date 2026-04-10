import "server-only";
import { projectRequestSchema } from "@/features/contact/contact.schema";
import type { ProjectRequestSubmitRequest } from "@/features/contact/contact.contract";
import type { ContactCommandHandlerResult } from "@/server/contact/handlers/contact-command-handler-result";
import { validateCommandPayload } from "@/server/contact/handlers/validate-command-payload";
import { getServerEnv } from "@/server/config/env";
import { createProjectRequestLeadWrite } from "@/server/services/contact/contact-lead-metadata";
import { persistProjectRequestLead } from "@/server/services/contact/persist-contact-lead";
import { mapContactToMail } from "@/server/services/mail/mappers/map-contact-to-mail";
import { sendMail } from "@/server/services/mail/mail-service";

export async function submitProjectRequestCommandHandler(
  payload: ProjectRequestSubmitRequest,
  requestId: string,
): Promise<ContactCommandHandlerResult> {
  return validateCommandPayload(
    projectRequestSchema,
    payload,
    async (validatedPayload) => {
      const env = getServerEnv();
      const leadWrite = createProjectRequestLeadWrite(
        validatedPayload,
        requestId,
      );
      await persistProjectRequestLead(leadWrite);

      const message = await mapContactToMail(
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
