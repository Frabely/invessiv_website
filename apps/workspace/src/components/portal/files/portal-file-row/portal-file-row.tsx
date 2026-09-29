"use client";

import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import { FileEntryRow } from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { PortalFilesDictionary } from "@/i18n/dictionaries/portal";

export type PortalFileRowProps = {
  content: PortalFilesDictionary;
  file: PortalFileDto;
  locale: Locale;
  onDownloadAction: (file: PortalFileDto) => void;
  onPreviewAction?: (file: PortalFileDto) => void;
  onSelectAction?: (file: PortalFileDto) => void;
  selected: boolean;
};

/** The portal adds only the project label to the shared, read-only file row. */
export function PortalFileRow({
  content,
  file,
  locale,
  onDownloadAction,
  onPreviewAction,
  onSelectAction,
  selected,
}: PortalFileRowProps) {
  return (
    <FileEntryRow
      file={file}
      kindLabel={content.kinds[file.assetKind]}
      labels={{ ...content.row, selectNamed: content.archive.selectNamed }}
      locale={locale}
      metadata={
        file.projectId === null ? (
          <span>{content.row.general}</span>
        ) : file.projectTitle ? (
          <span>{file.projectTitle}</span>
        ) : null
      }
      onDownloadAction={onDownloadAction}
      onPreviewAction={onPreviewAction}
      onSelectAction={onSelectAction}
      selected={selected}
    />
  );
}
