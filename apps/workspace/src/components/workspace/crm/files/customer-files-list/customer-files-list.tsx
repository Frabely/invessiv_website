"use client";

import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { MAX_ARCHIVE_FILES } from "@/common/constants/crm/files/file-archive-limits";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";
import { ButtonControl } from "@invessiv/ui";
import { FileListLoadStatus } from "@/common/constants/crm/files/file-list-load-status";
import type { FilesProjectOption } from "@/common/contracts/crm/files/files-project-option";
import type { Locale } from "@/config/i18n";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FileRow } from "../file-row/file-row";
import { SectionEmptyState } from "@/components/workspace/crm/shared/section-empty-state/section-empty-state";
import styles from "./customer-files-list.module.css";

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
  if (status === FileListLoadStatus.Loading && files.length === 0)
    return (
      <p className={styles.state} role="status">
        {content.section.loading}
      </p>
    );
  if (status === FileListLoadStatus.Error && files.length === 0)
    return (
      <div className={styles.state} role="alert">
        <p>{content.section.loadError}</p>
        <ButtonControl onClick={onReloadAction} type="button" variant="ghost">
          {content.section.retry}
        </ButtonControl>
      </div>
    );
  if (files.length === 0)
    return filterIsActive ? (
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
          canWrite
            ? content.empty.description
            : content.empty.readOnlyDescription
        }
        title={content.empty.title}
      />
    );

  return (
    <>
      <ul
        aria-busy={status === FileListLoadStatus.Loading}
        aria-label={content.section.listLabel}
        className={styles.list}
      >
        {files.map((file) => {
          const projectLabel = projectId
            ? undefined
            : file.projectId === null
              ? content.row.customerWide
              : projects.find((project) => project.id === file.projectId)
                  ?.title;
          return (
            <FileRow
              content={content}
              file={file}
              key={file.id}
              locale={locale}
              onDeleteAction={
                canDeleteAction(file) ? onDeleteAction : undefined
              }
              onDownloadAction={onDownloadAction}
              onEditAction={canEditAction(file) ? onEditAction : undefined}
              onPreviewAction={
                filePresentation.previewKindOf(file) !== null
                  ? onPreviewAction
                  : undefined
              }
              projectLabel={projectLabel}
              uploaderName={
                file.uploadedByMemberId
                  ? (memberNames.get(file.uploadedByMemberId) ?? null)
                  : null
              }
              selected={selectedIds.includes(file.id)}
              onSelectAction={
                file.assetKind === AssetKind.Video ||
                (selectedIds.length >= MAX_ARCHIVE_FILES &&
                  !selectedIds.includes(file.id))
                  ? undefined
                  : onSelectAction
              }
            />
          );
        })}
      </ul>
      <div className={styles.more}>
        <p className={styles.shown}>
          {formatMessage(content.section.shown, {
            shown: String(files.length),
            total: String(total),
          })}
        </p>
        {hasMore ? (
          <ButtonControl
            disabled={status === FileListLoadStatus.LoadingMore}
            onClick={onLoadMoreAction}
            type="button"
            variant="ghost"
          >
            {content.section.loadMore}
          </ButtonControl>
        ) : null}
      </div>
    </>
  );
}
