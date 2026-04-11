import type { SaveProjectRequestDto } from "@/common/contracts/contact/project-request/save-project-request-dto";
import type { MailMessage } from "@/server/services/mail/mail-provider";
import { createContactNotificationMessage } from "@/server/services/mail/templates/contact-notification";

export async function mapContactToMail(
  payload: SaveProjectRequestDto,
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
