import "server-only";
import { projectRequestSchema } from "@/features/contact/contact.schema";
import type { ProjectRequestSubmitRequest } from "@/features/contact/contact.contract";
import type { ContactCommandHandlerResult } from "@/server/contact/handlers/contact-command-handler-result";
import { validateCommandPayload } from "@/server/contact/handlers/validate-command-payload";
import { getServerEnv } from "@/server/config/env";
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
      // Persistence is intentionally disabled for now.
      // Re-enable once the lead schema is reworked.
      //
      // const submission = createContactLeadSubmission(
      //   validatedPayload,
      //   requestId,
      //   env.contactMailProvider,
      // );
      // const persistenceResult = await persistContactLead(submission);

      const message = await mapContactToMail(
        validatedPayload,
        env.contactMailTo,
      );
      const deliveryResult = await sendMail(message);

      if (!deliveryResult.ok) {
        // if (persistenceResult.persisted) {
        //   await updateContactLeadMailStatus(
        //     persistenceResult.leadId,
        //     "failed",
        //     deliveryResult.reason,
        //   );
        // }

        return {
          code: deliveryResult.reason,
          ok: false as const,
        };
      }

      // if (persistenceResult.persisted) {
      //   await updateContactLeadMailStatus(persistenceResult.leadId, "sent");
      // }

      void requestId;

      return {
        ok: true as const,
      };
    },
  );
}
