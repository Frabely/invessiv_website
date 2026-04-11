import "server-only";
import type { QuickContactSubmitRequest } from "@/common/contracts/contact/submit/contact-submit";
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
  payload: QuickContactSubmitRequest,
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
      `<tr><td style="padding:6px 12px 6px 0;font-weight:600;vertical-align:top;">${escapeHtml(copy.firstNameLabel)}:</td><td style="padding:6px 0;">${escapeHtml(payload.firstName)}</td></tr>`,
      `<tr><td style="padding:6px 12px 6px 0;font-weight:600;vertical-align:top;">${escapeHtml(copy.lastNameLabel)}:</td><td style="padding:6px 0;">${escapeHtml(payload.lastName)}</td></tr>`,
      `<tr><td style="padding:6px 12px 6px 0;font-weight:600;vertical-align:top;">${escapeHtml(copy.emailLabel)}:</td><td style="padding:6px 0;">${escapeHtml(payload.email)}</td></tr>`,
      "</table>",
      `<h2 style="font-size:16px;margin:0 0 8px;">${escapeHtml(copy.detailsLabel)}</h2>`,
      `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(payload.message)}</p>`,
    ].join(""),
    subject: `${environmentPrefix}[${copy.subjectPrefix}] ${sanitizeLine(payload.firstName)} ${sanitizeLine(payload.lastName)}`,
    text: [
      copy.heading,
      "",
      `${copy.firstNameLabel}: ${payload.firstName}`,
      `${copy.lastNameLabel}: ${payload.lastName}`,
      `${copy.emailLabel}: ${payload.email}`,
      "",
      `${copy.detailsLabel}:`,
      payload.message,
    ].join("\n"),
  };
}

export async function mapQuickContactToMail(
  payload: QuickContactSubmitRequest,
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
