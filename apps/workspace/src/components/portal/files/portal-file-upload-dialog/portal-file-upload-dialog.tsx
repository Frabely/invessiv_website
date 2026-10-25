"use client";

import { type ReactNode, useState } from "react";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { PortalFileProjectOptionDto } from "@invessiv/common/contracts/portal/portal-file-project-option.dto";
import type { TabPanelBinding } from "@invessiv/common/contracts/ui/tab-panel-binding";
import { FileUploadDialogFrame } from "@invessiv/ui";
import { portalFilesApiService } from "@/client/portal/portal-files-api-service";
import type { Locale } from "@/config/i18n";
import { useInitialUploadFiles } from "@/hooks/shared/use-initial-upload-files";
import { useUploadQueue } from "@/hooks/shared/use-upload-queue";
import type { PortalFilesDictionary } from "@/i18n/dictionaries/portal";
import { PortalFileDetailsFields } from "../portal-file-details-fields/portal-file-details-fields";

export type PortalFileUploadDialogProps = {
  content: PortalFilesDictionary;
  customerId: string;
  initialFiles: readonly File[];
  locale: Locale;
  projects: readonly PortalFileProjectOptionDto[];
  initialProjectId?: string | null;
  /** Makes the content the panel of the tab list rendered as navigation. */
  navigationPanel?: TabPanelBinding;
  renderNavigation?: (busy: boolean, hasDraft: boolean) => ReactNode;
  onCloseAction: () => void;
  onUploadedAction: (file: PortalFileDto) => void;
};

/** Portal-specific destination around the shared upload queue presentation. */
export function PortalFileUploadDialog({
  content,
  customerId,
  initialFiles,
  locale,
  projects,
  initialProjectId = null,
  navigationPanel,
  renderNavigation,
  onCloseAction,
  onUploadedAction,
}: PortalFileUploadDialogProps) {
  const [projectId, setProjectId] = useState<string | null>(initialProjectId);
  const [note, setNote] = useState("");
  const queue = useUploadQueue<PortalFileDto>(
    portalFilesApiService.uploadTransport(customerId, {
      projectId,
      note: note.trim() || null,
    }),
    { onUploadedAction, leaveWarning: content.upload.leaveWarning },
  );
  useInitialUploadFiles(initialFiles, queue.stage);

  return (
    <FileUploadDialogFrame
      fields={
        <PortalFileDetailsFields
          content={content}
          disabled={queue.hasStarted}
          note={note}
          onNoteChangeAction={setNote}
          onProjectChangeAction={setProjectId}
          projectId={projectId}
          projects={projects}
        />
      }
      labels={{ ...content.upload, title: content.add.title }}
      locale={locale}
      navigationPanel={navigationPanel}
      renderNavigation={
        renderNavigation
          ? (busy, hasDraft) =>
              renderNavigation(
                busy,
                (hasDraft && queue.doneCount < queue.items.length) ||
                  (!queue.hasStarted && !!note.trim()),
              )
          : undefined
      }
      onCloseAction={onCloseAction}
      queue={queue}
      rowLabels={{ ...content.upload, errors: content.errors }}
    />
  );
}
