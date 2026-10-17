"use client";

import { useId, useMemo, useRef, useState } from "react";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { PortalFileListPageDto } from "@invessiv/common/contracts/portal/portal-file-list-page.dto";
import type { PortalFileProjectOptionDto } from "@invessiv/common/contracts/portal/portal-file-project-option.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FileLightbox, FilePreviewPanel } from "@invessiv/ui";
import { MAX_ARCHIVE_FILES } from "@/common/constants/files/file-archive-limits";
import { PortalDashboardQueryParam } from "@/common/constants/portal/portal-dashboard-query-params";
import { PortalFileOriginFilter } from "@/common/constants/portal/portal-file-origin-filter";
import { PortalFilesOverlayKind } from "@/common/constants/portal/portal-files-overlay-kind";
import {
  PORTAL_FILES_PANEL_MEDIA_QUERY,
  PortalFilesQueryParam,
  PortalFilesScope,
} from "@/common/constants/portal/portal-files-query-params";
import { filePreviewSelection } from "@/common/patterns/files/file-preview-selection";
import { buildPortalHref } from "@/common/patterns/portal/build-portal-href";
import { portalFilesOriginFilter } from "@/common/patterns/portal/portal-files-origin-filter";
import type { Locale } from "@/config/i18n";
import { PortalOwnerNotice } from "@/components/portal/portal-owner-notice/portal-owner-notice";
import { PortalStepFrame } from "@/components/portal/shared/portal-step-frame/portal-step-frame";
import { PortalStepHeader } from "@/components/portal/shared/portal-step-header/portal-step-header";
import { useFileSelection } from "@/hooks/shared/use-file-selection";
import { useMediaQuery } from "@/hooks/shared/use-media-query";
import { useUrlSearch } from "@/hooks/shared/use-url-search";
import { usePortalFileDownloads } from "@/hooks/portal/use-portal-file-downloads";
import { usePortalFiles } from "@/hooks/portal/use-portal-files";
import type { PortalFilesDictionary } from "@/i18n/dictionaries/portal";
import { PortalFileAddDialog } from "../portal-file-add-dialog/portal-file-add-dialog";
import { PortalFileProjectLabel } from "../portal-file-project-label/portal-file-project-label";
import { PortalFileTable } from "../portal-file-table/portal-file-table";
import { PortalFilesBar } from "../portal-files-bar/portal-files-bar";
import { PortalFilesFilters } from "../portal-files-filters/portal-files-filters";
import { PortalFilesSelectionBar } from "../portal-files-selection-bar/portal-files-selection-bar";
import styles from "./portal-files-view.module.css";

export type PortalFilesViewProps = {
  /** Scope the page was rendered for; afterwards the URL decides. */
  allProjects?: boolean;
  /** The project of the server render: from `?project` or the current project; afterwards the URL decides. */
  selectedProjectId?: string | null;
  /** The dashboard; the way back keeps the project chosen here. */
  dashboardPath: string;
  /** Only a contact with `portal.files.write` uploads; the owner view never does. */
  canUpload: boolean;
  /** CRM link for the owner view's notice; null for customer contacts. */
  cockpitHref: string | null;
  content: PortalFilesDictionary;
  customerId: string;
  /** First page of the origin and scope named in the URL, rendered on the server. */
  initialPage: PortalFileListPageDto;
  initialOriginFilter: PortalFileOriginFilter;
  locale: Locale;
  projects: readonly PortalFileProjectOptionDto[];
};

type Overlay =
  | { kind: typeof PortalFilesOverlayKind.Add }
  | { kind: typeof PortalFilesOverlayKind.Preview; fileId: string };

/**
 * The customer's files page, laid out like the onboarding form and the feedback rounds: the way
 * back, the title and the two filters on top, the table in between, adding files in the bar below.
 * Chosen files get the ZIP actions in a floating bar. On a wide screen the chosen file shows next
 * to the table. Mount it with `key={customerId}` so no list or selection state crosses companies.
 */
export function PortalFilesView({
  allProjects: initialAllProjects = false,
  selectedProjectId = null,
  canUpload,
  dashboardPath,
  cockpitHref,
  content,
  customerId,
  initialPage,
  initialOriginFilter,
  locale,
  projects,
}: PortalFilesViewProps) {
  const ownerNoticeId = useId();
  const initialSearch = new URLSearchParams();
  if (initialOriginFilter !== PortalFileOriginFilter.All)
    initialSearch.set(PortalFilesQueryParam.Origin, initialOriginFilter);
  if (initialAllProjects)
    initialSearch.set(PortalFilesQueryParam.Scope, PortalFilesScope.All);
  const { search, replace } = useUrlSearch({
    initialSearch: initialSearch.toString(),
  });
  const params = new URLSearchParams(search);
  const originFilter = portalFilesOriginFilter.read(
    params.get(PortalFilesQueryParam.Origin),
  );
  const urlProjectId = params.get(PortalDashboardQueryParam.Project);
  const chosenProjectId =
    projects.find((project) => project.id === urlProjectId)?.id ??
    selectedProjectId;
  const scope =
    chosenProjectId &&
    params.get(PortalFilesQueryParam.Scope) !== PortalFilesScope.All
      ? PortalFilesScope.Project
      : PortalFilesScope.All;
  const projectId = scope === PortalFilesScope.Project ? chosenProjectId : null;
  const [revision, setRevision] = useState(0);
  const list = usePortalFiles(
    customerId,
    portalFilesOriginFilter.originOf(originFilter),
    revision,
    {
      origin: portalFilesOriginFilter.originOf(initialOriginFilter),
      page: initialPage,
      projectId: initialAllProjects ? null : selectedProjectId,
    },
    projectId,
  );
  const selection = useFileSelection(
    customerId,
    PortalFilesQueryParam.Selected,
  );
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const { archiveBusy, actionError, download, loadPreview, downloadArchive } =
    usePortalFileDownloads<PortalFileDto>(customerId, content.errors, {
      filename: content.archive.filename,
      selectedIds: selection.selectedIds,
      clearSelection: selection.clear,
    });

  const previewable = useMemo(
    () => filePreviewSelection.list(list.files),
    [list.files],
  );
  // Resolved on every render, so a file that left the list closes the preview.
  const previewIndex = filePreviewSelection.indexOf(
    previewable,
    overlay?.kind === PortalFilesOverlayKind.Preview ? overlay.fileId : null,
  );
  const withPanel = useMediaQuery(PORTAL_FILES_PANEL_MEDIA_QUERY);
  // Resolved against the list as well, so a file that left it empties the panel.
  const shownFileId = params.get(PortalFilesQueryParam.File);
  const shownFile = withPanel
    ? (list.files.find((file) => file.id === shownFileId) ?? null)
    : null;

  // No server round trip: the list hook loads origin and project itself.
  function selectOrigin(next: PortalFileOriginFilter) {
    replace((current) => {
      if (next === PortalFileOriginFilter.All)
        current.delete(PortalFilesQueryParam.Origin);
      else current.set(PortalFilesQueryParam.Origin, next);
      current.delete(PortalFilesQueryParam.File);
    });
  }

  function selectProject(next: string) {
    replace((current) => {
      current.delete(PortalFilesQueryParam.Selected);
      current.delete(PortalFilesQueryParam.File);
      if (next === PortalFilesScope.All) {
        current.set(PortalFilesQueryParam.Scope, PortalFilesScope.All);
        return;
      }
      current.set(PortalDashboardQueryParam.Project, next);
      current.delete(PortalFilesQueryParam.Scope);
    });
  }

  // Next to the table on a wide screen, as the full-size preview everywhere else.
  function openFile(file: PortalFileDto) {
    if (withPanel)
      replace((current) => current.set(PortalFilesQueryParam.File, file.id));
    else open({ kind: PortalFilesOverlayKind.Preview, fileId: file.id });
  }

  function open(next: Overlay) {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setOverlay(next);
  }

  function close() {
    setOverlay(null);
    const target = returnFocusRef.current;
    requestAnimationFrame(() => target?.isConnected && target.focus());
  }

  function added(message: string) {
    setAnnouncement(message);
    setRevision((current) => current + 1);
    // What the customer just sent belongs to "from you"; it must not vanish behind "from us".
    if (originFilter === PortalFileOriginFilter.FromUs)
      selectOrigin(PortalFileOriginFilter.FromYou);
  }

  return (
    <div
      className={styles.page}
      data-page-bar={canUpload ? "true" : "false"}
      data-portal-fixed-head
    >
      <PortalStepFrame
        bar={
          <PortalFilesBar
            canUpload={canUpload}
            content={content}
            onAddAction={() => open({ kind: PortalFilesOverlayKind.Add })}
          />
        }
        header={
          <PortalStepHeader
            backHref={buildPortalHref(dashboardPath, "", {
              project: chosenProjectId,
            })}
            backLabel={content.page.back}
            backShortLabel={content.page.backShort}
            summary={
              <PortalFilesFilters
                content={content}
                onOriginChangeAction={selectOrigin}
                onProjectChangeAction={selectProject}
                originFilter={originFilter}
                projects={projects}
                projectValue={projectId ?? PortalFilesScope.All}
              />
            }
            title={content.page.heading}
          />
        }
      >
        <div className={styles.content}>
          <div className={styles.library}>
            {!canUpload && cockpitHref ? (
              <PortalOwnerNotice
                cockpitHref={cockpitHref}
                hint={content.owner.hint}
                id={ownerNoticeId}
                linkLabel={content.owner.link}
              />
            ) : null}
            {actionError ? (
              <p className={styles.actionError} role="alert">
                {actionError}
              </p>
            ) : null}
            <PortalFileTable
              activeFileId={shownFile?.id ?? null}
              canUpload={canUpload}
              content={content}
              files={list.files}
              hasMore={list.hasMore}
              locale={locale}
              onDeselectAction={selection.removeMany}
              onDownloadAction={download}
              onLoadMoreAction={list.loadMore}
              onOpenAction={openFile}
              onReloadAction={list.reload}
              onSelectAction={selection.add}
              onToggleAction={(file) => selection.toggle(file.id)}
              originFilter={originFilter}
              selectedIds={selection.selectedIds}
              showProject={scope === PortalFilesScope.All}
              status={list.status}
              total={list.total}
              withPanel={withPanel}
            />
          </div>
          {withPanel ? (
            <div className={styles.aside}>
              <FilePreviewPanel
                file={shownFile}
                playbackEnabled={overlay === null}
                kindLabel={shownFile ? content.kinds[shownFile.assetKind] : ""}
                labels={{
                  ...content.panel,
                  loading: content.lightbox.loading,
                  error: content.lightbox.error,
                  download: content.row.download,
                  open: content.row.open,
                  opensInNewTab: content.row.opensInNewTab,
                }}
                loadSourceAction={loadPreview}
                locale={locale}
                metadata={
                  shownFile && scope === PortalFilesScope.All ? (
                    <PortalFileProjectLabel
                      content={content}
                      file={shownFile}
                    />
                  ) : null
                }
                onDownloadAction={download}
                onExpandAction={(file) =>
                  open({
                    kind: PortalFilesOverlayKind.Preview,
                    fileId: file.id,
                  })
                }
              />
            </div>
          ) : null}
        </div>

        <PortalFilesSelectionBar
          archiveBusy={archiveBusy}
          content={content}
          hasVideo={list.files.some(
            (file) => file.assetKind === AssetKind.Video,
          )}
          limitReached={selection.selectedIds.length === MAX_ARCHIVE_FILES}
          onClearAction={selection.clear}
          onDownloadAction={downloadArchive}
          selectedCount={selection.selectedIds.length}
        />
        <p aria-live="polite" className="sr-only" role="status">
          {announcement}
        </p>
        {overlay?.kind === PortalFilesOverlayKind.Add ? (
          <PortalFileAddDialog
            content={content}
            customerId={customerId}
            locale={locale}
            onCloseAction={close}
            onUploadedAction={(file) =>
              added(
                formatMessage(content.announcements.uploaded, {
                  name: file.displayName,
                }),
              )
            }
            onCreatedAction={(file) =>
              added(
                formatMessage(content.announcements.linkAdded, {
                  name: file.displayName,
                }),
              )
            }
            projects={projects}
            initialProjectId={projectId}
          />
        ) : null}
        {previewIndex >= 0 ? (
          <FileLightbox
            files={previewable}
            index={previewIndex}
            labels={content.lightbox}
            loadSourceAction={loadPreview}
            onCloseAction={close}
            onDownloadAction={download}
            onIndexChangeAction={(next) =>
              setOverlay(
                previewable[next]
                  ? {
                      kind: PortalFilesOverlayKind.Preview,
                      fileId: previewable[next].id,
                    }
                  : null,
              )
            }
          />
        ) : null}
      </PortalStepFrame>
    </div>
  );
}
