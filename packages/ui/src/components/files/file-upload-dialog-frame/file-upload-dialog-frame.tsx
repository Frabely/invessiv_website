"use client";

import type { ReactNode } from "react";
import { UPLOAD_ACCEPT_ATTRIBUTE } from "@invessiv/common/constants/files/upload-accept";
import { UploadQueueItemStatus } from "@invessiv/common/constants/files/upload-queue-item-status";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import type { UploadQueueItem } from "@invessiv/common/contracts/files/upload-queue-item";
import type { UploadQueueRowLabels } from "@invessiv/common/contracts/ui/upload-queue-row-labels";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, PrimaryCtaButton } from "../../button/button";
import { Dialog } from "../../dialog/dialog/dialog";
import { FileDropZone } from "../../file-drop-zone/file-drop-zone";
import { UploadQueueRow } from "../upload-queue-row/upload-queue-row";
import styles from "./file-upload-dialog-frame.module.css";

export type FileUploadDialogFrameProps = {
  fields: ReactNode;
  /** BCP 47 locale for file sizes. */
  locale: string;
  labels: {
    title: string;
    description: string;
    close: string;
    cancel: string;
    more: string;
    start: string;
    startOne: string;
    busyHint: string;
    queueLabel: string;
    summary: string;
    dropLabel: string;
    dropHint: string;
    largerHint: string;
  };
  rowLabels: UploadQueueRowLabels;
  queue: {
    items: readonly UploadQueueItem[];
    isActive: boolean;
    hasStarted: boolean;
    stagedCount: number;
    doneCount: number;
    stage: (files: File[]) => void;
    start: () => void;
    reset: () => void;
    cancel: (id: string) => void;
    remove: (id: string) => void;
    retry: (id: string) => void;
  };
  onCloseAction: () => void;
};

/** Shared presentation for the CRM and portal upload queues. */
export function FileUploadDialogFrame({
  fields,
  locale,
  labels,
  rowLabels,
  queue,
  onCloseAction,
}: FileUploadDialogFrameProps) {
  const total = queue.items.filter(
    (item) =>
      item.status !== UploadQueueItemStatus.Rejected &&
      item.status !== UploadQueueItemStatus.Cancelled,
  ).length;

  return (
    <Dialog
      busy={queue.isActive}
      closeLabel={labels.close}
      description={labels.description}
      footer={
        <div className={styles.footer}>
          {queue.isActive ? (
            <p className={styles.footerHint}>{labels.busyHint}</p>
          ) : null}
          <div className={styles.footerActions}>
            {queue.hasStarted && !queue.isActive ? (
              <>
                <ButtonControl
                  onClick={queue.reset}
                  type="button"
                  variant="ghost"
                >
                  {labels.more}
                </ButtonControl>
                <PrimaryCtaButton onClick={onCloseAction} type="button">
                  {labels.close}
                </PrimaryCtaButton>
              </>
            ) : null}
            {!queue.hasStarted ? (
              <>
                <ButtonControl
                  onClick={onCloseAction}
                  type="button"
                  variant="ghost"
                >
                  {labels.cancel}
                </ButtonControl>
                <PrimaryCtaButton
                  disabled={queue.stagedCount === 0}
                  onClick={queue.start}
                  type="button"
                >
                  {queue.stagedCount === 1
                    ? labels.startOne
                    : formatMessage(labels.start, {
                        count: String(queue.stagedCount),
                      })}
                </PrimaryCtaButton>
              </>
            ) : null}
          </div>
        </div>
      }
      onCloseAction={onCloseAction}
      size={DialogSize.Narrow}
      title={labels.title}
    >
      <div className={styles.body}>
        {!queue.hasStarted ? (
          <>
            <FileDropZone
              accept={UPLOAD_ACCEPT_ATTRIBUTE}
              hint={labels.dropHint}
              label={labels.dropLabel}
              multiple
              onFilesSelected={queue.stage}
            />
            <p className={styles.largerHint}>{labels.largerHint}</p>
          </>
        ) : null}
        {queue.items.length > 0 ? (
          <ul aria-label={labels.queueLabel} className={styles.queue}>
            {queue.items.map((item) => (
              <UploadQueueRow
                item={item}
                key={item.id}
                labels={rowLabels}
                locale={locale}
                onCancelAction={queue.cancel}
                onRemoveAction={queue.remove}
                onRetryAction={queue.retry}
              />
            ))}
          </ul>
        ) : null}
        <p aria-live="polite" className={styles.summary} role="status">
          {queue.hasStarted
            ? formatMessage(labels.summary, {
                done: String(queue.doneCount),
                total: String(total),
              })
            : null}
        </p>
        <fieldset className={styles.settings} disabled={queue.hasStarted}>
          {fields}
        </fieldset>
      </div>
    </Dialog>
  );
}
