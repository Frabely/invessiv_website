"use client";

import { useMemo } from "react";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonControl } from "@invessiv/ui";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import { ThreadMessageItemKind } from "@/common/constants/ui/thread-message-item-kinds";
import type { MessageThreadLabels } from "@/common/contracts/ui/message-thread-labels";
import type { PendingThreadMessage } from "@/common/contracts/ui/pending-thread-message";
import type { ThreadMessageItem } from "@/common/contracts/ui/thread-message-item";
import {
  describeThreadDay,
  groupThreadMessages,
  sortThreadMessageItems,
} from "@/common/patterns/ui/group-thread-messages";
import { useIsBrowser } from "@/hooks/use-is-browser";
import { useThreadAutoscroll } from "@/hooks/workspace/shared/use-thread-autoscroll";
import { MessageComposer } from "../message-composer/message-composer";
import { MessageDateDivider } from "../message-date-divider/message-date-divider";
import { MessageGroup } from "../message-group/message-group";
import { MessageSystemEntry } from "../message-system-entry/message-system-entry";
import styles from "./message-thread.module.css";

export type MessageThreadProps = {
  /** Scope of the locally kept draft, e.g. the customer id. */
  draftScopeId: string;
  /** Turns a system event (dictionary key + parameters) into text. */
  describeSystemMessageAction: (message: MessageDto) => string;
  hasOlder: boolean;
  labels: MessageThreadLabels;
  loadingOlder: boolean;
  locale: string;
  messages: readonly MessageDto[];
  onLoadOlderAction: () => void;
  onRedactAction?: (messageId: string) => void;
  onRetryAction: (clientId: string) => void;
  /** Without it the thread is read-only and renders no composer. */
  onSendAction?: (body: string) => void;
  ownDisplayName: string;
  pending: readonly PendingThreadMessage[];
};

export function MessageThread({
  draftScopeId,
  describeSystemMessageAction,
  hasOlder,
  labels,
  loadingOlder,
  locale,
  messages,
  onLoadOlderAction,
  onRedactAction,
  onRetryAction,
  onSendAction,
  ownDisplayName,
  pending,
}: MessageThreadProps) {
  // Dates and times depend on the viewer's time zone, so they only render in the browser.
  const isBrowser = useIsBrowser();
  const items = useMemo<ThreadMessageItem[]>(
    () =>
      sortThreadMessageItems([
        ...messages.map((message) => ({
          kind: ThreadMessageItemKind.Message,
          message,
        })),
        ...pending.map((entry) => ({
          kind: ThreadMessageItemKind.Pending,
          pending: entry,
        })),
      ]),
    [messages, pending],
  );
  const days = useMemo(
    () => groupThreadMessages(items, ownDisplayName),
    [items, ownDisplayName],
  );
  const firstItem = items.at(0);
  const lastItem = items.at(-1);
  const keyOf = (item: ThreadMessageItem | undefined) =>
    item
      ? item.kind === ThreadMessageItemKind.Message
        ? item.message.id
        : item.pending.clientId
      : null;
  const {
    containerRef,
    hasUnseen,
    onScroll,
    scrollToBottom,
    stickToBottomOnNextChange,
  } = useThreadAutoscroll(
    isBrowser ? keyOf(firstItem) : null,
    isBrowser ? keyOf(lastItem) : null,
  );
  const timeFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }),
    [locale],
  );

  function handleSend(body: string) {
    stickToBottomOnNextChange();
    onSendAction?.(body);
  }

  const now = new Date();

  return (
    <div className={styles.thread}>
      <div className={styles.viewport}>
        <div
          aria-busy={loadingOlder}
          aria-label={labels.logLabel}
          className={styles.log}
          onScroll={onScroll}
          ref={containerRef}
          role="log"
          tabIndex={0}
        >
          {hasOlder ? (
            <ButtonControl
              className={styles.loadOlder}
              disabled={loadingOlder}
              onClick={onLoadOlderAction}
              type="button"
              variant="ghost"
            >
              {loadingOlder ? labels.loadingOlder : labels.loadOlder}
            </ButtonControl>
          ) : null}
          {items.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>{labels.emptyTitle}</p>
              <p>{labels.emptyBody}</p>
            </div>
          ) : isBrowser ? (
            days.map((day) => (
              <div className={styles.day} key={day.dayKey}>
                <MessageDateDivider
                  dateTime={day.dayKey}
                  label={describeThreadDay(day.firstAt, now, locale, labels)}
                />
                {day.groups.map((group) => {
                  const timeLabel = timeFormat.format(
                    new Date(group.startedAt),
                  );
                  const first = group.items[0];
                  return group.isSystem &&
                    first.kind === ThreadMessageItemKind.Message ? (
                    <MessageSystemEntry
                      dateTime={group.startedAt}
                      key={group.key}
                      text={describeSystemMessageAction(first.message)}
                      timeLabel={timeLabel}
                    />
                  ) : (
                    <MessageGroup
                      canRedact={Boolean(onRedactAction)}
                      group={group}
                      key={group.key}
                      labels={labels}
                      onRedactAction={onRedactAction}
                      onRetryAction={onRetryAction}
                      timeLabel={timeLabel}
                    />
                  );
                })}
              </div>
            ))
          ) : null}
        </div>
        {hasUnseen ? (
          <ButtonControl
            className={styles.newMessages}
            onClick={scrollToBottom}
            type="button"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faArrowDown} />
            {labels.newMessages}
          </ButtonControl>
        ) : null}
      </div>
      {onSendAction ? (
        <MessageComposer
          draftScopeId={draftScopeId}
          labels={labels}
          onSendAction={handleSend}
        />
      ) : null}
    </div>
  );
}
