"use client";

import { useEffect, useRef, useState } from "react";
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
  /** Small preview of an image, shown at once and replaced as soon as the original has loaded. */
  placeholderSrc?: string | null;
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
  placeholderSrc,
}: FilePreviewStageProps<TFile>) {
  const kind = filePresentation.previewKindOf(file);
  const current = useFilePreviewSource(file, kind, loadSourceAction);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Keyed by source: a renewed signed URL starts hidden again and may fail on its own.
  const [loadedSource, setLoadedSource] = useState<string | null>(null);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const placeholder =
    kind === FilePreviewKind.Image && placeholderSrc ? placeholderSrc : null;

  useEffect(() => {
    if (!playbackEnabled) videoRef.current?.pause();
  }, [playbackEnabled, current?.source]);

  function renderImage(source: string) {
    return (
      // Signed private URLs cannot pass through an image optimizer; the SVG stays inert inside <img>.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={file.displayName}
        className={styles.image}
        onError={() => setFailedSource(source)}
        onLoad={() => setLoadedSource(source)}
        src={source}
      />
    );
  }

  /** Both pictures share one cell; the original fades in over the small one once it is complete. */
  function renderWithPlaceholder(
    placeholderUrl: string,
    source: string | null,
  ) {
    return (
      <span
        className={styles.stack}
        data-loaded={
          source !== null && loadedSource === source ? "true" : "false"
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative stand-in for the original below */}
        <img
          alt=""
          aria-hidden="true"
          className={styles.placeholder}
          src={placeholderUrl}
        />
        {source ? renderImage(source) : null}
      </span>
    );
  }

  function renderPreview() {
    if (!current)
      return placeholder ? (
        renderWithPlaceholder(placeholder, null)
      ) : (
        <p className={styles.state}>{labels.loading}</p>
      );
    if (current.source === null || failedSource === current.source)
      return (
        <p className={styles.state} role="alert">
          {labels.error}
        </p>
      );
    switch (kind) {
      case FilePreviewKind.Image:
        return placeholder
          ? renderWithPlaceholder(placeholder, current.source)
          : renderImage(current.source);
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
