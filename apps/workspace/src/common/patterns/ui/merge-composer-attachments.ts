import { MESSAGE_ATTACHMENTS_MAX } from "@invessiv/common/constants/crm/message-limits";
import type { ComposerAttachment } from "@invessiv/common/contracts/ui/composer-attachment";

/** Keeps the picking order, ignores entries already attached and stops at the per-message limit. */
export function mergeComposerAttachments(
  current: readonly ComposerAttachment[],
  added: readonly ComposerAttachment[],
): ComposerAttachment[] {
  const merged = [...current];
  for (const attachment of added) {
    if (merged.length >= MESSAGE_ATTACHMENTS_MAX) break;
    if (!merged.some((entry) => entry.fileId === attachment.fileId))
      merged.push(attachment);
  }
  return merged;
}
