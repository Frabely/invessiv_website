import type { ProjectRequestSubmitInput } from "@/features/contact/contact.schema";
import type { MailMessage } from "@/server/services/mail/mail-provider";
import { createContactNotificationMessage } from "@/server/services/mail/templates/contact-notification";

export async function mapContactToMail(
  payload: ProjectRequestSubmitInput,
  to: string,
): Promise<MailMessage> {
  const message = await createContactNotificationMessage(payload);

  return {
    html: message.html,
    subject: message.subject,
    text: message.text,
    to,
  };
}
