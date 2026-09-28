"use client";

import Link from "next/link";
import {
  faArrowUpRightFromSquare,
  faDownload,
  faEye,
  faEyeSlash,
  faPen,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, CheckboxControl } from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FileKindIcon } from "../file-kind-icon/file-kind-icon";
import styles from "./file-row.module.css";

type FileRowProps = {
  content: CrmFilesDictionary;
  file: FileDto;
  locale: Locale;
  /** Undefined hides the project column, e.g. inside a project. */
  projectLabel?: string;
  /** Null without `members.read`; the side is shown instead. */
  uploaderName: string | null;
  onDeleteAction?: (file: FileDto) => void;
  onDownloadAction: (file: FileDto) => void;
  onEditAction?: (file: FileDto) => void;
  /** Undefined when the browser cannot show this format. */
  onPreviewAction?: (file: FileDto) => void;
  selected?: boolean;
  onSelectAction?: (file: FileDto) => void;
};

const dateFormatters = new Map<Locale, Intl.DateTimeFormat>();

function dateFormatter(locale: Locale): Intl.DateTimeFormat {
  const cached = dateFormatters.get(locale);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  dateFormatters.set(locale, formatter);
  return formatter;
}

function formatDate(iso: string, locale: Locale): string {
  return dateFormatter(locale).format(new Date(iso));
}

/** One file or link: what it is, where it belongs, who added it and whether the customer sees it. */
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
  const isLink = file.source === FileSource.Link;
  const host = isLink && file.url ? filePresentation.linkHost(file.url) : null;
  const uploader =
    uploaderName ??
    (file.uploadedBySide === UploadSide.Customer
      ? content.row.byCustomer
      : content.row.byTeam);

  return (
    <li
      className={styles.row}
      data-origin={file.uploadedBySide}
      data-selected={selected ? "true" : "false"}
    >
      {onSelectAction ? (
        <label className={styles.select}>
          <CheckboxControl
            aria-label={formatMessage(content.archive.selectNamed, name)}
            checked={selected ?? false}
            onChange={() => onSelectAction(file)}
          />
        </label>
      ) : null}
      <FileKindIcon assetKind={file.assetKind} extension={file.extension} />
      <div className={styles.identity}>
        {isLink && file.url ? (
          <Link
            className={styles.name}
            href={file.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            {file.displayName}
            <span className="sr-only"> ({content.row.opensInNewTab})</span>
          </Link>
        ) : onPreviewAction ? (
          <ButtonControl
            className={styles.name}
            onClick={() => onPreviewAction(file)}
            type="button"
            variant="ghost"
          >
            {file.displayName}
          </ButtonControl>
        ) : (
          <span className={styles.name}>{file.displayName}</span>
        )}
        {file.note ? <p className={styles.note}>{file.note}</p> : null}
        <p className={styles.meta}>
          <span>
            {host ??
              (file.extension
                ? file.extension.toUpperCase()
                : content.kinds[file.assetKind])}
          </span>
          {projectLabel ? <span>{projectLabel}</span> : null}
          {file.sizeBytes !== null ? (
            <span className={styles.numeric}>
              {filePresentation.formatSize(file.sizeBytes, locale)}
            </span>
          ) : null}
          <span>{uploader}</span>
          <time className={styles.numeric} dateTime={file.createdAt}>
            {formatDate(file.createdAt, locale)}
          </time>
        </p>
      </div>
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
      <div
        aria-label={formatMessage(content.row.actionsLabel, name)}
        className={styles.actions}
        role="group"
      >
        {onPreviewAction ? (
          <ButtonControl
            aria-label={formatMessage(content.row.previewNamed, name)}
            className={styles.action}
            onClick={() => onPreviewAction(file)}
            title={content.row.preview}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faEye} />
          </ButtonControl>
        ) : null}
        {isLink && file.url ? (
          <Link
            aria-label={formatMessage(content.row.openNamed, name)}
            className={styles.action}
            href={file.url}
            rel="noopener noreferrer"
            target="_blank"
            title={content.row.open}
          >
            <FontAwesomeIcon
              aria-hidden="true"
              icon={faArrowUpRightFromSquare}
            />
          </Link>
        ) : (
          <ButtonControl
            aria-label={formatMessage(content.row.downloadNamed, name)}
            className={styles.action}
            onClick={() => onDownloadAction(file)}
            title={content.row.download}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faDownload} />
          </ButtonControl>
        )}
        {onEditAction ? (
          <ButtonControl
            aria-label={formatMessage(content.row.editNamed, name)}
            className={styles.action}
            onClick={() => onEditAction(file)}
            title={content.row.edit}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faPen} />
          </ButtonControl>
        ) : null}
        {onDeleteAction ? (
          <ButtonControl
            aria-label={formatMessage(content.row.deleteNamed, name)}
            className={styles.action}
            data-tone="danger"
            onClick={() => onDeleteAction(file)}
            title={content.row.delete}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faTrashCan} />
          </ButtonControl>
        ) : null}
      </div>
    </li>
  );
}
