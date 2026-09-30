"use client";

import { useState } from "react";
import { faLinkSlash } from "@fortawesome/free-solid-svg-icons";
import type { FilePreviewKind } from "@invessiv/common/constants/files/file-preview-kind";
import type { FeedbackAttachmentDto } from "@invessiv/common/contracts/crm/feedback-attachment.dto";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";
import { filePreviewSelection } from "@/common/patterns/files/file-preview-selection";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FileEntryRow, FileLightbox } from "@invessiv/ui";
import type { FeedbackAttachmentTexts } from "@/common/contracts/files/feedback-attachment-texts";
import styles from "./feedback-attachment-list.module.css";

export type FeedbackAttachmentListProps = {
  attachments: readonly FeedbackAttachmentDto[];
  /** Names the list, e.g. "Attachments of item 2". */
  label: string;
  locale: string;
  texts: FeedbackAttachmentTexts;
  onDownloadAction: (file: FeedbackAttachmentDto) => void;
  loadPreviewAction: (
    file: FeedbackAttachmentDto,
    kind: FilePreviewKind,
  ) => Promise<string | null>;
  /** Present only where the viewer may unhook files; the file itself is never deleted here. */
  detach?: {
    label: string;
    title: string;
    disabled: boolean;
    onDetachAction: (file: FeedbackAttachmentDto) => void;
  };
};

/**
 * Attachments of one feedback item with the shared file row and preview, so the CRM and the
 * portal show the same thing; only texts and API calls differ.
 */
export function FeedbackAttachmentList({
  attachments,
  label,
  locale,
  texts,
  onDownloadAction,
  loadPreviewAction,
  detach,
}: FeedbackAttachmentListProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewable = filePreviewSelection.list(attachments);
  const previewIndex = filePreviewSelection.indexOf(previewable, previewId);

  return (
    <>
      <ul aria-label={label} className={styles.list}>
        {attachments.map((file) => (
          <FileEntryRow
            compact
            extraActions={
              detach && !detach.disabled
                ? [
                    {
                      icon: faLinkSlash,
                      label: formatMessage(detach.label, {
                        name: file.displayName,
                      }),
                      title: detach.title,
                      onClick: () => detach.onDetachAction(file),
                    },
                  ]
                : undefined
            }
            file={file}
            key={file.id}
            kindLabel={texts.kinds[file.assetKind]}
            labels={{ ...texts.row, selectNamed: "" }}
            locale={locale}
            onDownloadAction={onDownloadAction}
            onPreviewAction={
              filePresentation.previewKindOf(file) !== null
                ? (target) => setPreviewId(target.id)
                : undefined
            }
            selected={false}
          />
        ))}
      </ul>
      {previewIndex >= 0 ? (
        <FileLightbox
          files={previewable}
          index={previewIndex}
          labels={texts.lightbox}
          loadSourceAction={loadPreviewAction}
          onCloseAction={() => setPreviewId(null)}
          onDownloadAction={onDownloadAction}
          onIndexChangeAction={(index) =>
            setPreviewId(previewable[index]?.id ?? null)
          }
        />
      ) : null}
    </>
  );
}
