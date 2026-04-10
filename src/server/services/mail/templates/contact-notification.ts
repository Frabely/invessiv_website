import "server-only";
import type { ProjectRequestSubmitInput } from "@/features/contact/contact.schema";
import { getDictionary } from "@/i18n/get-dictionary";
import { getServerEnv } from "@/server/config/env";
import {
  escapeHtml,
  getEnvironmentSubjectPrefix,
  sanitizeLine,
} from "@/server/services/mail/templates/template-utils";

type ContactNotificationMessage = {
  html: string;
  subject: string;
  text: string;
};

type ContactNotificationCopy = Awaited<
  ReturnType<typeof getDictionary>
>["mail"]["contactNotification"];

function mapValue(
  field: string,
  value: string | string[] | undefined,
  localeCopy: ContactNotificationCopy,
) {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => localeCopy.values[field]?.[entry] ?? entry)
      .join(", ");
  }

  return localeCopy.values[field]?.[value] ?? value;
}

export async function createContactNotificationMessage(
  payload: ProjectRequestSubmitInput,
): Promise<ContactNotificationMessage> {
  const copy = (await getDictionary(payload.locale)).mail.contactNotification;
  const localizedOffer =
    mapValue("offerKey", payload.offerKey, copy) ?? payload.offerKey;
  const environmentPrefix = getEnvironmentSubjectPrefix(
    getServerEnv().deploymentEnvironment,
  );
  const subject = `${environmentPrefix}[${copy.subjectPrefix}] ${sanitizeLine(localizedOffer)} | ${sanitizeLine(payload.firstName)} ${sanitizeLine(payload.lastName)}`;
  const rows = [
    [copy.labels.offerKey, mapValue("offerKey", payload.offerKey, copy)],
    [copy.labels.firstName, payload.firstName],
    [copy.labels.lastName, payload.lastName],
    [copy.labels.email, payload.email],
    [copy.labels.company, payload.company],
    [copy.labels.role, payload.role],
    [copy.labels.phone, payload.phone],
    [copy.labels.website, payload.website],
    [copy.labels.goalKey, mapValue("goalKey", payload.goalKey, copy)],
    [copy.labels.pageKeys, mapValue("pageKeys", payload.pageKeys, copy)],
    [copy.labels.budgetKey, mapValue("budgetKey", payload.budgetKey, copy)],
    [
      copy.labels.preferredStartKey,
      mapValue("preferredStartKey", payload.preferredStartKey, copy),
    ],
    [
      copy.labels.workflowKey,
      mapValue("workflowKey", payload.workflowKey, copy),
    ],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  const textRows = rows.map(([label, value]) => `"${label}": ${value}`);
  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;font-weight:600;vertical-align:top;">"${escapeHtml(label)}":</td><td style="padding:6px 0;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return {
    html: [
      `<h1 style="font-size:20px;margin:0 0 16px;">${escapeHtml(copy.heading)}</h1>`,
      `<table style="border-collapse:collapse;margin-bottom:20px;">${htmlRows}</table>`,
      `<h2 style="font-size:16px;margin:0 0 8px;">${escapeHtml(copy.detailsLabel)}</h2>`,
      `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(payload.projectDetails)}</p>`,
    ].join(""),
    subject,
    text: [
      copy.heading,
      "",
      ...textRows,
      "",
      `${copy.detailsLabel}:`,
      payload.projectDetails,
    ].join("\n"),
  };
}
