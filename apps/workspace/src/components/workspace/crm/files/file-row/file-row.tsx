"use client";

import {
  faEye,
  faEyeSlash,
  faPen,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FileEntryRow } from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./file-row.module.css";

type FileRowProps = {
  content: CrmFilesDictionary;
  file: FileDto;
  locale: Locale;
  projectLabel?: string;
  uploaderName: string | null;
  onDeleteAction?: (file: FileDto) => void;
  onDownloadAction: (file: FileDto) => void;
  onEditAction?: (file: FileDto) => void;
  onPreviewAction?: (file: FileDto) => void;
  selected?: boolean;
  onSelectAction?: (file: FileDto) => void;
};

/** CRM metadata, visibility and write actions around the shared file row. */
export function FileRow({
  content,
  file,
  locale,
  projectLabel,
  uploaderName,
  onDeleteAction,
  onDownloadAction,
  onEditAction,
  onPreviewAction,
  selected,
  onSelectAction,
}: FileRowProps) {
  const name = { name: file.displayName };
  const uploader =
    uploaderName ??
    (file.uploadedBySide === UploadSide.Customer
      ? content.row.byCustomer
      : content.row.byTeam);

  return (
    <FileEntryRow
      compact
      extraActions={[
        ...(onEditAction
          ? [
              {
                icon: faPen,
                label: formatMessage(content.row.editNamed, name),
                title: content.row.edit,
                onClick: () => onEditAction(file),
              },
            ]
          : []),
        ...(onDeleteAction
          ? [
              {
                icon: faTrashCan,
                label: formatMessage(content.row.deleteNamed, name),
                title: content.row.delete,
                onClick: () => onDeleteAction(file),
                danger: true,
              },
            ]
          : []),
      ]}
      file={file}
      kindLabel={content.kinds[file.assetKind]}
      labels={{ ...content.row, selectNamed: content.archive.selectNamed }}
      locale={locale}
      metadata={
        <>
          {projectLabel ? <span>{projectLabel}</span> : null}
          <span>{uploader}</span>
        </>
      }
      onDownloadAction={onDownloadAction}
      onPreviewAction={onPreviewAction}
      onSelectAction={onSelectAction}
      origin={file.uploadedBySide}
      selected={selected ?? false}
      status={
        <p
          className={styles.visibility}
          data-visible={file.visibleToCustomer ? "true" : "false"}
        >
          <FontAwesomeIcon
            aria-hidden="true"
            icon={file.visibleToCustomer ? faEye : faEyeSlash}
          />
          <span>
            {file.visibleToCustomer
              ? content.visibility.visible
              : content.visibility.hidden}
          </span>
        </p>
      }
    />
  );
}
