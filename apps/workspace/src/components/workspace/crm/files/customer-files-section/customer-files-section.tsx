"use client";

import { useMemo, useRef, useState } from "react";
import {
  faArrowUpFromBracket,
  faLink,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { UPLOAD_ACCEPT_ATTRIBUTE } from "@invessiv/common/constants/files/upload-accept";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import { FileDropZoneVariant } from "@invessiv/common/constants/ui/file-drop-zone-variants";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";
import {
  ButtonControl,
  FileDropZone,
  PrimaryCtaButton,
  useFileDragTarget,
} from "@invessiv/ui";
import { filesApiService } from "@/client/crm/files-api-service";
import { FileListLoadStatus } from "@/common/constants/crm/files/file-list-load-status";
import type { FilesViewModel } from "@/common/contracts/crm/files/files-view-model";
import { customerFilesFilter } from "@/common/patterns/crm/files/customer-files-filter";
import { filesScopeRights } from "@/common/patterns/crm/files/files-scope-rights";
import { CollapsibleSection } from "@/components/workspace/crm/shared/collapsible-section/collapsible-section";
import type { Locale } from "@/config/i18n";
import { useCustomerFiles } from "@/hooks/workspace/crm/use-customer-files";
import { useCustomerFilesFilter } from "@/hooks/workspace/crm/use-customer-files-filter";
import { useCustomerFilesSelection } from "@/hooks/workspace/crm/use-customer-files-selection";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FileDeleteDialog } from "../file-delete-dialog/file-delete-dialog";
import { FileEditDialog } from "../file-edit-dialog/file-edit-dialog";
import { FileLightbox } from "../file-lightbox/file-lightbox";
import { FileLinkDialog } from "../file-link-dialog/file-link-dialog";
import { FilesToolbar } from "../files-toolbar/files-toolbar";
import { FileUploadDialog } from "../file-upload-dialog/file-upload-dialog";
import { CustomerFilesList } from "../customer-files-list/customer-files-list";
import { MAX_ARCHIVE_FILES } from "@/common/constants/crm/files/file-archive-limits";
import styles from "./customer-files-section.module.css";

type CustomerFilesSectionProps = {
  content: CrmFilesDictionary;
  customerId: string;
  defaultExpanded?: boolean;
  locale: Locale;
  /** Pins the section to one project; filters by project and the project column disappear. */
  projectId?: string;
  /** Bumped by the cockpit after any file change, so every files section reloads. */
  revision: number;
  viewModel: FilesViewModel;
  onChangedAction: () => void;
};

type FileOverlay =
  | { kind: "upload"; files: File[] }
  | { kind: "link" }
  | { kind: "edit"; file: FileDto }
  | { kind: "delete"; file: FileDto }
  | { kind: "preview"; fileId: string };

/**
 * The files and links of a customer, or of one project. The list loads through the API; every
 * write action appears only for scopes the page resolved as writable.
 */
export function CustomerFilesSection({
  content,
  customerId,
  defaultExpanded = true,
  locale,
  projectId,
  revision,
  viewModel,
  onChangedAction,
}: CustomerFilesSectionProps) {
  const filters = useCustomerFilesFilter({
    readableProjectIds: viewModel.read.projectIds,
    syncUrl: projectId === undefined,
    fixedProjectId: projectId,
  });
  const list = useCustomerFiles(customerId, filters.filter, revision);
  const selection = useCustomerFilesSelection(customerId);
  const [overlay, setOverlay] = useState<FileOverlay | null>(null);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const writeTargets = projectId
    ? filesScopeRights.allows(viewModel.write, projectId)
      ? [projectId]
      : []
    : filesScopeRights.targets(viewModel.write, viewModel.projects);
  const moveTargets = filesScopeRights.targets(
    viewModel.write,
    viewModel.projects,
  );
  const canWrite = writeTargets.length > 0;
  const defaultTarget =
    projectId ??
    (filters.filter.projectId !== undefined &&
    writeTargets.includes(filters.filter.projectId)
      ? filters.filter.projectId
      : (writeTargets[0] ?? null));
  const previewable = useMemo(
    () =>
      list.files.filter(
        (file) => filePresentation.previewKindOf(file) !== null,
      ),
    [list.files],
  );
  const memberNames = useMemo(
    () =>
      new Map(
        viewModel.members.map((member) => [member.id, member.displayName]),
      ),
    [viewModel.members],
  );
  // The list can reload (revision bump, filter change) while the lightbox is open. Resolving the
  // index fresh from the live `previewable` list on every render, instead of storing it in state,
  // means a file that disappeared (deleted, filtered out) closes the lightbox instead of silently
  // showing whatever now sits at the old index.
  const previewFileId = overlay?.kind === "preview" ? overlay.fileId : null;
  const previewIndex =
    previewFileId === null
      ? null
      : previewable.findIndex((file) => file.id === previewFileId);
  const previewOpen = previewIndex !== null && previewIndex >= 0;
  const isFileOverlayOpen =
    overlay !== null && (overlay.kind !== "preview" || previewOpen);
  const drag = useFileDragTarget(openUpload, !canWrite || isFileOverlayOpen);

  function rememberFocus() {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
  }

  function restoreFocus() {
    const target = returnFocusRef.current;
    requestAnimationFrame(() => target?.isConnected && target.focus());
  }

  function openUpload(files: File[] = []) {
    rememberFocus();
    setOverlay({ kind: "upload", files });
  }

  function changed(message: string) {
    setAnnouncement(message);
    onChangedAction();
  }

  async function download(file: FileDto) {
    setActionError(null);
    const result = await filesApiService.getDownloadUrl(
      file.id,
      StorageDisposition.Attachment,
    );
    if (!result.ok) {
      setActionError(content.errors[result.code]);
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = result.value;
    anchor.rel = "noopener";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }

  async function downloadArchive() {
    if (!selection.selectedIds.length || archiveBusy) return;
    setArchiveBusy(true);
    setActionError(null);
    try {
      const result = await filesApiService.downloadArchive(
        customerId,
        selection.selectedIds,
      );
      if (!result.ok) {
        // The archive is all-or-nothing, so a stale id would block every retry.
        if (result.code === FileApiErrorCode.NotFound) selection.clear();
        setActionError(content.errors[result.code]);
        return;
      }
      const url = URL.createObjectURL(result.value);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = content.archive.filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      selection.clear();
    } finally {
      setArchiveBusy(false);
    }
  }

  return (
    <div
      className={styles.dropTarget}
      data-drop-active={drag.active ? "true" : "false"}
      {...drag.handlers}
    >
      <CollapsibleSection
        action={
          canWrite ? (
            <PrimaryCtaButton
              className={styles.headerAction}
              onClick={() => openUpload()}
              type="button"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faArrowUpFromBracket} />
              {content.actions.upload}
            </PrimaryCtaButton>
          ) : null
        }
        after={
          <>
            <p aria-live="polite" className="sr-only" role="status">
              {announcement}
            </p>
            {overlay?.kind === "upload" ? (
              <FileUploadDialog
                content={content}
                customerId={customerId}
                defaultTarget={defaultTarget}
                initialFiles={overlay.files}
                locale={locale}
                onCloseAction={() => {
                  setOverlay(null);
                  restoreFocus();
                }}
                onUploadedAction={(file) =>
                  changed(
                    formatMessage(content.announcements.uploaded, {
                      name: file.displayName,
                    }),
                  )
                }
                projects={viewModel.projects}
                targets={writeTargets}
              />
            ) : null}
            {overlay?.kind === "link" ? (
              <FileLinkDialog
                content={content}
                customerId={customerId}
                defaultTarget={defaultTarget}
                onCloseAction={() => {
                  setOverlay(null);
                  restoreFocus();
                }}
                onCreatedAction={(file) =>
                  changed(
                    formatMessage(content.announcements.linkAdded, {
                      name: file.displayName,
                    }),
                  )
                }
                projects={viewModel.projects}
                targets={writeTargets}
              />
            ) : null}
            {overlay?.kind === "edit" ? (
              <FileEditDialog
                content={content}
                file={overlay.file}
                key={overlay.file.id}
                onCloseAction={() => {
                  setOverlay(null);
                  restoreFocus();
                }}
                onSavedAction={(file) =>
                  changed(
                    formatMessage(content.announcements.saved, {
                      name: file.displayName,
                    }),
                  )
                }
                projects={viewModel.projects}
                targets={moveTargets}
              />
            ) : null}
            {overlay?.kind === "delete" ? (
              <FileDeleteDialog
                content={content}
                file={overlay.file}
                key={overlay.file.id}
                onChangedAction={list.replace}
                onCloseAction={() => {
                  setOverlay(null);
                  restoreFocus();
                }}
                onDeletedAction={(file) => {
                  selection.remove(file.id);
                  changed(
                    formatMessage(content.announcements.deleted, {
                      name: file.displayName,
                    }),
                  );
                }}
              />
            ) : null}
            {previewIndex !== null && previewIndex >= 0 ? (
              <FileLightbox
                content={content}
                files={previewable}
                index={previewIndex}
                onCloseAction={() => {
                  setOverlay(null);
                  restoreFocus();
                }}
                onDownloadAction={download}
                onIndexChangeAction={(nextIndex) =>
                  setOverlay(
                    previewable[nextIndex]
                      ? { kind: "preview", fileId: previewable[nextIndex].id }
                      : null,
                  )
                }
              />
            ) : null}
          </>
        }
        count={
          list.status === FileListLoadStatus.Ready ||
          list.status === FileListLoadStatus.LoadingMore
            ? list.total === 1
              ? content.section.countOne
              : formatMessage(content.section.count, {
                  count: String(list.total),
                })
            : undefined
        }
        defaultExpanded={defaultExpanded}
        labelCollapse={content.section.collapseLabel}
        labelExpand={content.section.expandLabel}
        title={content.section.title}
      >
        <div className={styles.body}>
          {canWrite ? (
            <div className={styles.intake}>
              <FileDropZone
                accept={UPLOAD_ACCEPT_ATTRIBUTE}
                className={styles.intakeZone}
                hint={content.upload.dropHint}
                label={content.upload.dropLabel}
                multiple
                onFilesSelected={openUpload}
                variant={FileDropZoneVariant.Compact}
              />
              <ButtonControl
                className={styles.linkButton}
                onClick={() => {
                  rememberFocus();
                  setOverlay({ kind: "link" });
                }}
                type="button"
                variant="ghost"
              >
                <FontAwesomeIcon aria-hidden="true" icon={faLink} />
                {content.actions.addLink}
              </ButtonControl>
            </div>
          ) : null}
          <FilesToolbar
            content={content}
            filter={filters.filter}
            onFilterChangeAction={filters.setFilter}
            onResetAction={filters.reset}
            onSearchChangeAction={filters.setSearch}
            projects={projectId ? undefined : viewModel.projects}
            showCustomerWide={viewModel.read.customerWide}
          />
          {list.files.length ? (
            <div
              className={styles.archiveBar}
              role="group"
              aria-label={content.archive.groupLabel}
            >
              <ButtonControl
                onClick={() =>
                  selection.add(
                    list.files
                      .filter((file) => file.assetKind !== AssetKind.Video)
                      .map((file) => file.id),
                  )
                }
                type="button"
                variant="ghost"
              >
                {content.archive.selectShown}
              </ButtonControl>
              {selection.selectedIds.length ? (
                <>
                  <span>
                    {formatMessage(content.archive.selected, {
                      count: String(selection.selectedIds.length),
                    })}
                  </span>
                  <ButtonControl
                    onClick={selection.clear}
                    type="button"
                    variant="ghost"
                  >
                    {content.archive.clear}
                  </ButtonControl>
                  <ButtonControl
                    disabled={archiveBusy}
                    onClick={downloadArchive}
                    type="button"
                    variant="ghost"
                  >
                    <FontAwesomeIcon aria-hidden="true" icon={faDownload} />
                    {archiveBusy
                      ? content.archive.preparing
                      : content.archive.download}
                  </ButtonControl>
                  {selection.selectedIds.length === MAX_ARCHIVE_FILES ? (
                    <span>{content.archive.limitReached}</span>
                  ) : null}
                </>
              ) : null}
              {list.files.some((file) => file.assetKind === AssetKind.Video) ? (
                <span>{content.archive.videoHint}</span>
              ) : null}
            </div>
          ) : null}
          {actionError ? (
            <p className={styles.actionError} role="alert">
              {actionError}
            </p>
          ) : null}
          <CustomerFilesList
            canDeleteAction={(file) =>
              filesScopeRights.allows(viewModel.remove, file.projectId)
            }
            canEditAction={(file) =>
              filesScopeRights.allows(viewModel.write, file.projectId)
            }
            canWrite={canWrite}
            content={content}
            files={list.files}
            filterIsActive={customerFilesFilter.isFiltered(
              projectId
                ? { ...filters.filter, projectId: undefined }
                : filters.filter,
            )}
            hasMore={list.hasMore}
            locale={locale}
            memberNames={memberNames}
            onDeleteAction={(file) => {
              rememberFocus();
              setOverlay({ kind: "delete", file });
            }}
            onDownloadAction={download}
            onEditAction={(file) => {
              rememberFocus();
              setOverlay({ kind: "edit", file });
            }}
            onLoadMoreAction={list.loadMore}
            onPreviewAction={(file) => {
              rememberFocus();
              setOverlay({ kind: "preview", fileId: file.id });
            }}
            onReloadAction={list.reload}
            onResetAction={filters.reset}
            projectId={projectId}
            projects={viewModel.projects}
            status={list.status}
            total={list.total}
            selectedIds={selection.selectedIds}
            onSelectAction={(file) => selection.toggle(file.id)}
          />
        </div>
      </CollapsibleSection>
      {drag.active ? (
        <div aria-hidden="true" className={styles.dropOverlay}>
          <FontAwesomeIcon icon={faArrowUpFromBracket} />
          <span>{content.section.dropOverlay}</span>
        </div>
      ) : null}
    </div>
  );
}
