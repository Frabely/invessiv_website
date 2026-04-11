import "server-only";
import type { ContactCommandHandlerResult } from "@/common/contracts/contact/records/contact-command-handler-result";
import type { SaveQuickContactDto } from "@/common/contracts/contact/quick-contact/save-quick-contact-dto";
import { getServerEnv } from "@/server/config/env";
import { persistQuickContactLead } from "@/server/db/contact/persist-quick-contact";
import { quickContactValidationService } from "@/server/contact/validation/quick-contact/quick-contact-validation-service";
import { mapQuickContactApiToDb } from "@/server/services/contact/quick-contact/quick-contact-mapping-service";
import { mapQuickContactToMail } from "@/server/services/mail/templates/quick-contact-notification";
import { sendMail } from "@/server/services/mail/mail-service";

export async function submitQuickContactCommandHandler(
  payload: SaveQuickContactDto,
  requestId: string,
): Promise<ContactCommandHandlerResult> {
  const validationResult = quickContactValidationService.validate(payload);
  if (!validationResult.ok) {
    return validationResult;
  }

  const env = getServerEnv();
  const leadWrite = mapQuickContactApiToDb(validationResult.data, {
    requestId,
  });
  await persistQuickContactLead(leadWrite);
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
