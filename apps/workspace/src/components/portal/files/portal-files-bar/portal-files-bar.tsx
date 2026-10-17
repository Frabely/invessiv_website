"use client";

import { faDownload, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, PrimaryCtaButton } from "@invessiv/ui";
import { PortalPageBar } from "@/components/portal/shared/portal-page-bar/portal-page-bar";
import type { PortalFilesDictionary } from "@/i18n/dictionaries/portal";
import styles from "./portal-files-bar.module.css";

export type PortalFilesBarProps = {
  archiveBusy: boolean;
  canUpload: boolean;
  content: PortalFilesDictionary;
  /** Videos never go into a ZIP; the bar says so while files are selected. */
  hasVideo: boolean;
  limitReached: boolean;
  selectedCount: number;
  onAddAction: () => void;
  onClearAction: () => void;
  onDownloadAction: () => void;
};

/**
 * One primary entry point for adding files, with ZIP actions before it while files are selected.
 */
export function PortalFilesBar({
  archiveBusy,
  canUpload,
  content,
  hasVideo,
  limitReached,
  selectedCount,
  onAddAction,
  onClearAction,
  onDownloadAction,
}: PortalFilesBarProps) {
  if (selectedCount > 0)
    return (
      <PortalPageBar
        actions={
          <div className={styles.actions}>
            <ButtonControl
              onClick={onClearAction}
              type="button"
              variant={ButtonVariant.Ghost}
            >
              {content.archive.clear}
            </ButtonControl>
            <ButtonControl
              disabled={archiveBusy}
              onClick={onDownloadAction}
              type="button"
              variant={ButtonVariant.Ghost}
            >
              <FontAwesomeIcon aria-hidden="true" icon={faDownload} />
              {archiveBusy
                ? content.archive.preparing
                : content.archive.download}
            </ButtonControl>
            {canUpload ? (
              <PrimaryCtaButton onClick={onAddAction} type="button">
                <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
                {content.actions.add}
              </PrimaryCtaButton>
            ) : null}
          </div>
        }
        status={
          <p className={styles.status}>
            <strong>
              {formatMessage(content.archive.selected, {
                count: String(selectedCount),
              })}
            </strong>
            {limitReached ? <span>{content.archive.limitReached}</span> : null}
            {hasVideo ? <span>{content.archive.videoHint}</span> : null}
          </p>
        }
      />
    );

  if (!canUpload) return null;

  return (
    <PortalPageBar
      actions={
        <PrimaryCtaButton onClick={onAddAction} type="button">
          <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
          {content.actions.add}
        </PrimaryCtaButton>
      }
    />
  );
}
