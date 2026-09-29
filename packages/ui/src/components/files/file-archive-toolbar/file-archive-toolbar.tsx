"use client";

import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "../../button/button";
import styles from "./file-archive-toolbar.module.css";

export type FileArchiveToolbarProps = {
  busy: boolean;
  hasFiles: boolean;
  hasVideo: boolean;
  limitReached: boolean;
  selectedCount: number;
  labels: {
    groupLabel: string;
    selectShown: string;
    selected: string;
    clear: string;
    preparing: string;
    download: string;
    limitReached: string;
    videoHint: string;
  };
  onSelectShownAction: () => void;
  onClearAction: () => void;
  onDownloadAction: () => void;
};

export function FileArchiveToolbar({
  busy,
  hasFiles,
  hasVideo,
  limitReached,
  selectedCount,
  labels,
  onSelectShownAction,
  onClearAction,
  onDownloadAction,
}: FileArchiveToolbarProps) {
  if (!hasFiles) return null;

  return (
    <div aria-label={labels.groupLabel} className={styles.toolbar} role="group">
      <ButtonControl
        onClick={onSelectShownAction}
        type="button"
        variant="ghost"
      >
        {labels.selectShown}
      </ButtonControl>
      {selectedCount > 0 ? (
        <>
          <span>
            {formatMessage(labels.selected, { count: String(selectedCount) })}
          </span>
          <ButtonControl onClick={onClearAction} type="button" variant="ghost">
            {labels.clear}
          </ButtonControl>
          <ButtonControl
            disabled={busy}
            onClick={onDownloadAction}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faDownload} />
            {busy ? labels.preparing : labels.download}
          </ButtonControl>
          {limitReached ? <span>{labels.limitReached}</span> : null}
        </>
      ) : null}
      {hasVideo ? <span>{labels.videoHint}</span> : null}
    </div>
  );
}
