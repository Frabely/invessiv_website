export type MailMessage = {
  html: string;
  subject: string;
  text: string;
  to: string;
};

export type MailProvider = {
  send(message: MailMessage): Promise<{ externalId?: string }>;
};
