import { AttachmentChipKind } from "@invessiv/common/constants/ui/attachment-chip-kinds";
import type { MessageAttachmentDto } from "@invessiv/common/contracts/crm/message-attachment.dto";
import type { MessageThreadLabels } from "@invessiv/common/contracts/ui/message-thread-labels";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  AttachmentChip,
  type AttachmentChipProps,
} from "../attachment-chip/attachment-chip";
import styles from "./message-attachment-list.module.css";

type MessageAttachmentListLabels = Pick<
  MessageThreadLabels,
  | "attachmentsLabel"
  | "attachmentUnavailable"
  | "downloadAttachment"
  | "openAttachmentLink"
>;

type MessageAttachmentListProps = {
  attachments: readonly MessageAttachmentDto[];
  labels: MessageAttachmentListLabels;
  /** Without it upload chips only name the file; a pending message is not downloadable yet. */
  onDownloadAction?: (fileId: string) => void;
};

function chipProps(
  attachment: MessageAttachmentDto,
  labels: MessageAttachmentListLabels,
  onDownloadAction?: (fileId: string) => void,
): AttachmentChipProps {
  if (!attachment.available)
    return {
      kind: AttachmentChipKind.Static,
      assetKind: null,
      name: labels.attachmentUnavailable,
      unavailable: true,
    };
  const { assetKind, displayName, fileId, url } = attachment;
  const base = { assetKind, name: displayName };
  if (url)
    return {
      ...base,
      kind: AttachmentChipKind.Link,
      href: url,
      label: formatMessage(labels.openAttachmentLink, { name: displayName }),
    };
  if (!onDownloadAction) return { ...base, kind: AttachmentChipKind.Static };
  return {
    ...base,
    kind: AttachmentChipKind.Download,
    onDownloadAction: () => onDownloadAction(fileId),
    label: formatMessage(labels.downloadAttachment, { name: displayName }),
  };
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
            {...chipProps(attachment, labels, onDownloadAction)}
          />
        </li>
      ))}
    </ul>
  );
}
