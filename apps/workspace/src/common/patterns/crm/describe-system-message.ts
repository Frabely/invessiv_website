import { SystemMessageParam } from "@invessiv/common/constants/crm/system-message-keys";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import { formatMessage } from "@/lib/i18n/format-message";

/**
 * A system event stores a dictionary key and raw parameters; the phase value is translated here so
 * CRM and portal render the same event with their own texts.
 */
export function describeSystemMessage(
  message: Pick<MessageDto, "body" | "metadata">,
  texts: {
    templates: Readonly<Record<string, string>>;
    phases: Readonly<Record<string, string>>;
    fallback: string;
  },
): string {
  const template = message.body ? texts.templates[message.body] : undefined;
  if (!template) return texts.fallback;
  const params = { ...(message.metadata ?? {}) };
  const phase = params[SystemMessageParam.Phase];
  if (phase) params[SystemMessageParam.Phase] = texts.phases[phase] ?? phase;
  return formatMessage(template, params);
}
