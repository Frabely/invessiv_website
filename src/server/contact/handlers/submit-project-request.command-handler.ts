import "server-only";
import type { ProjectRequestSubmitRequest } from "@/common/contracts/contact/submit/contact-submit";
import type { ContactCommandHandlerResult } from "@/common/contracts/contact/records/contact-command-handler-result";
import { getServerEnv } from "@/server/config/env";
import { persistProjectRequestLead } from "@/server/db/contact/persist-project-request";
import { projectRequestValidationService } from "@/server/contact/validation/project-request/project-request-validation-service";
import { mapProjectRequestApiToDb } from "@/server/services/contact/project-request/project-request-mapping-service";
import { mapContactToMail } from "@/server/services/mail/mappers/map-contact-to-mail";
import { sendMail } from "@/server/services/mail/mail-service";

export async function submitProjectRequestCommandHandler(
  payload: ProjectRequestSubmitRequest,
  requestId: string,
): Promise<ContactCommandHandlerResult> {
  const validationResult = projectRequestValidationService.validate(payload);
  if (!validationResult.ok) {
    return validationResult;
  }

  const env = getServerEnv();
  const leadWrite = mapProjectRequestApiToDb(validationResult.data, {
    requestId,
  });
  await persistProjectRequestLead(leadWrite);

  const message = await mapContactToMail(
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
