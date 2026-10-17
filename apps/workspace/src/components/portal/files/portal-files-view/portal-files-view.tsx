"use client";

import { useId, useMemo, useRef, useState } from "react";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import {
  PORTAL_FILE_ORIGIN_VALUES,
  PortalFileOrigin,
} from "@invessiv/common/constants/portal/portal-file-origin";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { PortalFileListPageDto } from "@invessiv/common/contracts/portal/portal-file-list-page.dto";
import type { PortalFileProjectOptionDto } from "@invessiv/common/contracts/portal/portal-file-project-option.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  ButtonControl,
  FileLightbox,
  FilePreviewPanel,
  SegmentedControl,
  TabList,
} from "@invessiv/ui";
import { MAX_ARCHIVE_FILES } from "@/common/constants/files/file-archive-limits";
import {
  PORTAL_FILES_PANEL_MEDIA_QUERY,
  PortalFilesQueryParam,
  PortalFilesScope,
} from "@/common/constants/portal/portal-files-query-params";
import { fileArchiveSelection } from "@/common/patterns/files/file-archive-selection";
import { filePreviewSelection } from "@/common/patterns/files/file-preview-selection";
import { readPortalFilesTab } from "@/common/patterns/portal/portal-files-tab";
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
import { PortalFileList } from "../portal-file-list/portal-file-list";
import { PortalFileProjectLabel } from "../portal-file-project-label/portal-file-project-label";
import { PortalFilesBar } from "../portal-files-bar/portal-files-bar";
import styles from "./portal-files-view.module.css";

export type PortalFilesViewProps = {
  /** Scope the page was rendered for; afterwards the URL decides. */
  allProjects?: boolean;
  selectedProjectId?: string | null;
  dashboardHref: string;
  /** Only a contact with `portal.files.write` uploads; the owner view never does. */
  canUpload: boolean;
  /** CRM link for the owner view's notice; null for customer contacts. */
  cockpitHref: string | null;
  content: PortalFilesDictionary;
  customerId: string;
  /** First page of the tab and scope named in the URL, rendered on the server. */
  initialPage: PortalFileListPageDto;
  initialTab: PortalFileOrigin;
  locale: Locale;
  projects: readonly PortalFileProjectOptionDto[];
};

type Overlay = { kind: "add" } | { kind: "preview"; fileId: string };

/**
 * The customer's files page, laid out like the onboarding form and the feedback rounds: the way
 * back, the title and the project scope on top, the two origins as tabs in between, the primary
 * upload, links and the ZIP download in the bar below. On a wide screen the chosen file shows
 * next to the list. Mount it with `key={customerId}` so no list or selection state crosses
 * companies.
 */
export function PortalFilesView({
  allProjects: initialAllProjects = false,
  selectedProjectId = null,
  canUpload,
  dashboardHref,
  cockpitHref,
  content,
  customerId,
  initialPage,
  initialTab,
  locale,
  projects,
}: PortalFilesViewProps) {
  const baseId = useId();
  const ownerNoticeId = useId();
  const initialSearch = new URLSearchParams({
    [PortalFilesQueryParam.Tab]: initialTab,
  });
  if (initialAllProjects)
    initialSearch.set(PortalFilesQueryParam.Scope, PortalFilesScope.All);
  const { search, replace } = useUrlSearch({
    initialSearch: initialSearch.toString(),
  });
  const params = new URLSearchParams(search);
  const tab = readPortalFilesTab(params.get(PortalFilesQueryParam.Tab));
  const scope =
    selectedProjectId &&
    params.get(PortalFilesQueryParam.Scope) !== PortalFilesScope.All
      ? PortalFilesScope.Project
      : PortalFilesScope.All;
  const projectId =
    scope === PortalFilesScope.Project ? selectedProjectId : null;
  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId,
  );
  const [revision, setRevision] = useState(0);
  const list = usePortalFiles(
    customerId,
    tab,
    revision,
    {
      origin: initialTab,
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
    overlay?.kind === "preview" ? overlay.fileId : null,
  );
  const selectableIds = fileArchiveSelection.shownIds(list.files);
  const withPanel = useMediaQuery(PORTAL_FILES_PANEL_MEDIA_QUERY);
  // Resolved against the list as well, so a file that left it empties the panel.
  const shownFileId = params.get(PortalFilesQueryParam.File);
  const shownFile = withPanel
    ? (list.files.find((file) => file.id === shownFileId) ?? null)
    : null;
  const panelId = `${baseId}-panel`;

  // No server round trip: the list hook loads tab and scope itself, a re-render would be discarded.
  function selectTab(next: PortalFileOrigin) {
    replace((current) => {
      current.set(PortalFilesQueryParam.Tab, next);
      current.delete(PortalFilesQueryParam.File);
    });
  }

  function selectScope(next: PortalFilesScope) {
    replace((current) => {
      current.delete(PortalFilesQueryParam.Selected);
      current.delete(PortalFilesQueryParam.File);
      if (next === PortalFilesScope.All)
        current.set(PortalFilesQueryParam.Scope, PortalFilesScope.All);
      else current.delete(PortalFilesQueryParam.Scope);
    });
  }

  // Next to the list on a wide screen, as the full-size preview everywhere else.
  function preview(file: PortalFileDto) {
    if (withPanel)
      replace((current) => current.set(PortalFilesQueryParam.File, file.id));
    else open({ kind: "preview", fileId: file.id });
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
    // What the customer just sent belongs in "from you"; show it there.
    if (tab !== PortalFileOrigin.FromYou) selectTab(PortalFileOrigin.FromYou);
  }

  return (
    <div className={styles.page} data-portal-fixed-head>
      <PortalStepFrame
        bar={
          <PortalFilesBar
            archiveBusy={archiveBusy}
            canUpload={canUpload}
            content={content}
            hasVideo={list.files.some(
              (file) => file.assetKind === AssetKind.Video,
            )}
            limitReached={selection.selectedIds.length === MAX_ARCHIVE_FILES}
            onAddAction={() => open({ kind: "add" })}
            onClearAction={selection.clear}
            onDownloadAction={downloadArchive}
            selectedCount={selection.selectedIds.length}
          />
        }
        header={
          <PortalStepHeader
            backHref={dashboardHref}
            backLabel={content.page.back}
            backShortLabel={content.page.backShort}
            summary={
              selectedProject ? (
                <SegmentedControl
                  activeValue={scope}
                  ariaLabel={content.scope.label}
                  className={styles.scope}
                  items={[
                    {
                      value: PortalFilesScope.Project,
                      label: selectedProject.title,
                    },
                    { value: PortalFilesScope.All, label: content.scope.all },
                  ]}
                  onSelectAction={selectScope}
                />
              ) : null
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
            <div className={styles.tabRow}>
              <TabList
                activeValue={tab}
                ariaLabel={content.tabs.label}
                className={styles.tabs}
                items={PORTAL_FILE_ORIGIN_VALUES.map((origin) => ({
                  value: origin,
                  id: `${baseId}-${origin}`,
                  panelId,
                  label: content.tabs[origin],
                }))}
                onSelectAction={selectTab}
              />
              {selectableIds.length > 0 ? (
                <ButtonControl
                  onClick={() => selection.add(selectableIds)}
                  type="button"
                  variant={ButtonVariant.Quiet}
                >
                  {content.archive.selectShown}
                </ButtonControl>
              ) : null}
            </div>
            <div
              aria-labelledby={`${baseId}-${tab}`}
              className={styles.panel}
              id={panelId}
              role="tabpanel"
            >
              {actionError ? (
                <p className={styles.actionError} role="alert">
                  {actionError}
                </p>
              ) : null}
              <PortalFileList
                activeFileId={shownFile?.id ?? null}
                canUpload={canUpload}
                content={content}
                files={list.files}
                hasMore={list.hasMore}
                locale={locale}
                onDownloadAction={download}
                onLoadMoreAction={list.loadMore}
                onPreviewAction={preview}
                onReloadAction={list.reload}
                onSelectAction={(file) => selection.toggle(file.id)}
                origin={tab}
                selectedIds={selection.selectedIds}
                showProject={scope === PortalFilesScope.All}
                status={list.status}
                total={list.total}
              />
            </div>
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
                  open({ kind: "preview", fileId: file.id })
                }
              />
            </div>
          ) : null}
        </div>

        <p aria-live="polite" className="sr-only" role="status">
          {announcement}
        </p>
        {overlay?.kind === "add" ? (
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
                  ? { kind: "preview", fileId: previewable[next].id }
                  : null,
              )
            }
          />
        ) : null}
      </PortalStepFrame>
    </div>
  );
}
