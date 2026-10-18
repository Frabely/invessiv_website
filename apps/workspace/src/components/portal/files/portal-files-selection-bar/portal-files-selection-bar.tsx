"use client";

import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, SelectionActionBar } from "@invessiv/ui";
import type { PortalFilesDictionary } from "@/i18n/dictionaries/portal";

export type PortalFilesSelectionBarProps = {
  archiveBusy: boolean;
  content: PortalFilesDictionary;
  /** Videos never go into a ZIP; the bar says so while the list shows one. */
  hasVideo: boolean;
  limitReached: boolean;
  selectedCount: number;
  onClearAction: () => void;
  onDownloadAction: () => void;
};

/** The ZIP actions for the chosen files, floating above the page bar like the bulk bar of the leads. */
export function PortalFilesSelectionBar({
  archiveBusy,
  content,
  hasVideo,
  limitReached,
  selectedCount,
  onClearAction,
  onDownloadAction,
}: PortalFilesSelectionBarProps) {
  if (selectedCount === 0) return null;

  const hint = limitReached
    ? content.archive.limitReached
    : hasVideo
      ? content.archive.videoHint
      : null;

  return (
    <SelectionActionBar
      actions={
        <>
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
            variant={ButtonVariant.Primary}
          >
            <FontAwesomeIcon aria-hidden="true" icon={faDownload} />
            {archiveBusy ? content.archive.preparing : content.archive.download}
          </ButtonControl>
        </>
      }
      hint={hint}
      summary={formatMessage(content.archive.selected, {
        count: String(selectedCount),
      })}
    />
  );
}
