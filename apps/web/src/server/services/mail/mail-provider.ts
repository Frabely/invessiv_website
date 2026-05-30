export type MailMessage = {
  attachments?: MailAttachment[];
  html: string;
  subject: string;
  text: string;
  to: string;
};

export type MailAttachment = {
  content: string;
  filename: string;
};

export type MailProvider = {
  send(message: MailMessage): Promise<{ externalId?: string }>;
};
