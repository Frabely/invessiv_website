"use client";

import {
  FileUploadDialogFrame,
  type FileUploadDialogFrameProps,
} from "@invessiv/ui";
import type { ComposerAttachment } from "@invessiv/common/contracts/ui/composer-attachment";
import type { ChatAttachmentApi } from "@/common/contracts/files/chat-attachment-api";
import { useUploadQueue } from "@/hooks/shared/use-upload-queue";

export type ChatUploadDialogProps<TFile extends { id: string }> = {
  /** File dictionary labels with the chat's own title and description. */
  labels: FileUploadDialogFrameProps["labels"];
  locale: string;
  onCloseAction: () => void;
  /** Every finished upload is attached right away; the dialog stays open for more. */
  onUploadedAction: (attachment: ComposerAttachment) => void;
  rowLabels: FileUploadDialogFrameProps["rowLabels"];
  upload: NonNullable<ChatAttachmentApi<TFile>["upload"]>;
};

/** Customer-wide upload from the chat through the side's own upload endpoints. */
export function ChatUploadDialog<TFile extends { id: string }>({
  labels,
  locale,
  onCloseAction,
  onUploadedAction,
  rowLabels,
  upload,
}: ChatUploadDialogProps<TFile>) {
  const queue = useUploadQueue<TFile>(upload.transport, {
    onUploadedAction: (file) => onUploadedAction(upload.toAttachment(file)),
  });

  return (
    <FileUploadDialogFrame
      labels={labels}
      locale={locale}
      onCloseAction={onCloseAction}
      queue={queue}
      rowLabels={rowLabels}
    />
  );
}
