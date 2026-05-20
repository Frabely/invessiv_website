import "server-only";
import type { ContactCommandHandlerResult } from "@invessiv/common/contracts/contact/records/contact-command-handler-result";
import { CONTACT_SUBMIT_ERROR_CODE } from "@invessiv/common/contracts/contact/submit/contact-submit-error-code";
import {
  CONTACT_SUBMIT_LOG_MESSAGE,
  CONTACT_SUBMIT_LOG_PREFIX,
} from "@/server/contact/handlers/contact-submit-logging";
import { leadMapperService } from "@/server/contact/mapper/contact-lead-mapper-service";
import { persistDiscoveryCallLead } from "@invessiv/db/contact/persist-discovery-call";
import { discoveryCallValidationService } from "@/server/contact/validation/discovery-call/discovery-call-validation-service";

export async function submitDiscoveryCallCommandHandler(
  payload: unknown,
  requestId: string,
): Promise<ContactCommandHandlerResult> {
  const validationResult = discoveryCallValidationService.validate(payload);
  if (!validationResult.ok) {
    return validationResult;
  }

  try {
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
  } catch (error) {
    console.error(
      `${CONTACT_SUBMIT_LOG_PREFIX.DiscoveryCall} ${CONTACT_SUBMIT_LOG_MESSAGE.PersistenceFailed}`,
      { error, requestId },
    );

    return {
      code: CONTACT_SUBMIT_ERROR_CODE.DeliveryUnavailable,
      ok: false as const,
    };
  }
}
