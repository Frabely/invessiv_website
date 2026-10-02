"use client";

import { useState } from "react";
import { faLinkSlash } from "@fortawesome/free-solid-svg-icons";
import type { FilePreviewKind } from "@invessiv/common/constants/files/file-preview-kind";
import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";
import { filePreviewSelection } from "@/common/patterns/files/file-preview-selection";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FileEntryRow, FileLightbox } from "@invessiv/ui";
import type { FileAttachmentTexts } from "@/common/contracts/files/file-attachment-texts";
import styles from "./file-attachment-list.module.css";

export type FileAttachmentListProps = {
  attachments: readonly FileAttachmentDto[];
  /** Names the list, e.g. "Attachments of item 2". */
  label: string;
  locale: string;
  texts: FileAttachmentTexts;
  onDownloadAction: (file: FileAttachmentDto) => void;
  loadPreviewAction: (
    file: FileAttachmentDto,
    kind: FilePreviewKind,
  ) => Promise<string | null>;
  /** Present only where the viewer may unhook files; the file itself is never deleted here. */
  detach?: {
    label: string;
    title: string;
    disabled: boolean;
    onDetachAction: (file: FileAttachmentDto) => void;
  };
};

/**
 * Files hung on something else (a feedback item, a field of a form) with the shared file row and
 * preview, so the CRM and the portal show the same thing; only texts and API calls differ.
 */
export function FileAttachmentList({
  attachments,
  label,
  locale,
  texts,
  onDownloadAction,
  loadPreviewAction,
  detach,
}: FileAttachmentListProps) {
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
