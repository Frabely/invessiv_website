"use client";

import { useId } from "react";
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";
import { MessageThread, MessageThreadStatus } from "@invessiv/ui";
import { describeSystemMessage } from "@/common/patterns/crm/describe-system-message";
import { describeThreadNotice } from "@/common/patterns/crm/describe-thread-notice";
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
        onSendAction={thread.conversation.canWrite ? thread.send : undefined}
        ownDisplayName={content.thread.own}
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
