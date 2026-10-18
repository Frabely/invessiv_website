"use client";

import { useState } from "react";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { PortalFileProjectOptionDto } from "@invessiv/common/contracts/portal/portal-file-project-option.dto";
import { SegmentedControl } from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { PortalFilesDictionary } from "@/i18n/dictionaries/portal";
import { PortalFileLinkDialog } from "../portal-file-link-dialog/portal-file-link-dialog";
import { PortalFileUploadDialog } from "../portal-file-upload-dialog/portal-file-upload-dialog";
import styles from "./portal-file-add-dialog.module.css";

export type PortalFileAddDialogProps = {
  content: PortalFilesDictionary;
  customerId: string;
  locale: Locale;
  projects: readonly PortalFileProjectOptionDto[];
  initialProjectId: string | null;
  onCloseAction: () => void;
  onUploadedAction: (file: PortalFileDto) => void;
  onCreatedAction: (file: PortalFileDto) => void;
};

/** One entry point for uploading a file or sharing an existing cloud link. */
export function PortalFileAddDialog({
  content,
  customerId,
  locale,
  projects,
  initialProjectId,
  onCloseAction,
  onUploadedAction,
  onCreatedAction,
}: PortalFileAddDialogProps) {
  const [mode, setMode] = useState<FileSource>(FileSource.Upload);

  function renderNavigation(busy: boolean, hasDraft: boolean) {
    return (
      <div className={styles.navigation}>
        <SegmentedControl
          activeValue={mode}
          ariaLabel={content.add.modeLabel}
          disabled={busy}
          items={[
            { value: FileSource.Upload, label: content.add.upload },
            { value: FileSource.Link, label: content.add.link },
          ]}
          onSelectAction={(next) => {
            if (busy || next === mode) return;
            if (hasDraft && !window.confirm(content.add.switchWarning)) return;
            setMode(next);
          }}
        />
      </div>
    );
  }

  const shared = {
    content,
    customerId,
    projects,
    initialProjectId,
    onCloseAction,
    renderNavigation,
  };

  return mode === FileSource.Upload ? (
    <PortalFileUploadDialog
      {...shared}
      initialFiles={[]}
      locale={locale}
      onUploadedAction={onUploadedAction}
    />
  ) : (
    <PortalFileLinkDialog {...shared} onCreatedAction={onCreatedAction} />
  );
}
