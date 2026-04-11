import "server-only";
import type { ContactCommandHandlerResult } from "@/common/contracts/contact/records/contact-command-handler-result";
import type { SaveDiscoveryCallDto } from "@/common/contracts/contact/discovery-call/save-discovery-call-dto";
import { persistDiscoveryCallLead } from "@/server/db/contact/persist-discovery-call";
import { discoveryCallValidationService } from "@/server/contact/validation/discovery-call/discovery-call-validation-service";
import { mapDiscoveryCallApiToDb } from "@/server/services/contact/discovery-call/discovery-call-mapping-service";

export async function submitDiscoveryCallCommandHandler(
  payload: SaveDiscoveryCallDto,
  requestId: string,
): Promise<ContactCommandHandlerResult> {
  const validationResult = discoveryCallValidationService.validate(payload);
  if (!validationResult.ok) {
    return validationResult;
  }

  const leadWrite = mapDiscoveryCallApiToDb(validationResult.data, {
    requestId,
  });
  await persistDiscoveryCallLead(leadWrite);

  return {
    ok: true as const,
  };
}
