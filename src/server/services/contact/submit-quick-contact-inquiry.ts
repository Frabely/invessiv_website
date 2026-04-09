import "server-only";
import type { QuickContactSubmitInput } from "@/features/contact/contact.schema";
import { getServerEnv } from "@/server/config/env";
import { mapQuickContactToMail } from "@/server/services/mail/templates/quick-contact-notification";
import { sendMail } from "@/server/services/mail/mail-service";

export async function submitQuickContactInquiry(
  payload: QuickContactSubmitInput,
) {
  const env = getServerEnv();
  const message = await mapQuickContactToMail(payload, env.contactMailTo);
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
