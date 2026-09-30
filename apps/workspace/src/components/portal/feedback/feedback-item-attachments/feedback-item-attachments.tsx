"use client";

import { useEffect, useState } from "react";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { UploadQueueItemStatus } from "@invessiv/common/constants/files/upload-queue-item-status";
import { FileDropZoneVariant } from "@invessiv/common/constants/ui/file-drop-zone-variants";
import type { FeedbackAttachmentDto } from "@invessiv/common/contracts/crm/feedback-attachment.dto";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FileDropZone, UploadQueueRow } from "@invessiv/ui";
import { portalFeedbackApiService } from "@/client/portal/portal-feedback-api-service";
import { portalFilesApiService } from "@/client/portal/portal-files-api-service";
import type { FeedbackDraftItem } from "@/common/contracts/portal/feedback-draft-item";
import { FeedbackAttachmentList } from "@/components/shared/feedback/feedback-attachment-list/feedback-attachment-list";
import type { Locale } from "@/config/i18n";
import { usePortalFileDownloads } from "@/hooks/portal/use-portal-file-downloads";
import { useUploadQueue } from "@/hooks/shared/use-upload-queue";
import type {
  PortalFeedbackDictionary,
  PortalFilesDictionary,
} from "@/i18n/dictionaries/portal";
import styles from "./feedback-item-attachments.module.css";

export type FeedbackItemAttachmentsProps = {
  /** Detach; without it the files are only listed. */
  canAttach: boolean;
  /** Upload as well, which needs `portal.files.write` on top. */
  canUpload: boolean;
  content: PortalFeedbackDictionary;
  customerId: string;
  filesContent: PortalFilesDictionary;
  /** Saves the draft first, so the item exists on the server before a file hangs on it. */
  flushAction: () => Promise<boolean>;
  item: FeedbackDraftItem;
  locale: Locale;
  number: number;
  onAnnounceAction: (message: string) => void;
  onChangeAction: (
    update: (current: FeedbackAttachmentDto[]) => FeedbackAttachmentDto[],
  ) => void;
  onActivityChangeAction: (itemId: string, active: boolean) => void;
  /** Uploads land in the round's project, like a file sent from the files page. */
  projectId: string;
  roundId: string;
};

/** Files of one point: upload through the portal upload, then hung on the point automatically. */
export function FeedbackItemAttachments({
  canAttach,
  canUpload,
  content,
  customerId,
  filesContent,
  flushAction,
  item,
  locale,
  number,
  onAnnounceAction,
  onChangeAction,
  onActivityChangeAction,
  projectId,
  roundId,
}: FeedbackItemAttachmentsProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const target = { roundId, itemId: item.id };

  async function attach(file: PortalFileDto) {
    setAttaching(true);
    try {
      const result = await portalFeedbackApiService.attachFile(
        customerId,
        target,
        file.id,
      );
      if (!result.ok) {
        setError(content.errors[result.code]);
        return;
      }
      onChangeAction((current) =>
        current.some((entry) => entry.id === result.attachment.id)
          ? current
          : [...current, result.attachment],
      );
      onAnnounceAction(
        formatMessage(content.announcements.attached, {
          name: result.attachment.displayName,
          number,
        }),
      );
    } finally {
      setAttaching(false);
    }
  }

  const queue = useUploadQueue<PortalFileDto>(
    portalFilesApiService.uploadTransport(customerId, {
      projectId,
      note: null,
    }),
    {
      onUploadedAction: (file) => void attach(file),
      maxFiles: FEEDBACK_LIMITS.filesPerItem - item.attachments.length,
      leaveWarning: filesContent.upload.leaveWarning,
    },
  );
  const downloads = usePortalFileDownloads<FeedbackAttachmentDto>(
    customerId,
    filesContent.errors,
  );
  const active = busy || queue.isActive || attaching;

  useEffect(() => {
    onActivityChangeAction(item.id, active);
  }, [active, item.id, onActivityChangeAction]);

  useEffect(
    () => () => onActivityChangeAction(item.id, false),
    [item.id, onActivityChangeAction],
  );

  async function select(files: File[]) {
    setError(null);
    setBusy(true);
    const saved = await flushAction();
    setBusy(false);
    if (!saved) return;
    queue.stage(files);
    queue.start();
  }

  async function detach(file: FeedbackAttachmentDto) {
    setError(null);
    const result = await portalFeedbackApiService.detachFile(
      customerId,
      target,
      file.id,
    );
    if (!result.ok) {
      setError(content.errors[result.code]);
      return;
    }
    onChangeAction((current) =>
      current.filter((entry) => entry.id !== file.id),
    );
    onAnnounceAction(
      formatMessage(content.announcements.detached, { name: file.displayName }),
    );
  }

  const running = queue.items.filter(
    (entry) => entry.status !== UploadQueueItemStatus.Done,
  );
  const full = item.attachments.length >= FEEDBACK_LIMITS.filesPerItem;
  const message = error ?? downloads.actionError;

  return (
    <div className={styles.attachments}>
      {item.attachments.length > 0 ? (
        <FeedbackAttachmentList
          attachments={item.attachments}
          detach={
            canAttach
              ? {
                  label: content.attachments.detach,
                  title: content.attachments.detachTitle,
                  disabled: false,
                  onDetachAction: (file) => void detach(file),
                }
              : undefined
          }
          label={formatMessage(content.attachments.label, { number })}
          loadPreviewAction={downloads.loadPreview}
          locale={locale}
          onDownloadAction={downloads.download}
          texts={filesContent}
        />
      ) : null}
      {running.length > 0 ? (
        <ul
          aria-label={formatMessage(content.attachments.queueLabel, { number })}
          className={styles.queue}
        >
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
          className={styles.drop}
          disabled={busy}
          hint={content.attachments.dropHint}
          label={content.attachments.dropLabel}
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
