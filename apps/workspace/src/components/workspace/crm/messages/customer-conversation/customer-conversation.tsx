"use client";

import { useEffect, useState } from "react";
import { ButtonControl, ConfirmDialog } from "@invessiv/ui";
import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import { MESSAGE_DRAFT_STORAGE_KEY_PREFIX } from "@/common/constants/crm/message-draft-storage";
import { describeSystemMessage } from "@/common/patterns/crm/describe-system-message";
import { MessageThread } from "@/components/workspace/shared/message-thread/message-thread/message-thread";
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
  const draftScopeId = `${viewerMemberId}:${customerId}`;
  const thread = useCustomerConversation(
    customerId,
    initialConversation,
    active,
    draftScopeId,
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
      <div
        className={styles.state}
        role={thread.loadFailed ? "alert" : "status"}
      >
        {thread.loadFailed ? (
          <>
            <p>{content.states.loadError}</p>
            <ButtonControl
              className={styles.stateAction}
              onClick={() => void thread.reload()}
              type="button"
              variant="ghost"
            >
              {content.states.reload}
            </ButtonControl>
          </>
        ) : (
          <p>{content.states.loading}</p>
        )}
      </div>
    );
  }

  const describe = (message: MessageDto) =>
    describeSystemMessage(message, {
      templates: content.systemMessages,
      phases: content.phases,
      fallback: content.thread.systemFallback,
    });

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
      {thread.loadFailed || thread.olderFailed ? (
        <p className={styles.notice} role="alert">
          {thread.loadFailed
            ? content.states.loadError
            : content.states.olderError}
        </p>
      ) : null}
      <MessageThread
        describeSystemMessageAction={describe}
        draftScopeId={draftScopeId}
        hasOlder={thread.hasOlder}
        labels={content.thread}
        loadingOlder={thread.loadingOlder}
        locale={locale}
        messages={thread.messages}
        onLoadOlderAction={() => void thread.loadOlder()}
        onRedactAction={
          thread.conversation.canRedact
            ? (messageId) => {
                setRedactionFailed(false);
                setRedactionTarget(messageId);
              }
            : undefined
        }
        onRetryAction={thread.retry}
        onSendAction={canWrite ? thread.send : undefined}
        ownDisplayName={content.thread.own}
        pending={thread.pending}
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
