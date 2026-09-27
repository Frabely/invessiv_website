"use client";

import Link from "next/link";
import { MessageType } from "@invessiv/common/constants/crm/message-types";
import type { ConversationInboxItemDto } from "@invessiv/common/contracts/crm/conversation-inbox-item.dto";
import { threadDayKey } from "@invessiv/common/patterns/ui/group-thread-messages";
import { useIsBrowser } from "@invessiv/ui";
import { describeSystemMessage } from "@/common/patterns/crm/describe-system-message";
import type { Locale } from "@/config/i18n";
import type { CrmMessagesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import styles from "./conversation-list-item.module.css";

type ConversationListItemProps = {
  content: CrmMessagesDictionary;
  href: string;
  item: ConversationInboxItemDto;
  locale: Locale;
  selected: boolean;
};

function previewText(
  item: ConversationInboxItemDto,
  content: CrmMessagesDictionary,
): string {
  const message = item.lastMessage;
  if (!message) return content.inbox.noMessages;
  if (message.type === MessageType.System)
    return describeSystemMessage(message, {
      templates: content.systemMessages,
      phases: content.phases,
      fallback: content.thread.systemFallback,
    });
  const text = message.body ?? content.thread.redacted;
  return message.isOwn ? `${content.inbox.ownPrefix}${text}` : text;
}

/** Today shows the time, older conversations the date — both in the viewer's time zone. */
function formatActivity(iso: string, locale: Locale): string {
  const date = new Date(iso);
  const isToday = threadDayKey(iso) === threadDayKey(new Date().toISOString());
  return new Intl.DateTimeFormat(
    locale,
    isToday
      ? { hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "2-digit", year: "2-digit" },
  ).format(date);
}

export function ConversationListItem({
  content,
  href,
  item,
  locale,
  selected,
}: ConversationListItemProps) {
  const isBrowser = useIsBrowser();
  const unread = item.unreadCount > 0;

  return (
    <li className={styles.item}>
      <Link
        aria-current={selected ? "true" : undefined}
        className={styles.link}
        data-selected={selected}
        data-unread={unread}
        href={href}
        scroll={false}
      >
        <span className={styles.top}>
          <span className={styles.name}>{item.customerDisplayName}</span>
          {item.lastMessageAt && isBrowser ? (
            <time className={styles.time} dateTime={item.lastMessageAt}>
              {formatActivity(item.lastMessageAt, locale)}
            </time>
          ) : null}
        </span>
        <span className={styles.preview}>{previewText(item, content)}</span>
        <span className={styles.bottom}>
          <span className={styles.owner}>
            {formatMessage(content.inbox.responsible, {
              name: item.ownerDisplayName,
            })}
          </span>
          {unread ? (
            <span className={styles.unread}>
              {formatMessage(content.inbox.unread, { count: item.unreadCount })}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}
