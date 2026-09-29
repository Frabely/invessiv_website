"use client";

import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, FileListFrame } from "@invessiv/ui";
import { FileListLoadStatus } from "@/common/constants/files/file-list-load-status";
import type { FilesProjectOption } from "@/common/contracts/crm/files/files-project-option";
import { fileArchiveSelection } from "@/common/patterns/files/file-archive-selection";
import { SectionEmptyState } from "@/components/workspace/crm/shared/section-empty-state/section-empty-state";
import type { Locale } from "@/config/i18n";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FileRow } from "../file-row/file-row";

export type CustomerFilesListProps = {
  content: CrmFilesDictionary;
  files: readonly FileDto[];
  total: number;
  status: FileListLoadStatus;
  hasMore: boolean;
  filterIsActive: boolean;
  canWrite: boolean;
  projectId?: string;
  projects: readonly FilesProjectOption[];
  memberNames: ReadonlyMap<string, string>;
  locale: Locale;
  onResetAction: () => void;
  onReloadAction: () => void;
  onLoadMoreAction: () => void;
  onDeleteAction: (file: FileDto) => void;
  onDownloadAction: (file: FileDto) => void;
  onEditAction: (file: FileDto) => void;
  onPreviewAction: (file: FileDto) => void;
  canDeleteAction: (file: FileDto) => boolean;
  canEditAction: (file: FileDto) => boolean;
  selectedIds: readonly string[];
  onSelectAction: (file: FileDto) => void;
};

export function CustomerFilesList({
  content,
  files,
  total,
  status,
  hasMore,
  filterIsActive,
  canWrite,
  projectId,
  projects,
  memberNames,
  locale,
  onResetAction,
  onReloadAction,
  onLoadMoreAction,
  onDeleteAction,
  onDownloadAction,
  onEditAction,
  onPreviewAction,
  canDeleteAction,
  canEditAction,
  selectedIds,
  onSelectAction,
}: CustomerFilesListProps) {
  const emptyState = filterIsActive ? (
    <SectionEmptyState
      action={
        <ButtonControl onClick={onResetAction} type="button" variant="ghost">
          {content.toolbar.reset}
        </ButtonControl>
      }
      description={content.empty.filteredDescription}
      title={content.empty.filteredTitle}
    />
  ) : (
    <SectionEmptyState
      description={
        canWrite ? content.empty.description : content.empty.readOnlyDescription
      }
      title={content.empty.title}
    />
  );

  return (
    <FileListFrame
      count={files.length}
      emptyState={emptyState}
      errorLabel={content.section.loadError}
      hasMore={hasMore}
      isError={status === FileListLoadStatus.Error}
      isLoading={status === FileListLoadStatus.Loading}
      isLoadingMore={status === FileListLoadStatus.LoadingMore}
      listLabel={content.section.listLabel}
      loadingLabel={content.section.loading}
      loadMoreLabel={content.section.loadMore}
      onLoadMoreAction={onLoadMoreAction}
      onReloadAction={onReloadAction}
      retryLabel={content.section.retry}
      rows={files.map((file) => {
        const selected = selectedIds.includes(file.id);
        const projectLabel = projectId
          ? undefined
          : file.projectId === null
            ? content.row.customerWide
            : projects.find((project) => project.id === file.projectId)?.title;
        return (
          <FileRow
            content={content}
            file={file}
            key={file.id}
            locale={locale}
            onDeleteAction={canDeleteAction(file) ? onDeleteAction : undefined}
            onDownloadAction={onDownloadAction}
            onEditAction={canEditAction(file) ? onEditAction : undefined}
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
            projectLabel={projectLabel}
            selected={selected}
            uploaderName={
              file.uploadedByMemberId
                ? (memberNames.get(file.uploadedByMemberId) ?? null)
                : null
            }
          />
        );
      })}
      shownLabel={formatMessage(content.section.shown, {
        shown: String(files.length),
        total: String(total),
      })}
    />
  );
}
