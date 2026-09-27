"use client";

import type { ReactNode } from "react";
import { MessageThread, MessageThreadStatus } from "@invessiv/ui";
import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import type { ConversationThreadTexts } from "@/common/contracts/crm/conversation-thread-texts";
import { describeSystemMessage } from "@/common/patterns/crm/describe-system-message";
import { describeThreadNotice } from "@/common/patterns/crm/describe-thread-notice";
import type { Locale } from "@/config/i18n";
import type { useConversationThread } from "@/hooks/shared/use-conversation-thread";
import styles from "./conversation-thread-view.module.css";

export type ConversationThreadViewProps = {
  /** Rendered below the thread, e.g. the owner notice of the portal or a confirmation dialog. */
  children?: ReactNode;
  content: ConversationThreadTexts;
  locale: Locale;
  /** Without it no message offers the redact action. */
  onRedactAction?: (messageId: string) => void;
  /** Without it the thread is read-only and shows no composer. */
  onSendAction?: (body: string) => void;
  thread: ReturnType<typeof useConversationThread<ConversationDto>>;
};

/** The conversation as the CRM and the portal show it: loading state first, then the thread. */
export function ConversationThreadView({
  children,
  content,
  locale,
  onRedactAction,
  onSendAction,
  thread,
}: ConversationThreadViewProps) {
  if (!thread.conversation) {
    return (
      <MessageThreadStatus
        failed={thread.loadFailed}
        labels={content.states}
        onReloadAction={() => void thread.reload()}
      />
    );
  }

  return (
    <div className={styles.conversation}>
      <MessageThread
        {...thread.threadProps}
        describeSystemMessageAction={(message) =>
          describeSystemMessage(message, content)
        }
        labels={content.thread}
        locale={locale}
        notice={describeThreadNotice(thread, content.states)}
        onRedactAction={onRedactAction}
        onSendAction={onSendAction}
        ownDisplayName={content.thread.own}
      />
      {children}
    </div>
  );
}
