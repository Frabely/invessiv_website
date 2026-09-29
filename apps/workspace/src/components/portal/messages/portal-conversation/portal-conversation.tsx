"use client";

import { useId } from "react";
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";
import { PortalOwnerNotice } from "@/components/portal/portal-owner-notice/portal-owner-notice";
import { ConversationThreadView } from "@/components/shared/conversation-thread-view/conversation-thread-view";
import type { Locale } from "@/config/i18n";
import { usePortalChatAttachmentApi } from "@/hooks/portal/use-portal-chat-attachment-api";
import { usePortalConversation } from "@/hooks/portal/use-portal-conversation";
import type {
  PortalFilesDictionary,
  PortalMessagesDictionary,
} from "@/i18n/dictionaries/portal";

export type PortalConversationProps = {
  /** Only a visible conversation loads, refreshes and counts as read. */
  active: boolean;
  /** CRM link for the owner's read-only view; null for customer contacts. */
  cockpitHref: string | null;
  content: PortalMessagesDictionary;
  customerId: string;
  /** Upload labels and file errors for chat attachments. */
  filesContent: PortalFilesDictionary;
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
  filesContent,
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
  const attachmentApi = usePortalChatAttachmentApi(
    customerId,
    thread.conversation?.attachmentAccess ?? null,
  );

  if (!active) return null;

  return (
    <ConversationThreadView
      attachments={{
        api: attachmentApi,
        files: filesContent,
        texts: content.attachments,
      }}
      content={content}
      locale={locale}
      onSendAction={thread.conversation?.canWrite ? thread.send : undefined}
      thread={thread}
    >
      {cockpitHref ? (
        <PortalOwnerNotice
          cockpitHref={cockpitHref}
          hint={content.ownerView.hint}
          id={ownerNoticeId}
          linkLabel={content.ownerView.link}
        />
      ) : null}
    </ConversationThreadView>
  );
}
