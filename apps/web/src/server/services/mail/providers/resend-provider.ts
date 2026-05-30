import type {
  MailMessage,
  MailProvider,
} from "@/server/services/mail/mail-provider";

type ResendProviderOptions = {
  apiKey: string;
  from: string;
};

const RESEND_EMAILS_ENDPOINT = "https://api.resend.com/emails";

export class ResendMailProvider implements MailProvider {
  constructor(private readonly options: ResendProviderOptions) {}

  async send(message: MailMessage) {
    const response = await fetch(RESEND_EMAILS_ENDPOINT, {
      body: JSON.stringify({
        attachments: message.attachments,
        from: this.options.from,
        html: message.html,
        subject: message.subject,
        text: message.text,
        to: [message.to],
      }),
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`resend_request_failed:${response.status}`);
    }

    const payload = (await response.json()) as { id?: string };
    return { externalId: payload.id };
  }
}
