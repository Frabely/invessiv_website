"use client";

import { useEffect } from "react";
import {
  faChevronLeft,
  faChevronRight,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { FilePreviewKind } from "@invessiv/common/constants/files/file-preview-kind";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import type { FilePreviewItem } from "@invessiv/common/contracts/files/file-preview-item";
import type { FileLightboxLabels } from "@invessiv/common/contracts/ui/file-lightbox-labels";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "../../button/button";
import { Dialog } from "../../dialog/dialog/dialog";
import { FilePreviewStage } from "../file-preview-stage/file-preview-stage";
import styles from "./file-lightbox.module.css";

export type FileLightboxProps<TFile extends FilePreviewItem> = {
  /** Only previewable files; the arrows page through exactly these. */
  files: readonly TFile[];
  index: number;
  labels: FileLightboxLabels;
  /**
   * Resolves the source for one file: plain text for `text`, otherwise a short-lived inline URL.
   * Null means the preview could not be loaded.
   */
  loadSourceAction: (
    file: TFile,
    kind: FilePreviewKind,
  ) => Promise<string | null>;
  onCloseAction: () => void;
  onDownloadAction: (file: TFile) => void;
  onIndexChangeAction: (index: number) => void;
};

const FIELD_TAGS = new Set(["INPUT", "SELECT", "TEXTAREA"]);

/**
 * Shows images, PDFs, short text and browser-playable video. Media load through a short-lived
 * inline URL; text is only ever rendered as text, never as markup.
 */
export function FileLightbox<TFile extends FilePreviewItem>({
  files,
  index,
  labels,
  loadSourceAction,
  onCloseAction,
  onDownloadAction,
  onIndexChangeAction,
}: FileLightboxProps<TFile>) {
  const file = files[index];

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && FIELD_TAGS.has(target.tagName)) return;
      if (event.key === "ArrowRight" && index < files.length - 1) {
        event.preventDefault();
        onIndexChangeAction(index + 1);
      }
      if (event.key === "ArrowLeft" && index > 0) {
        event.preventDefault();
        onIndexChangeAction(index - 1);
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [files.length, index, onIndexChangeAction]);

  if (!file) return null;

  return (
    <Dialog
      bodyClassName={styles.body}
      className={styles.lightbox}
      closeLabel={labels.close}
      eyebrow={
        files.length > 1
          ? formatMessage(labels.position, {
              index: String(index + 1),
              total: String(files.length),
            })
          : undefined
      }
      footer={
        <div className={styles.footer}>
          <div className={styles.paging}>
            <ButtonControl
              aria-label={labels.previous}
              disabled={index === 0}
              onClick={() => onIndexChangeAction(index - 1)}
              title={labels.previous}
              type="button"
              variant="ghost"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faChevronLeft} />
            </ButtonControl>
            <ButtonControl
              aria-label={labels.next}
              disabled={index >= files.length - 1}
              onClick={() => onIndexChangeAction(index + 1)}
              title={labels.next}
              type="button"
              variant="ghost"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faChevronRight} />
            </ButtonControl>
          </div>
          <ButtonControl
            onClick={() => onDownloadAction(file)}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faDownload} />
            {labels.download}
          </ButtonControl>
        </div>
      }
      onCloseAction={onCloseAction}
      size={DialogSize.Wide}
      title={file.displayName}
    >
      <FilePreviewStage
        file={file}
        labels={labels}
        loadSourceAction={loadSourceAction}
      />
    </Dialog>
  );
}
