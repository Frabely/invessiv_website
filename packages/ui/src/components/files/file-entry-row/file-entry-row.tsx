"use client";

import type { ReactNode } from "react";
import {
  faArrowUpRightFromSquare,
  faDownload,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import type { FilePreviewItem } from "@invessiv/common/contracts/files/file-preview-item";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "../../button/button";
import { CheckboxControl } from "../../checkbox-control/checkbox-control";
import { FileKindIcon } from "../file-kind-icon/file-kind-icon";
import styles from "./file-entry-row.module.css";

type FileEntry = FilePreviewItem & {
  assetKind: AssetKind;
  note: string | null;
  url: string | null;
  createdAt: string;
};

export type FileEntryRowProps<TFile extends FileEntry> = {
  file: TFile;
  locale: string;
  kindLabel: string;
  metadata?: ReactNode;
  status?: ReactNode;
  compact?: boolean;
  origin?: string;
  selected: boolean;
  labels: {
    opensInNewTab: string;
    actionsLabel: string;
    preview: string;
    previewNamed: string;
    download: string;
    downloadNamed: string;
    open: string;
    openNamed: string;
    selectNamed: string;
  };
  onSelectAction?: (file: TFile) => void;
  onPreviewAction?: (file: TFile) => void;
  onDownloadAction: (file: TFile) => void;
  extraActions?: readonly {
    icon: IconDefinition;
    label: string;
    title: string;
    onClick: () => void;
    danger?: boolean;
  }[];
};

/** Shared file identity and actions; callers supply only their extra metadata and rights. */
export function FileEntryRow<TFile extends FileEntry>({
  file,
  locale,
  kindLabel,
  metadata,
  status,
  compact = false,
  origin,
  selected,
  labels,
  onSelectAction,
  onPreviewAction,
  onDownloadAction,
  extraActions,
}: FileEntryRowProps<TFile>) {
  const name = { name: file.displayName };
  const linkUrl = file.source === FileSource.Link ? file.url : null;
  const host = linkUrl ? filePresentation.linkHost(linkUrl) : null;

  return (
    <li
      className={styles.row}
      data-compact={compact ? "true" : "false"}
      data-has-status={status ? "true" : "false"}
      data-origin={origin}
      data-selected={selected ? "true" : "false"}
    >
      <span className={styles.select}>
        {onSelectAction ? (
          <CheckboxControl
            aria-label={formatMessage(labels.selectNamed, name)}
            checked={selected}
            onChange={() => onSelectAction(file)}
          />
        ) : null}
      </span>
      <span className={styles.icon}>
        <FileKindIcon assetKind={file.assetKind} extension={file.extension} />
      </span>
      <div className={styles.identity}>
        {linkUrl ? (
          <a
            aria-label={`${file.displayName} (${labels.opensInNewTab})`}
            className={styles.name}
            href={linkUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {file.displayName}
          </a>
        ) : onPreviewAction ? (
          <button
            className={styles.name}
            onClick={() => onPreviewAction(file)}
            type="button"
          >
            {file.displayName}
          </button>
        ) : (
          <span className={styles.name}>{file.displayName}</span>
        )}
        {file.note ? <p className={styles.note}>{file.note}</p> : null}
        <p className={styles.meta}>
          <span>
            {host ??
              (file.extension ? file.extension.toUpperCase() : kindLabel)}
          </span>
          {metadata}
          {file.sizeBytes !== null ? (
            <span className={styles.numeric}>
              {filePresentation.formatSize(file.sizeBytes, locale)}
            </span>
          ) : null}
          <time className={styles.numeric} dateTime={file.createdAt}>
            {filePresentation.formatDate(file.createdAt, locale)}
          </time>
        </p>
      </div>
      {status ? <div className={styles.status}>{status}</div> : null}
      <div
        aria-label={formatMessage(labels.actionsLabel, name)}
        className={styles.actions}
        role="group"
      >
        {onPreviewAction ? (
          <ButtonControl
            aria-label={formatMessage(labels.previewNamed, name)}
            className={styles.action}
            onClick={() => onPreviewAction(file)}
            title={labels.preview}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faEye} />
          </ButtonControl>
        ) : null}
        {linkUrl ? (
          <a
            aria-label={formatMessage(labels.openNamed, name)}
            className={styles.action}
            href={linkUrl}
            rel="noopener noreferrer"
            target="_blank"
            title={labels.open}
          >
            <FontAwesomeIcon
              aria-hidden="true"
              icon={faArrowUpRightFromSquare}
            />
          </a>
        ) : (
          <ButtonControl
            aria-label={formatMessage(labels.downloadNamed, name)}
            className={styles.action}
            onClick={() => onDownloadAction(file)}
            title={labels.download}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faDownload} />
          </ButtonControl>
        )}
        {extraActions?.map((action) => (
          <ButtonControl
            aria-label={action.label}
            className={styles.action}
            data-tone={action.danger ? "danger" : undefined}
            key={action.title}
            onClick={action.onClick}
            title={action.title}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={action.icon} />
          </ButtonControl>
        ))}
      </div>
    </li>
  );
}
