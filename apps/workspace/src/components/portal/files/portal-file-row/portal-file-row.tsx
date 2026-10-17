"use client";

import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import { FileEntryRow } from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { PortalFilesDictionary } from "@/i18n/dictionaries/portal";
import { PortalFileProjectLabel } from "../portal-file-project-label/portal-file-project-label";

export type PortalFileRowProps = {
  /** The file shown in the side panel next to the list. */
  active: boolean;
  content: PortalFilesDictionary;
  file: PortalFileDto;
  locale: Locale;
  onDownloadAction: (file: PortalFileDto) => void;
  onPreviewAction?: (file: PortalFileDto) => void;
  onSelectAction?: (file: PortalFileDto) => void;
  selected: boolean;
  /** Names the project; pointless while the page shows a single project. */
  showProject: boolean;
};

/** The portal adds only the project label to the shared, read-only file row. */
export function PortalFileRow({
  active,
  content,
  file,
  locale,
  onDownloadAction,
  onPreviewAction,
  onSelectAction,
  selected,
  showProject,
}: PortalFileRowProps) {
  return (
    <FileEntryRow
      active={active}
      file={file}
      kindLabel={content.kinds[file.assetKind]}
      labels={{ ...content.row, selectNamed: content.archive.selectNamed }}
      locale={locale}
      metadata={
        showProject ? (
          <PortalFileProjectLabel content={content} file={file} />
        ) : null
      }
      onDownloadAction={onDownloadAction}
      onPreviewAction={onPreviewAction}
      openOnRowClick
      onSelectAction={onSelectAction}
      selected={selected}
    />
  );
}
