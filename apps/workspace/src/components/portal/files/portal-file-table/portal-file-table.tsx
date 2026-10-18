"use client";

import { useEffect, useRef } from "react";
import { faFolderOpen, faInbox } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  ButtonControl,
  CheckboxControl,
  DataTableLayout,
  EmptyState,
} from "@invessiv/ui";
import { FileListLoadStatus } from "@/common/constants/files/file-list-load-status";
import { MAX_ARCHIVE_FILES } from "@/common/constants/files/file-archive-limits";
import { PortalFileOriginFilter } from "@/common/constants/portal/portal-file-origin-filter";
import { fileArchiveSelection } from "@/common/patterns/files/file-archive-selection";
import type { Locale } from "@/config/i18n";
import type { PortalFilesDictionary } from "@/i18n/dictionaries/portal";
import { PortalFileTableRow } from "../portal-file-table-row/portal-file-table-row";
import styles from "./portal-file-table.module.css";

export type PortalFileTableProps = {
  /** The file shown in the side panel; null without a panel or a choice. */
  activeFileId: string | null;
  canUpload: boolean;
  content: PortalFilesDictionary;
  files: readonly PortalFileDto[];
  hasMore: boolean;
  locale: Locale;
  originFilter: PortalFileOriginFilter;
  selectedIds: readonly string[];
  showProject: boolean;
  status: FileListLoadStatus;
  total: number;
  withPanel: boolean;
  onDeselectAction: (ids: readonly string[]) => void;
  onDownloadAction: (file: PortalFileDto) => void;
  onLoadMoreAction: () => void;
  onOpenAction: (file: PortalFileDto) => void;
  onReloadAction: () => void;
  onSelectAction: (ids: readonly string[]) => void;
  onToggleAction: (file: PortalFileDto) => void;
};

/**
 * The customer's files as a table: on a phone the rows become cards, further entries load below
 * the last row, so the ZIP selection may span everything loaded.
 */
export function PortalFileTable({
  activeFileId,
  canUpload,
  content,
  files,
  hasMore,
  locale,
  originFilter,
  selectedIds,
  showProject,
  status,
  total,
  withPanel,
  onDeselectAction,
  onDownloadAction,
  onLoadMoreAction,
  onOpenAction,
  onReloadAction,
  onSelectAction,
  onToggleAction,
}: PortalFileTableProps) {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const columns = content.table.columns;
  const selectableIds = fileArchiveSelection.shownIds(files);
  const selectedShown = selectableIds.filter((id) => selectedIds.includes(id));
  const allSelected =
    selectableIds.length > 0 && selectedShown.length === selectableIds.length;
  const someSelected = selectedShown.length > 0 && !allSelected;
  const limitReached = selectedIds.length >= MAX_ARCHIVE_FILES;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  if (status === FileListLoadStatus.Loading && files.length === 0)
    return (
      <p className={styles.state} role="status">
        {content.list.loading}
      </p>
    );
  if (status === FileListLoadStatus.Error && files.length === 0)
    return (
      <div className={styles.state} role="alert">
        <p>{content.list.loadError}</p>
        <ButtonControl
          onClick={onReloadAction}
          type="button"
          variant={ButtonVariant.Ghost}
        >
          {content.list.retry}
        </ButtonControl>
      </div>
    );
  if (files.length === 0) {
    const fromUs = originFilter === PortalFileOriginFilter.FromUs;
    const empty =
      originFilter === PortalFileOriginFilter.FromYou
        ? content.empty.fromYou
        : content.empty.all;
    return (
      <EmptyState
        alignment="start"
        description={
          fromUs
            ? content.empty.fromUs.description
            : canUpload
              ? empty.description
              : empty.readOnlyDescription
        }
        icon={<FontAwesomeIcon icon={fromUs ? faInbox : faFolderOpen} />}
        title={fromUs ? content.empty.fromUs.title : empty.title}
      />
    );
  }

  return (
    <DataTableLayout
      ariaLabel={content.list.label}
      fillAvailableHeight
      caption={content.list.label}
      columns={[
        {
          header:
            selectableIds.length > 0 ? (
              <CheckboxControl
                aria-label={content.table.selectAll}
                checked={allSelected}
                disabled={limitReached && selectedShown.length === 0}
                onChange={() =>
                  allSelected || limitReached
                    ? onDeselectAction(selectableIds)
                    : onSelectAction(selectableIds)
                }
                ref={selectAllRef}
              />
            ) : null,
          id: "selection",
        },
        { header: columns.name, id: "name" },
        { header: columns.origin, id: "origin" },
        ...(showProject ? [{ header: columns.project, id: "project" }] : []),
        { header: columns.type, id: "type" },
        { header: columns.size, id: "size" },
        { header: columns.added, id: "added" },
        {
          header: columns.actions,
          id: "actions",
          isVisuallyHidden: true,
        },
      ]}
      footer={
        <>
          <p className={styles.shown}>
            {formatMessage(content.list.shown, {
              shown: String(files.length),
              total: String(total),
            })}
          </p>
          {hasMore ? (
            <ButtonControl
              disabled={status === FileListLoadStatus.LoadingMore}
              onClick={onLoadMoreAction}
              type="button"
              variant={ButtonVariant.Ghost}
            >
              {content.list.loadMore}
            </ButtonControl>
          ) : null}
        </>
      }
      responsiveMode="cards"
    >
      {files.map((file) => (
        <PortalFileTableRow
          active={file.id === activeFileId}
          content={content}
          file={file}
          key={file.id}
          locale={locale}
          onDownloadAction={onDownloadAction}
          onOpenAction={onOpenAction}
          onSelectAction={
            fileArchiveSelection.canSelect(file, selectedIds)
              ? onToggleAction
              : undefined
          }
          selected={selectedIds.includes(file.id)}
          showProject={showProject}
          withPanel={withPanel}
        />
      ))}
    </DataTableLayout>
  );
}
