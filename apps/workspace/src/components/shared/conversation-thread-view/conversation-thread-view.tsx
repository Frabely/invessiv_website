"use client";

import { type ReactNode, useState } from "react";
import {
  type FileUploadDialogFrameProps,
  type MessageComposerAttachmentsProps,
  MessageThread,
  MessageThreadStatus,
} from "@invessiv/ui";
import { MESSAGE_ATTACHMENTS_MAX } from "@invessiv/common/constants/crm/message-limits";
import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import type { ComposerAttachment } from "@invessiv/common/contracts/ui/composer-attachment";
import type { ConversationThreadTexts } from "@/common/contracts/crm/conversation-thread-texts";
import type { ChatAttachmentApi } from "@/common/contracts/files/chat-attachment-api";
import type { ChatAttachmentTexts } from "@/common/contracts/files/chat-attachment-texts";
import { describeSystemMessage } from "@/common/patterns/crm/describe-system-message";
import { describeThreadNotice } from "@/common/patterns/crm/describe-thread-notice";
import type { Locale } from "@/config/i18n";
import type { useConversationThread } from "@/hooks/shared/use-conversation-thread";
import { browserDownload } from "@/lib/files/browser-download";
import { ChatAttachmentMenu } from "../chat-attachments/chat-attachment-menu/chat-attachment-menu";
import { ChatFilePickerDialog } from "../chat-attachments/chat-file-picker-dialog/chat-file-picker-dialog";
import { ChatUploadDialog } from "../chat-attachments/chat-upload-dialog/chat-upload-dialog";
import styles from "./conversation-thread-view.module.css";

const AttachmentDialog = { Upload: "upload", Pick: "pick" } as const;
type AttachmentDialog =
  (typeof AttachmentDialog)[keyof typeof AttachmentDialog];

export type ConversationThreadAttachmentsProps<TFile extends { id: string }> = {
  api: ChatAttachmentApi<TFile>;
  /** Upload labels and error texts of the side's file dictionary. */
  files: {
    upload: FileUploadDialogFrameProps["labels"] &
      Omit<FileUploadDialogFrameProps["rowLabels"], "errors">;
    errors: FileUploadDialogFrameProps["rowLabels"]["errors"];
  };
  texts: ChatAttachmentTexts;
};

export type ConversationThreadViewProps<TFile extends { id: string }> = {
  /** Without it the thread shows attachment chips but offers no download and no 📎. */
  attachments?: ConversationThreadAttachmentsProps<TFile>;
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

function releaseNotice(
  items: readonly ComposerAttachment[],
  texts: ChatAttachmentTexts,
): string | null {
  const released = items.filter((item) => item.releasesOnSend).length;
  if (released === 0) return null;
  return (
    (released === 1 ? texts.releaseNoticeOne : texts.releaseNoticeMany) ?? null
  );
}

/** The conversation as the CRM and the portal show it: loading state first, then the thread. */
export function ConversationThreadView<TFile extends { id: string }>({
  attachments,
  children,
  content,
  locale,
  onRedactAction,
  onSendAction,
  thread,
}: ConversationThreadViewProps<TFile>) {
  const [dialog, setDialog] = useState<AttachmentDialog | null>(null);
  const [downloadFailed, setDownloadFailed] = useState(false);

  if (!thread.conversation) {
    return (
      <MessageThreadStatus
        failed={thread.loadFailed}
        labels={content.states}
        onReloadAction={() => void thread.reload()}
      />
    );
  }

  const picked = thread.attachments.items;
  const api = attachments?.api;

  async function download(fileId: string) {
    if (!api) return;
    setDownloadFailed(false);
    const result = await api.getDownloadUrl(fileId);
    if (result.ok) browserDownload.openUrl(result.value);
    else setDownloadFailed(true);
  }

  // Attaching belongs to writing: a read-only thread shows chips but no 📎.
  const composerAttachments: MessageComposerAttachmentsProps | undefined =
    attachments &&
    onSendAction &&
    (attachments.api.listFiles || attachments.api.upload)
      ? {
          items: picked,
          notice: releaseNotice(picked, attachments.texts),
          onRemoveAction: thread.attachments.remove,
          trigger: (
            <ChatAttachmentMenu
              canPick={Boolean(attachments.api.listFiles)}
              canUpload={Boolean(attachments.api.upload)}
              labels={attachments.texts}
              limitReached={picked.length >= MESSAGE_ATTACHMENTS_MAX}
              onPickAction={() => setDialog(AttachmentDialog.Pick)}
              onUploadAction={() => setDialog(AttachmentDialog.Upload)}
            />
          ),
        }
      : undefined;
  // A failed reload or send outranks a failed download.
  const notice =
    describeThreadNotice(thread, content.states) ??
    (downloadFailed && attachments ? attachments.texts.downloadError : null);

  return (
    <div className={styles.conversation}>
      <MessageThread
        {...thread.threadProps}
        composerAttachments={composerAttachments}
        describeSystemMessageAction={(message) =>
          describeSystemMessage(message, content)
        }
        labels={content.thread}
        locale={locale}
        notice={notice}
        onDownloadAttachmentAction={
          api ? (fileId) => void download(fileId) : undefined
        }
        onRedactAction={onRedactAction}
        onSendAction={onSendAction}
        ownDisplayName={content.thread.own}
      />
      {dialog === AttachmentDialog.Pick && attachments && api?.listFiles ? (
        <ChatFilePickerDialog
          attachedIds={picked.map((item) => item.fileId)}
          labels={attachments.texts}
          listFiles={api.listFiles}
          onCloseAction={() => setDialog(null)}
          onPickAction={(selected) => {
            thread.attachments.add(selected);
            setDialog(null);
          }}
          remaining={MESSAGE_ATTACHMENTS_MAX - picked.length}
          searchable={api.searchable}
        />
      ) : null}
      {dialog === AttachmentDialog.Upload && attachments && api?.upload ? (
        <ChatUploadDialog
          labels={{
            ...attachments.files.upload,
            title: attachments.texts.uploadTitle,
            description: attachments.texts.uploadDescription,
          }}
          locale={locale}
          onCloseAction={() => setDialog(null)}
          onUploadedAction={(attachment) =>
            thread.attachments.add([attachment])
          }
          rowLabels={{
            ...attachments.files.upload,
            errors: attachments.files.errors,
          }}
          upload={api.upload}
        />
      ) : null}
      {children}
    </div>
  );
}
