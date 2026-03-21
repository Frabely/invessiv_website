import "server-only";
import type { ContactSubmitInput } from "@/features/contact/contact.schema";
import { getServerEnv } from "@/server/config/env";
import { mapContactToMail } from "@/server/services/mail/mappers/map-contact-to-mail";
import { sendMail } from "@/server/services/mail/mail-service";

export async function submitContactInquiry(payload: ContactSubmitInput) {
  const env = getServerEnv();
  const message = await mapContactToMail(payload, env.contactMailTo);
  const deliveryResult = await sendMail(message);

  if (!deliveryResult.ok) {
    return {
      ok: false as const,
      code: deliveryResult.reason,
    };
  }

  return {
    ok: true as const,
  };
}
