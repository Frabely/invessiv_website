"use client";

import { faFolderOpen, faInbox } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { EmptyState, FileListFrame } from "@invessiv/ui";
import { FileListLoadStatus } from "@/common/constants/files/file-list-load-status";
import { fileArchiveSelection } from "@/common/patterns/files/file-archive-selection";
import type { Locale } from "@/config/i18n";
import type { PortalFilesDictionary } from "@/i18n/dictionaries/portal";
import { PortalFileRow } from "../portal-file-row/portal-file-row";

export type PortalFileListProps = {
  canUpload: boolean;
  content: PortalFilesDictionary;
  files: readonly PortalFileDto[];
  hasMore: boolean;
  locale: Locale;
  origin: PortalFileOrigin;
  selectedIds: readonly string[];
  status: FileListLoadStatus;
  total: number;
  onDownloadAction: (file: PortalFileDto) => void;
  onLoadMoreAction: () => void;
  onPreviewAction: (file: PortalFileDto) => void;
  onReloadAction: () => void;
  onSelectAction: (file: PortalFileDto) => void;
};

export function PortalFileList({
  canUpload,
  content,
  files,
  hasMore,
  locale,
  origin,
  selectedIds,
  status,
  total,
  onDownloadAction,
  onLoadMoreAction,
  onPreviewAction,
  onReloadAction,
  onSelectAction,
}: PortalFileListProps) {
  const emptyState =
    origin === PortalFileOrigin.FromUs ? (
      <EmptyState
        alignment="start"
        description={content.empty.fromUs.description}
        icon={<FontAwesomeIcon icon={faInbox} />}
        title={content.empty.fromUs.title}
      />
    ) : (
      <EmptyState
        alignment="start"
        description={
          canUpload
            ? content.empty.fromYou.description
            : content.empty.fromYou.readOnlyDescription
        }
        icon={<FontAwesomeIcon icon={faFolderOpen} />}
        title={content.empty.fromYou.title}
      />
    );

  return (
    <FileListFrame
      count={files.length}
      emptyState={emptyState}
      errorLabel={content.list.loadError}
      hasMore={hasMore}
      isError={status === FileListLoadStatus.Error}
      isLoading={status === FileListLoadStatus.Loading}
      isLoadingMore={status === FileListLoadStatus.LoadingMore}
      listLabel={content.list.label}
      loadingLabel={content.list.loading}
      loadMoreLabel={content.list.loadMore}
      onLoadMoreAction={onLoadMoreAction}
      onReloadAction={onReloadAction}
      retryLabel={content.list.retry}
      rows={files.map((file) => {
        const selected = selectedIds.includes(file.id);
        return (
          <PortalFileRow
            content={content}
            file={file}
            key={file.id}
            locale={locale}
            onDownloadAction={onDownloadAction}
            onPreviewAction={
              filePresentation.previewKindOf(file) !== null
                ? onPreviewAction
                : undefined
            }
            onSelectAction={
              fileArchiveSelection.canSelect(file, selectedIds)
                ? onSelectAction
                : undefined
            }
            selected={selected}
          />
        );
      })}
      shownLabel={formatMessage(content.list.shown, {
        shown: String(files.length),
        total: String(total),
      })}
      spacious
    />
  );
}
