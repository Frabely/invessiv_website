"use client";

import { useEffect, useRef, useState } from "react";
import { UploadQueueItemStatus } from "@invessiv/common/constants/files/upload-queue-item-status";
import { FileDropZoneVariant } from "@invessiv/common/constants/ui/file-drop-zone-variants";
import type { FeedbackAttachmentDto } from "@invessiv/common/contracts/crm/feedback-attachment.dto";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import { FileDropZone, UploadQueueRow } from "@invessiv/ui";
import type { UploadQueueTransport } from "@/common/contracts/files/upload-queue-transport";
import { FeedbackAttachmentList } from "@/components/shared/feedback/feedback-attachment-list/feedback-attachment-list";
import type { Locale } from "@/config/i18n";
import { usePortalFileDownloads } from "@/hooks/portal/use-portal-file-downloads";
import { useUploadQueue } from "@/hooks/shared/use-upload-queue";
import type { PortalFilesDictionary } from "@/i18n/dictionaries/portal";
import styles from "./portal-attachment-field.module.css";

export type PortalAttachmentFieldProps = {
  /** Passed to the file picker; the server still decides what is attachable. */
  accept?: string;
  /** Hangs an uploaded file on its target; a refusal comes back as the text to show. */
  attachAction: (
    file: PortalFileDto,
  ) => Promise<
    | { ok: true; attachment: FeedbackAttachmentDto }
    | { ok: false; message: string }
  >;
  attachments: readonly FeedbackAttachmentDto[];
  /** Detach; without it the files are only listed. */
  canAttach: boolean;
  /** Upload as well, which needs `portal.files.write` on top. */
  canUpload: boolean;
  customerId: string;
  detachAction: (
    file: FeedbackAttachmentDto,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  filesContent: PortalFilesDictionary;
  locale: Locale;
  /** Most files the target takes; the upload zone goes away once it is reached. */
  maxFiles: number;
  onActivityChangeAction?: (active: boolean) => void;
  onAttachedAction: (attachment: FeedbackAttachmentDto) => void;
  onDetachedAction: (attachment: FeedbackAttachmentDto) => void;
  /** Runs before an upload starts, e.g. to save the target first; false keeps the files out. */
  prepareAction?: () => Promise<boolean>;
  texts: {
    listLabel: string;
    queueLabel: string;
    dropLabel: string;
    dropHint: string;
    /** Takes `{name}`. */
    detach: string;
    detachTitle: string;
  };
  transport: UploadQueueTransport<PortalFileDto>;
};

/** Files of one target: upload through the portal upload, then hung on the target automatically. */
export function PortalAttachmentField({
  accept,
  attachAction,
  attachments,
  canAttach,
  canUpload,
  customerId,
  detachAction,
  filesContent,
  locale,
  maxFiles,
  onActivityChangeAction,
  onAttachedAction,
  onDetachedAction,
  prepareAction,
  texts,
  transport,
}: PortalAttachmentFieldProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const onActivityChangeRef = useRef(onActivityChangeAction);

  useEffect(() => {
    onActivityChangeRef.current = onActivityChangeAction;
  });

  async function attach(file: PortalFileDto) {
    setAttaching(true);
    try {
      const result = await attachAction(file);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onAttachedAction(result.attachment);
    } finally {
      setAttaching(false);
    }
  }

  const queue = useUploadQueue<PortalFileDto>(transport, {
    onUploadedAction: (file) => void attach(file),
    maxFiles: Math.max(0, maxFiles - attachments.length - (attaching ? 1 : 0)),
    leaveWarning: filesContent.upload.leaveWarning,
  });
  const downloads = usePortalFileDownloads<FeedbackAttachmentDto>(
    customerId,
    filesContent.errors,
  );
  const active = busy || queue.isActive || attaching;

  // The callback is read through a ref, so a consumer's inline function does not retrigger this.
  useEffect(() => {
    onActivityChangeRef.current?.(active);
  }, [active]);

  useEffect(() => () => onActivityChangeRef.current?.(false), []);

  async function select(files: File[]) {
    setError(null);
    if (prepareAction) {
      setBusy(true);
      let prepared = false;
      try {
        prepared = await prepareAction();
      } finally {
        setBusy(false);
      }
      if (!prepared) return;
    }
    queue.stage(files);
    queue.start();
  }

  async function detach(file: FeedbackAttachmentDto) {
    setError(null);
    const result = await detachAction(file);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onDetachedAction(file);
  }

  const running = queue.items.filter(
    (entry) => entry.status !== UploadQueueItemStatus.Done,
  );
  const full = attachments.length >= maxFiles;
  const message = error ?? downloads.actionError;

  return (
    <div className={styles.attachments}>
      {attachments.length > 0 ? (
        <FeedbackAttachmentList
          attachments={attachments}
          detach={
            canAttach
              ? {
                  label: texts.detach,
                  title: texts.detachTitle,
                  disabled: false,
                  onDetachAction: (file) => void detach(file),
                }
              : undefined
          }
          label={texts.listLabel}
          loadPreviewAction={downloads.loadPreview}
          locale={locale}
          onDownloadAction={downloads.download}
          texts={filesContent}
        />
      ) : null}
      {running.length > 0 ? (
        <ul aria-label={texts.queueLabel} className={styles.queue}>
          {running.map((entry) => (
            <UploadQueueRow
              item={entry}
              key={entry.id}
              labels={{ ...filesContent.upload, errors: filesContent.errors }}
              locale={locale}
              onCancelAction={queue.cancel}
              onRemoveAction={queue.remove}
              onRetryAction={queue.retry}
            />
          ))}
        </ul>
      ) : null}
      {canAttach && canUpload && !full ? (
        <FileDropZone
          accept={accept}
          className={styles.drop}
          disabled={busy}
          hint={texts.dropHint}
          label={texts.dropLabel}
          multiple
          onFilesSelected={(files) => void select(files)}
          variant={FileDropZoneVariant.Compact}
        />
      ) : null}
      {message ? (
        <p className={styles.error} role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
