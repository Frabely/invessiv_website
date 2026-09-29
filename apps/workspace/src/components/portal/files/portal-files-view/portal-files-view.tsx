"use client";

import { useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { faLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { UPLOAD_ACCEPT_ATTRIBUTE } from "@invessiv/common/constants/files/upload-accept";
import {
  PORTAL_FILE_ORIGIN_VALUES,
  PortalFileOrigin,
} from "@invessiv/common/constants/portal/portal-file-origin";
import { FileDropZoneVariant } from "@invessiv/common/constants/ui/file-drop-zone-variants";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { PortalFileListPageDto } from "@invessiv/common/contracts/portal/portal-file-list-page.dto";
import type { PortalFileProjectOptionDto } from "@invessiv/common/contracts/portal/portal-file-project-option.dto";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  ButtonControl,
  FileArchiveToolbar,
  FileDropZone,
  FileLightbox,
  TabList,
} from "@invessiv/ui";
import { portalFilesApiService } from "@/client/portal/portal-files-api-service";
import { MAX_ARCHIVE_FILES } from "@/common/constants/files/file-archive-limits";
import { PortalFilesQueryParam } from "@/common/constants/portal/portal-files-query-params";
import { fileArchiveSelection } from "@/common/patterns/files/file-archive-selection";
import { readPortalFilesTab } from "@/common/patterns/portal/portal-files-tab";
import type { Locale } from "@/config/i18n";
import { PortalOwnerNotice } from "@/components/portal/portal-owner-notice/portal-owner-notice";
import { useFileSelection } from "@/hooks/shared/use-file-selection";
import { useFileDownloads } from "@/hooks/shared/use-file-downloads";
import { usePortalFiles } from "@/hooks/portal/use-portal-files";
import type { PortalFilesDictionary } from "@/i18n/dictionaries/portal";
import { PortalFileLinkDialog } from "../portal-file-link-dialog/portal-file-link-dialog";
import { PortalFileList } from "../portal-file-list/portal-file-list";
import { PortalFileUploadDialog } from "../portal-file-upload-dialog/portal-file-upload-dialog";
import styles from "./portal-files-view.module.css";

export type PortalFilesViewProps = {
  /** Only a contact with `portal.files.write` uploads; the owner view never does. */
  canUpload: boolean;
  /** CRM link for the owner view's notice; null for customer contacts. */
  cockpitHref: string | null;
  content: PortalFilesDictionary;
  customerId: string;
  /** First page of the tab named in the URL, rendered on the server. */
  initialPage: PortalFileListPageDto;
  initialTab: PortalFileOrigin;
  locale: Locale;
  projects: readonly PortalFileProjectOptionDto[];
};

type Overlay =
  | { kind: "upload"; files: File[] }
  | { kind: "link" }
  | { kind: "preview"; fileId: string };

const PORTAL_TAB_CHANGE_EVENT = "portal-files-tab-change";

function subscribeToTabChange(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(PORTAL_TAB_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(PORTAL_TAB_CHANGE_EVENT, onChange);
  };
}

function currentSearch() {
  return window.location.search;
}

/**
 * The customer's files page: intake on top, the two origins as tabs below. Mount it with
 * `key={customerId}` so no list or selection state crosses companies.
 */
export function PortalFilesView({
  canUpload,
  cockpitHref,
  content,
  customerId,
  initialPage,
  initialTab,
  locale,
  projects,
}: PortalFilesViewProps) {
  const pathname = usePathname();
  const baseId = useId();
  const ownerNoticeId = useId();
  const search = useSyncExternalStore(
    subscribeToTabChange,
    currentSearch,
    () => `?${PortalFilesQueryParam.Tab}=${initialTab}`,
  );
  const tab = readPortalFilesTab(
    new URLSearchParams(search).get(PortalFilesQueryParam.Tab),
  );
  const [revision, setRevision] = useState(0);
  const list = usePortalFiles(customerId, tab, revision, {
    origin: initialTab,
    page: initialPage,
  });
  const selection = useFileSelection(
    customerId,
    PortalFilesQueryParam.Selected,
  );
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const { archiveBusy, actionError, download, loadPreview, downloadArchive } =
    useFileDownloads<PortalFileDto>({
      archiveFilename: content.archive.filename,
      errors: content.errors,
      selectedIds: selection.selectedIds,
      clearSelection: selection.clear,
      getDownloadUrl: (fileId, disposition) =>
        portalFilesApiService.getDownloadUrl(customerId, fileId, disposition),
      readText: (fileId) => portalFilesApiService.readText(customerId, fileId),
      getArchive: (ids) =>
        portalFilesApiService.downloadArchive(customerId, ids),
    });

  const previewable = useMemo(
    () =>
      list.files.filter(
        (file) => filePresentation.previewKindOf(file) !== null,
      ),
    [list.files],
  );
  // Resolved on every render, so a file that left the list closes the preview.
  const previewIndex =
    overlay?.kind === "preview"
      ? previewable.findIndex((file) => file.id === overlay.fileId)
      : -1;
  const panelId = `${baseId}-panel`;

  // No server round trip: the list hook loads the tab itself, a re-render would be discarded.
  function selectTab(next: PortalFileOrigin) {
    const params = new URLSearchParams(window.location.search);
    params.set(PortalFilesQueryParam.Tab, next);
    window.history.replaceState(
      window.history.state,
      "",
      `${pathname}?${params.toString()}`,
    );
    window.dispatchEvent(new Event(PORTAL_TAB_CHANGE_EVENT));
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
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{content.page.heading}</h1>
        <p>{content.page.intro}</p>
      </header>

      {canUpload ? (
        <section aria-label={content.actions.upload} className={styles.intake}>
          <FileDropZone
            accept={UPLOAD_ACCEPT_ATTRIBUTE}
            className={styles.dropZone}
            hint={content.intake.dropHint}
            label={content.intake.dropLabel}
            multiple
            onFilesSelected={(files) => open({ kind: "upload", files })}
            variant={FileDropZoneVariant.Large}
          />
          <div className={styles.linkRow}>
            <p>{content.intake.linkHint}</p>
            <ButtonControl
              onClick={() => open({ kind: "link" })}
              type="button"
              variant="ghost"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faLink} />
              {content.actions.addLink}
            </ButtonControl>
          </div>
        </section>
      ) : cockpitHref ? (
        <PortalOwnerNotice
          cockpitHref={cockpitHref}
          hint={content.owner.hint}
          id={ownerNoticeId}
          linkLabel={content.owner.link}
        />
      ) : null}

      <section className={styles.library}>
        <TabList
          activeValue={tab}
          ariaLabel={content.tabs.label}
          items={PORTAL_FILE_ORIGIN_VALUES.map((origin) => ({
            value: origin,
            id: `${baseId}-${origin}`,
            panelId,
            label: content.tabs[origin],
          }))}
          onSelectAction={selectTab}
        />
        <div
          aria-labelledby={`${baseId}-${tab}`}
          className={styles.panel}
          id={panelId}
          role="tabpanel"
        >
          <FileArchiveToolbar
            busy={archiveBusy}
            hasFiles={list.files.length > 0}
            hasVideo={list.files.some(
              (file) => file.assetKind === AssetKind.Video,
            )}
            labels={content.archive}
            limitReached={selection.selectedIds.length === MAX_ARCHIVE_FILES}
            onClearAction={selection.clear}
            onDownloadAction={downloadArchive}
            onSelectShownAction={() =>
              selection.add(fileArchiveSelection.shownIds(list.files))
            }
            selectedCount={selection.selectedIds.length}
          />
          {actionError ? (
            <p className={styles.actionError} role="alert">
              {actionError}
            </p>
          ) : null}
          <PortalFileList
            canUpload={canUpload}
            content={content}
            files={list.files}
            hasMore={list.hasMore}
            locale={locale}
            onDownloadAction={download}
            onLoadMoreAction={list.loadMore}
            onPreviewAction={(file) =>
              open({ kind: "preview", fileId: file.id })
            }
            onReloadAction={list.reload}
            onSelectAction={(file) => selection.toggle(file.id)}
            origin={tab}
            selectedIds={selection.selectedIds}
            status={list.status}
            total={list.total}
          />
        </div>
      </section>

      <p aria-live="polite" className="sr-only" role="status">
        {announcement}
      </p>
      {overlay?.kind === "upload" ? (
        <PortalFileUploadDialog
          content={content}
          customerId={customerId}
          initialFiles={overlay.files}
          locale={locale}
          onCloseAction={close}
          onUploadedAction={(file) =>
            added(
              formatMessage(content.announcements.uploaded, {
                name: file.displayName,
              }),
            )
          }
          projects={projects}
        />
      ) : null}
      {overlay?.kind === "link" ? (
        <PortalFileLinkDialog
          content={content}
          customerId={customerId}
          onCloseAction={close}
          onCreatedAction={(file) =>
            added(
              formatMessage(content.announcements.linkAdded, {
                name: file.displayName,
              }),
            )
          }
          projects={projects}
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
    </div>
  );
}
