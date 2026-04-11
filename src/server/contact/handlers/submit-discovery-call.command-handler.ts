import "server-only";
import { discoveryCallSchema } from "@/features/contact/contact.schema";
import type { DiscoveryCallSubmitRequest } from "@/features/contact/contact.contract";
import type { ContactCommandHandlerResult } from "@/server/common/contracts/contact/contact-command-handler-result";
import { validateCommandPayload } from "@/server/contact/validators/validate-command-payload";
import { persistDiscoveryCallLead } from "@/server/db/contact/persist-discovery-call";
import { mapDiscoveryCallApiToDb } from "@/server/services/contact/discovery-call/discovery-call-mapping-service";

export async function submitDiscoveryCallCommandHandler(
  payload: DiscoveryCallSubmitRequest,
  requestId: string,
): Promise<ContactCommandHandlerResult> {
  return validateCommandPayload(
    discoveryCallSchema,
    payload,
    async (validatedPayload) => {
      const leadWrite = mapDiscoveryCallApiToDb(
        validatedPayload,
        { requestId },
      );
      await persistDiscoveryCallLead(leadWrite);

      return {
        ok: true as const,
      };
    },
  );
}
