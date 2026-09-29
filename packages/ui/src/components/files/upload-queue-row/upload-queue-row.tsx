"use client";

import {
  faArrowRotateRight,
  faCircleCheck,
  faCircleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { UploadQueueItemStatus as Status } from "@invessiv/common/constants/files/upload-queue-item-status";
import type { UploadQueueItem } from "@invessiv/common/contracts/files/upload-queue-item";
import type { UploadQueueRowLabels } from "@invessiv/common/contracts/ui/upload-queue-row-labels";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "../../button/button";
import { FileKindIcon } from "../file-kind-icon/file-kind-icon";
import styles from "./upload-queue-row.module.css";

export type UploadQueueRowProps = {
  item: UploadQueueItem;
  labels: UploadQueueRowLabels;
  /** BCP 47 locale for the size format. */
  locale: string;
  onCancelAction: (id: string) => void;
  onRemoveAction: (id: string) => void;
  onRetryAction: (id: string) => void;
};

export function UploadQueueRow({
  item,
  labels,
  locale,
  onCancelAction,
  onRemoveAction,
  onRetryAction,
}: UploadQueueRowProps) {
  const name = { name: item.name };
  const transferring =
    item.status === Status.Uploading || item.status === Status.Finalizing;
  const canRemove =
    item.status === Status.Staged || item.status === Status.Rejected;
  const canCancel =
    item.status === Status.Queued || item.status === Status.Uploading;
  const canRetry =
    (item.status === Status.Failed && item.retryable) ||
    item.status === Status.Cancelled;

  return (
    <li className={styles.row} data-status={item.status}>
      <FileKindIcon assetKind={item.assetKind} />
      <div className={styles.body}>
        <p className={styles.name}>{item.name}</p>
        <p className={styles.meta}>
          <span className={styles.size}>
            {filePresentation.formatSize(item.size, locale)}
          </span>
          <span className={styles.status}>
            {item.status === Status.Done ? (
              <FontAwesomeIcon aria-hidden="true" icon={faCircleCheck} />
            ) : null}
            {item.status === Status.Failed ||
            item.status === Status.Rejected ? (
              <FontAwesomeIcon aria-hidden="true" icon={faCircleExclamation} />
            ) : null}
            {labels.status[item.status]}
          </span>
        </p>
        {item.errorCode ? (
          <p className={styles.error}>{labels.errors[item.errorCode]}</p>
        ) : null}
        {transferring ? (
          <progress
            aria-label={formatMessage(labels.progress, name)}
            className={styles.progress}
            max={1}
            value={
              item.status === Status.Finalizing ? undefined : item.progress
            }
          />
        ) : null}
      </div>
      <div className={styles.actions}>
        {canRemove ? (
          <ButtonControl
            aria-label={formatMessage(labels.remove, name)}
            className={styles.action}
            onClick={() => onRemoveAction(item.id)}
            title={formatMessage(labels.remove, name)}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
          </ButtonControl>
        ) : null}
        {canCancel ? (
          <ButtonControl
            aria-label={formatMessage(labels.cancelItem, name)}
            className={styles.action}
            onClick={() => onCancelAction(item.id)}
            title={formatMessage(labels.cancelItem, name)}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
          </ButtonControl>
        ) : null}
        {canRetry ? (
          <ButtonControl
            aria-label={formatMessage(labels.retryItem, name)}
            className={styles.action}
            onClick={() => onRetryAction(item.id)}
            title={formatMessage(labels.retryItem, name)}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faArrowRotateRight} />
          </ButtonControl>
        ) : null}
      </div>
    </li>
  );
}
