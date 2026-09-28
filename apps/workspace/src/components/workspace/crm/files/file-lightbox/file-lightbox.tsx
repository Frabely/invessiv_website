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
import { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, Dialog } from "@invessiv/ui";
import { filesApiService } from "@/client/crm/files-api-service";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./file-lightbox.module.css";

type FileLightboxProps = {
  content: CrmFilesDictionary;
  /** Only previewable files; the arrows page through exactly these. */
  files: readonly FileDto[];
  index: number;
  onCloseAction: () => void;
  onDownloadAction: (file: FileDto) => void;
  onIndexChangeAction: (index: number) => void;
};

// A null source means the preview could not be loaded.
type PreviewState = { fileId: string; source: string | null };

const FIELD_TAGS = new Set(["INPUT", "SELECT", "TEXTAREA"]);
// Refreshed well before the signed URL's TTL expires, so a preview left open never goes stale.
const PREVIEW_URL_REFRESH_MS = DOWNLOAD_URL_TTL_MS - 60_000;

/**
 * Shows images, PDFs, short text and browser-playable video. Media load through a short-lived
 * inline URL; text is read through the authenticated app route and only ever rendered as text.
 */
export function FileLightbox({
  content,
  files,
  index,
  onCloseAction,
  onDownloadAction,
  onIndexChangeAction,
}: FileLightboxProps) {
  const file = files[index];
  const kind = file ? filePresentation.previewKindOf(file) : null;
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const current = preview?.fileId === file?.id ? preview : null;

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    let timer: number | undefined;

    function load() {
      if (!file) return;
      const request =
        kind === FilePreviewKind.Text
          ? filesApiService.readText(file.id)
          : filesApiService.getDownloadUrl(file.id, StorageDisposition.Inline);
      void request.then((result) => {
        if (cancelled) return;
        setPreview(
          result.ok
            ? { fileId: file.id, source: result.value }
            : { fileId: file.id, source: null },
        );
        // A signed inline URL expires; text goes through the authenticated route and never does.
        if (result.ok && kind !== FilePreviewKind.Text)
          timer = window.setTimeout(load, PREVIEW_URL_REFRESH_MS);
      });
    }

    load();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
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
    if (!current)
      return <p className={styles.state}>{content.lightbox.loading}</p>;
    if (current.source === null)
      return (
        <p className={styles.state} role="alert">
          {content.lightbox.error}
        </p>
      );
    switch (kind) {
      case FilePreviewKind.Image:
        return (
          // Signed private URLs cannot pass through next/image; the SVG stays inert inside <img>.
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
      closeLabel={content.lightbox.close}
      eyebrow={
        files.length > 1
          ? formatMessage(content.lightbox.position, {
              index: String(index + 1),
              total: String(files.length),
            })
          : undefined
      }
      footer={
        <div className={styles.footer}>
          <div className={styles.paging}>
            <ButtonControl
              aria-label={content.lightbox.previous}
              disabled={index === 0}
              onClick={() => onIndexChangeAction(index - 1)}
              title={content.lightbox.previous}
              type="button"
              variant="ghost"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faChevronLeft} />
            </ButtonControl>
            <ButtonControl
              aria-label={content.lightbox.next}
              disabled={index >= files.length - 1}
              onClick={() => onIndexChangeAction(index + 1)}
              title={content.lightbox.next}
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
            {content.lightbox.download}
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
