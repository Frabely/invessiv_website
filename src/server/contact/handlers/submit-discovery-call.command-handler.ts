import "server-only";
import { discoveryCallSchema } from "@/features/contact/contact.schema";
import type { DiscoveryCallSubmitRequest } from "@/features/contact/contact.contract";
import type { ContactCommandHandlerResult } from "@/server/contact/handlers/contact-command-handler-result";
import { validateCommandPayload } from "@/server/contact/handlers/validate-command-payload";
import { createDiscoveryCallLeadWrite } from "@/server/services/contact/contact-lead-metadata";
import { persistDiscoveryCallLead } from "@/server/services/contact/persist-contact-lead";

export async function submitDiscoveryCallCommandHandler(
  payload: DiscoveryCallSubmitRequest,
  requestId: string,
): Promise<ContactCommandHandlerResult> {
  return validateCommandPayload(
    discoveryCallSchema,
    payload,
    async (validatedPayload) => {
      const leadWrite = createDiscoveryCallLeadWrite(
        validatedPayload,
        requestId,
      );
      await persistDiscoveryCallLead(leadWrite);

      return {
        ok: true as const,
      };
    },
  );
}
