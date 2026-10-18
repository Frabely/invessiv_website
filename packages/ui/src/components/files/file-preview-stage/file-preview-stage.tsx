"use client";

import { useEffect, useRef } from "react";
import { FilePreviewKind } from "@invessiv/common/constants/files/file-preview-kind";
import {
  FilePreviewStageVariant,
  type FilePreviewStageVariant as FilePreviewStageVariantValue,
} from "@invessiv/common/constants/ui/file-preview-stage-variants";
import type { FilePreviewItem } from "@invessiv/common/contracts/files/file-preview-item";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";
import { useFilePreviewSource } from "../../../hooks/use-file-preview-source";
import styles from "./file-preview-stage.module.css";

export type FilePreviewStageProps<TFile extends FilePreviewItem> = {
  file: TFile;
  /** Pauses media while another view is active; enabling it never starts playback. */
  playbackEnabled?: boolean;
  labels: { loading: string; error: string };
  /**
   * Resolves the source for one file: plain text for `text`, otherwise a short-lived inline URL.
   * Null means the preview could not be loaded.
   */
  loadSourceAction: (
    file: TFile,
    kind: FilePreviewKind,
  ) => Promise<string | null>;
  variant?: FilePreviewStageVariantValue;
};

/**
 * Shows one image, PDF, short text or browser-playable video. Media load through a short-lived
 * inline URL; text is only ever rendered as text, never as markup.
 */
export function FilePreviewStage<TFile extends FilePreviewItem>({
  file,
  playbackEnabled = true,
  labels,
  loadSourceAction,
  variant = FilePreviewStageVariant.Dialog,
}: FilePreviewStageProps<TFile>) {
  const kind = filePresentation.previewKindOf(file);
  const current = useFilePreviewSource(file, kind, loadSourceAction);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!playbackEnabled) videoRef.current?.pause();
  }, [playbackEnabled, current?.source]);

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
            preload="metadata"
            ref={videoRef}
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
    <div
      className={styles.stage}
      data-kind={kind ?? undefined}
      data-variant={variant}
    >
      {renderPreview()}
    </div>
  );
}
