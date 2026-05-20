import "server-only";
import type { ContactCommandHandlerResult } from "@invessiv/common/contracts/contact/records/contact-command-handler-result";
import { CONTACT_SUBMIT_ERROR_CODE } from "@invessiv/common/contracts/contact/submit/contact-submit-error-code";
import { getServerEnv } from "@/server/config/env";
import { leadMapperService } from "@/server/contact/mapper/contact-lead-mapper-service";
import {
  CONTACT_SUBMIT_LOG_MESSAGE,
  CONTACT_SUBMIT_LOG_PREFIX,
} from "@/server/contact/handlers/contact-submit-logging";
import { persistProjectRequestLead } from "@invessiv/db/contact/persist-project-request";
import { projectRequestValidationService } from "@/server/contact/validation/project-request/project-request-validation-service";
import { mapContactToMail } from "@/server/services/mail/mappers/map-contact-to-mail";
import { sendMail } from "@/server/services/mail/mail-service";

export async function submitProjectRequestCommandHandler(
  payload: unknown,
  requestId: string,
): Promise<ContactCommandHandlerResult> {
  const validationResult = projectRequestValidationService.validate(payload);
  if (!validationResult.ok) {
    return validationResult;
  }

  const env = getServerEnv();

  try {
    const projectRequestPersistInput =
      leadMapperService.mapProjectRequestDtoToDbPersistInput(
        validationResult.data,
        {
          requestId,
        },
      );
    await persistProjectRequestLead(projectRequestPersistInput);
    try {
      const message = await mapContactToMail(
        validationResult.data,
        env.contactMailTo,
      );
      const deliveryResult = await sendMail(message);

      if (!deliveryResult.ok) {
        console.error(
          `${CONTACT_SUBMIT_LOG_PREFIX.ProjectRequest} ${CONTACT_SUBMIT_LOG_MESSAGE.MailDeliveryFailed}`,
          {
            reason: deliveryResult.reason,
            requestId,
          },
        );
      }
    } catch (error) {
      console.error(
        `${CONTACT_SUBMIT_LOG_PREFIX.ProjectRequest} ${CONTACT_SUBMIT_LOG_MESSAGE.MailDeliveryFailed}`,
        {
          error,
          requestId,
        },
      );
    }

    return {
      ok: true as const,
    };
  } catch (error) {
    console.error(
      `${CONTACT_SUBMIT_LOG_PREFIX.ProjectRequest} ${CONTACT_SUBMIT_LOG_MESSAGE.PersistenceFailed}`,
      {
        error,
        requestId,
      },
    );
    return {
      code: CONTACT_SUBMIT_ERROR_CODE.DeliveryUnavailable,
      ok: false as const,
    };
  }
}
