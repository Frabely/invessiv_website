"use client";

import type { ReactNode } from "react";
import {
  faArrowUpRightFromSquare,
  faDownload,
  faExpand,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { FilePreviewKind } from "@invessiv/common/constants/files/file-preview-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import { FilePreviewStageVariant } from "@invessiv/common/constants/ui/file-preview-stage-variants";
import type { FileEntryItem } from "@invessiv/common/contracts/files/file-entry-item";
import type { FilePreviewPanelLabels } from "@invessiv/common/contracts/ui/file-preview-panel-labels";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";
import { ButtonControl, ButtonLink } from "../../button/button";
import { FileEntryMeta } from "../file-entry-meta/file-entry-meta";
import { FileKindIcon } from "../file-kind-icon/file-kind-icon";
import { FilePreviewStage } from "../file-preview-stage/file-preview-stage";
import styles from "./file-preview-panel.module.css";

export type FilePreviewPanelProps<TFile extends FileEntryItem> = {
  /** Null while no file is chosen; nothing loads then. */
  file: TFile | null;
  /** Pauses the panel's media while a modal view is active, preserving its position. */
  playbackEnabled?: boolean;
  kindLabel: string;
  labels: FilePreviewPanelLabels;
  locale: string;
  /** The caller's own facts for the meta line, such as the project. */
  metadata?: ReactNode;
  loadSourceAction: (
    file: TFile,
    kind: FilePreviewKind,
  ) => Promise<string | null>;
  onDownloadAction: (file: TFile) => void;
  onExpandAction: (file: TFile) => void;
};

/**
 * One file next to a list: its preview, name, note and facts, with the way to the full-size view
 * and the download. Only the chosen file loads.
 */
export function FilePreviewPanel<TFile extends FileEntryItem>({
  file,
  playbackEnabled = true,
  kindLabel,
  labels,
  locale,
  metadata,
  loadSourceAction,
  onDownloadAction,
  onExpandAction,
}: FilePreviewPanelProps<TFile>) {
  if (!file)
    return (
      <aside aria-label={labels.label} className={styles.panel}>
        <div className={styles.empty}>
          <FontAwesomeIcon aria-hidden="true" icon={faEye} />
          <p>{labels.empty}</p>
        </div>
      </aside>
    );

  const previewable = filePresentation.previewKindOf(file) !== null;
  const linkUrl = file.source === FileSource.Link ? file.url : null;

  return (
    <aside aria-label={labels.label} className={styles.panel}>
      {previewable ? (
        <FilePreviewStage
          file={file}
          key={file.id}
          labels={labels}
          loadSourceAction={loadSourceAction}
          placeholderSrc={file.thumbnailUrl}
          playbackEnabled={playbackEnabled}
          variant={FilePreviewStageVariant.Panel}
        />
      ) : null}
      <div className={styles.details}>
        {previewable ? null : (
          <FileKindIcon assetKind={file.assetKind} extension={file.extension} />
        )}
        <h2 className={styles.name}>{file.displayName}</h2>
        {file.note ? <p className={styles.note}>{file.note}</p> : null}
        <FileEntryMeta
          file={file}
          kindLabel={kindLabel}
          locale={locale}
          metadata={metadata}
        />
      </div>
      <div className={styles.actions}>
        {previewable ? (
          <ButtonControl
            onClick={() => onExpandAction(file)}
            type="button"
            variant={ButtonVariant.Ghost}
          >
            <FontAwesomeIcon aria-hidden="true" icon={faExpand} />
            {labels.expand}
          </ButtonControl>
        ) : null}
        {linkUrl ? (
          <ButtonLink
            aria-label={`${labels.open} (${labels.opensInNewTab})`}
            href={linkUrl}
            rel="noopener noreferrer"
            target="_blank"
            variant={ButtonVariant.Ghost}
          >
            <FontAwesomeIcon
              aria-hidden="true"
              icon={faArrowUpRightFromSquare}
            />
            {labels.open}
          </ButtonLink>
        ) : (
          <ButtonControl
            onClick={() => onDownloadAction(file)}
            type="button"
            variant={ButtonVariant.Ghost}
          >
            <FontAwesomeIcon aria-hidden="true" icon={faDownload} />
            {labels.download}
          </ButtonControl>
        )}
      </div>
    </aside>
  );
}
