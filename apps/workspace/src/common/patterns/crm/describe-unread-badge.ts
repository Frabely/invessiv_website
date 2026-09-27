import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";

/** Badge text of a chat dock; nothing while everything is read. */
export function describeUnreadBadge(
  unreadCount: number,
  template: string,
): string | undefined {
  return unreadCount > 0
    ? formatMessage(template, { count: unreadCount })
    : undefined;
}
