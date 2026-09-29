"use client";

import { useEffect, useState } from "react";
import {
  faChevronLeft,
  faChevronRight,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FilePreviewKind } from "@invessiv/common/constants/files/file-preview-kind";
import { DOWNLOAD_URL_TTL_MS } from "@invessiv/common/constants/files/upload-limits";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import type { FilePreviewItem } from "@invessiv/common/contracts/files/file-preview-item";
import type { FileLightboxLabels } from "@invessiv/common/contracts/ui/file-lightbox-labels";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "../../button/button";
import { Dialog } from "../../dialog/dialog/dialog";
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

// A null source means the preview could not be loaded.
type PreviewState = { fileId: string; source: string | null };

const FIELD_TAGS = new Set(["INPUT", "SELECT", "TEXTAREA"]);
// Refreshed well before the signed URL's TTL expires, so a preview left open never goes stale.
const PREVIEW_URL_REFRESH_MS = DOWNLOAD_URL_TTL_MS - 60_000;

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
  const kind = file ? filePresentation.previewKindOf(file) : null;
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const current = preview?.fileId === file?.id ? preview : null;

  useEffect(() => {
    if (!file || !kind) return;
    let cancelled = false;
    let timer: number | undefined;

    function load() {
      if (!file || !kind) return;
      void loadSourceAction(file, kind).then((source) => {
        if (cancelled) return;
        setPreview({ fileId: file.id, source });
        // A signed inline URL expires; text is read through the app and never does.
        if (source !== null && kind !== FilePreviewKind.Text)
          timer = window.setTimeout(load, PREVIEW_URL_REFRESH_MS);
      });
    }

    load();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
    // The loader is a callback prop; reloading on its identity would refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, kind]);

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

  function renderPreview() {
    if (!current) return <p className={styles.state}>{labels.loading}</p>;
    if (current.source === null)
      return (
        <p className={styles.state} role="alert">
          {labels.error}
        </p>
      );
    switch (kind) {
      case FilePreviewKind.Image:
        return (
          // Signed private URLs cannot pass through an image optimizer; the SVG stays inert inside <img>.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={file.displayName}
            className={styles.image}
            src={current.source}
          />
        );
      case FilePreviewKind.Pdf:
        return (
          <iframe
            className={styles.frame}
            src={current.source}
            title={file.displayName}
          />
        );
      case FilePreviewKind.Video:
        return (
          <video
            className={styles.video}
            controls
            playsInline
            src={current.source}
          >
            <track kind="captions" />
          </video>
        );
      case FilePreviewKind.Text:
        return <pre className={styles.text}>{current.source}</pre>;
      default:
        return null;
    }
  }

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
      <div className={styles.stage} data-kind={kind ?? undefined}>
        {renderPreview()}
      </div>
    </Dialog>
  );
}
