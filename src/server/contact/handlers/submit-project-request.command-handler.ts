import "server-only";
import { projectRequestSchema } from "@/features/contact/contact.schema";
import type { ProjectRequestSubmitRequest } from "@/common/contracts/contact/submit/contact-submit";
import type { ContactCommandHandlerResult } from "@/common/contracts/contact/records/contact-command-handler-result";
import { validateCommandPayload } from "@/server/contact/validators/validate-command-payload";
import { getServerEnv } from "@/server/config/env";
import { persistProjectRequestLead } from "@/server/db/contact/persist-project-request";
import { mapProjectRequestApiToDb } from "@/server/services/contact/project-request/project-request-mapping-service";
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
      const leadWrite = mapProjectRequestApiToDb(validatedPayload, {
        requestId,
      });
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
