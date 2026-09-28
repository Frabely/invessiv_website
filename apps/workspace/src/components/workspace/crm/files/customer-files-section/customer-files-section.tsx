"use client";

import { useMemo, useRef, useState } from "react";
import {
  faArrowUpFromBracket,
  faLink,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { UPLOAD_ACCEPT_ATTRIBUTE } from "@invessiv/common/constants/files/upload-accept";
import { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import { FileDropZoneVariant } from "@invessiv/common/constants/ui/file-drop-zone-variants";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
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
import { SectionEmptyState } from "@/components/workspace/crm/shared/section-empty-state/section-empty-state";
import type { Locale } from "@/config/i18n";
import { useCustomerFiles } from "@/hooks/workspace/crm/use-customer-files";
import { useCustomerFilesFilter } from "@/hooks/workspace/crm/use-customer-files-filter";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FileDeleteDialog } from "../file-delete-dialog/file-delete-dialog";
import { FileEditDialog } from "../file-edit-dialog/file-edit-dialog";
import { FileLightbox } from "../file-lightbox/file-lightbox";
import { FileLinkDialog } from "../file-link-dialog/file-link-dialog";
import { FileRow } from "../file-row/file-row";
import { FilesToolbar } from "../files-toolbar/files-toolbar";
import { FileUploadDialog } from "../file-upload-dialog/file-upload-dialog";
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
  const [uploadFiles, setUploadFiles] = useState<File[] | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [editing, setEditing] = useState<FileDto | null>(null);
  const [deleting, setDeleting] = useState<FileDto | null>(null);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
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
  const previewIndex =
    previewFileId === null
      ? null
      : previewable.findIndex((file) => file.id === previewFileId);
  const previewOpen = previewIndex !== null && previewIndex >= 0;
  const dialogOpen =
    uploadFiles !== null ||
    linkOpen ||
    editing !== null ||
    deleting !== null ||
    previewOpen;
  const drag = useFileDragTarget(openUpload, !canWrite || dialogOpen);

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
    setUploadFiles(files);
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

  function projectLabel(file: FileDto) {
    if (projectId) return undefined;
    return file.projectId === null
      ? content.row.customerWide
      : viewModel.projects.find((project) => project.id === file.projectId)
          ?.title;
  }

  function renderBody() {
    if (list.status === FileListLoadStatus.Loading && list.files.length === 0)
      return (
        <p className={styles.state} role="status">
          {content.section.loading}
        </p>
      );
    if (list.status === FileListLoadStatus.Error && list.files.length === 0)
      return (
        <div className={styles.state} role="alert">
          <p>{content.section.loadError}</p>
          <ButtonControl onClick={list.reload} type="button" variant="ghost">
            {content.section.retry}
          </ButtonControl>
        </div>
      );
    if (list.files.length === 0)
      return customerFilesFilter.isFiltered(
        projectId
          ? { ...filters.filter, projectId: undefined }
          : filters.filter,
      ) ? (
        <SectionEmptyState
          action={
            <ButtonControl
              onClick={filters.reset}
              type="button"
              variant="ghost"
            >
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
          aria-busy={list.status === FileListLoadStatus.Loading}
          aria-label={content.section.listLabel}
          className={styles.list}
        >
          {list.files.map((file) => {
            const isPreviewable = filePresentation.previewKindOf(file) !== null;
            return (
              <FileRow
                content={content}
                file={file}
                key={file.id}
                locale={locale}
                onDeleteAction={
                  filesScopeRights.allows(viewModel.remove, file.projectId)
                    ? (target) => {
                        rememberFocus();
                        setDeleting(target);
                      }
                    : undefined
                }
                onDownloadAction={download}
                onEditAction={
                  filesScopeRights.allows(viewModel.write, file.projectId)
                    ? (target) => {
                        rememberFocus();
                        setEditing(target);
                      }
                    : undefined
                }
                onPreviewAction={
                  isPreviewable
                    ? () => {
                        rememberFocus();
                        setPreviewFileId(file.id);
                      }
                    : undefined
                }
                projectLabel={projectLabel(file)}
                uploaderName={
                  file.uploadedByMemberId
                    ? (memberNames.get(file.uploadedByMemberId) ?? null)
                    : null
                }
              />
            );
          })}
        </ul>
        <div className={styles.more}>
          <p className={styles.shown}>
            {formatMessage(content.section.shown, {
              shown: String(list.files.length),
              total: String(list.total),
            })}
          </p>
          {list.hasMore ? (
            <ButtonControl
              disabled={list.status === FileListLoadStatus.LoadingMore}
              onClick={list.loadMore}
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
            {uploadFiles !== null ? (
              <FileUploadDialog
                content={content}
                customerId={customerId}
                defaultTarget={defaultTarget}
                initialFiles={uploadFiles}
                locale={locale}
                onCloseAction={() => {
                  setUploadFiles(null);
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
            {linkOpen ? (
              <FileLinkDialog
                content={content}
                customerId={customerId}
                defaultTarget={defaultTarget}
                onCloseAction={() => {
                  setLinkOpen(false);
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
            {editing ? (
              <FileEditDialog
                content={content}
                file={editing}
                key={editing.id}
                onCloseAction={() => {
                  setEditing(null);
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
            {deleting ? (
              <FileDeleteDialog
                content={content}
                file={deleting}
                key={deleting.id}
                onChangedAction={list.replace}
                onCloseAction={() => {
                  setDeleting(null);
                  restoreFocus();
                }}
                onDeletedAction={(file) =>
                  changed(
                    formatMessage(content.announcements.deleted, {
                      name: file.displayName,
                    }),
                  )
                }
              />
            ) : null}
            {previewIndex !== null && previewIndex >= 0 ? (
              <FileLightbox
                content={content}
                files={previewable}
                index={previewIndex}
                onCloseAction={() => {
                  setPreviewFileId(null);
                  restoreFocus();
                }}
                onDownloadAction={download}
                onIndexChangeAction={(nextIndex) =>
                  setPreviewFileId(previewable[nextIndex]?.id ?? null)
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
                  setLinkOpen(true);
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
          {actionError ? (
            <p className={styles.actionError} role="alert">
              {actionError}
            </p>
          ) : null}
          {renderBody()}
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
