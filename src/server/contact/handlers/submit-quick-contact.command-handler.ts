import "server-only";
import type { ContactCommandHandlerResult } from "@/common/contracts/contact/records/contact-command-handler-result";
import { getServerEnv } from "@/server/config/env";
import { leadMapperService } from "@/server/contact/mapper/contact-lead-mapper-service";
import { persistQuickContactLead } from "@/server/db/contact/persist-quick-contact";
import { quickContactValidationService } from "@/server/contact/validation/quick-contact/quick-contact-validation-service";
import { mapQuickContactToMail } from "@/server/services/mail/templates/quick-contact-notification";
import { sendMail } from "@/server/services/mail/mail-service";

export async function submitQuickContactCommandHandler(
  payload: unknown,
  requestId: string,
): Promise<ContactCommandHandlerResult> {
  const validationResult = quickContactValidationService.validate(payload);
  if (!validationResult.ok) {
    return validationResult;
  }

  const env = getServerEnv();
  const quickContactPersistInput =
    leadMapperService.mapQuickContactDtoToDbPersistInput(
      validationResult.data,
      {
        requestId,
      },
    );
  await persistQuickContactLead(quickContactPersistInput);
  const message = await mapQuickContactToMail(
    validationResult.data,
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
}
