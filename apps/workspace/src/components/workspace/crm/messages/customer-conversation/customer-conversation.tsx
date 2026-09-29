"use client";

import { useState } from "react";
import { ConfirmDialog } from "@invessiv/ui";
import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
import { ConversationThreadView } from "@/components/shared/conversation-thread-view/conversation-thread-view";
import type { Locale } from "@/config/i18n";
import { useCrmChatAttachmentApi } from "@/hooks/workspace/crm/use-crm-chat-attachment-api";
import { useCustomerConversation } from "@/hooks/workspace/crm/use-customer-conversation";
import type {
  CrmFilesDictionary,
  CrmMessagesDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import styles from "./customer-conversation.module.css";

type CustomerConversationProps = {
  /** Only a visible conversation loads, refreshes and counts as read. */
  active: boolean;
  /** True only with `chat.redact`, which the owner role alone holds. */
  canRedact: boolean;
  canWrite: boolean;
  content: CrmMessagesDictionary;
  customerId: string;
  /** Upload labels and file errors for chat attachments. */
  filesContent: CrmFilesDictionary;
  initialConversation: InternalConversationDto | null;
  locale: Locale;
  viewerMemberId: string;
};

export function CustomerConversation({
  active,
  canRedact,
  canWrite,
  content,
  customerId,
  filesContent,
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
  const attachmentApi = useCrmChatAttachmentApi(
    customerId,
    thread.conversation?.attachmentAccess ?? null,
  );
  const [redactionTarget, setRedactionTarget] = useState<string | null>(null);
  const [redacting, setRedacting] = useState(false);
  const [redactionFailed, setRedactionFailed] = useState(false);

  if (!active) return null;

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
    <ConversationThreadView
      attachments={{
        api: attachmentApi,
        files: filesContent,
        texts: content.attachments,
      }}
      content={content}
      locale={locale}
      onRedactAction={canRedact ? requestRedaction : undefined}
      onSendAction={canWrite ? thread.send : undefined}
      thread={thread}
    >
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
    </ConversationThreadView>
  );
}
