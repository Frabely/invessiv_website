import { SystemMessageParam } from "@invessiv/common/constants/crm/system-message-keys";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { SystemMessageTexts } from "@/common/contracts/crm/system-message-texts";

/**
 * A system event stores a dictionary key and raw parameters; the phase value is translated here so
 * CRM and portal render the same event with their own chat dictionary.
 */
export function describeSystemMessage(
  message: Pick<MessageDto, "body" | "metadata">,
  texts: SystemMessageTexts,
): string {
  const template = message.body
    ? texts.systemMessages[message.body]
    : undefined;
  if (!template) return texts.thread.systemFallback;
  const params = { ...(message.metadata ?? {}) };
  const phase = params[SystemMessageParam.Phase];
  if (phase) params[SystemMessageParam.Phase] = texts.phases[phase] ?? phase;
  return formatMessage(template, params);
}
