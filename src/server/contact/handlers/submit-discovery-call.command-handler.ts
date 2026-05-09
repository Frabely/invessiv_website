import "server-only";
import type { ContactCommandHandlerResult } from "@/common/contracts/contact/records/contact-command-handler-result";
import { leadMapperService } from "@/server/contact/mapper/contact-lead-mapper-service";
import { persistDiscoveryCallLead } from "@/server/db/contact/persist-discovery-call";
import { discoveryCallValidationService } from "@/server/contact/validation/discovery-call/discovery-call-validation-service";

export async function submitDiscoveryCallCommandHandler(
  payload: unknown,
  requestId: string,
): Promise<ContactCommandHandlerResult> {
  const validationResult = discoveryCallValidationService.validate(payload);
  if (!validationResult.ok) {
    return validationResult;
  }

  const discoveryCallPersistInput =
    leadMapperService.mapDiscoveryCallDtoToDbPersistInput(
      validationResult.data,
      {
        requestId,
      },
    );
  await persistDiscoveryCallLead(discoveryCallPersistInput);

  return {
    ok: true as const,
  };
}
