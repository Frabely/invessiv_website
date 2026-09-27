import { MessageType } from "@invessiv/common/constants/crm/message-types";
import { ThreadMessageItemKind } from "@invessiv/common/constants/ui/thread-message-item-kinds";
import type { ThreadDaySection } from "@invessiv/common/contracts/ui/thread-day-section";
import type { ThreadMessageGroup } from "@invessiv/common/contracts/ui/thread-message-group";
import type { ThreadMessageItem } from "@invessiv/common/contracts/ui/thread-message-item";

const GROUP_WINDOW_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function itemCreatedAt(item: ThreadMessageItem): string {
  return item.kind === ThreadMessageItemKind.Message
    ? item.message.createdAt
    : item.pending.createdAt;
}

function itemKey(item: ThreadMessageItem): string {
  return item.kind === ThreadMessageItemKind.Message
    ? item.message.id
    : item.pending.clientId;
}

/** Keep confirmed and optimistic rows in one chronological sequence. */
export function sortThreadMessageItems(
  items: readonly ThreadMessageItem[],
): ThreadMessageItem[] {
  return [...items].sort((left, right) => {
    const leftAt = itemCreatedAt(left);
    const rightAt = itemCreatedAt(right);
    if (leftAt !== rightAt) return leftAt < rightAt ? -1 : 1;
    return itemKey(left).localeCompare(itemKey(right));
  });
}

function isSystemItem(item: ThreadMessageItem): boolean {
  return (
    item.kind === ThreadMessageItemKind.Message &&
    item.message.type === MessageType.System
  );
}

function isOwnItem(item: ThreadMessageItem): boolean {
  return item.kind === ThreadMessageItemKind.Pending || item.message.isOwn;
}

/** Identity of the speaker; own rows share one identity regardless of confirmation state. */
function senderIdentity(item: ThreadMessageItem): string {
  if (item.kind === ThreadMessageItemKind.Pending || item.message.isOwn)
    return "own";
  return `${item.message.senderSide}:${item.message.senderDisplayName}`;
}

/** Local calendar day as `YYYY-MM-DD`, so dividers follow the viewer's clock. */
export function threadDayKey(iso: string): string {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function startGroup(
  item: ThreadMessageItem,
  ownDisplayName: string,
): ThreadMessageGroup {
  return {
    key: itemKey(item),
    isSystem: isSystemItem(item),
    isOwn: isOwnItem(item),
    senderDisplayName:
      item.kind === ThreadMessageItemKind.Message
        ? item.message.senderDisplayName
        : ownDisplayName,
    startedAt: itemCreatedAt(item),
    items: [item],
  };
}

function belongsToGroup(
  group: ThreadMessageGroup,
  item: ThreadMessageItem,
): boolean {
  if (group.isSystem || isSystemItem(item)) return false;
  const last = group.items.at(-1);
  if (!last || senderIdentity(last) !== senderIdentity(item)) return false;
  const gap =
    new Date(itemCreatedAt(item)).getTime() -
    new Date(itemCreatedAt(last)).getTime();
  return gap >= 0 && gap <= GROUP_WINDOW_MS;
}

/**
 * Splits chronologically ordered rows into calendar days and speaker groups. A group ends after
 * five minutes of silence, with another speaker or at a system event; system events stand alone.
 */
export function groupThreadMessages(
  items: readonly ThreadMessageItem[],
  ownDisplayName: string,
): ThreadDaySection[] {
  const days: ThreadDaySection[] = [];
  for (const item of items) {
    const createdAt = itemCreatedAt(item);
    const dayKey = threadDayKey(createdAt);
    let day = days.at(-1);
    if (!day || day.dayKey !== dayKey) {
      day = { dayKey, firstAt: createdAt, groups: [] };
      days.push(day);
    }
    const group = day.groups.at(-1);
    if (group && belongsToGroup(group, item)) {
      group.items.push(item);
    } else {
      day.groups.push(startGroup(item, ownDisplayName));
    }
  }
  return days;
}

/** "today", "yesterday" or the formatted date — formatting follows the locale via `Intl`. */
export function describeThreadDay(
  firstAt: string,
  now: Date,
  locale: string,
  labels: { today: string; yesterday: string },
): string {
  const dayKey = threadDayKey(firstAt);
  if (dayKey === threadDayKey(now.toISOString())) return labels.today;
  if (dayKey === threadDayKey(new Date(now.getTime() - DAY_MS).toISOString()))
    return labels.yesterday;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(firstAt));
}
