import "server-only";
import type { ContactCommandHandlerResult } from "@invessiv/common/contracts/contact/records/contact-command-handler-result";
import { CONTACT_SUBMIT_ERROR_CODE } from "@invessiv/common/contracts/contact/submit/contact-submit-error-code";
import { getServerEnv } from "@/server/config/env";
import { leadMapperService } from "@/server/contact/mapper/contact-lead-mapper-service";
import {
  CONTACT_SUBMIT_LOG_MESSAGE,
  CONTACT_SUBMIT_LOG_PREFIX,
} from "@/server/contact/handlers/contact-submit-logging";
import { persistQuickContactLead } from "@invessiv/db/contact/persist-quick-contact";
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

  try {
    const quickContactPersistInput =
      leadMapperService.mapQuickContactDtoToDbPersistInput(
        validationResult.data,
        {
          requestId,
        },
      );
    await persistQuickContactLead(quickContactPersistInput);
    try {
      const message = await mapQuickContactToMail(
        validationResult.data,
        env.contactMailTo,
      );
      const deliveryResult = await sendMail(message);

      if (!deliveryResult.ok) {
        console.error(
          `${CONTACT_SUBMIT_LOG_PREFIX.QuickContact} ${CONTACT_SUBMIT_LOG_MESSAGE.MailDeliveryFailed}`,
          {
            requestId,
            reason: deliveryResult.reason,
          },
        );
      }
    } catch (error) {
      console.error(
        `${CONTACT_SUBMIT_LOG_PREFIX.QuickContact} ${CONTACT_SUBMIT_LOG_MESSAGE.MailDeliveryFailed}`,
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
      `${CONTACT_SUBMIT_LOG_PREFIX.QuickContact} ${CONTACT_SUBMIT_LOG_MESSAGE.PersistenceFailed}`,
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
