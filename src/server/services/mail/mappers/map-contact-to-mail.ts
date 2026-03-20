import type { ContactSubmitInput } from "@/features/contact/contact.schema";
import type { MailMessage } from "@/server/services/mail/mail-provider";
import { createContactNotificationMessage } from "@/server/services/mail/templates/contact-notification";

export function mapContactToMail(
  payload: ContactSubmitInput,
  to: string,
): MailMessage {
  const message = createContactNotificationMessage(payload);

  return {
    html: message.html,
    subject: message.subject,
    text: message.text,
    to,
  };
}
