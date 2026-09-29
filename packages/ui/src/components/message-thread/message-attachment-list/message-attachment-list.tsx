import {
  faDownload,
  faUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { MessageAttachmentDto } from "@invessiv/common/contracts/crm/message-attachment.dto";
import type { MessageThreadLabels } from "@invessiv/common/contracts/ui/message-thread-labels";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FileKindIcon } from "@invessiv/ui";
import styles from "./message-attachment-list.module.css";

type MessageAttachmentListProps = {
  attachments: readonly MessageAttachmentDto[];
  labels: Pick<
    MessageThreadLabels,
    | "attachmentsLabel"
    | "attachmentUnavailable"
    | "downloadAttachment"
    | "openAttachmentLink"
  >;
  /** Without it upload chips only name the file; a pending message is not downloadable yet. */
  onDownloadAction?: (fileId: string) => void;
};

function AttachmentChip({
  attachment,
  labels,
  onDownloadAction,
}: {
  attachment: MessageAttachmentDto;
  labels: MessageAttachmentListProps["labels"];
  onDownloadAction?: (fileId: string) => void;
}) {
  const { available, fileId, displayName, assetKind, url } = attachment;
  if (!available || !fileId || !displayName)
    return (
      <span className={styles.chip} data-state="unavailable">
        <FileKindIcon assetKind={null} />
        {labels.attachmentUnavailable}
      </span>
    );
  const content = (
    <>
      <FileKindIcon assetKind={assetKind} />
      <span className={styles.name}>{displayName}</span>
    </>
  );
  if (url)
    return (
      <a
        aria-label={formatMessage(labels.openAttachmentLink, {
          name: displayName,
        })}
        className={styles.chip}
        href={url}
        rel="noopener noreferrer"
        target="_blank"
      >
        {content}
        <FontAwesomeIcon
          aria-hidden="true"
          className={styles.action}
          icon={faUpRightFromSquare}
        />
      </a>
    );
  if (!onDownloadAction) return <span className={styles.chip}>{content}</span>;
  return (
    <button
      aria-label={formatMessage(labels.downloadAttachment, {
        name: displayName,
      })}
      className={styles.chip}
      onClick={() => onDownloadAction(fileId)}
      type="button"
    >
      {content}
      <FontAwesomeIcon
        aria-hidden="true"
        className={styles.action}
        icon={faDownload}
      />
    </button>
  );
}

/** Files and links of one message; an entry the viewer may not see shows no name. */
export function MessageAttachmentList({
  attachments,
  labels,
  onDownloadAction,
}: MessageAttachmentListProps) {
  if (attachments.length === 0) return null;
  return (
    <ul aria-label={labels.attachmentsLabel} className={styles.list}>
      {attachments.map((attachment) => (
        <li key={attachment.position}>
          <AttachmentChip
            attachment={attachment}
            labels={labels}
            onDownloadAction={onDownloadAction}
          />
        </li>
      ))}
    </ul>
  );
}
