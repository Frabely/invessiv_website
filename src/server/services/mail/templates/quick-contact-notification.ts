import "server-only";
import type { SaveQuickContactDto } from "@/common/contracts/contact/quick-contact/save-quick-contact-dto";
import { getDictionary } from "@/i18n/get-dictionary";
import { getServerEnv } from "@/server/config/env";
import type { MailMessage } from "@/server/services/mail/mail-provider";
import {
  escapeHtml,
  getEnvironmentSubjectPrefix,
  sanitizeLine,
} from "@/server/services/mail/templates/template-utils";

type QuickContactNotificationMessage = {
  html: string;
  subject: string;
  text: string;
};

type QuickContactNotificationCopy = Awaited<
  ReturnType<typeof getDictionary>
>["mail"]["quickContactNotification"];

export async function createQuickContactNotificationMessage(
  payload: SaveQuickContactDto,
): Promise<QuickContactNotificationMessage> {
  const copy: QuickContactNotificationCopy = (
    await getDictionary(payload.locale)
  ).mail.quickContactNotification;
  const environmentPrefix = getEnvironmentSubjectPrefix(
    getServerEnv().deploymentEnvironment,
  );

  return {
    html: [
      `<h1 style="font-size:20px;margin:0 0 16px;">${escapeHtml(copy.heading)}</h1>`,
      '<table style="border-collapse:collapse;margin-bottom:20px;">',
      `<tr><td style="padding:6px 12px 6px 0;font-weight:600;vertical-align:top;">${escapeHtml(copy.nameLabel)}:</td><td style="padding:6px 0;">${escapeHtml(payload.displayName)}</td></tr>`,
      `<tr><td style="padding:6px 12px 6px 0;font-weight:600;vertical-align:top;">${escapeHtml(copy.emailLabel)}:</td><td style="padding:6px 0;">${escapeHtml(payload.email)}</td></tr>`,
      "</table>",
      `<h2 style="font-size:16px;margin:0 0 8px;">${escapeHtml(copy.detailsLabel)}</h2>`,
      `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(payload.message)}</p>`,
    ].join(""),
    subject: `${environmentPrefix}[${copy.subjectPrefix}] ${sanitizeLine(payload.displayName)}`,
    text: [
      copy.heading,
      "",
      `${copy.nameLabel}: ${payload.displayName}`,
      `${copy.emailLabel}: ${payload.email}`,
      "",
      `${copy.detailsLabel}:`,
      payload.message,
    ].join("\n"),
  };
}

export async function mapQuickContactToMail(
  payload: SaveQuickContactDto,
  to: string,
): Promise<MailMessage> {
  const message = await createQuickContactNotificationMessage(payload);

  return {
    html: message.html,
    subject: message.subject,
    text: message.text,
    to,
  };
}
