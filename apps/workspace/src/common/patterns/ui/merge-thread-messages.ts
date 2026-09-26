import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";

function compareMessages(left: MessageDto, right: MessageDto): number {
  if (left.createdAt !== right.createdAt)
    return left.createdAt < right.createdAt ? -1 : 1;
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

/**
 * Unites loaded pages chronologically. A message present in `incoming` replaces the known one, so a
 * reload shows a redaction that happened in the meantime.
 */
export function mergeThreadMessages(
  known: readonly MessageDto[],
  incoming: readonly MessageDto[],
): MessageDto[] {
  const byId = new Map(known.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort(compareMessages);
}
