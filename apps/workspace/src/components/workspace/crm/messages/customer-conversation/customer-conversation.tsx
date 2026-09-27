"use client";

import { useEffect, useState } from "react";
import {
  ConfirmDialog,
  MessageThread,
  MessageThreadStatus,
} from "@invessiv/ui";
import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
import { MESSAGE_DRAFT_STORAGE_KEY_PREFIX } from "@/common/constants/crm/message-draft-storage";
import { describeSystemMessage } from "@/common/patterns/crm/describe-system-message";
import { describeThreadNotice } from "@/common/patterns/crm/describe-thread-notice";
import type { Locale } from "@/config/i18n";
import { useCustomerConversation } from "@/hooks/workspace/crm/use-customer-conversation";
import type { CrmMessagesDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./customer-conversation.module.css";

type CustomerConversationProps = {
  /** Only a visible conversation loads, refreshes and counts as read. */
  active: boolean;
  canWrite: boolean;
  content: CrmMessagesDictionary;
  customerId: string;
  initialConversation: InternalConversationDto | null;
  locale: Locale;
  viewerMemberId: string;
};

export function CustomerConversation({
  active,
  canWrite,
  content,
  customerId,
  initialConversation,
  locale,
  viewerMemberId,
}: CustomerConversationProps) {
  const thread = useCustomerConversation(
    customerId,
    initialConversation,
    active,
    `${viewerMemberId}:${customerId}`,
  );
  const [redactionTarget, setRedactionTarget] = useState<string | null>(null);
  const [redacting, setRedacting] = useState(false);
  const [redactionFailed, setRedactionFailed] = useState(false);

  useEffect(() => {
    // Legacy drafts had no owner scope and cannot be assigned safely after an account switch.
    try {
      window.localStorage.removeItem(
        `${MESSAGE_DRAFT_STORAGE_KEY_PREFIX}${customerId}`,
      );
    } catch {
      // Blocked storage does not affect the conversation.
    }
  }, [customerId]);

  if (!active) return null;

  if (!thread.conversation) {
    return (
      <MessageThreadStatus
        failed={thread.loadFailed}
        labels={content.states}
        onReloadAction={() => void thread.reload()}
      />
    );
  }

  function requestRedaction(messageId: string) {
    setRedactionFailed(false);
    setRedactionTarget(messageId);
  }

  async function confirmRedaction() {
    if (!redactionTarget) return;
    setRedacting(true);
    const ok = await thread.redact(redactionTarget);
    setRedacting(false);
    setRedactionFailed(!ok);
    if (ok) setRedactionTarget(null);
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
        onRedactAction={
          thread.conversation.canRedact ? requestRedaction : undefined
        }
        onSendAction={canWrite ? thread.send : undefined}
        ownDisplayName={content.thread.own}
      />
      {redactionTarget ? (
        <ConfirmDialog
          busy={redacting}
          cancelLabel={content.redaction.cancel}
          closeLabel={content.redaction.close}
          confirmLabel={content.redaction.confirm}
          description={content.redaction.description}
          onCancelAction={() => setRedactionTarget(null)}
          onConfirmAction={() => void confirmRedaction()}
          title={content.redaction.title}
          tone="danger"
        >
          {redactionFailed ? (
            <p className={styles.notice} role="alert">
              {content.redaction.error}
            </p>
          ) : null}
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
