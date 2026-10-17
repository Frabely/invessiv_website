import type { ReactNode } from "react";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import type { FileEntryItem } from "@invessiv/common/contracts/files/file-entry-item";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";
import styles from "./file-entry-meta.module.css";

export type FileEntryMetaProps = {
  file: FileEntryItem;
  kindLabel: string;
  locale: string;
  /** The caller's own facts, such as the project, between the type and the size. */
  metadata?: ReactNode;
};

/** The quiet line under a file name: type or link host, the caller's facts, size and date. */
export function FileEntryMeta({
  file,
  kindLabel,
  locale,
  metadata,
}: FileEntryMetaProps) {
  const host =
    file.source === FileSource.Link && file.url
      ? filePresentation.linkHost(file.url)
      : null;

  return (
    <p className={styles.meta}>
      <span>
        {host ?? (file.extension ? file.extension.toUpperCase() : kindLabel)}
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
  );
}
