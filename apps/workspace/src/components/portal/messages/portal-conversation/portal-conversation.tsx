"use client";

import { useId } from "react";
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";
import { MessageThread, MessageThreadStatus } from "@invessiv/ui";
import { describeSystemMessage } from "@/common/patterns/crm/describe-system-message";
import { PortalOwnerNotice } from "@/components/portal/portal-owner-notice/portal-owner-notice";
import type { Locale } from "@/config/i18n";
import { usePortalConversation } from "@/hooks/portal/use-portal-conversation";
import type { PortalMessagesDictionary } from "@/i18n/dictionaries/portal";
import styles from "./portal-conversation.module.css";

export type PortalConversationProps = {
  /** Only a visible conversation loads, refreshes and counts as read. */
  active: boolean;
  /** CRM link for the owner's read-only view; null for customer contacts. */
  cockpitHref: string | null;
  content: PortalMessagesDictionary;
  customerId: string;
  initialConversation: PortalConversationDto | null;
  locale: Locale;
  /** Keeps drafts and failed sends private to the signed-in user. */
  viewerUserId: string;
};

export function PortalConversation({
  active,
  cockpitHref,
  content,
  customerId,
  initialConversation,
  locale,
  viewerUserId,
}: PortalConversationProps) {
  const ownerNoticeId = useId();
  const thread = usePortalConversation(
    customerId,
    initialConversation,
    active,
    `${viewerUserId}:${customerId}`,
  );

  if (!active) return null;

  if (!thread.conversation) {
    return (
      <MessageThreadStatus
        errorLabel={content.states.loadError}
        failed={thread.loadFailed}
        loadingLabel={content.states.loading}
        onReloadAction={() => void thread.reload()}
        reloadLabel={content.states.reload}
      />
    );
  }

  const describe = (message: MessageDto) =>
    describeSystemMessage(message, {
      templates: content.systemMessages,
      phases: content.phases,
      fallback: content.thread.systemFallback,
    });

  const notice = thread.loadFailed
    ? content.states.loadError
    : thread.sendError === MessageErrorCode.RateLimited
      ? content.states.rateLimited
      : thread.olderFailed
        ? content.states.olderError
        : null;

  return (
    <div className={styles.conversation}>
      <MessageThread
        describeSystemMessageAction={describe}
        draftStorageKey={thread.draftStorageKey}
        hasOlder={thread.hasOlder}
        labels={content.thread}
        loadingOlder={thread.loadingOlder}
        locale={locale}
        messages={thread.messages}
        notice={notice}
        onLoadOlderAction={() => void thread.loadOlder()}
        onRetryAction={thread.retry}
        onSendAction={thread.conversation.canWrite ? thread.send : undefined}
        ownDisplayName={content.thread.own}
        pending={thread.pending}
      />
      {cockpitHref ? (
        <PortalOwnerNotice
          cockpitHref={cockpitHref}
          hint={content.ownerView.hint}
          id={ownerNoticeId}
          linkLabel={content.ownerView.link}
        />
      ) : null}
    </div>
  );
}
