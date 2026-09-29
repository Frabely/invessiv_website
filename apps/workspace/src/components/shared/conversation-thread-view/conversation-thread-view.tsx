"use client";

import { type ReactNode, useState } from "react";
import {
  type FileUploadDialogFrameProps,
  type MessageComposerAttachmentsProps,
  MessageThread,
  MessageThreadStatus,
} from "@invessiv/ui";
import { MESSAGE_ATTACHMENTS_MAX } from "@invessiv/common/constants/crm/message-limits";
import { FileErrorCode } from "@invessiv/common/constants/files/file-error-code";
import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import type { ComposerAttachment } from "@invessiv/common/contracts/ui/composer-attachment";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
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
  /** Chips are always shown; download and 📎 follow the capabilities of `api`. */
  attachments: ConversationThreadAttachmentsProps<TFile>;
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
  const notice =
    released === 1 ? texts.releaseNoticeOne : texts.releaseNoticeMany;
  return notice ?? null;
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

  const { api, texts } = attachments;
  const picked = thread.attachments.items;
  const releaseWarning = releaseNotice(picked, texts);
  const remaining = MESSAGE_ATTACHMENTS_MAX - picked.length;
  const limitText = formatMessage(texts.limitReached, {
    max: String(MESSAGE_ATTACHMENTS_MAX),
  });

  async function download(fileId: string) {
    setDownloadFailed(false);
    const result = await api.getDownloadUrl(fileId);
    if (result.ok) browserDownload.openUrl(result.value);
    else setDownloadFailed(true);
  }

  // The download error belongs to the last download; the next send clears it.
  const send = onSendAction
    ? (body: string) => {
        setDownloadFailed(false);
        onSendAction(body);
      }
    : undefined;
  // Attaching belongs to writing: a read-only thread shows chips but no 📎.
  const composerAttachments: MessageComposerAttachmentsProps | undefined =
    send && (api.listFiles || api.upload)
      ? {
          items: picked,
          notice: releaseWarning,
          confirmation:
            releaseWarning &&
            texts.releaseConfirmTitle &&
            texts.releaseConfirmDescription &&
            texts.releaseConfirmButton
              ? {
                  title: texts.releaseConfirmTitle,
                  description: texts.releaseConfirmDescription,
                  confirmLabel: texts.releaseConfirmButton,
                  cancelLabel: texts.cancel,
                  closeLabel: texts.close,
                }
              : undefined,
          onRemoveAction: thread.attachments.remove,
          trigger: (
            <ChatAttachmentMenu
              canPick={Boolean(api.listFiles)}
              canUpload={Boolean(api.upload)}
              labels={{ ...texts, limitReached: limitText }}
              limitReached={remaining <= 0}
              onPickAction={() => setDialog(AttachmentDialog.Pick)}
              onUploadAction={() => setDialog(AttachmentDialog.Upload)}
            />
          ),
        }
      : undefined;
  // A failed reload or send outranks a failed download.
  const notice =
    describeThreadNotice(thread, content.states) ??
    (downloadFailed ? texts.downloadError : null);

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
        onDownloadAttachmentAction={(fileId) => void download(fileId)}
        onRedactAction={onRedactAction}
        onSendAction={send}
        ownDisplayName={content.thread.own}
      />
      {dialog === AttachmentDialog.Pick && api.listFiles ? (
        <ChatFilePickerDialog
          attachedIds={picked.map((item) => item.fileId)}
          labels={{ ...texts, limitReached: limitText }}
          listFiles={api.listFiles}
          onCloseAction={() => setDialog(null)}
          onPickAction={(selected) => {
            thread.attachments.add(selected);
            setDialog(null);
          }}
          remaining={remaining}
          searchable={api.searchable}
        />
      ) : null}
      {dialog === AttachmentDialog.Upload && api.upload ? (
        <ChatUploadDialog
          labels={{
            ...attachments.files.upload,
            title: texts.uploadTitle,
            description: texts.uploadDescription,
          }}
          locale={locale}
          maxFiles={remaining}
          onCloseAction={() => setDialog(null)}
          onUploadedAction={(attachment) =>
            thread.attachments.add([attachment])
          }
          rowLabels={{
            ...attachments.files.upload,
            // The chat's own limit replaces the batch limit of the files area.
            errors: {
              ...attachments.files.errors,
              [FileErrorCode.TooManyFiles]: limitText,
            },
          }}
          upload={api.upload}
        />
      ) : null}
      {children}
    </div>
  );
}
